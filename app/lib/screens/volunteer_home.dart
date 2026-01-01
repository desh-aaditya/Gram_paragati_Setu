import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gram_pragati_setu_mobile/l10n/gen/app_localizations.dart';
import '../providers/language_provider.dart';
import '../screens/survey_screen.dart';
import '../screens/home_screen.dart';
import 'volunteer/checkpoint_upload_screen.dart';
import 'volunteer/issue_validation_screen.dart';
import 'volunteer/survey_verification_screen.dart';
import 'volunteer/skill_survey_screen.dart';

class VolunteerHomeScreen extends ConsumerWidget {
  final Map<String, dynamic> volunteerData;

  const VolunteerHomeScreen({super.key, required this.volunteerData});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final currentLocale = ref.watch(languageProvider);
    
    return Scaffold(
      extendBodyBehindAppBar: true, 
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: Padding(
          padding: const EdgeInsets.only(left: 16.0),
          child: Image.asset(
            'assets/images/emblem.png',
            fit: BoxFit.contain,
          ),
        ),
        leadingWidth: 70, 
        title: Text(
          l10n.welcomeVolunteer(volunteerData['full_name'] ?? 'Volunteer'),
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        actions: [
           PopupMenuButton<Locale>(
            icon: const Icon(Icons.language, color: Colors.white),
            onSelected: (Locale locale) {
              ref.read(languageProvider.notifier).setLanguage(locale);
            },
            itemBuilder: (BuildContext context) => <PopupMenuEntry<Locale>>[
              const PopupMenuItem<Locale>(
                value: Locale('en'),
                child: Text('English'),
              ),
              const PopupMenuItem<Locale>(
                value: Locale('hi'),
                child: Text('हिंदी'),
              ),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            onPressed: () {
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const HomeScreen()),
                (route) => false,
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          // Gradient Header
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(24, 100, 24, 32),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFFFF9933), Color(0xFFE65100)], // Saffron/Orange
              ),
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(32),
                bottomRight: Radius.circular(32),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black26,
                  blurRadius: 10,
                  offset: Offset(0, 4),
                )
              ],
            ),
            child: Column(
              children: [
                const Icon(Icons.volunteer_activism, size: 48, color: Colors.white),
                const SizedBox(height: 16),
                Text(
                  l10n.volunteerDashboard,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    letterSpacing: 0.5,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                     l10n.assignedTo(() {
                       final details = volunteerData['assigned_village_details'] as List<dynamic>?;
                       if (details != null && details.isNotEmpty) {
                         return details.map((d) => d['name'].toString()).join(", ");
                       }
                       return volunteerData['assigned_villages']?.join(", ") ?? "No villages";
                     }()),
                    style: const TextStyle(
                      fontSize: 13,
                      color: Colors.white,
                      fontWeight: FontWeight.w500,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
          ),
 
          Expanded(
            child: GridView.count(
              padding: const EdgeInsets.all(24.0),
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 0.85, // Fixed aspect ratio for consistency
              children: [
                _buildDashboardCard(
                  context,
                  title: l10n.villageSurvey,
                  subtitle: l10n.villageSurvey,
                  icon: Icons.verified_user,
                  color: const Color(0xFFFF9933), 
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => SurveyScreen(
                          isVolunteer: true,
                          volunteerId: volunteerData['volunteer_id'],
                          employeeId: volunteerData['employee_id'],
                        ),
                      ),
                    );
                  },
                ),
                _buildDashboardCard(
                  context,
                  title: l10n.uploadProgress,
                  subtitle: l10n.updateProjectStatus,
                  icon: Icons.camera_alt,
                  color: const Color(0xFF138808), 
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => CheckpointUploadScreen(
                          volunteerId: volunteerData['volunteer_id'],
                        ),
                      ),
                    );
                  },
                ),
                _buildDashboardCard(
                  context,
                  title: l10n.validateIssues,
                  subtitle: l10n.verifyReportedIssues,
                  icon: Icons.fact_check,
                  color: const Color(0xFF1A237E), // Deep Blue
                  onTap: () => _handleNavigation(
                    context,
                    (villageId) => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => IssueValidationScreen(
                          volunteerId: volunteerData['volunteer_id'].toString(),
                          villageId: villageId,
                        ),
                      ),
                    ),
                  ),
                ),
                _buildDashboardCard(
                  context,
                  title: l10n.verifySurveys,
                  subtitle: l10n.verifyPriorityVotes,
                  icon: Icons.how_to_vote,
                  color: const Color(0xFFC2185B), // Pink
                  onTap: () => _handleNavigation(
                    context,
                    (villageId) => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => SurveyVerificationScreen(
                          volunteerId: volunteerData['volunteer_id'].toString(),
                          villageId: villageId,
                        ),
                      ),
                    ),
                  ),
                ),
                _buildDashboardCard(
                  context,
                  title: 'Skill Survey',
                  subtitle: 'Register Villager Skills',
                  icon: Icons.work,
                  color: const Color(0xFF673AB7), // Deep Purple
                  onTap: () => _handleNavigation(
                    context,
                    (villageId) => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => SkillSurveyScreen(
                          volunteerId: volunteerData['volunteer_id'].toString(),
                          villageId: villageId,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDashboardCard(BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 32, color: color),
              ),
              const SizedBox(height: 12),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF003366),
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: TextStyle(fontSize: 10, color: Colors.grey[600]),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _handleNavigation(BuildContext context, Function(int) onVillageSelected) {
    final assignedVillages = volunteerData['assigned_villages'] as List<dynamic>?;
    final l10n = AppLocalizations.of(context)!;

    if (assignedVillages == null || assignedVillages.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.noAssignedVillages)),
      );
      return;
    }

    if (assignedVillages.length == 1) {
      onVillageSelected(assignedVillages[0] as int);
    } else {
      _showVillageSelectionDialog(context, assignedVillages, onVillageSelected);
    }
  }

  void _showVillageSelectionDialog(
    BuildContext context,
    List<dynamic> villages,
    Function(int) onSelected,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Village'),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: villages.length,
            itemBuilder: (context, index) {
              final villageId = villages[index] as int;
              String villageLabel = 'Village ID: $villageId';

              // Try to find name if available
              final details = volunteerData['assigned_village_details'] as List<dynamic>?;
              if (details != null) {
                final match = details.firstWhere(
                  (d) => d['id'] == villageId, 
                  orElse: () => null
                );
                if (match != null) {
                  villageLabel = match['name'].toString();
                }
              }

              return ListTile(
                leading: const Icon(Icons.location_on, color: Color(0xFF003366)),
                title: Text(villageLabel),
                onTap: () {
                  Navigator.pop(context);
                  onSelected(villageId);
                },
              );
            },
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }
}

