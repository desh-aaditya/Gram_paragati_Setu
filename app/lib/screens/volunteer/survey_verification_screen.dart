import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../services/api_service.dart';

class SurveyVerificationScreen extends ConsumerStatefulWidget {
  final String volunteerId;
  final int villageId;

  const SurveyVerificationScreen({
    super.key,
    required this.volunteerId,
    required this.villageId,
  });

  @override
  ConsumerState<SurveyVerificationScreen> createState() => _SurveyVerificationScreenState();
}

class _SurveyVerificationScreenState extends ConsumerState<SurveyVerificationScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> _pendingVotes = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPendingVotes();
  }

  Future<void> _loadPendingVotes() async {
    try {
      final votes = await _apiService.getPendingPriorityVotes(widget.villageId);
      setState(() {
        _pendingVotes = votes;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  Future<void> _verifyVote(int voteId, String status) async {
    final notesController = TextEditingController();
    
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(status == 'verified' ? 'Verify Vote' : 'Reject Vote'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Are you sure you want to ${status == 'verified' ? 'verify' : 'reject'} this vote?'),
            const SizedBox(height: 16),
            TextField(
              controller: notesController,
              decoration: const InputDecoration(
                labelText: 'Notes (Optional)',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: status == 'verified' ? Colors.green : Colors.red,
              foregroundColor: Colors.white,
            ),
            child: Text(status == 'verified' ? 'Verify' : 'Reject'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await _apiService.verifyPriorityVote(
          voteId: voteId,
          volunteerId: widget.volunteerId,
          status: status,
          notes: notesController.text,
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Vote $status successfully')),
          );
          _loadPendingVotes();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Verify Surveys')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _pendingVotes.isEmpty
              ? const Center(child: Text('No pending surveys found'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _pendingVotes.length,
                  itemBuilder: (context, index) {
                    final vote = _pendingVotes[index];
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
                                Expanded(
                                  child: Text(
                                    vote['required_infrastructure'],
                                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.blue[100],
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    '${vote['total_votes']} Votes',
                                    style: TextStyle(color: Colors.blue[800], fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(vote['description']),
                            if (vote['category'] != null) ...[
                              const SizedBox(height: 4),
                              Text('Category: ${vote['category']}', style: TextStyle(color: Colors.grey[600])),
                            ],
                            const SizedBox(height: 16),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                OutlinedButton(
                                  onPressed: () => _verifyVote(vote['id'], 'rejected'),
                                  style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
                                  child: const Text('Reject'),
                                ),
                                const SizedBox(width: 16),
                                ElevatedButton(
                                  onPressed: () => _verifyVote(vote['id'], 'verified'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.green,
                                    foregroundColor: Colors.white,
                                  ),
                                  child: const Text('Verify'),
                                ),
                              ],
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
