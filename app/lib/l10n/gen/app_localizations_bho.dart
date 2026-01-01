// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Bhojpuri (`bho`).
class AppLocalizationsBho extends AppLocalizations {
  AppLocalizationsBho([String locale = 'bho']) : super(locale);

  @override
  String get appTitle => 'ग्राम प्रगति सेतु';

  @override
  String get volunteerLogin => 'स्वयंसेवक लॉगिन';

  @override
  String get welcomeTitle => 'ग्राम प्रगति सेतु में रउआ सब के स्वागत बा';

  @override
  String get welcomeSubtitle => 'ग्रामीण विकास के सशक्तिकरण';

  @override
  String get villageSurvey => 'गाँव सर्वेक्षण';

  @override
  String get reportIssue => 'समस्या बताईं';

  @override
  String get officialInitiative => 'सरकारी पहल';

  @override
  String get volunteerAccess => 'स्वयंसेवक बदे';

  @override
  String get username => 'यजरनेम';

  @override
  String get password => 'पासवर्ड';

  @override
  String get secureLogin => 'सुरक्षित लॉगिन';

  @override
  String get authorizedOnly => 'खाली अधिकारी लोग खातिर';

  @override
  String get loginFailed => 'लॉगिन फेल हो गइल';

  @override
  String get serverError => 'सर्वर एरर';

  @override
  String welcomeVolunteer(String name) {
    return 'स्वागत बा, $name';
  }

  @override
  String get volunteerDashboard => 'स्वयंसेवक डैशबोर्ड';

  @override
  String assignedTo(String villages) {
    return 'काम मिलल बा: $villages';
  }

  @override
  String get uploadProgress => 'अपलोड प्रगति';

  @override
  String get updateProjectStatus => 'प्रोजेक्ट स्टेटस अपडेट करीं';

  @override
  String get validateIssues => 'समस्या जाँची';

  @override
  String get verifyReportedIssues => 'बतावल गइल समस्या जाँची';

  @override
  String get verifySurveys => 'सर्वेक्षण जाँची';

  @override
  String get verifyPriorityVotes => 'वोट जाँची';

  @override
  String get noAssignedVillages => 'कवनो गाँव ना मिलल';
}
