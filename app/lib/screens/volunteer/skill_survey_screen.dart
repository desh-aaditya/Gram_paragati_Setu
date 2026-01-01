
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../services/api_service.dart';

class SkillSurveyScreen extends StatefulWidget {
  final String volunteerId;
  final int villageId;

  const SkillSurveyScreen({
    super.key,
    required this.volunteerId,
    required this.villageId,
  });

  @override
  State<SkillSurveyScreen> createState() => _SkillSurveyScreenState();
}

class _SkillSurveyScreenState extends State<SkillSurveyScreen> {
  final _formKey = GlobalKey<FormState>();
  final _apiService = ApiService();
  bool _isLoading = false;

  // Form Fields
  final _nameController = TextEditingController();
  final _contactController = TextEditingController();
  String _skillCategory = 'Construction';
  String _skillLevel = 'Beginner';
  final _experienceController = TextEditingController();
  String _availability = 'Full-time';
  File? _proofImage;

  final List<String> _categories = [
    'Construction',
    'Agriculture',
    'Tailoring',
    'Healthcare',
    'Driving',
    'Education',
    'Technology',
    'Handicrafts',
    'Other'
  ];

  final List<String> _levels = ['Beginner', 'Intermediate', 'Expert'];
  final List<String> _availabilityOptions = ['Full-time', 'Part-time', 'Seasonal'];

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.camera);

    if (pickedFile != null) {
      setState(() {
        _proofImage = File(pickedFile.path);
      });
    }
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      await _apiService.submitSkill(
        villageId: widget.villageId,
        villagerName: _nameController.text,
        contactNumber: _contactController.text,
        skillCategory: _skillCategory,
        skillLevel: _skillLevel,
        experienceYears: int.parse(_experienceController.text),
        availability: _availability,
        volunteerId: widget.volunteerId,
        proofFile: _proofImage,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Skill entry added successfully! ✅'), backgroundColor: Colors.green),
        );
        _resetForm();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _resetForm() {
    _nameController.clear();
    _contactController.clear();
    _experienceController.clear();
    setState(() {
      _skillCategory = 'Construction';
      _skillLevel = 'Beginner';
      _availability = 'Full-time';
      _proofImage = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Villager Skill Survey'),
        backgroundColor: const Color(0xFF673AB7), // Deep Purple
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Enter Villager Details',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF673AB7)),
              ),
              const SizedBox(height: 16),

              // Name
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Villager Name',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.person),
                ),
                validator: (value) => value!.isEmpty ? 'Please enter name' : null,
              ),
              const SizedBox(height: 16),

              // Contact
              TextFormField(
                controller: _contactController,
                decoration: const InputDecoration(
                  labelText: 'Contact Number',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.phone),
                ),
                keyboardType: TextInputType.phone,
                validator: (value) => value!.isEmpty ? 'Please enter contact number' : null,
              ),
              const SizedBox(height: 16),

              // Skill Category
              DropdownButtonFormField<String>(
                value: _skillCategory,
                decoration: const InputDecoration(
                  labelText: 'Skill Category',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.work),
                ),
                items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                onChanged: (val) => setState(() => _skillCategory = val!),
              ),
              const SizedBox(height: 16),

              // Skill Level
              DropdownButtonFormField<String>(
                value: _skillLevel,
                decoration: const InputDecoration(
                  labelText: 'Skill Level',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.star),
                ),
                items: _levels.map((l) => DropdownMenuItem(value: l, child: Text(l))).toList(),
                onChanged: (val) => setState(() => _skillLevel = val!),
              ),
              const SizedBox(height: 16),

              // Experience
              TextFormField(
                controller: _experienceController,
                decoration: const InputDecoration(
                  labelText: 'Experience (Years)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.timeline),
                ),
                keyboardType: TextInputType.number,
                validator: (value) => value!.isEmpty ? 'Enter experience' : null,
              ),
              const SizedBox(height: 16),

              // Availability
              DropdownButtonFormField<String>(
                value: _availability,
                decoration: const InputDecoration(
                  labelText: 'Availability',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.schedule),
                ),
                items: _availabilityOptions.map((o) => DropdownMenuItem(value: o, child: Text(o))).toList(),
                onChanged: (val) => setState(() => _availability = val!),
              ),
              const SizedBox(height: 24),

              // Proof Image
              if (_proofImage != null)
                Stack(
                  alignment: Alignment.topRight,
                  children: [
                    Image.file(_proofImage!, height: 200, width: double.infinity, fit: BoxFit.cover),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white, size: 30),
                      onPressed: () => setState(() => _proofImage = null),
                    ),
                  ],
                ),
              
              OutlinedButton.icon(
                onPressed: _pickImage,
                icon: const Icon(Icons.camera_alt),
                label: Text(_proofImage == null ? 'Take Photo Proof (Optional)' : 'Retake Photo'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
              const SizedBox(height: 32),

              // Submit Button
              ElevatedButton(
                onPressed: _isLoading ? null : _submitForm,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF673AB7),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('SUBMIT SKILL ENTRY', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
