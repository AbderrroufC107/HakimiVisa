import { Injectable, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAuditLogDto, QueryAuditLogDto } from './dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuditLogService {
  constructor(
    private prisma: PrismaService,
    @Optional() private notifications?: NotificationsService,
  ) {}

  async log(dto: CreateAuditLogDto) {
    const metadata = (dto.metadata ?? {}) as Prisma.InputJsonValue;

    const auditLog = await this.prisma.auditLog.create({
      data: {
        action: dto.action,
        entity: dto.entity,
        entityId: dto.entityId,
        metadata,
        userId: dto.userId,
      },
    });

    // Keep managers informed about every create/update/delete operation.
    await this.notifications?.notifyOtherManagers(
      {
        type: dto.action === 'DELETE' ? 'WARNING' : 'INFO',
        title: `${dto.action} ${dto.entity}`,
        message: `${dto.entity} ${dto.action.toLowerCase()}d`,
        link: `/${dto.entity.toLowerCase()}s/${dto.entityId}`,
      },
      dto.userId,
    );

    return auditLog;
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
