import { DynamicModule, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppConfig, CONFIG } from './config';
import { PrismaService } from './prisma.service';
import { AuditService } from './audit/audit.service';
import { MAILER, mailerFor } from './mail/mailer';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { MemberGuard, StaffGuard, StaffPasswordGuard } from './auth/guards';
import { UsersController } from './users/users.controller';
import { PublicController } from './public/public.controller';
import { AdminAuthController } from './admin/admin-auth.controller';
import { AdminController } from './admin/admin.controller';
import { DevController } from './dev/dev.controller';
import { HealthController } from './health.controller';
import { AdminRequestsController, MyRequestsController, PublicRequestsController } from './requests/requests.controller';
import { RequestsService } from './requests/requests.service';

@Module({})
export class AppModule {
  static forRoot(config: AppConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [ThrottlerModule.forRoot({ throttlers: [{ name: 'default', ttl: 60_000, limit: 300 }] })],
      controllers: [HealthController, AuthController, UsersController, PublicController, AdminAuthController, AdminController, DevController, MyRequestsController, AdminRequestsController, PublicRequestsController],
      providers: [
        { provide: CONFIG, useValue: config },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        PrismaService,
        AuditService,
        // Real SMTP delivery when SMTP_URL is set (required in staging/production), sandbox outbox otherwise.
        { provide: MAILER, useClass: mailerFor(config) },
        AuthService,
        RequestsService,
        MemberGuard,
        StaffGuard,
        StaffPasswordGuard,
      ],
    };
  }
}
