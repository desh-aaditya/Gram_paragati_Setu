import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import '../providers/location_provider.dart';
import '../services/api_service.dart';
import '../models/village.dart';

class IssueSubmissionScreen extends ConsumerStatefulWidget {
  const IssueSubmissionScreen({super.key});

  @override
  ConsumerState<IssueSubmissionScreen> createState() => _IssueSubmissionScreenState();
}

class _IssueSubmissionScreenState extends ConsumerState<IssueSubmissionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _descriptionController = TextEditingController();
  String? _selectedIssueType;
  String? _selectedCategory;
  final List<File> _attachments = [];
  bool _isSubmitting = false;

  final List<String> _issueTypes = [
    'Broken Road',
    'No Water Supply',
    'Electricity Outage',
    'School Maintenance',
    'Hospital Staff Missing',
    'Garbage Collection',
    'Other'
  ];

  final List<String> _categories = [
    'Infrastructure',
    'Health',
    'Education',
    'Sanitation',
    'Utilities',
    'Other'
  ];

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.camera);
    if (pickedFile != null) {
      setState(() {
        _attachments.add(File(pickedFile.path));
      });
    }
  }

  Future<void> _submitIssue() async {
    if (!_formKey.currentState!.validate()) return;
    
    final locationState = ref.read(locationProvider).value;
    if (locationState?.selectedVillage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a village')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final prefs = await SharedPreferences.getInstance();
      final deviceId = prefs.getString('device_id') ?? const Uuid().v4();
      
      // Ensure device_id is saved if it wasn't
      if (!prefs.containsKey('device_id')) {
        await prefs.setString('device_id', deviceId);
      }

      final apiService = ApiService();
      final result = await apiService.submitIssue(
        villageId: locationState!.selectedVillage!.id,
        issueType: _selectedIssueType!,
        description: _descriptionController.text,
        category: _selectedCategory,
        deviceId: deviceId,
        attachments: _attachments,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Issue submitted successfully'),
            backgroundColor: result['vote_added'] == true ? Colors.green : Colors.orange,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
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
      appBar: AppBar(title: const Text('Report an Issue')),
      body: locationAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
        data: (locationState) {
          return Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(16.0),
              children: [
                // Location Section
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Location', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 16),
                        DropdownButtonFormField<String>(
                          value: locationState.selectedState,
                          decoration: const InputDecoration(labelText: 'State', border: OutlineInputBorder()),
                          items: locationState.states.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                          onChanged: (val) => val != null ? ref.read(locationProvider.notifier).selectState(val) : null,
                        ),
                        const SizedBox(height: 16),
                        if (locationState.selectedState != null)
                          DropdownButtonFormField<String>(
                            value: locationState.districts.contains(locationState.selectedDistrict)
                                ? locationState.selectedDistrict
                                : null,
                            decoration: const InputDecoration(labelText: 'District', border: OutlineInputBorder()),
                            items: locationState.districts.map((d) => DropdownMenuItem(value: d, child: Text(d))).toList(),
                            onChanged: (val) => val != null ? ref.read(locationProvider.notifier).selectDistrict(val) : null,
                          ),
                        const SizedBox(height: 16),
                        if (locationState.selectedDistrict != null)
                          DropdownButtonFormField<Village>(
                            value: locationState.villages.contains(locationState.selectedVillage)
                                ? locationState.selectedVillage
                                : null,
                            decoration: const InputDecoration(labelText: 'Village', border: OutlineInputBorder()),
                            items: locationState.villages.map((v) => DropdownMenuItem(value: v, child: Text(v.name))).toList(),
                            onChanged: (val) => val != null ? ref.read(locationProvider.notifier).selectVillage(val) : null,
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Issue Details
                DropdownButtonFormField<String>(
                  value: _selectedIssueType,
                  decoration: const InputDecoration(labelText: 'Issue Type *', border: OutlineInputBorder()),
                  items: _issueTypes.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                  onChanged: (val) => setState(() => _selectedIssueType = val),
                  validator: (val) => val == null ? 'Required' : null,
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: _selectedCategory,
                  decoration: const InputDecoration(labelText: 'Category (Optional)', border: OutlineInputBorder()),
                  items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                  onChanged: (val) => setState(() => _selectedCategory = val),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _descriptionController,
                  decoration: const InputDecoration(
                    labelText: 'Description *',
                    border: OutlineInputBorder(),
                    hintText: 'Describe the issue...',
                  ),
                  maxLines: 4,
                  validator: (val) => (val == null || val.isEmpty) ? 'Required' : null,
                ),
                const SizedBox(height: 24),

                // Attachments
                const Text('Photos (Optional)', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ..._attachments.map((file) => Stack(
                      children: [
                        Image.file(file, width: 100, height: 100, fit: BoxFit.cover),
                        Positioned(
                          right: 0,
                          top: 0,
                          child: GestureDetector(
                            onTap: () => setState(() => _attachments.remove(file)),
                            child: const Icon(Icons.remove_circle, color: Colors.red),
                          ),
                        ),
                      ],
                    )),
                    GestureDetector(
                      onTap: _pickImage,
                      child: Container(
                        width: 100,
                        height: 100,
                        color: Colors.grey[200],
                        child: const Icon(Icons.add_a_photo, color: Colors.grey),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 32),

                // Submit
                ElevatedButton(
                  onPressed: _isSubmitting ? null : _submitIssue,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: Theme.of(context).primaryColor,
                  ),
                  child: _isSubmitting
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('SUBMIT ISSUE', style: TextStyle(fontSize: 16, color: Colors.white)),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
