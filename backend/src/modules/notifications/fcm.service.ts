import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getMessaging, Message } from 'firebase-admin/messaging';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private initialized = false;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  onModuleInit() {
    const credentials = this.configService.get<string>('FIREBASE_CREDENTIALS');
    if (credentials) {
      try {
        let serviceAccount: ServiceAccount;
        if (credentials.startsWith('{')) {
          serviceAccount = JSON.parse(credentials) as ServiceAccount;
        } else {
          const fromCwd = resolve(process.cwd(), credentials);
          const fromBackend = resolve(__dirname, '../../../../', credentials);
          const resolvedPath = existsSync(fromCwd) ? fromCwd : fromBackend;
          const raw = readFileSync(resolvedPath, 'utf-8');
          serviceAccount = JSON.parse(raw) as ServiceAccount;
          this.logger.log(`Loaded Firebase credentials from file: ${resolvedPath}`);
        }
        if (getApps().length === 0) {
          initializeApp({ credential: cert(serviceAccount) });
        }
        this.initialized = true;
        const projectId = (serviceAccount as Record<string, string>)['project_id'] ?? serviceAccount.projectId;
        this.logger.log(`Firebase Admin initialized for project ${projectId}`);
      } catch (error) {
        this.logger.warn(`Failed to init Firebase Admin: ${error instanceof Error ? error.message : 'unknown'}`);
      }
    } else {
      this.logger.warn('FIREBASE_CREDENTIALS not set. Push notifications disabled.');
    }
  }

  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    if (!this.initialized) return;

    try {
      const deviceTokens = await this.prisma.deviceToken.findMany({
        where: { userId },
        select: { token: true },
      });

      if (deviceTokens.length === 0) return;

      const invalidTokens: string[] = [];
      const messaging = getMessaging();

      for (const { token } of deviceTokens) {
        const message: Message = {
          token,
          notification: { title, body },
          android: {
            priority: 'high',
            notification: {
              channelId: 'hakimi_notifications',
              priority: 'high',
              defaultSound: true,
              defaultVibrateTimings: true,
            },
          },
          data: {
            type: data?.type ?? 'info',
            notificationId: data?.notificationId ?? '',
            link: data?.link ?? '',
            title,
            body,
          },
        };

        try {
          await messaging.send(message);
        } catch (error: unknown) {
          const err = error as { code?: string; message?: string };
          this.logger.warn(`FCM error for token ${token}: ${err.code} ${err.message}`);
          if (err.code === 'messaging/registration-token-not-registered') {
            invalidTokens.push(token);
          }
        }
      }

      if (invalidTokens.length > 0) {
        await this.prisma.deviceToken.deleteMany({
          where: { token: { in: invalidTokens } },
        });
        this.logger.log(`Removed ${invalidTokens.length} invalid token(s)`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to send FCM: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  async registerToken(userId: string, token: string, platform: string = 'android') {
    const existing = await this.prisma.deviceToken.findUnique({
      where: { token },
    });
    if (existing) {
      if (existing.userId !== userId) {
        await this.prisma.deviceToken.update({
          where: { token },
          data: { userId, platform },
        });
        this.logger.log(`FCM token re-registered to user ${userId}`);
      }
      return;
    }
    await this.prisma.deviceToken.create({
      data: { token, userId, platform },
    });
    this.logger.log(`FCM token registered for user ${userId}`);
  }

  async unregisterToken(token: string) {
    await this.prisma.deviceToken.deleteMany({ where: { token } });
    this.logger.log('FCM token unregistered');
  }

  // ── Client (phone-based) token methods ──

  async registerClientToken(phone: string, token: string, platform: string = 'android') {
    const existing = await this.prisma.clientDeviceToken.findUnique({
      where: { token },
    });
    if (existing) {
      if (existing.phone !== phone) {
        await this.prisma.clientDeviceToken.update({
          where: { token },
          data: { phone, platform },
        });
        this.logger.log(`Client FCM token re-registered to phone ${phone}`);
      }
      return;
    }
    await this.prisma.clientDeviceToken.create({
      data: { token, phone, platform },
    });
    this.logger.log(`Client FCM token registered for phone ${phone}`);
  }

  async unregisterClientToken(token: string) {
    await this.prisma.clientDeviceToken.deleteMany({ where: { token } });
    this.logger.log('Client FCM token unregistered');
  }

  async sendToClientPhone(
    phone: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    if (!this.initialized) return;

    try {
      const deviceTokens = await this.prisma.clientDeviceToken.findMany({
        where: { phone },
        select: { token: true },
      });

      if (deviceTokens.length === 0) return;

      const invalidTokens: string[] = [];
      const messaging = getMessaging();

      for (const { token } of deviceTokens) {
        const message: Message = {
          token,
          notification: { title, body },
          android: {
            priority: 'high',
            notification: {
              channelId: 'hakimi_notifications',
              priority: 'high',
              defaultSound: true,
              defaultVibrateTimings: true,
            },
          },
          data: {
            type: data?.type ?? 'info',
            notificationId: data?.notificationId ?? '',
            link: data?.link ?? '',
            title,
            body,
          },
        };

        try {
          await messaging.send(message);
        } catch (error: unknown) {
          const err = error as { code?: string; message?: string };
          this.logger.warn(`FCM error for client token ${token}: ${err.code} ${err.message}`);
          if (err.code === 'messaging/registration-token-not-registered') {
            invalidTokens.push(token);
          }
        }
      }

      if (invalidTokens.length > 0) {
        await this.prisma.clientDeviceToken.deleteMany({
          where: { token: { in: invalidTokens } },
        });
        this.logger.log(`Removed ${invalidTokens.length} invalid client token(s)`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to send client FCM: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }
}
