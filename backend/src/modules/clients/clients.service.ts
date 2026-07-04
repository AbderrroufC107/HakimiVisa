import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-logs/audit-logs.service';
import { CreateClientDto, UpdateClientDto, QueryClientDto } from './dto';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async create(dto: CreateClientDto, userId: string) {
    const client = await this.prisma.client.create({
      data: {
        fullName: dto.fullName,
        phoneNumber: dto.phoneNumber,
        whatsappNumber: dto.whatsappNumber,
        email: dto.email,
        passportNumber: dto.passportNumber,
        nationality: dto.nationality,
        notes: dto.notes,
        createdBy: userId,
      },
    });

    await this.auditLog.log({
      action: 'CREATE',
      entity: 'Client',
      entityId: client.id,
      userId,
      metadata: { fullName: client.fullName },
    });

    return client;
  }

  async findAll(query: QueryClientDto) {
    const { search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { fullName: { contains: search } },
            { phoneNumber: { contains: search } },
            { passportNumber: { contains: search } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { visaCases: true } } },
      }),
      this.prisma.client.count({ where }),
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
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        visaCases: {
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { visaCases: true } },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async update(id: string, dto: UpdateClientDto, userId: string) {
    const existing = await this.prisma.client.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Client not found');
    }

    const client = await this.prisma.client.update({
      where: { id },
      data: dto,
    });

    await this.auditLog.log({
      action: 'UPDATE',
      entity: 'Client',
      entityId: client.id,
      userId,
      metadata: { fullName: client.fullName },
    });

    return client;
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.client.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Client not found');
    }

    await this.prisma.$transaction([
      this.prisma.client.delete({ where: { id } }),
      this.prisma.auditLog.create({
        data: {
          action: 'DELETE',
          entity: 'Client',
          entityId: id,
          userId,
          metadata: { fullName: existing.fullName },
        },
      }),
    ]);
  }

  async getProfile(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, firstName: true, lastName: true } },
        visaCases: {
          orderBy: { createdAt: 'desc' },
          include: {
            statusHistories: {
              orderBy: { changedAt: 'desc' },
              take: 1,
              include: { changer: { select: { id: true, firstName: true, lastName: true } } },
            },
            appointments: {
              orderBy: { appointmentDate: 'asc' },
              include: { user: { select: { id: true, firstName: true, lastName: true } } },
            },
            visaDetails: true,
          },
        },
        _count: { select: { visaCases: true, internalNotes: true } },
      },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async getTimeline(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      select: { id: true, createdAt: true, createdBy: true, fullName: true },
    });
    if (!client) throw new NotFoundException('Client not found');

    const statusHistories = await this.prisma.statusHistory.findMany({
      where: { visaCase: { clientId: id } },
      orderBy: { changedAt: 'desc' },
      include: {
        changer: { select: { id: true, firstName: true, lastName: true } },
        visaCase: { select: { caseNumber: true } },
      },
    });

    const appointments = await this.prisma.appointment.findMany({
      where: { visaCase: { clientId: id } },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        visaCase: { select: { caseNumber: true } },
      },
    });

    const visaCaseIds = (await this.prisma.visaCase.findMany({
      where: { clientId: id },
      select: { id: true },
    })).map((v: { id: string }) => v.id);

    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        OR: [
          { entity: 'Client', entityId: id },
          ...(visaCaseIds.length > 0
            ? [{ entity: 'VisaCase' as const, entityId: { in: visaCaseIds } }]
            : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });

    const timeline: Array<{
      id: string;
      type: string;
      label: string;
      description: string;
      userId: string;
      user: { id: string; firstName: string; lastName: string } | null;
      timestamp: string;
      metadata?: Record<string, unknown>;
    }> = [];

    timeline.push({
      id: `client-created-${client.id}`,
      type: 'CLIENT_CREATED',
      label: 'Client Created',
      description: `${client.fullName} was registered in the system`,
      userId: client.createdBy,
      user: null,
      timestamp: client.createdAt.toISOString(),
    });

    for (const sh of statusHistories) {
      timeline.push({
        id: `status-${sh.id}`,
        type: 'STATUS_CHANGE',
        label: 'Status Changed',
        description: `Case ${sh.visaCase.caseNumber}: ${sh.oldStatus.replace(/_/g, ' ')} → ${sh.newStatus.replace(/_/g, ' ')}`,
        userId: sh.changedBy,
        user: sh.changer,
        timestamp: sh.changedAt.toISOString(),
      });
    }

    for (const apt of appointments) {
      timeline.push({
        id: `appointment-${apt.id}`,
        type: 'APPOINTMENT_ADDED',
        label: 'Appointment Added',
        description: `${apt.appointmentType} at ${apt.appointmentCenter} on ${apt.appointmentDate.toLocaleDateString()} for case ${apt.visaCase.caseNumber}`,
        userId: apt.userId,
        user: apt.user,
        timestamp: apt.createdAt.toISOString(),
      });
    }

    for (const log of auditLogs) {
      timeline.push({
        id: `audit-${log.id}`,
        type: log.action === 'CREATE' ? 'ENTITY_CREATED' : log.action === 'UPDATE' ? 'ENTITY_UPDATED' : 'ENTITY_DELETED',
        label: `${log.action} ${log.entity}`,
        description: log.metadata ? JSON.stringify(log.metadata) : `${log.entity} ${log.action.toLowerCase()}d`,
        userId: log.userId,
        user: log.user,
        timestamp: log.createdAt.toISOString(),
        metadata: log.metadata as Record<string, unknown> | undefined,
      });
    }

    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return timeline;
  }

  async getStats(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id }, select: { id: true } });
    if (!client) throw new NotFoundException('Client not found');

    const [totalApplications, approved, refused, pending, appointments, completedCases] = await Promise.all([
      this.prisma.visaCase.count({ where: { clientId: id } }),
      this.prisma.visaCase.count({ where: { clientId: id, currentStatus: 'VISA_OK' } }),
      this.prisma.visaCase.count({ where: { clientId: id, currentStatus: 'VISA_REFUSEE' } }),
      this.prisma.visaCase.count({ where: { clientId: id, currentStatus: { in: ['EN_ATTENTE', 'EN_TRAITEMENT'] } } }),
      this.prisma.appointment.findMany({
        where: { visaCase: { clientId: id } },
        orderBy: { appointmentDate: 'asc' },
        select: { appointmentDate: true, appointmentTime: true, appointmentCenter: true, appointmentType: true, id: true, visaCase: { select: { caseNumber: true } } },
      }),
      this.prisma.visaCase.findMany({
        where: { clientId: id, currentStatus: { in: ['VISA_OK', 'VISA_REFUSEE'] } },
        select: { id: true, openingDate: true, createdAt: true },
      }),
    ]);

    const totalCompleted = approved + refused;
    const approvalRate = totalCompleted > 0 ? Math.round((approved / totalCompleted) * 100) : 0;
    const refusalRate = totalCompleted > 0 ? Math.round((refused / totalCompleted) * 100) : 0;

    const countries = await this.prisma.visaCase.groupBy({
      by: ['visaCountry'],
      where: { clientId: id },
      _count: { id: true },
    });

    const caseIds = completedCases.map((vc: { id: string }) => vc.id);
    const statusHistories = await this.prisma.statusHistory.findMany({
      where: { visaCaseId: { in: caseIds }, newStatus: { in: ['VISA_OK', 'VISA_REFUSEE'] } },
      orderBy: { changedAt: 'desc' },
      select: { visaCaseId: true, changedAt: true },
    });
    const historyByCase = new Map<string, Date>();
    for (const sh of statusHistories) {
      if (!historyByCase.has(sh.visaCaseId)) {
        historyByCase.set(sh.visaCaseId, sh.changedAt);
      }
    }
    const processingTimes: number[] = completedCases
      .map((vc: { id: string; openingDate: Date | null; createdAt: Date }) => {
        const end = historyByCase.get(vc.id);
        if (!end) return null;
        const start = vc.openingDate || vc.createdAt;
        return Math.round((end.getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
      })
      .filter((d: number | null): d is number => d !== null);
    const avgProcessingTime = processingTimes.length > 0
      ? Math.round(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length)
      : 0;

    const now = new Date();
    const upcomingAppointments = appointments.filter((a: { appointmentDate: string | Date; appointmentTime: string }) => {
      const dt = new Date(`${String(a.appointmentDate).split('T')[0]}T${a.appointmentTime}`);
      return dt > now;
    });
    const pastAppointments = appointments.filter((a: { appointmentDate: string | Date; appointmentTime: string }) => {
      const dt = new Date(`${String(a.appointmentDate).split('T')[0]}T${a.appointmentTime}`);
      return dt <= now;
    });

    return {
      totalApplications,
      approved,
      refused,
      pending,
      approvalRate,
      refusalRate,
      totalCountries: countries.length,
      countries: countries.map((c: { visaCountry: string; _count: { id: number } }) => ({ country: c.visaCountry, count: c._count.id })),
      avgProcessingTime,
      upcomingAppointments,
      pastAppointments,
    };
  }

  async getDocuments(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id }, select: { id: true } });
    if (!client) throw new NotFoundException('Client not found');

    const documents = await this.prisma.document.findMany({
      where: { visaCase: { clientId: id } },
      orderBy: { uploadedAt: 'desc' },
      include: {
        visaCase: { select: { caseNumber: true, visaCountry: true, visaType: true } },
      },
    });

    return documents;
  }

  async getDashboardStats() {
    const [
      totalClients,
      totalCases,
      enAttente,
      enTraitement,
      rdvOk,
      visaOk,
      refuse,
    ] = await Promise.all([
      this.prisma.client.count(),
      this.prisma.visaCase.count(),
      this.prisma.visaCase.count({ where: { currentStatus: 'EN_ATTENTE' } }),
      this.prisma.visaCase.count({ where: { currentStatus: 'EN_TRAITEMENT' } }),
      this.prisma.visaCase.count({ where: { currentStatus: 'RDV_OK' } }),
      this.prisma.visaCase.count({ where: { currentStatus: 'VISA_OK' } }),
      this.prisma.visaCase.count({ where: { currentStatus: 'VISA_REFUSEE' } }),
    ]);

    return {
      totalClients,
      totalCases,
      enAttente,
      enTraitement,
      rdvOk,
      visaOk,
      refuse,
    };
  }

  async getAnalytics() {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const cases = await this.prisma.visaCase.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: {
        createdAt: true,
        visaCountry: true,
        currentStatus: true,
      },
    });

    const months: Record<string, number> = {};
    const approvalsByMonth: Record<string, number> = {};
    const refusalsByMonth: Record<string, number> = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = 0;
      approvalsByMonth[key] = 0;
      refusalsByMonth[key] = 0;
    }

    for (const c of cases) {
      const d = new Date(c.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (months[key] !== undefined) {
        months[key]++;
        if (c.currentStatus === 'VISA_OK') approvalsByMonth[key]++;
        if (c.currentStatus === 'VISA_REFUSEE') refusalsByMonth[key]++;
      }
    }

    const applicationsPerMonth = Object.entries(months).map(([month, count]) => ({
      month,
      applications: count,
      approved: approvalsByMonth[month] ?? 0,
      refused: refusalsByMonth[month] ?? 0,
    }));

    const countries = await this.prisma.visaCase.groupBy({
      by: ['visaCountry'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const statusGroup = await this.prisma.visaCase.groupBy({
      by: ['currentStatus'],
      _count: { id: true },
    });
    const statusCountMap = new Map<string, number>(statusGroup.map((s: { currentStatus: string; _count: { id: number } }) => [s.currentStatus, s._count.id]));
    const statusDistribution = (['EN_ATTENTE', 'EN_TRAITEMENT', 'RDV_OK', 'VISA_OK', 'VISA_REFUSEE'] as const).map(
      (status) => ({ status, count: statusCountMap.get(status) ?? 0 }),
    );

    const totalProcessed =
      statusDistribution.find((s) => s.status === 'VISA_OK')?.count ?? 0;
    const totalRefused =
      statusDistribution.find((s) => s.status === 'VISA_REFUSEE')?.count ?? 0;
    const totalCompleted = totalProcessed + totalRefused;
    const approvalRate = totalCompleted > 0
      ? Math.round((totalProcessed / totalCompleted) * 100)
      : 0;

    return {
      applicationsPerMonth,
      topCountries: countries.map((c: { visaCountry: string; _count: { id: number } }) => ({
        country: c.visaCountry,
        count: c._count.id,
      })),
      statusDistribution,
      approvalRate,
    };
  }
}
