import 'package:flutter/material.dart';
import '../models/project.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import 'checkpoint_submission_screen.dart';

class VolunteerDashboard extends StatefulWidget {
  final String volunteerId;
  final String volunteerName;

  const VolunteerDashboard({
    super.key,
    required this.volunteerId,
    required this.volunteerName,
  });

  @override
  State<VolunteerDashboard> createState() => _VolunteerDashboardState();
}

class _VolunteerDashboardState extends State<VolunteerDashboard> {
  final ApiService _apiService = ApiService();
  List<Project> _projects = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadProjects();
  }

  Future<void> _loadProjects() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });
      
      final projects = await _apiService.getVolunteerProjects(widget.volunteerId);
      
      setState(() {
        _projects = projects;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load projects: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Volunteer Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await StorageService.clearVolunteerSession();
              if (mounted) Navigator.pop(context);
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _projects.length,
                  itemBuilder: (context, index) {
                    final project = _projects[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 16),
                      child: ExpansionTile(
                        title: Text(project.title),
                        subtitle: Text(project.status),
                        children: [
                          if (project.checkpoints != null)
                            ...project.checkpoints!.map((checkpoint) {
                              return ListTile(
                                title: Text(checkpoint.name),
                                subtitle: Text(checkpoint.description),
                                trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => CheckpointSubmissionScreen(
                                        checkpoint: checkpoint,
                                        volunteerId: widget.volunteerId,
                                      ),
                                    ),
                                  );
                                },
                              );
                            }),
                          if (project.checkpoints == null || project.checkpoints!.isEmpty)
                            const Padding(
                              padding: EdgeInsets.all(16.0),
                              child: Text('No checkpoints assigned'),
                            ),
                        ],
                      ),
                    );
                  },
                ),
    );
  }
}
