class Village {
  final int id;
  final String name;
  final String state;
  final String district;
  final String block;
  final int population;
  final double? latitude;
  final double? longitude;
  final double adarshScore;

  Village({
    required this.id,
    required this.name,
    required this.state,
    required this.district,
    required this.block,
    required this.population,
    this.latitude,
    this.longitude,
    this.adarshScore = 0.0,
  });

  factory Village.fromJson(Map<String, dynamic> json) {
    return Village(
      id: json['id'],
      name: json['name'],
      state: json['state'],
      district: json['district'],
      block: json['block'],
      population: json['population'],
      latitude: json['latitude'] != null ? double.tryParse(json['latitude'].toString()) : null,
      longitude: json['longitude'] != null ? double.tryParse(json['longitude'].toString()) : null,
      adarshScore: json['adarsh_score'] != null ? double.tryParse(json['adarsh_score'].toString()) ?? 0.0 : 0.0,
    );
  }
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Village && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}
