import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import 'package:record/record.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:io';
import '../providers/location_provider.dart';
import '../models/priority_vote.dart';
import '../models/village.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import '../services/sync_service.dart';

class SurveyScreen extends ConsumerStatefulWidget {
  final bool isVolunteer;
  final String? volunteerId;
  final int? employeeId;

  const SurveyScreen({
    super.key,
    this.isVolunteer = false,
    this.volunteerId,
    this.employeeId,
  });

  @override
  ConsumerState<SurveyScreen> createState() => _SurveyScreenState();
}

class _SurveyScreenState extends ConsumerState<SurveyScreen> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedInfrastructure;
  final _descriptionController = TextEditingController();
  String? _selectedCategory;
  
  // Audio Recording
  final _audioRecorder = AudioRecorder();
  String? _audioPath;
  bool _isRecording = false;

  final List<String> _infrastructureOptions = [
    'Hospital',
    'Roads',
    'Sewage',
    'Drinking Water',
    'School',
    'Electricity',
    'Internet',
    'Public Transport',
    'Market',
    'Bank',
  ];

  final List<String> _categories = [
    'Health',
    'Education',
    'Infrastructure',
    'Utilities',
    'Transport',
    'Finance',
    'Other',
  ];

  bool _isSubmitting = false;

  @override
  void dispose() {
    _descriptionController.dispose();
    _audioRecorder.dispose();
    super.dispose();
  }

  Future<void> _startRecording() async {
    try {
      if (await _audioRecorder.hasPermission()) {
        final dir = await getTemporaryDirectory();
        final path = '${dir.path}/audio_${DateTime.now().millisecondsSinceEpoch}.m4a';
        
        await _audioRecorder.start(
          const RecordConfig(encoder: AudioEncoder.aacLc),
          path: path,
        );
        setState(() => _isRecording = true);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error starting recording: $e')),
      );
    }
  }

  Future<void> _stopRecording() async {
    try {
      final path = await _audioRecorder.stop();
      setState(() {
        _isRecording = false;
        _audioPath = path;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error stopping recording: $e')),
      );
    }
  }

  void _deleteRecording() {
    setState(() => _audioPath = null);
  }

  Future<void> _submitSurvey() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedInfrastructure == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select infrastructure type')),
      );
      return;
    }

    final locationAsync = ref.watch(locationProvider);
    final locationState = locationAsync.value ?? LocationState();
    if (locationState.selectedVillage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a village')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final vote = PriorityVote(
      villageId: locationState.selectedVillage!.id,
      requiredInfrastructure: _selectedInfrastructure!,
      description: _descriptionController.text,
      category: _selectedCategory,
      isVolunteer: widget.isVolunteer,
      volunteerId: widget.volunteerId,
      employeeId: widget.employeeId,
      clientId: const Uuid().v4(),
    );

    try {
      // Check connectivity first
      final isOnline = await SyncService().isOnline();
      
      if (isOnline) {
        final apiService = ApiService();
        // Pass audio file if exists
        File? audioFile;
        if (_audioPath != null) {
          audioFile = File(_audioPath!);
        }
        
        await apiService.submitPriorityVote(vote, audioFile: audioFile);
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Survey submitted successfully!')),
          );
          Navigator.pop(context);
        }
      } else {
        // Offline mode
        // Note: Currently not storing audio offline in this simple version
        await StorageService.saveOfflineVote(vote);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
             SnackBar(
              content: Text(_audioPath != null 
                  ? 'Saved offline (Audio excluded). Will sync when online.' 
                  : 'Saved offline. Will sync when online.'),
              duration: const Duration(seconds: 3),
            ),
          );
          Navigator.pop(context);
        }
      }
    } catch (e) {
      try {
        await StorageService.saveOfflineVote(vote);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Network error. Saved offline. Error: $e'),
              duration: const Duration(seconds: 3),
            ),
          );
          Navigator.pop(context);
        }
      } catch (saveError) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error saving survey: $saveError')),
          );
        }
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final locationAsync = ref.watch(locationProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.isVolunteer ? 'Volunteer Survey' : 'Village Survey'),
      ),
      body: locationAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text('Error loading location data: $err', textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.refresh(locationProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (locationState) {
          return Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(16.0),
              children: [
                // Header Info
                Container(
                  padding: const EdgeInsets.all(16),
                  margin: const EdgeInsets.only(bottom: 24),
                  decoration: BoxDecoration(
                    color: const Color(0xFF003366).withOpacity(0.05),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF003366).withOpacity(0.1)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline, color: Color(0xFF003366)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          widget.isVolunteer 
                              ? 'Submit verified infrastructure requests on behalf of villagers.'
                              : 'Help us identify the most urgent needs in your village.',
                          style: const TextStyle(color: Color(0xFF003366), fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ),

                // Location Section
                const Text(
                  'Location Details',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF003366)),
                ),
                const SizedBox(height: 12),
                Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(color: Colors.grey.shade300),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      children: [
                        DropdownButtonFormField<String>(
                          value: locationState.selectedState,
                          decoration: const InputDecoration(labelText: 'State', prefixIcon: Icon(Icons.map)),
                          items: locationState.states.map((state) {
                            return DropdownMenuItem(value: state, child: Text(state));
                          }).toList(),
                          onChanged: (value) {
                            if (value != null) ref.read(locationProvider.notifier).selectState(value);
                          },
                        ),
                        const SizedBox(height: 16),
                        if (locationState.selectedState != null)
                          DropdownButtonFormField<String>(
                            value: locationState.districts.contains(locationState.selectedDistrict)
                                ? locationState.selectedDistrict
                                : null,
                            decoration: const InputDecoration(labelText: 'District', prefixIcon: Icon(Icons.location_city)),
                            items: locationState.districts.isEmpty
                                ? [const DropdownMenuItem(value: null, child: Text('Loading...'))]
                                : locationState.districts.map((d) => DropdownMenuItem(value: d, child: Text(d))).toList(),
                            onChanged: locationState.districts.isEmpty ? null : (value) {
                              if (value != null) ref.read(locationProvider.notifier).selectDistrict(value);
                            },
                          ),
                        const SizedBox(height: 16),
                        if (locationState.selectedDistrict != null)
                          locationState.isLoading && locationState.villages.isEmpty
                              ? const Center(child: CircularProgressIndicator())
                              : DropdownButtonFormField<Village>(
                                  value: locationState.villages.contains(locationState.selectedVillage)
                                      ? locationState.selectedVillage
                                      : null,
                                  decoration: const InputDecoration(labelText: 'Village', prefixIcon: Icon(Icons.home)),
                                  items: locationState.villages.isEmpty
                                      ? [const DropdownMenuItem(value: null, child: Text('No villages'))]
                                      : locationState.villages.map((v) => DropdownMenuItem(value: v, child: Text(v.name))).toList(),
                                  onChanged: locationState.villages.isEmpty ? null : (value) {
                                    if (value != null) ref.read(locationProvider.notifier).selectVillage(value);
                                  },
                                ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 24),
                
                 // Audio Recording Section
                const Text(
                  'Voice Response (Optional)',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF003366)),
                ),
                const SizedBox(height: 12),
                Card(
                  elevation: 0,
                  color: _isRecording ? Colors.red.withOpacity(0.05) : Colors.grey.withOpacity(0.05),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(color: _isRecording ? Colors.red : Colors.grey.shade300),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      children: [
                        if (_audioPath == null && !_isRecording) ...[
                           SizedBox(
                            width: double.infinity,
                            height: 60,
                             child: ElevatedButton.icon(
                              onPressed: _startRecording,
                              icon: const Icon(Icons.mic, size: 28),
                              label: const Text('Record Your Response'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.redAccent,
                                foregroundColor: Colors.white,
                              ),
                             ),
                           ),
                           const SizedBox(height: 8),
                           const Text('Tap to start recording', style: TextStyle(color: Colors.grey)),
                        ] else if (_isRecording) ...[
                          const Text(
                             'Recording...',
                             style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 18),
                          ),
                          const SizedBox(height: 16),
                          SizedBox(
                            width: double.infinity,
                             height: 60, 
                             child: OutlinedButton.icon(
                              onPressed: _stopRecording,
                              icon: const Icon(Icons.stop_circle, color: Colors.red, size: 28),
                               label: const Text('Stop Recording'),
                               style: OutlinedButton.styleFrom(
                                  side: const BorderSide(color: Colors.red, width: 2),
                               ),
                             ),
                          ),
                        ] else if (_audioPath != null) ...[
                          Row(
                            children: [
                              const Icon(Icons.check_circle, color: Colors.green, size: 32),
                              const SizedBox(width: 12),
                              const Expanded(
                                child: Text(
                                  'Voice response recorded',
                                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete, color: Colors.red),
                                onPressed: _deleteRecording,
                                tooltip: 'Delete recording',
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // Request Details Section
                const Text(
                  'Request Details',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF003366)),
                ),
                const SizedBox(height: 12),
                Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(color: Colors.grey.shade300),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      children: [
                        DropdownButtonFormField<String>(
                          value: _selectedInfrastructure,
                          decoration: const InputDecoration(labelText: 'Required Infrastructure *', prefixIcon: Icon(Icons.construction)),
                          items: _infrastructureOptions.map((option) {
                            return DropdownMenuItem(value: option, child: Text(option));
                          }).toList(),
                          onChanged: (value) => setState(() => _selectedInfrastructure = value),
                          validator: (value) => value == null ? 'Required' : null,
                        ),
                        const SizedBox(height: 16),
                        DropdownButtonFormField<String>(
                          value: _selectedCategory,
                          decoration: const InputDecoration(labelText: 'Category (Optional)', prefixIcon: Icon(Icons.category)),
                          items: _categories.map((category) {
                            return DropdownMenuItem(value: category, child: Text(category));
                          }).toList(),
                          onChanged: (value) => setState(() => _selectedCategory = value),
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _descriptionController,
                          decoration: const InputDecoration(
                            labelText: 'Description of Problem *',
                            hintText: 'Describe the issue in detail...',
                            alignLabelWithHint: true,
                            prefixIcon: Icon(Icons.description),
                          ),
                          maxLines: 4,
                          validator: (value) {
                            // If audio is present, description could be optional or just basic?
                            // User requirement: "Villager should be able to submit... voice + some basic ticks/fields"
                            // But schema requires description. I'll auto-fill if audio is present and description is empty?
                            // Or just prompt user.
                            // I'll leave it as required for now as backend requires it, or I can put "Voice Note" as placeholder.
                             if (_audioPath != null && (value == null || value.trim().isEmpty)) {
                              _descriptionController.text = "Voice Response Included";
                              return null;
                             }
                             return (value == null || value.trim().isEmpty) ? 'Required' : null;
                          },
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 32),

                // Submit Button
                SizedBox(
                  height: 54,
                  child: ElevatedButton(
                    onPressed: _isSubmitting ? null : _submitSurvey,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF003366),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 4,
                    ),
                    child: _isSubmitting
                        ? const CircularProgressIndicator(color: Colors.white)
                        : Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.send),
                              const SizedBox(width: 12),
                              Text(_audioPath != null ? 'SUBMIT REQUEST (WITH AUDIO)' : 'SUBMIT REQUEST', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1)),
                            ],
                          ),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          );
        },
      ),
    );
  }
}

