class Project {
  final int id;
  final String title;
  final String? projectType;
  final String status;
  final int villageId;
  final String villageName;
  final List<Checkpoint> checkpoints;
  final int? completionPercent;

  Project({
    required this.id,
    required this.title,
    this.projectType,
    required this.status,
    required this.villageId,
    required this.villageName,
    required this.checkpoints,
    this.completionPercent,
  });

  factory Project.fromJson(Map<String, dynamic> json) {
    return Project(
      id: json['id'] ?? 0,
      title: json['title'] ?? 'Untitled Project',
      projectType: json['project_type'],
      status: json['status'] ?? 'Unknown',
      villageId: json['village_id'] ?? 0,
      villageName: json['village_name'] ?? 'Unknown Village',
      checkpoints: (json['checkpoints'] as List<dynamic>?)
              ?.map((c) => Checkpoint.fromJson(c))
              .toList() ??
          [],
      completionPercent: json['completion_percent'],
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Project && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}

class Checkpoint {
  final int id;
  final String name;
  final String? description;
  final int checkpointOrder;
  final bool isMandatory;
  final String? estimatedDate;

  Checkpoint({
    required this.id,
    required this.name,
    this.description,
    required this.checkpointOrder,
    required this.isMandatory,
    this.estimatedDate,
  });

  factory Checkpoint.fromJson(Map<String, dynamic> json) {
    return Checkpoint(
      id: json['id'] ?? 0,
      name: json['name'] ?? 'Untitled Checkpoint',
      description: json['description'],
      checkpointOrder: json['checkpoint_order'] ?? 0,
      isMandatory: json['is_mandatory'] ?? true,
      estimatedDate: json['estimated_date'],
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Checkpoint && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}







