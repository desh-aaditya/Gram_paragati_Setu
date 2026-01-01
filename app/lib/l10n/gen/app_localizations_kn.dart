// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Kannada (`kn`).
class AppLocalizationsKn extends AppLocalizations {
  AppLocalizationsKn([String locale = 'kn']) : super(locale);

  @override
  String get appTitle => 'ಗ್ರಾಮ ಪ್ರಗತಿ ಸೇತುವೆ';

  @override
  String get volunteerLogin => 'ಸ್ವಯಂಸೇವಕ ಲಾಗಿನ್';

  @override
  String get welcomeTitle => 'ಗ್ರಾಮ ಪ್ರಗತಿ ಸೇತುವೆಗೆ ಸುಸ್ವಾಗತ';

  @override
  String get welcomeSubtitle => 'ಗ್ರಾಮೀಣ ಅಭಿವೃದ್ಧಿಯ ಸಬಲೀಕರಣ';

  @override
  String get villageSurvey => 'ಗ್ರಾಮ ಸಮೀಕ್ಷೆ';

  @override
  String get reportIssue => 'ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿ';

  @override
  String get officialInitiative => 'ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಉಪಕ್ರಮ';

  @override
  String get volunteerAccess => 'ಸ್ವಯಂಸೇವಕ ಪ್ರವೇಶ';

  @override
  String get username => 'ಬಳಕೆದಾರ ಹೆಸರು';

  @override
  String get password => 'ಪಾಸ್ವರ್ಡ್';

  @override
  String get secureLogin => 'ಸುರಕ್ಷಿತ ಲಾಗಿನ್';

  @override
  String get authorizedOnly => 'ಅಧಿಕೃತ ಸಿಬ್ಬಂದಿ ಮಾತ್ರ';

  @override
  String get loginFailed => 'ಲಾಗಿನ್ ವಿಫಲವಾಗಿದೆ';

  @override
  String get serverError => 'ಸರ್ವರ್ ದೋಷ';

  @override
  String welcomeVolunteer(String name) {
    return 'ಸ್ವಾಗತ, $name';
  }

  @override
  String get volunteerDashboard => 'ಸ್ವಯಂಸೇವಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್';

  @override
  String assignedTo(String villages) {
    return 'ನಿಯೋಜಿಸಲಾಗಿದೆ: $villages';
  }

  @override
  String get uploadProgress => 'ಅಪ್‌ಲೋಡ್ ಪ್ರಗತಿ';

  @override
  String get updateProjectStatus => 'ಯೋಜನೆಯ ಸ್ಥಿತಿಯನ್ನು ನವೀಕರಿಸಿ';

  @override
  String get validateIssues => 'ಸಮಸ್ಯೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ';

  @override
  String get verifyReportedIssues => 'ವರದಿಯಾದ ಸಮಸ್ಯೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ';

  @override
  String get verifySurveys => 'ಸಮೀಕ್ಷೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ';

  @override
  String get verifyPriorityVotes => 'ಆದ್ಯತೆಯ ಮತಗಳನ್ನು ಪರಿಶೀಲಿಸಿ';

  @override
  String get noAssignedVillages => 'ಯಾವುದೇ ನಿಯೋಜಿತ ಹಳ್ಳಿಗಳು ಕಂಡುಬಂದಿಲ್ಲ';
}
