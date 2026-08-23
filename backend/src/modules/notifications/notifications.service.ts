import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { AppGateway } from '../gateway/app.gateway';
import { FcmService } from './fcm.service';
import { CreateNotificationDto, QueryNotificationDto, BroadcastNotificationDto } from './dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private gateway: AppGateway,
    private fcmService: FcmService,
  ) {}

  async create(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({ data: dto });

    await this.gateway.sendToUser(dto.userId, 'notification', notification);

    await this.fcmService.sendToUser(
      dto.userId,
      notification.title,
      notification.message,
      {
        type: notification.type,
        notificationId: notification.id,
        link: notification.link ?? '',
      },
    );

    return notification;
  }

  /**
   * Desk-wide announcement. Partner agencies are deliberately excluded: these
   * messages name the client and quote the case, and a partner has no business
   * reading about files it did not submit. Pass `agencyId` to also reach the
   * partner that submitted the case in question — and only that partner.
   */
  async broadcast(dto: BroadcastNotificationDto, agencyId?: string | null) {
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { role: { in: [UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT] } },
          ...(agencyId ? [{ agencyId }] : []),
        ],
      },
      select: { id: true },
    });

    type NotificationWithId = {
      id: string;
      type: string;
      title: string;
      message: string;
      userId: string;
      link: string | null;
      read: boolean;
      createdAt: Date;
    };

    const notifications: NotificationWithId[] = await this.prisma.$transaction(
      users.map((user: { id: string }) =>
        this.prisma.notification.create({
          data: {
            type: dto.type,
            title: dto.title,
            message: dto.message,
            userId: user.id,
            link: dto.link,
          },
        }),
      ),
    );

    this.logger.log(`Broadcast notification sent to ${users.length} users`);

    for (const user of users) {
      const n = notifications.find((n: NotificationWithId) => n.userId === user.id);
      if (n) {
        await this.gateway.sendToUser(user.id, 'notification', n);
      }
    }

    for (const user of users) {
      await this.fcmService.sendToUser(user.id, dto.title, dto.message, {
        type: dto.type,
        link: dto.link ?? '',
      });
    }

    return { sent: users.length };
  }

  /** Notify every active manager except the person who performed the action. */
  async notifyOtherManagers(dto: BroadcastNotificationDto, actorId: string) {
    const managers = await this.prisma.user.findMany({
      where: {
        id: { not: actorId },
        isActive: true,
        role: { in: [UserRole.ADMIN, UserRole.MANAGER] },
      },
      select: { id: true },
    });

    if (managers.length === 0) return { sent: 0 };

    const notifications = await this.prisma.$transaction(
      managers.map((manager) =>
        this.prisma.notification.create({
          data: {
            type: dto.type,
            title: dto.title,
            message: dto.message,
            userId: manager.id,
            link: dto.link,
          },
        }),
      ),
    );

    for (const notification of notifications) {
      await this.gateway.sendToUser(notification.userId, 'notification', notification);
      await this.fcmService.sendToUser(
        notification.userId,
        notification.title,
        notification.message,
        { type: notification.type, notificationId: notification.id, link: notification.link ?? '' },
      );
    }

    return { sent: notifications.length };
  }

  async findByUser(userId: string, query: QueryNotificationDto) {
    const { read, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const rawRead = read as boolean | string | undefined;
    const readFilter =
      rawRead === true || rawRead === 'true' ? true : rawRead === false || rawRead === 'false' ? false : undefined;

    const where: Record<string, unknown> = { userId };
    if (readFilter !== undefined) where.read = readFilter;

    const [data, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      },
    };
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async remove(id: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: { id, userId },
    });
  }
}
