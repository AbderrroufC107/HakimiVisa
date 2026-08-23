import {
  BadRequestException,
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
import { TemplatesService } from '../templates/templates.service';
import { MessagesService } from '../templates/messages.service';
import {
  CreateVisaCaseDto,
  UpdateVisaCaseDto,
  UpdateStatusDto,
  QueryVisaCaseDto,
} from './dto';

const AUTO_NOTIFY_STATUSES = ['DOSSIER_INCOMPLET', 'RDV_OK', 'LIVREE'];

@Injectable()
export class VisaCasesService {
  private readonly logger = new Logger(VisaCasesService.name);

  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
    private notifications: NotificationsService,
    private fcm: FcmService,
    private gateway: AppGateway,
    private templates: TemplatesService,
    private messages: MessagesService,
  ) {}

  async create(dto: CreateVisaCaseDto, userId: string, agencyId?: string | null) {
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
        // Stamped from the token, never from the payload, so an agency cannot
        // file a case under another's name.
        submittedByAgencyId: agencyId ?? null,
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
      title: 'Nouveau dossier de visa créé',
      message: `Dossier ${caseNumber} créé pour ${client.fullName}`,
      userId,
      link: `/visa-cases/${visaCase.id}`,
    });

    return visaCase;
  }

  async findAll(query: QueryVisaCaseDto, agencyId?: string | null) {
    const { search, status, clientId, dateFrom, dateTo, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { archived: false };
    // An agency user only ever sees the cases it submitted.
    if (agencyId) {
      where.submittedByAgencyId = agencyId;
    }

    if (status) {
      where.currentStatus = status;
    }
    if (clientId) {
      where.clientId = clientId;
    }
    if (dateFrom || dateTo) {
      const createdAt: Record<string, Date> = {};
      if (dateFrom) createdAt.gte = new Date(dateFrom);
      if (dateTo) createdAt.lte = new Date(dateTo);
      where.createdAt = createdAt;
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
          submittedByAgency: { select: { id: true, name: true } },
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


  /**
   * An agency may only ever touch a case it submitted. Guards cover *what*
   * an agency may do; this covers *which* rows it may do it to.
   */
  private async assertAgencyOwns(id: string, agencyId?: string | null) {
    if (!agencyId) return;
    const owned = await this.prisma.visaCase.findFirst({
      where: { id, submittedByAgencyId: agencyId },
      select: { id: true },
    });
    if (!owned) {
      throw new NotFoundException('Visa case not found');
    }
  }

  async findOne(id: string, agencyId?: string | null) {
    await this.assertAgencyOwns(id, agencyId);

    const visaCase = await this.prisma.visaCase.findUnique({
      where: { id },
      include: {
        client: true,
        creator: { select: { id: true, firstName: true, lastName: true } },
        submittedByAgency: { select: { id: true, name: true } },
        statusHistories: {
          orderBy: { changedAt: 'desc' },
          include: {
            changer: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        appointments: { orderBy: { appointmentDate: 'desc' } },
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
      title: 'Dossier de visa modifié',
      message: `Le dossier ${visaCase.caseNumber} a été modifié`,
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
    const reason = dto.reason?.trim() || null;

    // "Incomplete" with nothing said is useless to the desk and to the client
    // tracking page, so the rule lives here rather than only in the web form.
    if (newStatus === 'DOSSIER_INCOMPLET' && !reason) {
      throw new BadRequestException(
        'Un motif est requis pour marquer le dossier comme incomplet',
      );
    }

    if (oldStatus === newStatus) {
      // Re-selecting the same status is how the desk corrects a motif it got
      // wrong; only a genuine transition belongs in the history.
      if (newStatus === 'DOSSIER_INCOMPLET' && reason !== existing.incompleteReason) {
        return this.prisma.visaCase.update({
          where: { id },
          data: { incompleteReason: reason },
        });
      }
      return existing;
    }

    const [visaCase] = await this.prisma.$transaction([
      this.prisma.visaCase.update({
        where: { id },
        data: {
          currentStatus: newStatus,
          incompleteReason: newStatus === 'DOSSIER_INCOMPLET' ? reason : null,
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
    // The partner that filed this case is told about it; every other partner
    // is not, since the message names the client.
    const owningAgencyId = visaCaseWithClient?.submittedByAgencyId ?? null;

    const changer = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });
    const changerName = changer ? `${changer.firstName} ${changer.lastName}` : 'Unknown';

    const notificationMsg = `Dossier ${visaCase.caseNumber} (${visaCaseWithClient?.client.fullName}): statut modifié de ${oldStatus} à ${newStatus} par ${changerName}`;
    await this.notifications.broadcast({
      type: 'STATUS_CHANGE',
      title: 'Statut du dossier mis à jour',
      message: notificationMsg,
      link: `/visa-cases/${id}`,
    }, owningAgencyId);

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

    // Auto-send WhatsApp/email on key status changes
    if (AUTO_NOTIFY_STATUSES.includes(newStatus)) {
      await this.sendAutoNotifications(id, newStatus);
    }

    return visaCase;
  }

  private async sendAutoNotifications(visaCaseId: string, status: string) {
    this.logger.log(`Auto notification triggered for case ${visaCaseId}, status=${status}`);
    try {
      const visaCase = await this.prisma.visaCase.findUnique({
        where: { id: visaCaseId },
        include: { client: true },
      });
      if (!visaCase) { this.logger.warn('Visa case not found for auto notification'); return; }
      // Same variable set as a manual send, so an auto message can quote the
      // granted visa dates and sign with the agency too.
      const agency = await this.prisma.agencySettings.findFirst();
      this.logger.log(`Auto notification: case=${visaCase.caseNumber}, client=${visaCase.client.fullName}`);

      const context = { country: visaCase.visaCountry, visaType: visaCase.visaType };

      let waTemplate;
      try {
        waTemplate = await this.templates.findBestTemplate('WHATSAPP', context);
      } catch (e: any) {
        this.logger.error(`findBestTemplate WA error: code=${e.code} message=${e.message} meta=${JSON.stringify(e.meta || {})}`);
      }
      this.logger.log(`WA template: ${waTemplate ? waTemplate.name : 'none'}`);
      if (waTemplate) {
        const variables = this.templates.buildVariables(visaCase as never, null, agency);
        const body = this.templates.renderText(waTemplate.body, variables);
        const rawPhone = visaCase.client.whatsappNumber || visaCase.client.phoneNumber;
        if (rawPhone) {
          let digits = rawPhone.replace(/\D/g, '');
          if (digits.startsWith('00')) digits = digits.slice(2);
          const waUrl = `https://wa.me/${digits}?text=${encodeURIComponent(body)}`;
          this.logger.log(`Auto WhatsApp URL ready: ${waUrl.substring(0, 100)}`);
        }
      }

      let emailTemplate;
      try {
        emailTemplate = await this.templates.findBestTemplate('EMAIL', context);
      } catch (e) {
        this.logger.error(`findBestTemplate EMAIL error: ${String(e)}`);
      }
      this.logger.log(`Email template: ${emailTemplate ? emailTemplate.name : 'none'}`);
      if (emailTemplate && visaCase.client.email) {
        try {
          await this.messages.sendEmail({ templateId: emailTemplate.id, visaCaseId });
          this.logger.log(`Auto email sent to ${visaCase.client.email}`);
        } catch (err) {
          this.logger.warn(`Auto email failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } catch (err) {
      this.logger.error(`Auto notification error for ${visaCaseId}: ${String(err)} ${(err as Error).stack || ''}`);
    }
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
      title: 'Dossier de visa supprimé',
      message: `Le dossier ${existing.caseNumber} a été supprimé`,
      userId,
    });
  }

  private clientStatusTitle(status: string): string {
    const titles: Record<string, string> = {
      EN_ATTENTE: 'Dossier soumis',
      EN_TRAITEMENT: 'Dossier en cours',
      RDV_OK: 'Rendez-vous programmé',
      LIVREE: 'Dossier livré',
    };
    return titles[status] ?? 'Mise à jour de votre dossier';
  }

  private clientStatusMessage(status: string): string {
    const messages: Record<string, string> = {
      EN_ATTENTE: 'Votre demande a été soumise et est en attente de traitement.',
      EN_TRAITEMENT: 'Votre dossier est en cours d\'examen.',
      RDV_OK: 'Un rendez-vous a été programmé pour le dépôt de votre dossier.',
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
