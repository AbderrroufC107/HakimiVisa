import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AppGateway } from '../gateway/app.gateway';
import { PdfService } from '../pdf/pdf.service';
import { ExcelService } from '../excel/excel.service';
import { BulkStatusChangeDto, BulkAppointmentDto, BulkIdsDto } from './dto';
import { Response } from 'express';


export interface BulkResultItem {
  id: string;
  caseNumber?: string;
  success: boolean;
  error?: string;
}

export interface BulkResult {
  total: number;
  successful: number;
  failed: number;
  items: BulkResultItem[];
}

@Injectable()
export class BulkService {
  private readonly logger = new Logger(BulkService.name);
  private readonly BATCH_SIZE = 50;

  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
    private notifications: NotificationsService,
    private gateway: AppGateway,
    private pdfService: PdfService,
    private excelService: ExcelService,
  ) {}

  async statusChange(dto: BulkStatusChangeDto, userId: string): Promise<BulkResult> {
    const cases = await this.prisma.visaCase.findMany({
      where: { id: { in: dto.ids } },
      select: { id: true, caseNumber: true, currentStatus: true, clientId: true },
    });

    if (cases.length === 0) {
      throw new BadRequestException('No valid visa cases found');
    }

    const clientIds = [...new Set(cases.map((vc: { clientId: string }) => vc.clientId))] as string[];
    const clients = await this.prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, fullName: true },
    });
    const clientMap = new Map(clients.map((c: { id: string; fullName: string }) => [c.id, c.fullName]));

    const result: BulkResult = { total: cases.length, successful: 0, failed: 0, items: [] };

    for (let i = 0; i < cases.length; i += this.BATCH_SIZE) {
      const batch = cases.slice(i, i + this.BATCH_SIZE);

      const promises = batch.map(async (vc: { id: string; caseNumber: string; currentStatus: string; clientId: string }) => {
        try {
          if (vc.currentStatus === dto.status) {
            result.items.push({ id: vc.id, caseNumber: vc.caseNumber, success: true });
            result.successful++;
            return;
          }

          await this.prisma.$transaction([
            this.prisma.visaCase.update({
              where: { id: vc.id },
              data: { currentStatus: dto.status },
            }),
            this.prisma.statusHistory.create({
              data: {
                visaCaseId: vc.id,
                oldStatus: vc.currentStatus as any,
                newStatus: dto.status,
                changedBy: userId,
              },
            }),
          ]);

          await this.auditLog.log({
            action: 'STATUS_CHANGE',
            entity: 'VisaCase',
            entityId: vc.id,
            userId,
            metadata: { caseNumber: vc.caseNumber, from: vc.currentStatus, to: dto.status, bulk: true },
          });

          const clientName = clientMap.get(vc.clientId) ?? 'Unknown';

          await this.notifications.create({
            type: 'STATUS_CHANGE',
            title: 'Visa Case Status Updated',
            message: `Case ${vc.caseNumber} (${clientName}): status changed from ${vc.currentStatus} to ${dto.status}`,
            userId,
            link: `/visa-cases/${vc.id}`,
          });

          result.items.push({ id: vc.id, caseNumber: vc.caseNumber, success: true });
          result.successful++;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          result.items.push({ id: vc.id, caseNumber: vc.caseNumber, success: false, error: message });
          result.failed++;
        }
      });

      await Promise.allSettled(promises);
    }

    await this.gateway.broadcast('bulk:statusChangeComplete', {
      count: result.successful,
      status: dto.status,
    });

    return result;
  }

  async createAppointments(dto: BulkAppointmentDto, userId: string): Promise<BulkResult> {
    const cases = await this.prisma.visaCase.findMany({
      where: { id: { in: dto.ids } },
      select: { id: true, caseNumber: true },
    });

    if (cases.length === 0) {
      throw new BadRequestException('No valid visa cases found');
    }

    const result: BulkResult = { total: cases.length, successful: 0, failed: 0, items: [] };

    for (let i = 0; i < cases.length; i += this.BATCH_SIZE) {
      const batch = cases.slice(i, i + this.BATCH_SIZE);

      const promises = batch.map(async (vc: { id: string; caseNumber: string }) => {
        try {
          const appointment = await this.prisma.appointment.create({
            data: {
              visaCaseId: vc.id,
              appointmentDate: new Date(dto.appointmentDate),
              appointmentTime: dto.appointmentTime,
              appointmentCenter: dto.appointmentCenter,
              appointmentType: dto.appointmentType as any,
              notes: dto.notes,
              userId,
            },
          });

          await this.auditLog.log({
            action: 'CREATE',
            entity: 'Appointment',
            entityId: appointment.id,
            userId,
            metadata: { visaCaseId: vc.id, bulk: true },
          });

          await this.gateway.broadcast('appointment:created', appointment);

          result.items.push({ id: vc.id, caseNumber: vc.caseNumber, success: true });
          result.successful++;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          result.items.push({ id: vc.id, caseNumber: vc.caseNumber, success: false, error: message });
          result.failed++;
        }
      });

      await Promise.allSettled(promises);
    }

    return result;
  }

  async exportPdf(dto: BulkIdsDto, res: Response) {
    const cases = await this.prisma.visaCase.findMany({
      where: { id: { in: dto.ids } },
      select: { id: true, caseNumber: true },
    });

    if (cases.length === 0) {
      throw new BadRequestException('No valid visa cases found');
    }

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="bordereaux-${Date.now()}.zip"`,
    });

    const archiverMod = await import('archiver');
    const archive = (archiverMod.default || archiverMod)('zip', { zlib: { level: 5 } });
    archive.pipe(res);

    for (const vc of cases) {
      try {
        const pdfBuffer = await this.pdfService.generateBordereauBuffer(vc.id);
        archive.append(pdfBuffer, { name: `bordereau-${vc.caseNumber}.pdf` });
      } catch {
        this.logger.warn(`Failed to generate PDF for case ${vc.caseNumber}`);
      }
    }

    await archive.finalize();
  }

  async exportExcel(dto: BulkIdsDto): Promise<Buffer> {
    const cases = await this.prisma.visaCase.findMany({
      where: { id: { in: dto.ids } },
      include: { client: true },
      orderBy: { createdAt: 'desc' },
    });

    if (cases.length === 0) {
      throw new BadRequestException('No valid visa cases found');
    }

    const rows = cases.map((vc: { caseNumber: string; client: { fullName: string; phoneNumber: string; passportNumber: string | null; nationality: string | null }; visaCountry: string; visaType: string; currentStatus: string; openingDate: Date; createdAt: Date }) => ({
      caseNumber: vc.caseNumber,
      clientName: vc.client.fullName,
      phoneNumber: vc.client.phoneNumber,
      passportNumber: vc.client.passportNumber ?? '',
      nationality: vc.client.nationality ?? '',
      visaCountry: vc.visaCountry,
      visaType: vc.visaType,
      currentStatus: vc.currentStatus,
      openingDate: vc.openingDate.toISOString().split('T')[0],
      createdAt: vc.createdAt.toISOString().split('T')[0],
    }));

    const columns = [
      { header: 'Case Number', key: 'caseNumber' },
      { header: 'Client Name', key: 'clientName' },
      { header: 'Phone', key: 'phoneNumber' },
      { header: 'Passport', key: 'passportNumber' },
      { header: 'Nationality', key: 'nationality' },
      { header: 'Visa Country', key: 'visaCountry' },
      { header: 'Visa Type', key: 'visaType' },
      { header: 'Status', key: 'currentStatus' },
      { header: 'Opening Date', key: 'openingDate' },
      { header: 'Created', key: 'createdAt' },
    ];

    return this.excelService.buildWorkbook('Visa Cases', columns, rows);
  }

  async archive(dto: BulkIdsDto, userId: string): Promise<BulkResult> {
    return this.toggleArchive(dto.ids, true, userId);
  }

  async restore(dto: BulkIdsDto, userId: string): Promise<BulkResult> {
    return this.toggleArchive(dto.ids, false, userId);
  }

  private async toggleArchive(ids: string[], archived: boolean, userId: string): Promise<BulkResult> {
    const cases = await this.prisma.visaCase.findMany({
      where: { id: { in: ids } },
      select: { id: true, caseNumber: true },
    });

    if (cases.length === 0) {
      throw new BadRequestException('No valid visa cases found');
    }

    const result: BulkResult = { total: cases.length, successful: 0, failed: 0, items: [] };

    for (let i = 0; i < cases.length; i += this.BATCH_SIZE) {
      const batch = cases.slice(i, i + this.BATCH_SIZE);

      const promises = batch.map(async (vc: { id: string; caseNumber: string }) => {
        try {
          await this.prisma.visaCase.update({
            where: { id: vc.id },
            data: { archived },
          });

          await this.auditLog.log({
            action: 'UPDATE',
            entity: 'VisaCase',
            entityId: vc.id,
            userId,
            metadata: { caseNumber: vc.caseNumber, archived, bulk: true },
          });

          result.items.push({ id: vc.id, caseNumber: vc.caseNumber, success: true });
          result.successful++;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          result.items.push({ id: vc.id, caseNumber: vc.caseNumber, success: false, error: message });
          result.failed++;
        }
      });

      await Promise.allSettled(promises);
    }

    const action = archived ? 'archive' : 'restore';
    await this.gateway.broadcast(`bulk:${action}Complete`, {
      count: result.successful,
    });

    return result;
  }

  async delete(dto: BulkIdsDto, userId: string): Promise<BulkResult> {
    const cases = await this.prisma.visaCase.findMany({
      where: { id: { in: dto.ids } },
      select: { id: true, caseNumber: true },
    });

    if (cases.length === 0) {
      throw new BadRequestException('No valid visa cases found');
    }

    const result: BulkResult = { total: cases.length, successful: 0, failed: 0, items: [] };

    for (let i = 0; i < cases.length; i += this.BATCH_SIZE) {
      const batch = cases.slice(i, i + this.BATCH_SIZE);

      const promises = batch.map(async (vc: { id: string; caseNumber: string }) => {
        try {
          await this.prisma.visaCase.delete({ where: { id: vc.id } });

          await this.auditLog.log({
            action: 'DELETE',
            entity: 'VisaCase',
            entityId: vc.id,
            userId,
            metadata: { caseNumber: vc.caseNumber, bulk: true },
          });

          result.items.push({ id: vc.id, caseNumber: vc.caseNumber, success: true });
          result.successful++;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          result.items.push({ id: vc.id, caseNumber: vc.caseNumber, success: false, error: message });
          result.failed++;
        }
      });

      await Promise.allSettled(promises);
    }

    await this.gateway.broadcast('bulk:deleteComplete', { count: result.successful });

    return result;
  }
}
