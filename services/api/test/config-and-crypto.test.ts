import { decrypt, encrypt, randomToken, sha256 } from '../src/common/crypto';
import { loadConfig } from '../src/config';

const key = Buffer.alloc(32, 1).toString('base64');

describe('crypto helpers', () => {
  it('round-trips AES-256-GCM and detects tampering', () => {
    const ct = encrypt('secret value', key);
    expect(decrypt(ct, key)).toBe('secret value');
    const parts = ct.split('.');
    parts[3] = Buffer.from('tampered').toString('base64url');
    expect(() => decrypt(parts.join('.'), key)).toThrow();
  });
  it('produces unique random tokens and stable hashes', () => {
    expect(randomToken()).not.toEqual(randomToken());
    expect(sha256('a')).toEqual(sha256('a'));
  });
});

describe('configuration', () => {
  const base = { DATABASE_URL: 'postgresql://x', MFA_ENCRYPTION_KEY: key };
  it('refuses a missing or short encryption key', () => {
    expect(() => loadConfig({ DATABASE_URL: 'postgresql://x' })).toThrow(/MFA_ENCRYPTION_KEY/);
    expect(() => loadConfig({ ...base, MFA_ENCRYPTION_KEY: 'c2hvcnQ=' })).toThrow(/32 bytes/);
  });
  it('never enables the sandbox outbox in production and uses secure cookies there', () => {
    const prod = loadConfig({ ...base, APP_ENV: 'production' });
    expect(prod.devOutboxEnabled).toBe(false);
    expect(prod.cookieSecure).toBe(true);
    expect(loadConfig({ ...base, APP_ENV: 'development' }).devOutboxEnabled).toBe(true);
  });
});
