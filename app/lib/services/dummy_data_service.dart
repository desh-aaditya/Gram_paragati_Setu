import '../models/village.dart';
import '../models/project.dart';
import '../models/priority_vote.dart';

class DummyDataService {
  Future<List<String>> getStates() async {
    await Future.delayed(const Duration(milliseconds: 500));
    return ['Maharashtra', 'Tamil Nadu', 'Uttar Pradesh'];
  }

  Future<List<String>> getDistricts(String state) async {
    await Future.delayed(const Duration(milliseconds: 500));
    if (state == 'Maharashtra') return ['Pune', 'Mumbai', 'Nagpur'];
    if (state == 'Tamil Nadu') return ['Chennai', 'Madurai', 'Coimbatore'];
    return ['District A', 'District B'];
  }

  Future<List<Village>> getVillages(String state, String district) async {
    await Future.delayed(const Duration(milliseconds: 500));
    return [
      Village(
        id: 1,
        name: 'Village A',
        state: state,
        district: district,
        block: 'Block X',
        population: 2500,
        latitude: 18.5204,
        longitude: 73.8567,
        adarshScore: 75.5,
      ),
      Village(
        id: 2,
        name: 'Village B',
        state: state,
        district: district,
        block: 'Block Y',
        population: 1800,
        latitude: 18.5304,
        longitude: 73.8667,
        adarshScore: 60.0,
      ),
    ];
  }

  Future<Map<String, dynamic>> getVillageAnalytics(int villageId) async {
    await Future.delayed(const Duration(milliseconds: 500));
    return {
      'village': {
        'id': villageId,
        'name': 'Village A',
        'adarsh_score': 75.5,
      },
      'projects': [],
      'checkpoint_images': [],
    };
  }

  Future<Map<String, dynamic>> submitPriorityVote(PriorityVote vote) async {
    await Future.delayed(const Duration(milliseconds: 500));
    return {'message': 'Vote submitted successfully (Dummy)'};
  }

  Future<Map<String, dynamic>> volunteerLogin(String username, String password) async {
    await Future.delayed(const Duration(milliseconds: 500));
    if (username == 'volunteer' && password == 'password') {
      return {
        'volunteer_id': 'vol_123',
        'username': 'volunteer',
        'full_name': 'John Doe',
        'employee_id': 101,
      };
    }
    throw Exception('Invalid credentials');
  }

  Future<List<Project>> getVolunteerProjects(String volunteerId) async {
    await Future.delayed(const Duration(milliseconds: 500));
    return [
      Project(
        id: 1,
        title: 'Road Construction',
        // description: 'Main road repair', // Removed as not in model
        projectType: 'Infrastructure',
        status: 'In Progress',
        villageId: 1,
        villageName: 'Village A', // Added required field
        checkpoints: [
          Checkpoint(
            id: 1,
            // projectId: 1, // Removed as not in model
            name: 'Foundation',
            description: 'Foundation work',
            checkpointOrder: 1,
            isMandatory: true,
          ),
        ],
      ),
    ];
  }

  Future<Map<String, dynamic>> submitCheckpoint(
    int checkpointId,
    String volunteerId,
    List<String> imagePaths,
    String? notes,
    double? lat,
    double? lng,
    String? clientId,
  ) async {
    await Future.delayed(const Duration(milliseconds: 1000));
    return {'message': 'Checkpoint submitted successfully (Dummy)'};
  }
}
