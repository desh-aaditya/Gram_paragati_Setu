class PriorityVote {
  final int? id;
  final int villageId;
  final String requiredInfrastructure;
  final String description;
  final String? category;
  final bool isVolunteer;
  final String? volunteerId;
  final int? employeeId;
  final String? clientId; // For offline sync

  PriorityVote({
    this.id,
    required this.villageId,
    required this.requiredInfrastructure,
    required this.description,
    this.category,
    this.isVolunteer = false,
    this.volunteerId,
    this.employeeId,
    this.clientId,
  });

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'village_id': villageId,
      'required_infrastructure': requiredInfrastructure,
      'description': description,
      if (category != null) 'category': category,
      'is_volunteer': isVolunteer,
      if (volunteerId != null) 'volunteer_id': volunteerId,
      if (employeeId != null) 'employee_id': employeeId,
      if (clientId != null) 'client_id': clientId,
    };
  }
}







