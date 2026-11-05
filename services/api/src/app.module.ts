import { DynamicModule, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppConfig, CONFIG } from './config';
import { PrismaService } from './prisma.service';
import { AuditService } from './audit/audit.service';
import { MAILER, SandboxMailer } from './mail/mailer';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { MemberGuard, StaffGuard, StaffPasswordGuard } from './auth/guards';
import { UsersController } from './users/users.controller';
import { PublicController } from './public/public.controller';
import { AdminAuthController } from './admin/admin-auth.controller';
import { AdminController } from './admin/admin.controller';
import { DevController } from './dev/dev.controller';
import { HealthController } from './health.controller';

@Module({})
export class AppModule {
  static forRoot(config: AppConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [ThrottlerModule.forRoot({ throttlers: [{ name: 'default', ttl: 60_000, limit: 300 }] })],
      controllers: [HealthController, AuthController, UsersController, PublicController, AdminAuthController, AdminController, DevController],
      providers: [
        { provide: CONFIG, useValue: config },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        PrismaService,
        AuditService,
        // Swap for a real email provider adapter in staging/production.
        { provide: MAILER, useClass: SandboxMailer },
        AuthService,
        MemberGuard,
        StaffGuard,
        StaffPasswordGuard,
      ],
    };
  }
}
