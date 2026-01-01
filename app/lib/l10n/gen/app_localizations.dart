import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_bgc.dart';
import 'app_localizations_bho.dart';
import 'app_localizations_en.dart';
import 'app_localizations_hi.dart';
import 'app_localizations_kn.dart';
import 'app_localizations_mr.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'gen/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('bgc'),
    Locale('bho'),
    Locale('en'),
    Locale('hi'),
    Locale('kn'),
    Locale('mr')
  ];

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'Gram Pragati Setu'**
  String get appTitle;

  /// No description provided for @volunteerLogin.
  ///
  /// In en, this message translates to:
  /// **'Volunteer Login'**
  String get volunteerLogin;

  /// No description provided for @welcomeTitle.
  ///
  /// In en, this message translates to:
  /// **'Welcome to Gram Pragati Setu'**
  String get welcomeTitle;

  /// No description provided for @welcomeSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Empowering Rural Development'**
  String get welcomeSubtitle;

  /// No description provided for @villageSurvey.
  ///
  /// In en, this message translates to:
  /// **'Village Survey'**
  String get villageSurvey;

  /// No description provided for @reportIssue.
  ///
  /// In en, this message translates to:
  /// **'Report Issue'**
  String get reportIssue;

  /// No description provided for @officialInitiative.
  ///
  /// In en, this message translates to:
  /// **'Official Government Initiative'**
  String get officialInitiative;

  /// No description provided for @volunteerAccess.
  ///
  /// In en, this message translates to:
  /// **'Volunteer Access'**
  String get volunteerAccess;

  /// No description provided for @username.
  ///
  /// In en, this message translates to:
  /// **'Username'**
  String get username;

  /// No description provided for @password.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password;

  /// No description provided for @secureLogin.
  ///
  /// In en, this message translates to:
  /// **'SECURE LOGIN'**
  String get secureLogin;

  /// No description provided for @authorizedOnly.
  ///
  /// In en, this message translates to:
  /// **'Authorized Personnel Only'**
  String get authorizedOnly;

  /// No description provided for @loginFailed.
  ///
  /// In en, this message translates to:
  /// **'Login failed'**
  String get loginFailed;

  /// No description provided for @serverError.
  ///
  /// In en, this message translates to:
  /// **'Server error'**
  String get serverError;

  /// No description provided for @welcomeVolunteer.
  ///
  /// In en, this message translates to:
  /// **'Welcome, {name}'**
  String welcomeVolunteer(String name);

  /// No description provided for @volunteerDashboard.
  ///
  /// In en, this message translates to:
  /// **'Volunteer Dashboard'**
  String get volunteerDashboard;

  /// No description provided for @assignedTo.
  ///
  /// In en, this message translates to:
  /// **'Assigned to: {villages}'**
  String assignedTo(String villages);

  /// No description provided for @uploadProgress.
  ///
  /// In en, this message translates to:
  /// **'Upload Progress'**
  String get uploadProgress;

  /// No description provided for @updateProjectStatus.
  ///
  /// In en, this message translates to:
  /// **'Update Project Status'**
  String get updateProjectStatus;

  /// No description provided for @validateIssues.
  ///
  /// In en, this message translates to:
  /// **'Validate Issues'**
  String get validateIssues;

  /// No description provided for @verifyReportedIssues.
  ///
  /// In en, this message translates to:
  /// **'Verify Reported Issues'**
  String get verifyReportedIssues;

  /// No description provided for @verifySurveys.
  ///
  /// In en, this message translates to:
  /// **'Verify Surveys'**
  String get verifySurveys;

  /// No description provided for @verifyPriorityVotes.
  ///
  /// In en, this message translates to:
  /// **'Verify Priority Votes'**
  String get verifyPriorityVotes;

  /// No description provided for @noAssignedVillages.
  ///
  /// In en, this message translates to:
  /// **'No assigned villages found'**
  String get noAssignedVillages;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) => <String>[
        'bgc',
        'bho',
        'en',
        'hi',
        'kn',
        'mr'
      ].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'bgc':
      return AppLocalizationsBgc();
    case 'bho':
      return AppLocalizationsBho();
    case 'en':
      return AppLocalizationsEn();
    case 'hi':
      return AppLocalizationsHi();
    case 'kn':
      return AppLocalizationsKn();
    case 'mr':
      return AppLocalizationsMr();
  }

  throw FlutterError(
      'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
