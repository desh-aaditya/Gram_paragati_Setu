import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:uuid/uuid.dart';
import '../config/api_config.dart';
import '../models/village.dart';
import '../models/project.dart';
import '../models/priority_vote.dart';
import 'dummy_data_service.dart';

class ApiService {
  final DummyDataService _dummyService = DummyDataService();
  late final Dio _dio;

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      sendTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      validateStatus: (status) {
        return status != null && status < 500; // Don't throw for 4xx errors so we can handle them
      },
    ));

    // Add interceptors for auth token (if needed later) or logging
    _dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
      logPrint: (obj) => print('API Log: $obj'),
    ));
  }

  Future<List<String>> getStates() async {
    if (ApiConfig.useDummyData) return _dummyService.getStates();
    
    try {
      final response = await _dio.get(ApiConfig.states);
      return List<String>.from(response.data);
    } catch (e) {
      throw Exception('Failed to load states: $e');
    }
  }

  Future<List<String>> getDistricts(String state) async {
    if (ApiConfig.useDummyData) return _dummyService.getDistricts(state);
    
    try {
      final response = await _dio.get(
        ApiConfig.districts,
        queryParameters: {'state': state},
      );
      return List<String>.from(response.data);
    } catch (e) {
      throw Exception('Failed to load districts: $e');
    }
  }

  Future<List<Village>> getVillages(String state, String district) async {
    if (ApiConfig.useDummyData) return _dummyService.getVillages(state, district);
    
    try {
      final response = await _dio.get(
        ApiConfig.villages,
        queryParameters: {'state': state, 'district': district},
      );
      final List<dynamic> data = response.data;
      return data.map((json) => Village.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to load villages: $e');
    }
  }

  Future<Map<String, dynamic>> getVillageAnalytics(int villageId) async {
    if (ApiConfig.useDummyData) return _dummyService.getVillageAnalytics(villageId);
    
    try {
      final response = await _dio.get('/village/$villageId/analytics'); // Assuming relative path
      return response.data;
    } catch (e) {
      throw Exception('Failed to load village analytics: $e');
    }
  }

  Future<Map<String, dynamic>> submitPriorityVote(PriorityVote vote, {File? audioFile}) async {
    if (ApiConfig.useDummyData) return _dummyService.submitPriorityVote(vote);
    
    try {
      if (audioFile != null) {
        // Use FormData for file upload
        final formData = FormData.fromMap({
          ...vote.toJson(),
        });
        
        formData.files.add(MapEntry(
          'audio_file',
          await MultipartFile.fromFile(audioFile.path),
        ));

        final response = await _dio.post(
          ApiConfig.priorityVote,
          data: formData,
        );
        return response.data;
      } else {
        // Standard JSON request
        final response = await _dio.post(
          ApiConfig.priorityVote,
          data: vote.toJson(),
        );
        return response.data;
      }
    } catch (e) {
      throw Exception('Failed to submit priority vote: $e');
    }
  }
  
  // Batch sync priority votes
  Future<Map<String, dynamic>> syncPriorityVotes(List<PriorityVote> votes) async {
    if (ApiConfig.useDummyData) return {'message': 'Dummy sync success'};

    try {
      final response = await _dio.post(
        '/sync/priority-votes',
        data: {'votes': votes.map((v) => v.toJson()).toList()},
      );
      return response.data;
    } catch (e) {
      throw Exception('Failed to sync priority votes: $e');
    }
  }

  Future<Map<String, dynamic>> volunteerLogin(String username, String password) async {
    if (ApiConfig.useDummyData) return _dummyService.volunteerLogin(username, password);
    
    try {
      final response = await _dio.post(
        ApiConfig.volunteerLogin,
        data: {'username': username, 'password': password},
      );
      
      if (response.statusCode == 200) {
        return response.data;
      } else {
        throw Exception(response.data['error'] ?? 'Login failed');
      }
    } catch (e) {
      throw Exception('Login failed: $e');
    }
  }

  Future<List<Project>> getVolunteerProjects(String volunteerId) async {
    if (ApiConfig.useDummyData) return _dummyService.getVolunteerProjects(volunteerId);
    
    try {
      final response = await _dio.get('/volunteer/$volunteerId/projects');
      final data = response.data;
      final List<dynamic> projects = data['projects'] ?? [];
      return projects.map((json) => Project.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to load projects: $e');
    }
  }

  // Submit Issue (Villager)
  // Submit Issue (Villager)
  Future<Map<String, dynamic>> submitIssue({
    required int villageId,
    required String issueType,
    required String description,
    required String deviceId,
    String? category,
    List<File>? attachments,
  }) async {
    try {
      final formData = FormData.fromMap({
        'client_id': const Uuid().v4(),
        'issue_type': issueType,
        'description': description,
        'device_id': deviceId,
        'category': category,
      });

      if (attachments != null) {
        for (var file in attachments) {
          formData.files.add(MapEntry(
            'attachments',
            await MultipartFile.fromFile(file.path),
          ));
        }
      }

      // Use root API URL (remove /mobile from base URL)
      final rootUrl = ApiConfig.baseUrl.replaceAll('/mobile', '');
      final url = '$rootUrl/issues/$villageId/submit';
      print('Submitting issue to: $url');
      
      final response = await _dio.post(
        url,
        data: formData,
      );
      
      print('Response status: ${response.statusCode}');
      print('Response data type: ${response.data.runtimeType}');
      print('Response data: ${response.data}');

      if (response.statusCode == 200) {
        if (response.data is List) {
          print('CRITICAL ERROR: Backend returned a List instead of a Map!');
          print('List content: ${response.data}');
          throw Exception('Backend returned unexpected List format: ${response.data}');
        }
        return response.data;
      } else {
        // Handle case where response.data is not a Map
        if (response.data is Map) {
          throw Exception(response.data['error'] ?? 'Submission failed');
        } else {
          throw Exception('Submission failed with status ${response.statusCode}: ${response.data}');
        }
      }
    } catch (e) {
      print('Submit issue error: $e');
      throw Exception('Failed to submit issue: $e');
    }
  }

  // Get Pending Issues (Volunteer)
  Future<List<dynamic>> getPendingIssues(int villageId) async {
    try {
      final rootUrl = ApiConfig.baseUrl.replaceAll('/mobile', '');
      final response = await _dio.get('$rootUrl/issues/$villageId/pending');
      return response.data;
    } catch (e) {
      throw Exception('Failed to load pending issues: $e');
    }
  }

  // Validate Issue (Volunteer)
  Future<void> validateIssue({
    required int issueId,
    required String volunteerId,
    required String notes,
    List<File>? photos,
  }) async {
    try {
      final formData = FormData.fromMap({
        'volunteer_id': volunteerId,
        'notes': notes,
      });

      if (photos != null) {
        for (var file in photos) {
          formData.files.add(MapEntry(
            'media',
            await MultipartFile.fromFile(file.path),
          ));
        }
      }

      final rootUrl = ApiConfig.baseUrl.replaceAll('/mobile', '');
      await _dio.post('$rootUrl/issues/$issueId/validate', data: formData);
    } catch (e) {
      throw Exception('Failed to validate issue: $e');
    }
  }

  // Get Pending Priority Votes (Volunteer)
  Future<List<dynamic>> getPendingPriorityVotes(int villageId) async {
    try {
      // These routes are in mobile.ts, so they are under /api/mobile
      // Dio baseUrl is already set to /api/mobile
      final response = await _dio.get('/priority-votes/$villageId/pending');
      return response.data;
    } catch (e) {
      throw Exception('Failed to load pending votes: $e');
    }
  }

  // Verify Priority Vote (Volunteer)
  Future<void> verifyPriorityVote({
    required int voteId,
    required String volunteerId,
    required String status, // 'verified' or 'rejected'
    String? notes,
  }) async {
    try {
      await _dio.post(
        '/priority-votes/$voteId/verify',
        data: {
          'volunteer_id': volunteerId,
          'status': status,
          'notes': notes,
        },
      );
    } catch (e) {
      throw Exception('Failed to verify vote: $e');
    }
  }

  // Submit Skill Entry (Volunteer)
  Future<void> submitSkill({
    required int villageId,
    required String villagerName,
    required String contactNumber,
    required String skillCategory,
    required String skillLevel,
    required int experienceYears,
    required String availability,
    required String volunteerId,
    File? proofFile,
  }) async {
    try {
      final formData = FormData.fromMap({
        'village_id': villageId,
        'villager_name': villagerName,
        'contact_number': contactNumber,
        'skill_category': skillCategory,
        'skill_level': skillLevel,
        'experience_years': experienceYears,
        'availability': availability,
        'volunteer_id': volunteerId,
      });

      if (proofFile != null) {
        formData.files.add(MapEntry(
          'proof_media',
          await MultipartFile.fromFile(proofFile.path),
        ));
      }

      // Route registered at /api/skills in backend
      // _dio base URL is /api/mobile usually? 
      // Wait, let's check base URL usage. `_dio` base URL is `ApiConfig.baseUrl`. 
      // If `ApiConfig.baseUrl` is `/api/mobile`, I need to go up or use absolute path.
      // But `skills` route is NOT in `mobile.ts`. It is in `skills.ts`.
      // So I should use root URL replacement trick like in `submitIssue`.
      
      final rootUrl = ApiConfig.baseUrl.replaceAll('/mobile', '');
      await _dio.post('$rootUrl/skills', data: formData);

    } catch (e) {
      throw Exception('Failed to submit skill: $e');
    }
  }
}

  // Checkpoint submission with file upload is handled via SyncService using Dio directly 
  // or we can expose a method here that SyncService uses.
  // For consistency, let's keep the upload logic where it handles FormData.
