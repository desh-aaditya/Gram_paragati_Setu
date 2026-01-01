import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../models/village.dart';
import '../models/project.dart';

class MapScreen extends StatefulWidget {
  final Village village;
  final List<Project> projects;

  const MapScreen({
    super.key,
    required this.village,
    this.projects = const [],
  });

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  @override
  Widget build(BuildContext context) {
    // Default to village location or India center
    final center = widget.village.latitude != null && widget.village.longitude != null
        ? LatLng(widget.village.latitude!, widget.village.longitude!)
        : const LatLng(20.5937, 78.9629);

    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.village.name} Map'),
      ),
      body: FlutterMap(
        options: MapOptions(
          initialCenter: center,
          initialZoom: 14.0,
        ),
        children: [
          TileLayer(
            urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            userAgentPackageName: 'com.gram.pragati.setu',
          ),
          MarkerLayer(
            markers: [
              // Village Center Marker
              if (widget.village.latitude != null && widget.village.longitude != null)
                Marker(
                  point: LatLng(widget.village.latitude!, widget.village.longitude!),
                  width: 80,
                  height: 80,
                  child: const Icon(
                    Icons.location_city,
                    color: Colors.blue,
                    size: 40,
                  ),
                ),
              
              // Project Markers (if they have location, assuming project model might not have it yet, 
              // but we can simulate or use village location with offset)
              ...widget.projects.map((project) {
                // For demo, we'll just put them near the village center if no specific location
                // In real app, Project model should have lat/lng
                return Marker(
                  point: center, // Ideally project.lat/lng
                  width: 60,
                  height: 60,
                  child: const Icon(
                    Icons.build,
                    color: Colors.orange,
                    size: 30,
                  ),
                );
              }),
            ],
          ),
        ],
      ),
    );
  }
}
