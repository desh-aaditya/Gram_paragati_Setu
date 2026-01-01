// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Haryanvi (`bgc`).
class AppLocalizationsBgc extends AppLocalizations {
  AppLocalizationsBgc([String locale = 'bgc']) : super(locale);

  @override
  String get appTitle => 'ग्राम प्रगति सेतु';

  @override
  String get volunteerLogin => 'स्वयंसेवक लॉगिन';

  @override
  String get welcomeTitle => 'ग्राम प्रगति सेतु में थारा स्वागत सै';

  @override
  String get welcomeSubtitle => 'गाम विकास नै मजबूत बनाना';

  @override
  String get villageSurvey => 'गाम सर्वेक्षण';

  @override
  String get reportIssue => 'दिक्कत बताओ';

  @override
  String get officialInitiative => 'सरकारी काम';

  @override
  String get volunteerAccess => 'स्वयंसेवक खातिर';

  @override
  String get username => 'यूजरनेम';

  @override
  String get password => 'पासवर्ड';

  @override
  String get secureLogin => 'पक्का लॉगिन';

  @override
  String get authorizedOnly => 'बस अधिकारी मानसां खातर';

  @override
  String get loginFailed => 'लॉगिन ना होया';

  @override
  String get serverError => 'सर्वर में दिक्कत';

  @override
  String welcomeVolunteer(String name) {
    return 'राम राम, $name';
  }

  @override
  String get volunteerDashboard => 'स्वयंसेवक डैशबोर्ड';

  @override
  String assignedTo(String villages) {
    return 'काम मिला: $villages';
  }

  @override
  String get uploadProgress => 'अपलोड चाल रह्या सै';

  @override
  String get updateProjectStatus => 'प्रोजेक्ट स्टेटस बदलो';

  @override
  String get validateIssues => 'दिक्कत देखो';

  @override
  String get verifyReportedIssues => 'बताई गई दिक्कत देखो';

  @override
  String get verifySurveys => 'सर्वे देखो';

  @override
  String get verifyPriorityVotes => 'वोट देखो';

  @override
  String get noAssignedVillages => 'कोई गाम कोनी मिला';
}
