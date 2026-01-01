class CheckpointSubmission {
  final int? id;
  final int checkpointId;
  final String volunteerId;
  final String? notes;
  final double? latitude;
  final double? longitude;
  final String? clientId;
  final DateTime? submittedAt;
  final List<String> mediaPaths; // Local file paths

  CheckpointSubmission({
    this.id,
    required this.checkpointId,
    required this.volunteerId,
    this.notes,
    this.latitude,
    this.longitude,
    this.clientId,
    this.submittedAt,
    this.mediaPaths = const [],
  });

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'checkpoint_id': checkpointId,
      'volunteer_id': volunteerId,
      if (notes != null) 'notes': notes,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (clientId != null) 'client_id': clientId,
      if (submittedAt != null) 'submitted_at': submittedAt!.toIso8601String(),
      'media_paths': mediaPaths,
    };
  }

  factory CheckpointSubmission.fromJson(Map<String, dynamic> json) {
    return CheckpointSubmission(
      id: json['id'],
      checkpointId: json['checkpoint_id'],
      volunteerId: json['volunteer_id'],
      notes: json['notes'],
      latitude: json['latitude'],
      longitude: json['longitude'],
      clientId: json['client_id'],
      submittedAt: json['submitted_at'] != null 
          ? DateTime.parse(json['submitted_at']) 
          : null,
      mediaPaths: List<String>.from(json['media_paths'] ?? []),
    );
  }
}
