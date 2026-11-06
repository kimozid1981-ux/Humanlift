import { decrypt, encrypt, randomToken, sha256 } from '../src/common/crypto';
import nodemailer from 'nodemailer';
import { loadConfig } from '../src/config';
import { mailerFor, SandboxMailer, SmtpMailer } from '../src/mail/mailer';

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
  const smtp = { SMTP_URL: 'smtps://user:pass@smtp.example.test:465', EMAIL_FROM: 'HumanLift <no-reply@example.test>' };
  it('refuses a missing or short encryption key', () => {
    expect(() => loadConfig({ DATABASE_URL: 'postgresql://x' })).toThrow(/MFA_ENCRYPTION_KEY/);
    expect(() => loadConfig({ ...base, MFA_ENCRYPTION_KEY: 'c2hvcnQ=' })).toThrow(/32 bytes/);
  });
  it('never enables the sandbox outbox in production and uses secure cookies there', () => {
    const prod = loadConfig({ ...base, ...smtp, APP_ENV: 'production' });
    expect(prod.devOutboxEnabled).toBe(false);
    expect(prod.cookieSecure).toBe(true);
    expect(loadConfig({ ...base, APP_ENV: 'development' }).devOutboxEnabled).toBe(true);
  });

  it('refuses to start in staging or production without a real email service', () => {
    expect(() => loadConfig({ ...base, APP_ENV: 'production' })).toThrow(/SMTP_URL and EMAIL_FROM/);
    expect(() => loadConfig({ ...base, APP_ENV: 'staging', SMTP_URL: smtp.SMTP_URL })).toThrow(/SMTP_URL and EMAIL_FROM/);
  });
  it('treats empty email settings as not set', () => {
    expect(loadConfig({ ...base, SMTP_URL: '', EMAIL_FROM: '' }).realEmail).toBe(false);
  });
  it('picks the real SMTP adapter when configured and the sandbox otherwise', () => {
    expect(mailerFor(loadConfig({ ...base, ...smtp, APP_ENV: 'production' }))).toBe(SmtpMailer);
    expect(mailerFor(loadConfig({ ...base, APP_ENV: 'development' }))).toBe(SandboxMailer);
  });
});

describe('SMTP email adapter', () => {
  it('sends a plain-text email from the configured sender', async () => {
    const config = loadConfig({ DATABASE_URL: 'postgresql://x', MFA_ENCRYPTION_KEY: key, APP_ENV: 'production', SMTP_URL: 'smtps://u:p@smtp.example.test:465', EMAIL_FROM: 'HumanLift <no-reply@example.test>' });
    const transport = nodemailer.createTransport({ jsonTransport: true });
    const sent: any[] = [];
    const spy = jest.spyOn(transport, 'sendMail').mockImplementation(async (m: any) => { sent.push(m); return {} as any; });
    await new SmtpMailer(config, transport).send({ to: 'ana@example.test', subject: 'Confirm', body: 'Hello' });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(sent[0]).toMatchObject({ from: 'HumanLift <no-reply@example.test>', to: 'ana@example.test', subject: 'Confirm', text: 'Hello' });
  });
});
