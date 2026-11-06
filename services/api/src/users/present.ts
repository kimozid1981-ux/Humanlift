import { AuthedUser } from '../common/request';

/** The only shape in which a user is ever returned to the user themself. No hashes, no secrets. */
export function presentSelf(user: AuthedUser) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    locale: user.locale,
    countryCode: user.countryCode,
    status: user.status,
    emailVerified: Boolean(user.emailVerifiedAt),
    roles: user.roles.map((r) => r.role),
    mfaEnabled: Boolean(user.mfaEnabledAt),
    createdAt: user.createdAt,
  };
}
