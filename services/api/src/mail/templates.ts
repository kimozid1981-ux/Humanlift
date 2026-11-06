type Locale = 'en' | 'fr';

export function verificationEmail(locale: Locale, name: string, link: string) {
  return locale === 'fr'
    ? {
        subject: 'Confirmez votre adresse e-mail — HumanLift',
        body: `Bonjour ${name},\n\nPour confirmer votre adresse e-mail, ouvrez ce lien (valable 24 heures) :\n${link}\n\nSi vous n'avez pas créé de compte HumanLift, ignorez ce message.`,
      }
    : {
        subject: 'Confirm your email address — HumanLift',
        body: `Hello ${name},\n\nTo confirm your email address, open this link (valid for 24 hours):\n${link}\n\nIf you did not create a HumanLift account, you can ignore this message.`,
      };
}

export function passwordResetEmail(locale: Locale, name: string, link: string) {
  return locale === 'fr'
    ? {
        subject: 'Réinitialisation de votre mot de passe — HumanLift',
        body: `Bonjour ${name},\n\nPour choisir un nouveau mot de passe, ouvrez ce lien (valable 1 heure) :\n${link}\n\nSi vous n'avez pas fait cette demande, ignorez ce message. Votre mot de passe actuel reste valable.`,
      }
    : {
        subject: 'Reset your password — HumanLift',
        body: `Hello ${name},\n\nTo choose a new password, open this link (valid for 1 hour):\n${link}\n\nIf you did not ask for this, ignore this message. Your current password still works.`,
      };
}
