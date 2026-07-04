import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AppGateway } from '../gateway/app.gateway';
import { CreateAppointmentDto, UpdateAppointmentDto, QueryAppointmentDto } from './dto';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
    private notifications: NotificationsService,
    private gateway: AppGateway,
  ) {}

  async create(dto: CreateAppointmentDto, userId: string) {
    const visaCase = await this.prisma.visaCase.findUnique({
      where: { id: dto.visaCaseId },
    });
    if (!visaCase) throw new NotFoundException('Visa case not found');

    const appointment = await this.prisma.appointment.create({
      data: {
        visaCaseId: dto.visaCaseId,
        appointmentDate: new Date(dto.appointmentDate),
        appointmentTime: dto.appointmentTime,
        appointmentCenter: dto.appointmentCenter,
        appointmentType: dto.appointmentType,
        notes: dto.notes,
        userId,
      },
      include: {
        visaCase: {
          select: { caseNumber: true, client: { select: { fullName: true } } },
        },
      },
    });

    await this.auditLog.log({
      action: 'CREATE',
      entity: 'Appointment',
      entityId: appointment.id,
      userId,
      metadata: {
        visaCaseId: dto.visaCaseId,
        appointmentType: dto.appointmentType,
        appointmentDate: dto.appointmentDate,
      },
    });

    await this.gateway.broadcast('appointment:created', appointment);

    const clientName = appointment.visaCase.client.fullName;
    await this.notifications.create({
      type: 'APPOINTMENT_REMINDER',
      title: 'New Appointment Created',
      message: `Appointment scheduled for ${clientName} on ${dto.appointmentDate}`,
      userId,
      link: `/appointments/${appointment.id}`,
    });

    return appointment;
  }

  async findAll(query: QueryAppointmentDto) {
    const { visaCaseId, dateFrom, dateTo, appointmentType, search } = query;
    const where: Record<string, unknown> = {};

    if (visaCaseId) where.visaCaseId = visaCaseId;
    if (appointmentType) where.appointmentType = appointmentType;
    if (dateFrom || dateTo) {
      const appointmentDate: Record<string, Date> = {};
      if (dateFrom) appointmentDate.gte = new Date(dateFrom);
      if (dateTo) appointmentDate.lte = new Date(dateTo);
      where.appointmentDate = appointmentDate;
    }
    if (search) {
      where.OR = [
        { appointmentCenter: { contains: search } },
        { visaCase: { caseNumber: { contains: search } } },
        { visaCase: { client: { fullName: { contains: search } } } },
      ];
    }

    const data = await this.prisma.appointment.findMany({
      where,
      orderBy: { appointmentDate: 'asc' },
      include: {
        visaCase: {
          select: {
            id: true,
            caseNumber: true,
            visaCountry: true,
            visaType: true,
            currentStatus: true,
            client: { select: { id: true, fullName: true, phoneNumber: true } },
          },
        },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return data;
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        visaCase: {
          select: {
            id: true,
            caseNumber: true,
            visaCountry: true,
            visaType: true,
            currentStatus: true,
            client: { select: { id: true, fullName: true, phoneNumber: true, email: true, passportNumber: true, nationality: true } },
          },
        },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto, userId: string) {
    const existing = await this.prisma.appointment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Appointment not found');

    const data: Record<string, unknown> = { ...dto };
    if (dto.appointmentDate) data.appointmentDate = new Date(dto.appointmentDate);

    const appointment = await this.prisma.appointment.update({
      where: { id },
      data,
      include: {
        visaCase: { select: { caseNumber: true } },
      },
    });

    await this.auditLog.log({
      action: 'UPDATE',
      entity: 'Appointment',
      entityId: id,
      userId,
      metadata: { visaCaseId: existing.visaCaseId },
    });

    await this.gateway.broadcast('appointment:updated', appointment);

    await this.notifications.create({
      type: 'INFO',
      title: 'Appointment Updated',
      message: `Appointment for case ${appointment.visaCase.caseNumber} was updated`,
      userId,
      link: `/appointments/${id}`,
    });

    return appointment;
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        visaCase: { select: { caseNumber: true, client: { select: { fullName: true } } } },
      },
    });
    if (!existing) throw new NotFoundException('Appointment not found');

    await this.prisma.$transaction([
      this.prisma.appointment.delete({ where: { id } }),
      this.prisma.auditLog.create({
        data: {
          action: 'DELETE',
          entity: 'Appointment',
          entityId: id,
          userId,
          metadata: { visaCaseId: existing.visaCaseId },
        },
      }),
    ]);

    await this.gateway.broadcast('appointment:deleted', { id, visaCaseId: existing.visaCaseId });

    const clientName = existing.visaCase.client.fullName;
    await this.notifications.create({
      type: 'WARNING',
      title: 'Appointment Cancelled',
      message: `Appointment for ${clientName} (case ${existing.visaCase.caseNumber}) was cancelled`,
      userId,
    });
  }
}
