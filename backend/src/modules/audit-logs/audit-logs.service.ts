import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAuditLogDto, QueryAuditLogDto } from './dto';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async log(dto: CreateAuditLogDto) {
    const metadata = (dto.metadata ?? {}) as Prisma.InputJsonValue;

    return this.prisma.auditLog.create({
      data: {
        action: dto.action,
        entity: dto.entity,
        entityId: dto.entityId,
        metadata,
        userId: dto.userId,
      },
    });
  }

  async findAll(query: QueryAuditLogDto) {
    const { entity, entityId, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (entity) where.entity = entity;
    if (entityId) where.entityId = entityId;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
