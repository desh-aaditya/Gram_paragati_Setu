import 'dart:io';
import 'package:dio/dio.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import '../services/storage_service.dart';
import '../services/api_service.dart';
import '../models/priority_vote.dart';
import '../models/checkpoint_submission.dart';
import '../config/api_config.dart';

class SyncService {
  final ApiService _apiService = ApiService();
  final Dio _dio = Dio(); // For direct media uploads if needed, or use ApiService

  // Check connectivity
  Future<bool> isOnline() async {
    if (ApiConfig.useDummyData) return true;
    
    final connectivityResult = await Connectivity().checkConnectivity();
    return !connectivityResult.contains(ConnectivityResult.none);
  }

  // Sync everything
  Future<void> syncAll() async {
    if (!await isOnline()) return;

    await syncOfflineVotes();
    await syncCheckpointSubmissions();
  }

  // Sync offline priority votes
  Future<void> syncOfflineVotes() async {
    final offlineVotes = await StorageService.getOfflineVotes();
    if (offlineVotes.isEmpty) return;

    try {
      // Try batch sync first
      await _apiService.syncPriorityVotes(offlineVotes);
      
      // If successful, clear all (or we could delete one by one if we want to be safer)
      // For now, assume batch success means all synced.
      await StorageService.clearOfflineVotes();
      debugPrint('Synced ${offlineVotes.length} votes');
    } catch (e) {
      debugPrint('Batch sync failed, trying individual: $e');
      // Fallback to individual sync
      for (final vote in offlineVotes) {
        try {
          await _apiService.submitPriorityVote(vote);
          if (vote.clientId != null) {
            await StorageService.deleteOfflineVote(vote.clientId!);
          }
        } catch (e) {
          debugPrint('Failed to sync vote ${vote.clientId}: $e');
        }
      }
    }
  }

  // Submit checkpoint (Online or Offline)
  Future<void> submitCheckpoint({
    required int checkpointId,
    required String volunteerId,
    required List<File> imageFiles,
    String? notes,
    double? lat,
    double? lng,
    String? clientId,
  }) async {
    final submission = CheckpointSubmission(
      checkpointId: checkpointId,
      volunteerId: volunteerId,
      notes: notes,
      latitude: lat,
      longitude: lng,
      clientId: clientId,
      submittedAt: DateTime.now(),
      mediaPaths: imageFiles.map((f) => f.path).toList(),
    );

    if (await isOnline()) {
      try {
        await _uploadSubmission(submission, imageFiles);
      } catch (e) {
        debugPrint('Online submission failed, saving offline: $e');
        await StorageService.saveCheckpointSubmission(submission);
      }
    } else {
      await StorageService.saveCheckpointSubmission(submission);
    }
  }

  // Sync pending checkpoint submissions
  Future<void> syncCheckpointSubmissions() async {
    final submissions = await StorageService.getCheckpointSubmissions();
    if (submissions.isEmpty) return;

    for (final submission in submissions) {
      try {
        final imageFiles = submission.mediaPaths.map((path) => File(path)).toList();
        // Verify files exist
        if (imageFiles.any((f) => !f.existsSync())) {
          debugPrint('Some files missing for submission ${submission.clientId}, skipping');
          continue;
        }

        await _uploadSubmission(submission, imageFiles);
        
        if (submission.clientId != null) {
          await StorageService.deleteCheckpointSubmission(submission.clientId!);
        }
      } catch (e) {
        debugPrint('Failed to sync submission ${submission.clientId}: $e');
      }
    }
  }

  // Helper to upload a single submission
  Future<void> _uploadSubmission(CheckpointSubmission submission, List<File> imageFiles) async {
    debugPrint('\n========================================');
    debugPrint('📸 UPLOADING CHECKPOINT SUBMISSION');
    debugPrint('========================================');
    debugPrint('Checkpoint ID: ${submission.checkpointId}');
    debugPrint('Volunteer ID: ${submission.volunteerId}');
    debugPrint('Number of images: ${imageFiles.length}');
    
    if (ApiConfig.useDummyData) {
      debugPrint('⚠️  Using dummy data mode, skipping actual upload');
      await Future.delayed(const Duration(seconds: 1));
      return;
    }

    // Validate files
    for (int i = 0; i < imageFiles.length; i++) {
      debugPrint('File ${i + 1}: ${imageFiles[i].path}');
      debugPrint('  Exists: ${imageFiles[i].existsSync()}');
      if (imageFiles[i].existsSync()) {
        debugPrint('  Size: ${imageFiles[i].lengthSync()} bytes');
      }
    }

    final formData = FormData();

    formData.fields.addAll([
      MapEntry('volunteer_id', submission.volunteerId),
      if (submission.notes != null) MapEntry('notes', submission.notes!),
      if (submission.latitude != null) MapEntry('location_lat', submission.latitude.toString()),
      if (submission.longitude != null) MapEntry('location_lng', submission.longitude.toString()),
      if (submission.clientId != null) MapEntry('client_id', submission.clientId!),
    ]);

    debugPrint('Form fields: ${formData.fields.map((e) => e.key).toList()}');

    for (final file in imageFiles) {
      formData.files.add(
        MapEntry(
          'media',
          await MultipartFile.fromFile(file.path),
        ),
      );
    }

    debugPrint('Form files count: ${formData.files.length}');

    final url = ApiConfig.getCheckpointSubmitUrl(submission.checkpointId);
    debugPrint('Uploading to: $url');

    try {
      final response = await _dio.post(
        url,
        data: formData,
        options: Options(
          headers: {'Content-Type': 'multipart/form-data'},
        ),
      );
      
      debugPrint('✅ Upload successful!');
      debugPrint('Response status: ${response.statusCode}');
      debugPrint('Response data: ${response.data}');
      debugPrint('========================================\n');
    } catch (e) {
      debugPrint('❌ Upload failed with error:');
      debugPrint('Error type: ${e.runtimeType}');
      debugPrint('Error: $e');
      debugPrint('========================================\n');
      rethrow; // Re-throw to let caller handle it
    }
  }
}

