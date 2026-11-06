import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_fr.dart';

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

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
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
    Locale('en'),
    Locale('fr'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'HumanLift'**
  String get appTitle;

  /// No description provided for @tagline.
  ///
  /// In en, this message translates to:
  /// **'Real people. Verified needs. Meaningful help.'**
  String get tagline;

  /// No description provided for @testBanner.
  ///
  /// In en, this message translates to:
  /// **'Test environment. No real money. Use made-up details only.'**
  String get testBanner;

  /// No description provided for @intro.
  ///
  /// In en, this message translates to:
  /// **'HumanLift will connect people facing an essential bill with people who want to help. Every request is checked before anyone can contribute.'**
  String get intro;

  /// No description provided for @signIn.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get signIn;

  /// No description provided for @createAccount.
  ///
  /// In en, this message translates to:
  /// **'Create account'**
  String get createAccount;

  /// No description provided for @signOut.
  ///
  /// In en, this message translates to:
  /// **'Sign out'**
  String get signOut;

  /// No description provided for @email.
  ///
  /// In en, this message translates to:
  /// **'Email address'**
  String get email;

  /// No description provided for @password.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password;

  /// No description provided for @passwordHint.
  ///
  /// In en, this message translates to:
  /// **'At least 12 characters.'**
  String get passwordHint;

  /// No description provided for @displayName.
  ///
  /// In en, this message translates to:
  /// **'Name to display'**
  String get displayName;

  /// No description provided for @rolesLegend.
  ///
  /// In en, this message translates to:
  /// **'What would you like to do?'**
  String get rolesLegend;

  /// No description provided for @roleApplicant.
  ///
  /// In en, this message translates to:
  /// **'Request assistance with a bill'**
  String get roleApplicant;

  /// No description provided for @roleDonor.
  ///
  /// In en, this message translates to:
  /// **'Help others by contributing'**
  String get roleDonor;

  /// No description provided for @acceptTerms.
  ///
  /// In en, this message translates to:
  /// **'I have read the terms and the privacy policy (drafts awaiting legal review).'**
  String get acceptTerms;

  /// No description provided for @errEmail.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid email address.'**
  String get errEmail;

  /// No description provided for @errPasswordShort.
  ///
  /// In en, this message translates to:
  /// **'Your password must be at least 12 characters.'**
  String get errPasswordShort;

  /// No description provided for @errName.
  ///
  /// In en, this message translates to:
  /// **'Enter a name between 1 and 60 characters.'**
  String get errName;

  /// No description provided for @errRoles.
  ///
  /// In en, this message translates to:
  /// **'Choose at least one option.'**
  String get errRoles;

  /// No description provided for @errTerms.
  ///
  /// In en, this message translates to:
  /// **'You need to accept to continue.'**
  String get errTerms;

  /// No description provided for @errCredentials.
  ///
  /// In en, this message translates to:
  /// **'Email or password is incorrect.'**
  String get errCredentials;

  /// No description provided for @errNotActive.
  ///
  /// In en, this message translates to:
  /// **'This account is not active. Please contact support.'**
  String get errNotActive;

  /// No description provided for @errRegistration.
  ///
  /// In en, this message translates to:
  /// **'We could not create this account. If you already have one, sign in or reset your password.'**
  String get errRegistration;

  /// No description provided for @errTooMany.
  ///
  /// In en, this message translates to:
  /// **'Too many attempts. Please wait a minute and try again.'**
  String get errTooMany;

  /// No description provided for @errNetwork.
  ///
  /// In en, this message translates to:
  /// **'We could not reach HumanLift. Check your connection and try again.'**
  String get errNetwork;

  /// No description provided for @errGeneric.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong. Please try again in a moment.'**
  String get errGeneric;

  /// No description provided for @retry.
  ///
  /// In en, this message translates to:
  /// **'Try again'**
  String get retry;

  /// No description provided for @forgotPassword.
  ///
  /// In en, this message translates to:
  /// **'Forgot your password?'**
  String get forgotPassword;

  /// No description provided for @resetSent.
  ///
  /// In en, this message translates to:
  /// **'If an account exists for this address, a reset link is on its way.'**
  String get resetSent;

  /// No description provided for @send.
  ///
  /// In en, this message translates to:
  /// **'Send'**
  String get send;

  /// No description provided for @save.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get save;

  /// No description provided for @saved.
  ///
  /// In en, this message translates to:
  /// **'Saved.'**
  String get saved;

  /// No description provided for @language.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// No description provided for @tabAccount.
  ///
  /// In en, this message translates to:
  /// **'Account'**
  String get tabAccount;

  /// No description provided for @tabPrivacy.
  ///
  /// In en, this message translates to:
  /// **'Privacy'**
  String get tabPrivacy;

  /// No description provided for @tabHelp.
  ///
  /// In en, this message translates to:
  /// **'Help'**
  String get tabHelp;

  /// No description provided for @hello.
  ///
  /// In en, this message translates to:
  /// **'Hello, {name}'**
  String hello(String name);

  /// No description provided for @emailConfirmed.
  ///
  /// In en, this message translates to:
  /// **'Email address confirmed'**
  String get emailConfirmed;

  /// No description provided for @emailNotConfirmed.
  ///
  /// In en, this message translates to:
  /// **'Please confirm your email address. We sent you a link.'**
  String get emailNotConfirmed;

  /// No description provided for @resendLink.
  ///
  /// In en, this message translates to:
  /// **'Send the link again'**
  String get resendLink;

  /// No description provided for @linkSent.
  ///
  /// In en, this message translates to:
  /// **'A new link has been sent.'**
  String get linkSent;

  /// No description provided for @yourRoles.
  ///
  /// In en, this message translates to:
  /// **'Your roles'**
  String get yourRoles;

  /// No description provided for @roleNameApplicant.
  ///
  /// In en, this message translates to:
  /// **'Applicant'**
  String get roleNameApplicant;

  /// No description provided for @roleNameDonor.
  ///
  /// In en, this message translates to:
  /// **'Donor'**
  String get roleNameDonor;

  /// No description provided for @addApplicant.
  ///
  /// In en, this message translates to:
  /// **'I also want to request assistance'**
  String get addApplicant;

  /// No description provided for @addDonor.
  ///
  /// In en, this message translates to:
  /// **'I also want to help others'**
  String get addDonor;

  /// No description provided for @comingSoonApplicant.
  ///
  /// In en, this message translates to:
  /// **'Identity checks and request creation are being built. You will be able to start a request here.'**
  String get comingSoonApplicant;

  /// No description provided for @comingSoonDonor.
  ///
  /// In en, this message translates to:
  /// **'Browsing verified requests and contributing are being built. You will find them here.'**
  String get comingSoonDonor;

  /// No description provided for @privacyIntro.
  ///
  /// In en, this message translates to:
  /// **'You can ask for a copy of your data, a correction, or the deletion of your account.'**
  String get privacyIntro;

  /// No description provided for @requestAccess.
  ///
  /// In en, this message translates to:
  /// **'Request a copy of my data'**
  String get requestAccess;

  /// No description provided for @requestCorrection.
  ///
  /// In en, this message translates to:
  /// **'Ask to correct my data'**
  String get requestCorrection;

  /// No description provided for @requestDeletion.
  ///
  /// In en, this message translates to:
  /// **'Ask to delete my account'**
  String get requestDeletion;

  /// No description provided for @deletionNote.
  ///
  /// In en, this message translates to:
  /// **'Deletion is handled by a person, because some records may have to be kept for a legal period once payments exist.'**
  String get deletionNote;

  /// No description provided for @requestReceived.
  ///
  /// In en, this message translates to:
  /// **'Your request has been received.'**
  String get requestReceived;

  /// No description provided for @requestOpen.
  ///
  /// In en, this message translates to:
  /// **'You already have an open request of this type.'**
  String get requestOpen;

  /// No description provided for @yourRequests.
  ///
  /// In en, this message translates to:
  /// **'Your requests'**
  String get yourRequests;

  /// No description provided for @noRequests.
  ///
  /// In en, this message translates to:
  /// **'You have not made any requests.'**
  String get noRequests;

  /// No description provided for @typeAccess.
  ///
  /// In en, this message translates to:
  /// **'Copy of my data'**
  String get typeAccess;

  /// No description provided for @typeCorrection.
  ///
  /// In en, this message translates to:
  /// **'Correction'**
  String get typeCorrection;

  /// No description provided for @typeDeletion.
  ///
  /// In en, this message translates to:
  /// **'Account deletion'**
  String get typeDeletion;

  /// No description provided for @statusReceived.
  ///
  /// In en, this message translates to:
  /// **'Received'**
  String get statusReceived;

  /// No description provided for @statusInProgress.
  ///
  /// In en, this message translates to:
  /// **'In progress'**
  String get statusInProgress;

  /// No description provided for @statusCompleted.
  ///
  /// In en, this message translates to:
  /// **'Completed'**
  String get statusCompleted;

  /// No description provided for @statusRejected.
  ///
  /// In en, this message translates to:
  /// **'Declined'**
  String get statusRejected;

  /// No description provided for @howItWorks.
  ///
  /// In en, this message translates to:
  /// **'How it works'**
  String get howItWorks;

  /// No description provided for @howItWorksBody.
  ///
  /// In en, this message translates to:
  /// **'1. A person asks for help with a specific bill.\n2. We check identity, address and the bill separately. A person makes the final decision.\n3. Donors can give part or all of the remaining amount, with fees shown first.\n4. Where possible, the money goes directly to the supplier or landlord.'**
  String get howItWorksBody;

  /// No description provided for @trust.
  ///
  /// In en, this message translates to:
  /// **'Trust and safety'**
  String get trust;

  /// No description provided for @trustBody.
  ///
  /// In en, this message translates to:
  /// **'We never publish identity documents, addresses or private financial details. We never promise that a request will be funded. HumanLift will never ask for your bank password or one-time codes.'**
  String get trustBody;

  /// No description provided for @contact.
  ///
  /// In en, this message translates to:
  /// **'Contact us'**
  String get contact;

  /// No description provided for @yourName.
  ///
  /// In en, this message translates to:
  /// **'Your name'**
  String get yourName;

  /// No description provided for @message.
  ///
  /// In en, this message translates to:
  /// **'Message'**
  String get message;

  /// No description provided for @messageHint.
  ///
  /// In en, this message translates to:
  /// **'At least 10 characters. Do not include ID numbers or bank details.'**
  String get messageHint;

  /// No description provided for @messageSent.
  ///
  /// In en, this message translates to:
  /// **'Thank you. Your message has been received.'**
  String get messageSent;

  /// No description provided for @reportAbuse.
  ///
  /// In en, this message translates to:
  /// **'Report abuse'**
  String get reportAbuse;

  /// No description provided for @abuseCategory.
  ///
  /// In en, this message translates to:
  /// **'What is the problem?'**
  String get abuseCategory;

  /// No description provided for @catFraud.
  ///
  /// In en, this message translates to:
  /// **'Possible fraud or fake request'**
  String get catFraud;

  /// No description provided for @catImpersonation.
  ///
  /// In en, this message translates to:
  /// **'Someone is pretending to be someone else'**
  String get catImpersonation;

  /// No description provided for @catHarassment.
  ///
  /// In en, this message translates to:
  /// **'Harassment or abusive messages'**
  String get catHarassment;

  /// No description provided for @catPrivacy.
  ///
  /// In en, this message translates to:
  /// **'Private information has been exposed'**
  String get catPrivacy;

  /// No description provided for @catOther.
  ///
  /// In en, this message translates to:
  /// **'Something else'**
  String get catOther;

  /// No description provided for @whatHappened.
  ///
  /// In en, this message translates to:
  /// **'What happened?'**
  String get whatHappened;

  /// No description provided for @reportSent.
  ///
  /// In en, this message translates to:
  /// **'Thank you. Your report has been received and will be reviewed.'**
  String get reportSent;

  /// No description provided for @emergency.
  ///
  /// In en, this message translates to:
  /// **'HumanLift cannot respond to emergencies. If someone is in danger, contact local emergency services.'**
  String get emergency;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'fr'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'fr':
      return AppLocalizationsFr();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
