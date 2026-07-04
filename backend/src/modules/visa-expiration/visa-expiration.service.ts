import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class VisaExpirationService {
  private readonly logger = new Logger(VisaExpirationService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiringVisas() {
    this.logger.log('Checking for expiring visas...');

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiringVisas = await this.prisma.visaDetails.findMany({
      where: {
        validUntil: {
          gte: now,
          lte: in30Days,
        },
      },
      include: {
        visaCase: {
          include: {
            client: { select: { fullName: true } },
            creator: { select: { id: true } },
          },
        },
      },
    });

    for (const detail of expiringVisas) {
      const daysRemaining = Math.ceil(
        (detail.validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      let threshold: string;
      if (daysRemaining <= 7) threshold = '7';
      else if (daysRemaining <= 15) threshold = '15';
      else threshold = '30';

      const title = `Visa expirant dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`;
      const message = `Le visa de ${detail.visaCase.client.fullName} (${detail.visaCase.caseNumber}) expire le ${detail.validUntil.toLocaleDateString('fr-FR')}.`;

      await this.notifications.create({
        type: 'VISA_EXPIRING',
        title,
        message,
        userId: detail.visaCase.creator.id,
        link: `/visa-cases/${detail.visaCase.id}`,
      });

      this.logger.log(`Created expiration notification for case ${detail.visaCase.caseNumber} (${daysRemaining} days remaining)`);
    }

    this.logger.log(`Checked ${expiringVisas.length} expiring visas.`);
  }

  async getExpiringSummary(days = 30) {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const data = await this.prisma.visaDetails.findMany({
      where: {
        validUntil: {
          gte: now,
          lte: future,
        },
      },
      include: {
        visaCase: {
          include: {
            client: { select: { id: true, fullName: true, phoneNumber: true, passportNumber: true } },
          },
        },
      },
      orderBy: { validUntil: 'asc' },
    });

    return data.map((d: { id: string; visaCase: { caseNumber: string; client: { fullName: string; phoneNumber: string | null; passportNumber: string | null } }; validFrom: Date; validUntil: Date; durationDays: number; entryType: string; visaNumber: string | null }) => ({
      id: d.id,
      caseNumber: d.visaCase.caseNumber,
      clientName: d.visaCase.client.fullName,
      passportNumber: d.visaCase.client.passportNumber,
      phoneNumber: d.visaCase.client.phoneNumber,
      validFrom: d.validFrom,
      validUntil: d.validUntil,
      durationDays: d.durationDays,
      entryType: d.entryType,
      visaNumber: d.visaNumber,
      daysRemaining: Math.ceil((d.validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    }));
  }

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  async checkUpcomingAppointments() {
    this.logger.log('Checking upcoming appointments...');

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: now,
          lte: tomorrow,
        },
      },
      include: {
        visaCase: {
          include: {
            client: { select: { fullName: true } },
          },
        },
        user: { select: { id: true } },
      },
    });

    for (const appointment of appointments) {
      await this.notifications.create({
        type: 'APPOINTMENT_REMINDER',
        title: 'Rappel de rendez-vous',
        message: `Rendez-vous ${appointment.appointmentType} pour ${appointment.visaCase.client.fullName} (${appointment.visaCase.caseNumber}) le ${appointment.appointmentDate.toLocaleDateString('fr-FR')} à ${appointment.appointmentTime} - ${appointment.appointmentCenter}`,
        userId: appointment.user.id,
        link: `/visa-cases/${appointment.visaCaseId}`,
      });
    }
  }
}
