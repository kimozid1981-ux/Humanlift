import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

export interface AuditEntry {
  actorId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  ipAddress?: string;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /** Writes an append-only audit entry. Never put passwords, tokens or document contents in metadata. */
  async record(entry: AuditEntry, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        ipAddress: entry.ipAddress,
        metadata: entry.metadata,
      },
    });
  }
}
