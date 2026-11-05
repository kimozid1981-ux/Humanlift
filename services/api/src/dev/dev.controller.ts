import { Controller, Get, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AppConfig, CONFIG } from '../config';

/** Development/test only. Returns 404 in staging and production. */
@Controller('dev')
export class DevController {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CONFIG) private readonly config: AppConfig,
  ) {}

  @Get('outbox')
  async outbox() {
    if (!this.config.devOutboxEnabled) throw new NotFoundException();
    const items = await this.prisma.devOutboxEmail.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    return { sandbox: true, items };
  }
}
