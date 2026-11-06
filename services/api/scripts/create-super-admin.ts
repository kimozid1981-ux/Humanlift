/**
 * Creates the first super administrator. Run once per environment:
 *   pnpm --filter @humanlift/api seed:admin -- admin@example.com "Founder Name"
 * A random password is generated and printed ONCE. MFA enrolment is forced at first sign-in.
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';

async function main() {
  const [emailArg, nameArg] = process.argv.slice(2).filter((a) => a !== '--');
  if (!emailArg) {
    console.error('Usage: seed:admin -- <email> [display name]');
    process.exit(1);
  }
  const email = emailArg.trim().toLowerCase();
  const prisma = new PrismaClient();
  try {
    if (await prisma.user.findUnique({ where: { email } })) {
      console.error('A user with this email already exists. Nothing changed.');
      process.exit(1);
    }
    const password = randomBytes(18).toString('base64url');
    const user = await prisma.user.create({
      data: {
        email,
        displayName: nameArg ?? 'Super administrator',
        passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
        emailVerifiedAt: new Date(),
        roles: { create: [{ role: 'SUPER_ADMINISTRATOR' }] },
      },
    });
    await prisma.auditLog.create({ data: { action: 'admin.super_admin_created_via_cli', targetType: 'User', targetId: user.id } });
    console.log('Super administrator created.');
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}`);
    console.log('Store this password in a password manager now. It will not be shown again.');
    console.log('At first sign-in to the admin dashboard you will be asked to set up an authenticator app.');
  } finally {
    await prisma.$disconnect();
  }
}

main();
