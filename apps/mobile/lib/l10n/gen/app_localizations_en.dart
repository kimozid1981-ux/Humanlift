// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'HumanLift';

  @override
  String get tagline => 'Real people. Verified needs. Meaningful help.';

  @override
  String get testBanner =>
      'Test environment. No real money. Use made-up details only.';

  @override
  String get intro =>
      'HumanLift will connect people facing an essential bill with people who want to help. Every request is checked before anyone can contribute.';

  @override
  String get signIn => 'Sign in';

  @override
  String get createAccount => 'Create account';

  @override
  String get signOut => 'Sign out';

  @override
  String get email => 'Email address';

  @override
  String get password => 'Password';

  @override
  String get passwordHint => 'At least 12 characters.';

  @override
  String get displayName => 'Name to display';

  @override
  String get rolesLegend => 'What would you like to do?';

  @override
  String get roleApplicant => 'Request assistance with a bill';

  @override
  String get roleDonor => 'Help others by contributing';

  @override
  String get acceptTerms =>
      'I have read the terms and the privacy policy (drafts awaiting legal review).';

  @override
  String get errEmail => 'Enter a valid email address.';

  @override
  String get errPasswordShort =>
      'Your password must be at least 12 characters.';

  @override
  String get errName => 'Enter a name between 1 and 60 characters.';

  @override
  String get errRoles => 'Choose at least one option.';

  @override
  String get errTerms => 'You need to accept to continue.';

  @override
  String get errCredentials => 'Email or password is incorrect.';

  @override
  String get errNotActive =>
      'This account is not active. Please contact support.';

  @override
  String get errRegistration =>
      'We could not create this account. If you already have one, sign in or reset your password.';

  @override
  String get errTooMany =>
      'Too many attempts. Please wait a minute and try again.';

  @override
  String get errNetwork =>
      'We could not reach HumanLift. Check your connection and try again.';

  @override
  String get errGeneric =>
      'Something went wrong. Please try again in a moment.';

  @override
  String get retry => 'Try again';

  @override
  String get forgotPassword => 'Forgot your password?';

  @override
  String get resetSent =>
      'If an account exists for this address, a reset link is on its way.';

  @override
  String get send => 'Send';

  @override
  String get save => 'Save';

  @override
  String get saved => 'Saved.';

  @override
  String get language => 'Language';

  @override
  String get tabAccount => 'Account';

  @override
  String get tabPrivacy => 'Privacy';

  @override
  String get tabHelp => 'Help';

  @override
  String hello(String name) {
    return 'Hello, $name';
  }

  @override
  String get emailConfirmed => 'Email address confirmed';

  @override
  String get emailNotConfirmed =>
      'Please confirm your email address. We sent you a link.';

  @override
  String get resendLink => 'Send the link again';

  @override
  String get linkSent => 'A new link has been sent.';

  @override
  String get yourRoles => 'Your roles';

  @override
  String get roleNameApplicant => 'Applicant';

  @override
  String get roleNameDonor => 'Donor';

  @override
  String get addApplicant => 'I also want to request assistance';

  @override
  String get addDonor => 'I also want to help others';

  @override
  String get comingSoonApplicant =>
      'Identity checks and request creation are being built. You will be able to start a request here.';

  @override
  String get comingSoonDonor =>
      'Browsing verified requests and contributing are being built. You will find them here.';

  @override
  String get privacyIntro =>
      'You can ask for a copy of your data, a correction, or the deletion of your account.';

  @override
  String get requestAccess => 'Request a copy of my data';

  @override
  String get requestCorrection => 'Ask to correct my data';

  @override
  String get requestDeletion => 'Ask to delete my account';

  @override
  String get deletionNote =>
      'Deletion is handled by a person, because some records may have to be kept for a legal period once payments exist.';

  @override
  String get requestReceived => 'Your request has been received.';

  @override
  String get requestOpen => 'You already have an open request of this type.';

  @override
  String get yourRequests => 'Your requests';

  @override
  String get noRequests => 'You have not made any requests.';

  @override
  String get typeAccess => 'Copy of my data';

  @override
  String get typeCorrection => 'Correction';

  @override
  String get typeDeletion => 'Account deletion';

  @override
  String get statusReceived => 'Received';

  @override
  String get statusInProgress => 'In progress';

  @override
  String get statusCompleted => 'Completed';

  @override
  String get statusRejected => 'Declined';

  @override
  String get howItWorks => 'How it works';

  @override
  String get howItWorksBody =>
      '1. A person asks for help with a specific bill.\n2. We check identity, address and the bill separately. A person makes the final decision.\n3. Donors can give part or all of the remaining amount, with fees shown first.\n4. Where possible, the money goes directly to the supplier or landlord.';

  @override
  String get trust => 'Trust and safety';

  @override
  String get trustBody =>
      'We never publish identity documents, addresses or private financial details. We never promise that a request will be funded. HumanLift will never ask for your bank password or one-time codes.';

  @override
  String get contact => 'Contact us';

  @override
  String get yourName => 'Your name';

  @override
  String get message => 'Message';

  @override
  String get messageHint =>
      'At least 10 characters. Do not include ID numbers or bank details.';

  @override
  String get messageSent => 'Thank you. Your message has been received.';

  @override
  String get reportAbuse => 'Report abuse';

  @override
  String get abuseCategory => 'What is the problem?';

  @override
  String get catFraud => 'Possible fraud or fake request';

  @override
  String get catImpersonation => 'Someone is pretending to be someone else';

  @override
  String get catHarassment => 'Harassment or abusive messages';

  @override
  String get catPrivacy => 'Private information has been exposed';

  @override
  String get catOther => 'Something else';

  @override
  String get whatHappened => 'What happened?';

  @override
  String get reportSent =>
      'Thank you. Your report has been received and will be reviewed.';

  @override
  String get emergency =>
      'HumanLift cannot respond to emergencies. If someone is in danger, contact local emergency services.';
}
