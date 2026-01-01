import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/village.dart';
import '../services/api_service.dart';

// State for selected location
class LocationState {
  final String? selectedState;
  final String? selectedDistrict;
  final Village? selectedVillage;
  final List<String> states;
  final List<String> districts;
  final List<Village> villages;
  final bool isLoading;

  LocationState({
    this.selectedState,
    this.selectedDistrict,
    this.selectedVillage,
    this.states = const [],
    this.districts = const [],
    this.villages = const [],
    this.isLoading = false,
  });

  LocationState copyWith({
    String? selectedState,
    String? selectedDistrict,
    Village? selectedVillage,
    List<String>? states,
    List<String>? districts,
    List<Village>? villages,
    bool? isLoading,
  }) {
    return LocationState(
      selectedState: selectedState ?? this.selectedState,
      selectedDistrict: selectedDistrict ?? this.selectedDistrict,
      selectedVillage: selectedVillage ?? this.selectedVillage,
      states: states ?? this.states,
      districts: districts ?? this.districts,
      villages: villages ?? this.villages,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

// Location Provider using AsyncNotifier (Riverpod 3.x pattern)
class LocationNotifier extends AsyncNotifier<LocationState> {
  final ApiService _apiService = ApiService();

  @override
  Future<LocationState> build() async {
    state = const AsyncValue.loading();
    try {
      final statesList = await _apiService.getStates();
      return LocationState(states: statesList, isLoading: false);
    } catch (e, stack) {
      // Don't rethrow, return state with empty list but error in AsyncValue
      // Actually, for build(), returning error is fine, UI should handle AsyncValue.error
      debugPrint('Error loading states: $e');
      throw e; 
    }
  }

  Future<void> loadStates() async {
    state = const AsyncValue.loading();
    try {
      final statesList = await _apiService.getStates();
      final currentState = state.value ?? LocationState();
      state = AsyncValue.data(currentState.copyWith(states: statesList, isLoading: false));
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> selectState(String stateName) async {
    final currentState = state.value ?? LocationState();
    state = AsyncValue.data(currentState.copyWith(
      selectedState: stateName,
      selectedDistrict: null,
      selectedVillage: null,
      districts: [],
      villages: [],
    ));
    await loadDistricts(stateName);
  }

  Future<void> loadDistricts(String stateName) async {
    final currentState = state.value ?? LocationState();
    state = AsyncValue.data(currentState.copyWith(isLoading: true));
    try {
      final districtsList = await _apiService.getDistricts(stateName);
      state = AsyncValue.data(currentState.copyWith(
        districts: districtsList,
        isLoading: false,
      ));
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> selectDistrict(String district) async {
    final currentState = state.value ?? LocationState();
    // Update state with selected district and clear villages
    state = AsyncValue.data(currentState.copyWith(
      selectedDistrict: district,
      selectedVillage: null,
      villages: [],
      isLoading: true,
    ));
    // Load villages for the selected district
    await loadVillages(currentState.selectedState!, district);
  }

  Future<void> loadVillages(String stateName, String district) async {
    // Get the latest state and set loading
    final currentState = state.value ?? LocationState();
    state = AsyncValue.data(currentState.copyWith(isLoading: true));
    try {
      debugPrint('Loading villages for state: $stateName, district: $district');
      final villagesList = await _apiService.getVillages(stateName, district);
      debugPrint('Loaded ${villagesList.length} villages');
      
      // Get the latest state again after async operation to preserve all other fields
      final latestState = state.value ?? LocationState();
      final updatedState = latestState.copyWith(
        villages: villagesList,
        isLoading: false,
        selectedState: stateName,
        selectedDistrict: district,
      );
      debugPrint('Updating state with ${updatedState.villages.length} villages');
      state = AsyncValue.data(updatedState);
    } catch (e, stack) {
      // On error, preserve current state but mark as not loading
      // On error, expose it so UI can show it
      state = AsyncValue.error(e, stack);
      debugPrint('Error loading villages: $e');
      debugPrint('Stack trace: $stack');
    }
  }

  void selectVillage(Village village) {
    final currentState = state.value ?? LocationState();
    state = AsyncValue.data(currentState.copyWith(selectedVillage: village));
  }

  void clearSelection() {
    final currentState = state.value ?? LocationState();
    state = AsyncValue.data(LocationState(states: currentState.states));
    loadStates();
  }
}

final locationProvider = AsyncNotifierProvider<LocationNotifier, LocationState>(() {
  return LocationNotifier();
});

