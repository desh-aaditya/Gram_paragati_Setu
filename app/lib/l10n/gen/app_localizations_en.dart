// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'Gram Pragati Setu';

  @override
  String get volunteerLogin => 'Volunteer Login';

  @override
  String get welcomeTitle => 'Welcome to Gram Pragati Setu';

  @override
  String get welcomeSubtitle => 'Empowering Rural Development';

  @override
  String get villageSurvey => 'Village Survey';

  @override
  String get reportIssue => 'Report Issue';

  @override
  String get officialInitiative => 'Official Government Initiative';

  @override
  String get volunteerAccess => 'Volunteer Access';

  @override
  String get username => 'Username';

  @override
  String get password => 'Password';

  @override
  String get secureLogin => 'SECURE LOGIN';

  @override
  String get authorizedOnly => 'Authorized Personnel Only';

  @override
  String get loginFailed => 'Login failed';

  @override
  String get serverError => 'Server error';

  @override
  String welcomeVolunteer(String name) {
    return 'Welcome, $name';
  }

  @override
  String get volunteerDashboard => 'Volunteer Dashboard';

  @override
  String assignedTo(String villages) {
    return 'Assigned to: $villages';
  }

  @override
  String get uploadProgress => 'Upload Progress';

  @override
  String get updateProjectStatus => 'Update Project Status';

  @override
  String get validateIssues => 'Validate Issues';

  @override
  String get verifyReportedIssues => 'Verify Reported Issues';

  @override
  String get verifySurveys => 'Verify Surveys';

  @override
  String get verifyPriorityVotes => 'Verify Priority Votes';

  @override
  String get noAssignedVillages => 'No assigned villages found';
}
