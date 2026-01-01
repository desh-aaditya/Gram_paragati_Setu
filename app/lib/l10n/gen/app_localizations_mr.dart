// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Marathi (`mr`).
class AppLocalizationsMr extends AppLocalizations {
  AppLocalizationsMr([String locale = 'mr']) : super(locale);

  @override
  String get appTitle => 'ग्राम प्रगती सेतू';

  @override
  String get volunteerLogin => 'स्वयंसेवक लॉगिन';

  @override
  String get welcomeTitle => 'ग्राम प्रगती सेतू मध्ये आपले स्वागत आहे';

  @override
  String get welcomeSubtitle => 'ग्रामीण विकास सक्षमीकरण';

  @override
  String get villageSurvey => 'ग्राम सर्वेक्षण';

  @override
  String get reportIssue => 'समस्या नोंदवा';

  @override
  String get officialInitiative => 'अधिकृत सरकारी उपक्रम';

  @override
  String get volunteerAccess => 'स्वयंसेवक प्रवेश';

  @override
  String get username => 'वापरकर्तानाव';

  @override
  String get password => 'पासवर्ड';

  @override
  String get secureLogin => 'सुरक्षित लॉगिन';

  @override
  String get authorizedOnly => 'केवळ अधिकृत कर्मचारी';

  @override
  String get loginFailed => 'लॉगिन अयशस्वी';

  @override
  String get serverError => 'सर्व्हर त्रुटी';

  @override
  String welcomeVolunteer(String name) {
    return 'स्वागत आहे, $name';
  }

  @override
  String get volunteerDashboard => 'स्वयंसेवक डॅशबोर्ड';

  @override
  String assignedTo(String villages) {
    return 'नेमून दिलेले: $villages';
  }

  @override
  String get uploadProgress => 'अपलोड प्रगती';

  @override
  String get updateProjectStatus => 'प्रकल्प स्थिती अपडेट करा';

  @override
  String get validateIssues => 'समस्या सत्यापित करा';

  @override
  String get verifyReportedIssues => 'नोंदवलेल्या समस्यांची पडताळणी करा';

  @override
  String get verifySurveys => 'सर्वेक्षणे तपासा';

  @override
  String get verifyPriorityVotes => 'प्राधान्य मतांची पडताळणी करा';

  @override
  String get noAssignedVillages => 'कोणतीही नेमून दिलेली गावे आढळली नाहीत';
}
