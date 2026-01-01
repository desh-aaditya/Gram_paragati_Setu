import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../services/api_service.dart';
import '../../providers/location_provider.dart';

class IssueValidationScreen extends ConsumerStatefulWidget {
  final String volunteerId;
  final int villageId;

  const IssueValidationScreen({
    super.key,
    required this.volunteerId,
    required this.villageId,
  });

  @override
  ConsumerState<IssueValidationScreen> createState() => _IssueValidationScreenState();
}

class _IssueValidationScreenState extends ConsumerState<IssueValidationScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> _pendingIssues = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPendingIssues();
  }

  Future<void> _loadPendingIssues() async {
    try {
      final issues = await _apiService.getPendingIssues(widget.villageId);
      setState(() {
        _pendingIssues = issues;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  Future<void> _validateIssue(int issueId) async {
    // Show dialog to add notes/photos
    showDialog(
      context: context,
      builder: (context) => ValidationDialog(
        issueId: issueId,
        volunteerId: widget.volunteerId,
        onSuccess: () {
          _loadPendingIssues();
          Navigator.pop(context);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Validate Issues')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _pendingIssues.isEmpty
              ? const Center(child: Text('No pending issues found'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _pendingIssues.length,
                  itemBuilder: (context, index) {
                    final issue = _pendingIssues[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 16),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  issue['issue_type'],
                                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.orange[100],
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    '${issue['vote_count']} Votes',
                                    style: TextStyle(color: Colors.orange[800], fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(issue['description']),
                            const SizedBox(height: 16),
                            ElevatedButton(
                              onPressed: () => _validateIssue(issue['id']),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Theme.of(context).primaryColor,
                                foregroundColor: Colors.white,
                              ),
                              child: const Text('VALIDATE ISSUE'),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}

class ValidationDialog extends StatefulWidget {
  final int issueId;
  final String volunteerId;
  final VoidCallback onSuccess;

  const ValidationDialog({
    super.key,
    required this.issueId,
    required this.volunteerId,
    required this.onSuccess,
  });

  @override
  State<ValidationDialog> createState() => _ValidationDialogState();
}

class _ValidationDialogState extends State<ValidationDialog> {
  final _notesController = TextEditingController();
  final List<File> _photos = [];
  bool _isSubmitting = false;

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.camera);
    if (pickedFile != null) {
      setState(() => _photos.add(File(pickedFile.path)));
    }
  }

  Future<void> _submitValidation() async {
    setState(() => _isSubmitting = true);
    try {
      final apiService = ApiService();
      await apiService.validateIssue(
        issueId: widget.issueId,
        volunteerId: widget.volunteerId,
        notes: _notesController.text,
        photos: _photos,
      );
      widget.onSuccess();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Validate Issue'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _notesController,
              decoration: const InputDecoration(
                labelText: 'Validation Notes',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              children: [
                ..._photos.map((f) => Image.file(f, width: 60, height: 60, fit: BoxFit.cover)),
                IconButton(
                  onPressed: _pickImage,
                  icon: const Icon(Icons.add_a_photo),
                ),
              ],
            ),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(
          onPressed: _isSubmitting ? null : _submitValidation,
          child: _isSubmitting ? const CircularProgressIndicator() : const Text('Submit'),
        ),
      ],
    );
  }
}
