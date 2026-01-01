import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:uuid/uuid.dart';
import '../../services/api_service.dart';
import '../../services/sync_service.dart';
import '../../models/project.dart';
import 'dart:io';

class CheckpointUploadScreen extends ConsumerStatefulWidget {
  final String volunteerId;

  const CheckpointUploadScreen({super.key, required this.volunteerId});

  @override
  ConsumerState<CheckpointUploadScreen> createState() => _CheckpointUploadScreenState();
}

class _CheckpointUploadScreenState extends ConsumerState<CheckpointUploadScreen> {
  List<Project>? _projects;
  Project? _selectedProject;
  Checkpoint? _selectedCheckpoint;
  final List<File> _selectedImages = [];
  final _notesController = TextEditingController();
  Position? _currentLocation;
  bool _isLoading = false;
  bool _isLoadingProjects = false;

  @override
  void initState() {
    super.initState();
    _loadProjects();
    _getCurrentLocation();
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _loadProjects() async {
    setState(() => _isLoadingProjects = true);
    try {
      final apiService = ApiService();
      _projects = await apiService.getVolunteerProjects(widget.volunteerId);
      setState(() {});
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load projects: $e')),
        );
      }
    } finally {
      setState(() => _isLoadingProjects = false);
    }
  }

  Future<void> _getCurrentLocation() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        return;
      }

      Position position = await Geolocator.getCurrentPosition();
      setState(() => _currentLocation = position);
    } catch (e) {
      // Location not available
    }
  }

  Future<void> _pickImages() async {
    final ImagePicker picker = ImagePicker();
    final List<XFile> images = await picker.pickMultiImage();
    
    setState(() {
      _selectedImages.addAll(images.map((xFile) => File(xFile.path)));
    });
  }

  Future<void> _takePhoto() async {
    final ImagePicker picker = ImagePicker();
    final XFile? photo = await picker.pickImage(source: ImageSource.camera);
    
    if (photo != null) {
      setState(() {
        _selectedImages.add(File(photo.path));
      });
    }
  }

  Future<void> _submitCheckpoint() async {
    if (_selectedProject == null || _selectedCheckpoint == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select project and checkpoint')),
      );
      return;
    }

    if (_selectedImages.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one image')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final syncService = SyncService();
      final clientId = const Uuid().v4();
      
      await syncService.submitCheckpoint(
        checkpointId: _selectedCheckpoint!.id,
        volunteerId: widget.volunteerId,
        imageFiles: _selectedImages,
        notes: _notesController.text.isEmpty ? null : _notesController.text,
        lat: _currentLocation?.latitude,
        lng: _currentLocation?.longitude,
        clientId: clientId,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Progress uploaded successfully!')),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Upload failed: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Upload Project Progress')),
      body: _isLoadingProjects
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16.0),
              children: [
                // Project Selection
                DropdownButtonFormField<Project>(
                  value: (_projects?.contains(_selectedProject) ?? false) ? _selectedProject : null,
                  decoration: const InputDecoration(
                    labelText: 'Select Project',
                    border: OutlineInputBorder(),
                  ),
                  items: (_projects ?? []).map((project) {
                    return DropdownMenuItem(
                      value: project,
                      child: Text(project.title),
                    );
                  }).toList(),
                  onChanged: (project) {
                    setState(() {
                      _selectedProject = project;
                      _selectedCheckpoint = null;
                    });
                  },
                ),

                const SizedBox(height: 16),

                // Checkpoint Selection
                if (_selectedProject != null)
                  DropdownButtonFormField<Checkpoint>(
                    value: (_selectedProject!.checkpoints.contains(_selectedCheckpoint))
                        ? _selectedCheckpoint
                        : null,
                    decoration: const InputDecoration(
                      labelText: 'Select Checkpoint',
                      border: OutlineInputBorder(),
                    ),
                    items: _selectedProject!.checkpoints.map((checkpoint) {
                      return DropdownMenuItem(
                        value: checkpoint,
                        child: Text(checkpoint.name),
                      );
                    }).toList(),
                    onChanged: (checkpoint) {
                      setState(() => _selectedCheckpoint = checkpoint);
                    },
                  ),

                const SizedBox(height: 24),

                // Image Selection Buttons
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _pickImages,
                        icon: const Icon(Icons.photo_library),
                        label: const Text('Pick from Gallery'),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _takePhoto,
                        icon: const Icon(Icons.camera_alt),
                        label: const Text('Take Photo'),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Selected Images Preview
                if (_selectedImages.isNotEmpty) ...[
                  const Text(
                    'Selected Images:',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    height: 150,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: _selectedImages.length,
                      itemBuilder: (context, index) {
                        return Stack(
                          children: [
                            Padding(
                              padding: const EdgeInsets.only(right: 8.0),
                              child: Image.file(
                                _selectedImages[index],
                                width: 150,
                                fit: BoxFit.cover,
                              ),
                            ),
                            Positioned(
                              top: 4,
                              right: 12,
                              child: IconButton(
                                icon: const Icon(Icons.close, color: Colors.red),
                                onPressed: () {
                                  setState(() {
                                    _selectedImages.removeAt(index);
                                  });
                                },
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Notes
                TextField(
                  controller: _notesController,
                  decoration: const InputDecoration(
                    labelText: 'Notes (Optional)',
                    border: OutlineInputBorder(),
                    hintText: 'Add any additional notes about this checkpoint...',
                  ),
                  maxLines: 3,
                ),

                const SizedBox(height: 16),

                // Location Info
                if (_currentLocation != null)
                  Card(
                    child: ListTile(
                      leading: const Icon(Icons.location_on),
                      title: const Text('Current Location'),
                      subtitle: Text(
                        'Lat: ${_currentLocation!.latitude.toStringAsFixed(6)}, '
                        'Lng: ${_currentLocation!.longitude.toStringAsFixed(6)}',
                      ),
                    ),
                  ),

                const SizedBox(height: 32),

                // Submit Button
                ElevatedButton(
                  onPressed: _isLoading ? null : _submitCheckpoint,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: Theme.of(context).primaryColor,
                  ),
                  child: _isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text(
                          'Upload Progress',
                          style: TextStyle(fontSize: 18, color: Colors.white),
                        ),
                ),
              ],
            ),
    );
  }
}

