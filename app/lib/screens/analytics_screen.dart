import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import '../providers/location_provider.dart';
import '../models/village.dart';
import '../services/api_service.dart';

class AnalyticsScreen extends ConsumerStatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  ConsumerState<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends ConsumerState<AnalyticsScreen> {
  Map<String, dynamic>? _analyticsData;
  bool _isLoading = false;
  String? _error;

  Future<void> _loadAnalytics() async {
    final locationAsync = ref.watch(locationProvider);
    final locationState = locationAsync.value ?? LocationState();
    if (locationState.selectedVillage == null) {
      setState(() => _error = 'Please select a village first');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final apiService = ApiService();
      final data = await apiService.getVillageAnalytics(
        locationState.selectedVillage!.id,
      );
      setState(() {
        _analyticsData = data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load analytics: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final locationAsync = ref.watch(locationProvider);
    final locationState = locationAsync.value ?? LocationState();

    return Scaffold(
      appBar: AppBar(title: const Text('Village Analytics')),
      body: locationState.selectedVillage == null
          ? ListView(
              padding: const EdgeInsets.all(16.0),
              children: [
                // Location Selection Card
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Select Location',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 16),
                        
                        // State Dropdown
                        DropdownButtonFormField<String>(
                          value: locationState.selectedState,
                          decoration: const InputDecoration(
                            labelText: 'State',
                            border: OutlineInputBorder(),
                          ),
                          items: locationState.states.isEmpty
                              ? [const DropdownMenuItem(value: null, child: Text('Loading states...'))]
                              : locationState.states.map((state) {
                                  return DropdownMenuItem(value: state, child: Text(state));
                                }).toList(),
                          onChanged: locationState.states.isEmpty
                              ? null
                              : (value) {
                                  if (value != null) {
                                    ref.read(locationProvider.notifier).selectState(value);
                                  }
                                },
                        ),
                        
                        const SizedBox(height: 16),
                        
                        // District Dropdown
                        if (locationState.selectedState != null)
                          DropdownButtonFormField<String>(
                            value: locationState.districts.contains(locationState.selectedDistrict)
                                ? locationState.selectedDistrict
                                : null,
                            decoration: const InputDecoration(
                              labelText: 'District',
                              border: OutlineInputBorder(),
                            ),
                            items: locationState.districts.isEmpty
                                ? [const DropdownMenuItem(value: null, child: Text('Loading districts...'))]
                                : locationState.districts.map((district) {
                                    return DropdownMenuItem(value: district, child: Text(district));
                                  }).toList(),
                            onChanged: locationState.districts.isEmpty
                                ? null
                                : (value) {
                                    if (value != null) {
                                      ref.read(locationProvider.notifier).selectDistrict(value);
                                    }
                                  },
                          ),
                        
                        if (locationState.selectedState != null) const SizedBox(height: 16),
                        
                        // Village Dropdown
                        if (locationState.selectedDistrict != null)
                          locationState.isLoading && locationState.villages.isEmpty
                              ? const Padding(
                                  padding: EdgeInsets.all(16.0),
                                  child: Center(child: CircularProgressIndicator()),
                                )
                              : DropdownButtonFormField<Village>(
                                  value: locationState.villages.contains(locationState.selectedVillage)
                                      ? locationState.selectedVillage
                                      : null,
                                  decoration: const InputDecoration(
                                    labelText: 'Village',
                                    border: OutlineInputBorder(),
                                  ),
                                  items: locationState.villages.isEmpty
                                      ? [const DropdownMenuItem(value: null, child: Text('No villages found'))]
                                      : locationState.villages.map((village) {
                                          return DropdownMenuItem(
                                            value: village,
                                            child: Text(village.name),
                                          );
                                        }).toList(),
                                  onChanged: locationState.villages.isEmpty
                                      ? null
                                      : (value) {
                                          if (value != null) {
                                            ref.read(locationProvider.notifier).selectVillage(value);
                                          }
                                        },
                                ),
                      ],
                    ),
                  ),
                ),
              ],
            )
          : _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _error != null
                  ? Center(child: Text(_error!))
                  : _analyticsData == null
                      ? Center(
                          child: ElevatedButton(
                            onPressed: _loadAnalytics,
                            child: const Text('Load Analytics'),
                          ),
                        )
                      : _buildAnalyticsContent(),
    );
  }

  Widget _buildAnalyticsContent() {
    final village = _analyticsData!['village'] as Map<String, dynamic>;
    final projects = _analyticsData!['projects'] as List<dynamic>;
    final images = _analyticsData!['checkpoint_images'] as List<dynamic>;

    return ListView(
      padding: const EdgeInsets.all(16.0),
      children: [
        // Village Info Card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  village['name'],
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text('${village['district']}, ${village['state']}'),
                if (village['adarsh_score'] != null) ...[
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      const Text('Adarsh Score: '),
                      Text(
                        '${village['adarsh_score']}%',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.green,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),

        const SizedBox(height: 24),

        // Projects Progress
        const Text(
          'Projects Progress',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        ...projects.map((project) => Card(
              child: ListTile(
                title: Text(project['title']),
                subtitle: Text('${project['completion_percent']}% Complete'),
                trailing: CircularProgressIndicator(
                  value: (project['completion_percent'] ?? 0) / 100,
                ),
              ),
            )),

        const SizedBox(height: 24),

        // Progress Chart
        if (projects.isNotEmpty) _buildProgressChart(projects),

        const SizedBox(height: 24),

        // Checkpoint Images
        if (images.isNotEmpty) ...[
          const Text(
            'Recent Progress Images',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 200,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: images.length,
              itemBuilder: (context, index) {
                final image = images[index];
                return Padding(
                  padding: const EdgeInsets.only(right: 8.0),
                  child: Image.network(
                    image['file_url'],
                    width: 200,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return const SizedBox(
                        width: 200,
                        child: Center(child: Text('Image not available')),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildProgressChart(List<dynamic> projects) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: SizedBox(
          height: 300,
          child: BarChart(
            BarChartData(
              alignment: BarChartAlignment.spaceAround,
              maxY: 100,
              barTouchData: BarTouchData(enabled: false),
              titlesData: FlTitlesData(
                show: true,
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    getTitlesWidget: (value, meta) {
                      if (value.toInt() < projects.length) {
                        final title = projects[value.toInt()]['title'] as String;
                        return Padding(
                          padding: const EdgeInsets.only(top: 8.0),
                          child: Text(
                            title.length > 15 ? '${title.substring(0, 15)}...' : title,
                            style: const TextStyle(fontSize: 10),
                          ),
                        );
                      }
                      return const Text('');
                    },
                  ),
                ),
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    getTitlesWidget: (value, meta) {
                      return Text('${value.toInt()}%');
                    },
                  ),
                ),
              ),
              gridData: FlGridData(show: true),
              borderData: FlBorderData(show: false),
              barGroups: projects.asMap().entries.map((entry) {
                final index = entry.key;
                final project = entry.value;
                return BarChartGroupData(
                  x: index,
                  barRods: [
                    BarChartRodData(
                      toY: (project['completion_percent'] ?? 0).toDouble(),
                      color: Colors.blue,
                      width: 20,
                    ),
                  ],
                );
              }).toList(),
            ),
          ),
        ),
      ),
    );
  }
}

