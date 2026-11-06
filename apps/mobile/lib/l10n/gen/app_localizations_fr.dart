// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for French (`fr`).
class AppLocalizationsFr extends AppLocalizations {
  AppLocalizationsFr([String locale = 'fr']) : super(locale);

  @override
  String get appTitle => 'HumanLift';

  @override
  String get tagline =>
      'De vraies personnes. Des besoins vérifiés. Une aide qui compte.';

  @override
  String get testBanner =>
      'Environnement de test. Aucun argent réel. Utilisez uniquement des informations fictives.';

  @override
  String get intro =>
      'HumanLift mettra en relation des personnes confrontées à une facture essentielle et des personnes qui souhaitent aider. Chaque demande est vérifiée avant toute contribution.';

  @override
  String get signIn => 'Se connecter';

  @override
  String get createAccount => 'Créer un compte';

  @override
  String get signOut => 'Se déconnecter';

  @override
  String get email => 'Adresse e-mail';

  @override
  String get password => 'Mot de passe';

  @override
  String get passwordHint => 'Au moins 12 caractères.';

  @override
  String get displayName => 'Nom affiché';

  @override
  String get rolesLegend => 'Que souhaitez-vous faire ?';

  @override
  String get roleApplicant => 'Demander de l\'aide pour une facture';

  @override
  String get roleDonor => 'Aider les autres en contribuant';

  @override
  String get acceptTerms =>
      'J\'ai lu les conditions générales et la politique de confidentialité (brouillons en attente de relecture juridique).';

  @override
  String get errEmail => 'Saisissez une adresse e-mail valide.';

  @override
  String get errPasswordShort =>
      'Votre mot de passe doit contenir au moins 12 caractères.';

  @override
  String get errName => 'Saisissez un nom de 1 à 60 caractères.';

  @override
  String get errRoles => 'Choisissez au moins une option.';

  @override
  String get errTerms => 'Vous devez accepter pour continuer.';

  @override
  String get errCredentials => 'Adresse e-mail ou mot de passe incorrect.';

  @override
  String get errNotActive =>
      'Ce compte n\'est pas actif. Merci de contacter l\'assistance.';

  @override
  String get errRegistration =>
      'Nous n\'avons pas pu créer ce compte. Si vous en avez déjà un, connectez-vous ou réinitialisez votre mot de passe.';

  @override
  String get errTooMany => 'Trop de tentatives. Merci de patienter une minute.';

  @override
  String get errNetwork =>
      'Impossible de joindre HumanLift. Vérifiez votre connexion et réessayez.';

  @override
  String get errGeneric =>
      'Une erreur s\'est produite. Merci de réessayer dans un instant.';

  @override
  String get retry => 'Réessayer';

  @override
  String get forgotPassword => 'Mot de passe oublié ?';

  @override
  String get resetSent =>
      'Si un compte existe pour cette adresse, un lien de réinitialisation vient d\'être envoyé.';

  @override
  String get send => 'Envoyer';

  @override
  String get save => 'Enregistrer';

  @override
  String get saved => 'Enregistré.';

  @override
  String get language => 'Langue';

  @override
  String get tabAccount => 'Compte';

  @override
  String get tabPrivacy => 'Confidentialité';

  @override
  String get tabHelp => 'Aide';

  @override
  String hello(String name) {
    return 'Bonjour $name';
  }

  @override
  String get emailConfirmed => 'Adresse e-mail confirmée';

  @override
  String get emailNotConfirmed =>
      'Merci de confirmer votre adresse e-mail. Nous vous avons envoyé un lien.';

  @override
  String get resendLink => 'Renvoyer le lien';

  @override
  String get linkSent => 'Un nouveau lien a été envoyé.';

  @override
  String get yourRoles => 'Vos rôles';

  @override
  String get roleNameApplicant => 'Demandeur';

  @override
  String get roleNameDonor => 'Donateur';

  @override
  String get addApplicant => 'Je souhaite aussi demander de l\'aide';

  @override
  String get addDonor => 'Je souhaite aussi aider les autres';

  @override
  String get comingSoonApplicant =>
      'La vérification d\'identité et la création de demandes sont en cours de développement. Vous pourrez démarrer une demande ici.';

  @override
  String get comingSoonDonor =>
      'La consultation des demandes vérifiées et les contributions sont en cours de développement. Vous les trouverez ici.';

  @override
  String get privacyIntro =>
      'Vous pouvez demander une copie de vos données, une correction ou la suppression de votre compte.';

  @override
  String get requestAccess => 'Demander une copie de mes données';

  @override
  String get requestCorrection => 'Demander la correction de mes données';

  @override
  String get requestDeletion => 'Demander la suppression de mon compte';

  @override
  String get deletionNote =>
      'La suppression est traitée par une personne, car certaines données devront peut-être être conservées pendant une durée légale une fois les paiements en place.';

  @override
  String get requestReceived => 'Votre demande a bien été reçue.';

  @override
  String get requestOpen => 'Vous avez déjà une demande de ce type en cours.';

  @override
  String get yourRequests => 'Vos demandes';

  @override
  String get noRequests => 'Vous n\'avez fait aucune demande.';

  @override
  String get typeAccess => 'Copie de mes données';

  @override
  String get typeCorrection => 'Correction';

  @override
  String get typeDeletion => 'Suppression du compte';

  @override
  String get statusReceived => 'Reçue';

  @override
  String get statusInProgress => 'En cours';

  @override
  String get statusCompleted => 'Traitée';

  @override
  String get statusRejected => 'Refusée';

  @override
  String get howItWorks => 'Comment ça marche';

  @override
  String get howItWorksBody =>
      '1. Une personne demande de l\'aide pour une facture précise.\n2. Nous vérifions séparément l\'identité, l\'adresse et la facture. Une personne prend la décision finale.\n3. Les donateurs peuvent donner tout ou partie du reste à financer, frais affichés avant.\n4. Quand c\'est possible, l\'argent va directement au fournisseur ou au bailleur.';

  @override
  String get trust => 'Confiance et sécurité';

  @override
  String get trustBody =>
      'Nous ne publions jamais de pièces d\'identité, d\'adresses ni de données financières privées. Nous ne promettons jamais qu\'une demande sera financée. HumanLift ne vous demandera jamais votre mot de passe bancaire ni vos codes à usage unique.';

  @override
  String get contact => 'Nous contacter';

  @override
  String get yourName => 'Votre nom';

  @override
  String get message => 'Message';

  @override
  String get messageHint =>
      'Au moins 10 caractères. N\'indiquez ni numéro de pièce d\'identité ni coordonnées bancaires.';

  @override
  String get messageSent => 'Merci. Votre message a bien été reçu.';

  @override
  String get reportAbuse => 'Signaler un abus';

  @override
  String get abuseCategory => 'Quel est le problème ?';

  @override
  String get catFraud => 'Fraude possible ou fausse demande';

  @override
  String get catImpersonation => 'Usurpation d\'identité';

  @override
  String get catHarassment => 'Harcèlement ou messages abusifs';

  @override
  String get catPrivacy => 'Des informations privées ont été exposées';

  @override
  String get catOther => 'Autre chose';

  @override
  String get whatHappened => 'Que s\'est-il passé ?';

  @override
  String get reportSent =>
      'Merci. Votre signalement a bien été reçu et sera examiné.';

  @override
  String get emergency =>
      'HumanLift ne peut pas répondre aux urgences. Si une personne est en danger, contactez les services d\'urgence locaux.';
}
