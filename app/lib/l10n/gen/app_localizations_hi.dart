// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Hindi (`hi`).
class AppLocalizationsHi extends AppLocalizations {
  AppLocalizationsHi([String locale = 'hi']) : super(locale);

  @override
  String get appTitle => 'ग्राम प्रगति सेतु';

  @override
  String get volunteerLogin => 'स्वयंसेवक लॉगिन';

  @override
  String get welcomeTitle => 'ग्राम प्रगति सेतु में आपका स्वागत है';

  @override
  String get welcomeSubtitle => 'ग्रामीण विकास को सशक्त बनाना';

  @override
  String get villageSurvey => 'ग्राम सर्वेक्षण';

  @override
  String get reportIssue => 'समस्या की रिपोर्ट करें';

  @override
  String get officialInitiative => 'आधिकारिक सरकारी पहल';

  @override
  String get volunteerAccess => 'स्वयंसेवक प्रवेश';

  @override
  String get username => 'उपयोगकर्ता नाम';

  @override
  String get password => 'पासवर्ड';

  @override
  String get secureLogin => 'सुरक्षित लॉगिन';

  @override
  String get authorizedOnly => 'केवल अधिकृत कर्मियों के लिए';

  @override
  String get loginFailed => 'लॉगिन विफल';

  @override
  String get serverError => 'सर्वर त्रुटि';

  @override
  String welcomeVolunteer(String name) {
    return 'स्वागत है, $name';
  }

  @override
  String get volunteerDashboard => 'स्वयंसेवक डैशबोर्ड';

  @override
  String assignedTo(String villages) {
    return 'आवंटित: $villages';
  }

  @override
  String get uploadProgress => 'अपलोड प्रगति';

  @override
  String get updateProjectStatus => 'परियोजना स्थिति अपडेट करें';

  @override
  String get validateIssues => 'समस्याएं सत्यापित करें';

  @override
  String get verifyReportedIssues => 'रिपोर्ट की गई समस्याओं को सत्यापित करें';

  @override
  String get verifySurveys => 'सर्वेक्षण सत्यापित करें';

  @override
  String get verifyPriorityVotes => 'प्राथमिकता वोट सत्यापित करें';

  @override
  String get noAssignedVillages => 'कोई आवंटित गांव नहीं मिला';
}
