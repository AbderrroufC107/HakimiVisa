import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PublicTrackingQueryDto } from './dto/public-tracking-query.dto';

@Injectable()
export class PublicTrackingService {
  constructor(private prisma: PrismaService) {}

  async findByPassport(query: PublicTrackingQueryDto) {
    const { passport, expiry, reference } = query;

    const client = await this.prisma.client.findFirst({
      where: { passportNumber: { equals: passport.trim() } },
      select: { id: true, fullName: true, phoneNumber: true, passportNumber: true, passportExpiry: true },
    });

    if (!client) {
      throw new NotFoundException('Aucun dossier trouvé avec ces informations de passeport');
    }

    // Verify passport expiry matches if both are provided
    if (expiry && client.passportExpiry) {
      const expiryDate = new Date(expiry);
      const matches =
        client.passportExpiry.getUTCFullYear() === expiryDate.getUTCFullYear() &&
        client.passportExpiry.getUTCMonth() === expiryDate.getUTCMonth() &&
        client.passportExpiry.getUTCDate() === expiryDate.getUTCDate();

      if (!matches) {
        throw new NotFoundException('Aucun dossier trouvé avec ces informations de passeport');
      }
    }

    const where: Record<string, unknown> = {
      clientId: client.id,
      archived: false,
    };

    if (reference) {
      where.caseNumber = { contains: reference };
    }

    const cases = await this.prisma.visaCase.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        caseNumber: true,
        visaCountry: true,
        visaType: true,
        currentStatus: true,
        incompleteReason: true,
        openingDate: true,
        updatedAt: true,
      },
    });

    return {
      clientName: client.fullName,
      passport: client.passportNumber,
      cases,
      total: cases.length,
    };
  }

  async findByCaseNumber(caseNumber: string) {
    const visaCase = await this.prisma.visaCase.findFirst({
      where: { caseNumber, archived: false },
      select: {
        caseNumber: true,
        visaCountry: true,
        visaType: true,
        currentStatus: true,
        incompleteReason: true,
        openingDate: true,
        updatedAt: true,
        client: {
          select: { fullName: true, phoneNumber: true, passportNumber: true, passportExpiry: true },
        },
        appointments: {
          orderBy: { appointmentDate: 'asc' },
          select: {
            appointmentDate: true,
            appointmentTime: true,
            appointmentCenter: true,
            appointmentType: true,
          },
        },
        visaDetails: {
          select: {
            validFrom: true,
            validUntil: true,
            durationDays: true,
            entryType: true,
            visaNumber: true,
          },
        },
        statusHistories: {
          orderBy: { changedAt: 'asc' },
          select: {
            oldStatus: true,
            newStatus: true,
            changedAt: true,
          },
        },
      },
    });

    if (!visaCase) {
      throw new NotFoundException('Dossier non trouvé');
    }

    return visaCase;
  }

  async findTimelineByCaseNumber(caseNumber: string) {
    const visaCase = await this.prisma.visaCase.findFirst({
      where: { caseNumber, archived: false },
      select: { id: true },
    });

    if (!visaCase) {
      throw new NotFoundException('Dossier non trouvé');
    }

    return this.prisma.statusHistory.findMany({
      where: { visaCaseId: visaCase.id },
      orderBy: { changedAt: 'asc' },
      select: {
        oldStatus: true,
        newStatus: true,
        changedAt: true,
      },
    });
  }

  async findAppointmentsByCaseNumber(caseNumber: string) {
    const visaCase = await this.prisma.visaCase.findFirst({
      where: { caseNumber, archived: false },
      select: { id: true },
    });

    if (!visaCase) {
      throw new NotFoundException('Dossier non trouvé');
    }

    return this.prisma.appointment.findMany({
      where: { visaCaseId: visaCase.id },
      orderBy: { appointmentDate: 'asc' },
      select: {
        appointmentDate: true,
        appointmentTime: true,
        appointmentCenter: true,
        appointmentType: true,
      },
    });
  }

  async findDocumentsByCaseNumber(caseNumber: string) {
    const visaCase = await this.prisma.visaCase.findFirst({
      where: { caseNumber, archived: false },
      select: { id: true },
    });

    if (!visaCase) {
      throw new NotFoundException('Dossier non trouvé');
    }

    return this.prisma.document.findMany({
      where: { visaCaseId: visaCase.id },
      select: {
        name: true,
        type: true,
        url: true,
        mimeType: true,
        size: true,
      },
    });
  }

  private async getClientIdByPhone(phone: string) {
    const client = await this.prisma.client.findFirst({
      where: { phoneNumber: { contains: phone } },
      select: { id: true },
    });
    if (!client) return null;
    return client.id;
  }

  private async getVisaCaseIdsByClientId(clientId: string) {
    const cases = await this.prisma.visaCase.findMany({
      where: { clientId, archived: false },
      select: { id: true },
    });
    return cases.map((vc: { id: string }) => vc.id);
  }

  async findAppointmentsByPhone(phone: string) {
    const clientId = await this.getClientIdByPhone(phone);
    if (!clientId) return [];

    const caseIds = await this.getVisaCaseIdsByClientId(clientId);
    if (caseIds.length === 0) return [];

    return this.prisma.appointment.findMany({
      where: { visaCaseId: { in: caseIds } },
      orderBy: { appointmentDate: 'asc' },
      select: {
        appointmentDate: true,
        appointmentTime: true,
        appointmentCenter: true,
        appointmentType: true,
      },
    });
  }

  async findDocumentsByPhone(phone: string) {
    const clientId = await this.getClientIdByPhone(phone);
    if (!clientId) return [];

    const caseIds = await this.getVisaCaseIdsByClientId(clientId);
    if (caseIds.length === 0) return [];

    return this.prisma.document.findMany({
      where: { visaCaseId: { in: caseIds } },
      select: {
        name: true,
        type: true,
        url: true,
        mimeType: true,
        size: true,
      },
    });
  }

  async findNotificationsByPhone(phone: string) {
    const clientId = await this.getClientIdByPhone(phone);
    if (!clientId) return [];

    const caseIds = await this.getVisaCaseIdsByClientId(clientId);
    if (caseIds.length === 0) return [];

    const histories = await this.prisma.statusHistory.findMany({
      where: { visaCaseId: { in: caseIds } },
      orderBy: { changedAt: 'desc' },
      take: 50,
      select: {
        newStatus: true,
        changedAt: true,
      },
    });

    return histories.map((h: { newStatus: string; changedAt: Date }) => ({
      type: 'STATUS_CHANGE',
      title: this.statusTitle(h.newStatus),
      message: this.statusMessage(h.newStatus),
      date: h.changedAt,
      read: true,
    }));
  }

  async findNotificationsByCaseNumber(caseNumber: string) {
    const visaCase = await this.prisma.visaCase.findFirst({
      where: { caseNumber, archived: false },
      select: { id: true },
    });

    if (!visaCase) {
      throw new NotFoundException('Dossier non trouvé');
    }

    const histories = await this.prisma.statusHistory.findMany({
      where: { visaCaseId: visaCase.id },
      orderBy: { changedAt: 'desc' },
      take: 20,
      select: {
        newStatus: true,
        changedAt: true,
      },
    });

    return histories.map((h: { newStatus: string; changedAt: Date }) => ({
      type: 'STATUS_CHANGE',
      title: this.statusTitle(h.newStatus),
      message: this.statusMessage(h.newStatus),
      date: h.changedAt,
      read: true,
    }));
  }

  private statusTitle(status: string): string {
    const titles: Record<string, string> = {
      EN_ATTENTE: 'Dossier soumis',
      EN_TRAITEMENT: 'Dossier en cours de traitement',
      RDV_OK: 'Rendez-vous programmé',
      VISA_OK: 'Visa accordé',
      VISA_REFUSEE: 'Visa refusé',
    };
    return titles[status] ?? 'Mise à jour du dossier';
  }

  private statusMessage(status: string): string {
    const messages: Record<string, string> = {
      EN_ATTENTE: 'Votre demande de visa a été soumise et est en attente de traitement.',
      EN_TRAITEMENT: 'Votre dossier est en cours d\'examen par nos services.',
      RDV_OK: 'Un rendez-vous a été programmé pour le dépôt de votre dossier.',
      VISA_OK: 'Félicitations, votre visa a été accordé.',
      VISA_REFUSEE: 'Nous regrettons de vous informer que votre demande de visa a été refusée.',
    };
    return messages[status] ?? 'Le statut de votre dossier a été mis à jour.';
  }
}
