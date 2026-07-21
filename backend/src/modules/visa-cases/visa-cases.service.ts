import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FcmService } from '../notifications/fcm.service';
import { BroadcastNotificationDto } from '../notifications/dto';
import { AppGateway } from '../gateway/app.gateway';
import {
  CreateVisaCaseDto,
  UpdateVisaCaseDto,
  UpdateStatusDto,
  QueryVisaCaseDto,
} from './dto';

@Injectable()
export class VisaCasesService {
  private readonly logger = new Logger(VisaCasesService.name);

  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
    private notifications: NotificationsService,
    private fcm: FcmService,
    private gateway: AppGateway,
  ) {}

  async create(dto: CreateVisaCaseDto, userId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
    });
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const caseNumber = await this.generateCaseNumber();

    const visaCase = await this.prisma.visaCase.create({
      data: {
        caseNumber,
        clientId: dto.clientId,
        visaCountry: dto.visaCountry,
        visaType: dto.visaType,
        currentStatus: dto.currentStatus ?? 'EN_ATTENTE',
        notes: dto.notes,
        price: dto.price,
        isPaid: dto.isPaid ?? false,
        createdBy: userId,
      },
    });

    await this.auditLog.log({
      action: 'CREATE',
      entity: 'VisaCase',
      entityId: visaCase.id,
      userId,
      metadata: { caseNumber, clientId: dto.clientId },
    });

    await this.notifications.create({
      type: 'INFO',
      title: 'New Visa Case Created',
      message: `Visa case ${caseNumber} created for ${client.fullName}`,
      userId,
      link: `/visa-cases/${visaCase.id}`,
    });

    return visaCase;
  }

  async findAll(query: QueryVisaCaseDto) {
    const { search, status, clientId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) {
      where.currentStatus = status;
    }
    if (clientId) {
      where.clientId = clientId;
    }
    if (search) {
      where.OR = [
        { caseNumber: { contains: search } },
        { client: { fullName: { contains: search } } },
        { client: { passportNumber: { contains: search } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.visaCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, fullName: true, phoneNumber: true, passportNumber: true, passportExpiry: true } },
          creator: { select: { id: true, firstName: true, lastName: true } },
          appointments: {
            orderBy: { appointmentDate: 'desc' as const },
            take: 1,
            select: {
              id: true,
              appointmentDate: true,
              appointmentTime: true,
              appointmentCenter: true,
              appointmentType: true,
            },
          },
        },
      }),
      this.prisma.visaCase.count({ where }),
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

  async findOne(id: string) {
    const visaCase = await this.prisma.visaCase.findUnique({
      where: { id },
      include: {
        client: true,
        creator: { select: { id: true, firstName: true, lastName: true } },
        statusHistories: {
          orderBy: { changedAt: 'desc' },
          include: {
            changer: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!visaCase) {
      throw new NotFoundException('Visa case not found');
    }

    return visaCase;
  }

  async update(id: string, dto: UpdateVisaCaseDto, userId: string) {
    const existing = await this.prisma.visaCase.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Visa case not found');
    }

    if (dto.clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: dto.clientId },
      });
      if (!client) {
        throw new NotFoundException('Client not found');
      }
    }

    const visaCase = await this.prisma.visaCase.update({
      where: { id },
      data: dto,
    });

    await this.auditLog.log({
      action: 'UPDATE',
      entity: 'VisaCase',
      entityId: visaCase.id,
      userId,
      metadata: { caseNumber: visaCase.caseNumber },
    });

    await this.notifications.create({
      type: 'INFO',
      title: 'Visa Case Updated',
      message: `Visa case ${visaCase.caseNumber} was updated`,
      userId,
      link: `/visa-cases/${id}`,
    });

    return visaCase;
  }

  async updateStatus(id: string, dto: UpdateStatusDto, userId: string) {
    const existing = await this.prisma.visaCase.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Visa case not found');
    }

    const oldStatus = existing.currentStatus;
    const newStatus = dto.status;

    if (oldStatus === newStatus) {
      return existing;
    }

    const [visaCase] = await this.prisma.$transaction([
      this.prisma.visaCase.update({
        where: { id },
        data: {
          currentStatus: newStatus,
          incompleteReason:
            newStatus === 'DOSSIER_INCOMPLET' ? (dto.reason ?? null) : null,
        },
      }),
      this.prisma.statusHistory.create({
        data: {
          visaCaseId: id,
          oldStatus,
          newStatus,
          changedBy: userId,
        },
      }),
    ]);

    await this.auditLog.log({
      action: 'STATUS_CHANGE',
      entity: 'VisaCase',
      entityId: visaCase.id,
      userId,
      metadata: {
        caseNumber: visaCase.caseNumber,
        from: oldStatus,
        to: newStatus,
      },
    });

    const visaCaseWithClient = await this.prisma.visaCase.findUnique({
      where: { id },
      include: { client: { select: { fullName: true } } },
    });

    const changer = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });
    const changerName = changer ? `${changer.firstName} ${changer.lastName}` : 'Unknown';

    const notificationMsg = `Case ${visaCase.caseNumber} (${visaCaseWithClient?.client.fullName}): status changed from ${oldStatus} to ${newStatus} by ${changerName}`;
    await this.notifications.broadcast({
      type: 'STATUS_CHANGE',
      title: 'Visa Case Status Updated',
      message: notificationMsg,
      link: `/visa-cases/${id}`,
    });

    // Send FCM push notification to the client
    const clientFull = await this.prisma.visaCase.findUnique({
      where: { id },
      select: { client: { select: { phoneNumber: true, fullName: true } } },
    });
    if (clientFull?.client.phoneNumber) {
      const clientTitle = this.clientStatusTitle(newStatus);
      const clientBody = `Votre dossier ${visaCase.caseNumber}: ${this.clientStatusMessage(newStatus)}`;
      await this.fcm.sendToClientPhone(
        clientFull.client.phoneNumber,
        clientTitle,
        clientBody,
        { type: 'STATUS_CHANGE', link: '/tracking' },
      );
    }

    await this.gateway.broadcast('visaCase:statusChange', {
      id,
      caseNumber: visaCase.caseNumber,
      oldStatus,
      newStatus,
      changedBy: changerName,
    });

    return visaCase;
  }

  async getHistory(id: string) {
    const visaCase = await this.prisma.visaCase.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!visaCase) {
      throw new NotFoundException('Visa case not found');
    }

    return this.prisma.statusHistory.findMany({
      where: { visaCaseId: id },
      orderBy: { changedAt: 'desc' },
      include: {
        changer: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.visaCase.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Visa case not found');
    }

    await this.prisma.$transaction([
      this.prisma.visaCase.delete({ where: { id } }),
      this.prisma.auditLog.create({
        data: {
          action: 'DELETE',
          entity: 'VisaCase',
          entityId: id,
          userId,
          metadata: { caseNumber: existing.caseNumber },
        },
      }),
    ]);

    await this.notifications.create({
      type: 'WARNING',
      title: 'Visa Case Deleted',
      message: `Visa case ${existing.caseNumber} was deleted`,
      userId,
    });
  }

  private clientStatusTitle(status: string): string {
    const titles: Record<string, string> = {
      EN_ATTENTE: 'Dossier soumis',
      EN_TRAITEMENT: 'Dossier en cours',
      RDV_OK: 'Rendez-vous programmé',
      VISA_OK: 'Visa accordé',
      VISA_REFUSEE: 'Visa refusé',
      LIVREE: 'Dossier livré',
    };
    return titles[status] ?? 'Mise à jour de votre dossier';
  }

  private clientStatusMessage(status: string): string {
    const messages: Record<string, string> = {
      EN_ATTENTE: 'Votre demande a été soumise et est en attente de traitement.',
      EN_TRAITEMENT: 'Votre dossier est en cours d\'examen.',
      RDV_OK: 'Un rendez-vous a été programmé pour le dépôt de votre dossier.',
      VISA_OK: 'Félicitations, votre visa a été accordé.',
      VISA_REFUSEE: 'Votre demande de visa a été refusée.',
      LIVREE: 'Votre dossier a été livré avec succès.',
    };
    return messages[status] ?? 'Le statut de votre dossier a été mis à jour.';
  }

  private async generateCaseNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `VISA-${year}-`;

    const lastCase = await this.prisma.visaCase.findFirst({
      where: { caseNumber: { startsWith: prefix } },
      orderBy: { caseNumber: 'desc' },
      select: { caseNumber: true },
    });

    let nextNumber = 1;
    if (lastCase) {
      const parts = lastCase.caseNumber.split('-');
      nextNumber = parseInt(parts[parts.length - 1] ?? '0', 10) + 1;
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }
}
