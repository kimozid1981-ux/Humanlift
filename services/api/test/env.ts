process.env.APP_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgresql://humanlift:humanlift@localhost:5432/humanlift_test';
process.env.MFA_ENCRYPTION_KEY = process.env.MFA_ENCRYPTION_KEY ?? Buffer.alloc(32, 7).toString('base64');
process.env.AUTH_RATE_LIMIT = process.env.AUTH_RATE_LIMIT ?? '1000';
process.env.WEB_BASE_URL = 'http://localhost:3000';
