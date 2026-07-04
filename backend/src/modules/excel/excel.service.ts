import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExcelService {
  private readonly logger = new Logger(ExcelService.name);

  constructor(private prisma: PrismaService) {}

  async exportClients() {
    const clients = await this.prisma.client.findMany({
      include: { _count: { select: { visaCases: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return this.buildWorkbook('Clients', [
      { header: 'ID', key: 'id' },
      { header: 'Nom complet', key: 'fullName' },
      { header: 'Téléphone', key: 'phoneNumber' },
      { header: 'WhatsApp', key: 'whatsappNumber' },
      { header: 'Email', key: 'email' },
      { header: 'Passeport', key: 'passportNumber' },
      { header: 'Nationalité', key: 'nationality' },
      { header: 'Dossiers', key: 'visaCasesCount' },
      { header: 'Date création', key: 'createdAt' },
    ], clients.map((c: { id: string; fullName: string; phoneNumber: string; whatsappNumber: string | null; email: string | null; passportNumber: string | null; nationality: string | null; _count: { visaCases: number }; createdAt: Date }) => ({
      id: c.id,
      fullName: c.fullName,
      phoneNumber: c.phoneNumber,
      whatsappNumber: c.whatsappNumber ?? '',
      email: c.email ?? '',
      passportNumber: c.passportNumber ?? '',
      nationality: c.nationality ?? '',
      visaCasesCount: c._count.visaCases,
      createdAt: c.createdAt.toISOString(),
    })));
  }

  async exportVisaCases() {
    const cases = await this.prisma.visaCase.findMany({
      include: {
        client: { select: { fullName: true, phoneNumber: true } },
        visaDetails: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return this.buildWorkbook('Dossiers', [
      { header: 'N° dossier', key: 'caseNumber' },
      { header: 'Client', key: 'clientName' },
      { header: 'Téléphone', key: 'phoneNumber' },
      { header: 'Pays', key: 'visaCountry' },
      { header: 'Type visa', key: 'visaType' },
      { header: 'Statut', key: 'currentStatus' },
      { header: 'Date ouverture', key: 'openingDate' },
      { header: 'N° visa', key: 'visaNumber' },
      { header: 'Valide du', key: 'validFrom' },
      { header: 'Valide jusqu\'au', key: 'validUntil' },
    ], cases.map((vc: { caseNumber: string; client: { fullName: string; phoneNumber: string }; visaCountry: string; visaType: string; currentStatus: string; openingDate: Date; visaDetails: { visaNumber: string | null; validFrom: Date; validUntil: Date } | null }) => ({
      caseNumber: vc.caseNumber,
      clientName: vc.client.fullName,
      phoneNumber: vc.client.phoneNumber,
      visaCountry: vc.visaCountry,
      visaType: vc.visaType,
      currentStatus: vc.currentStatus,
      openingDate: vc.openingDate.toISOString(),
      visaNumber: vc.visaDetails?.visaNumber ?? '',
      validFrom: vc.visaDetails?.validFrom?.toISOString() ?? '',
      validUntil: vc.visaDetails?.validUntil?.toISOString() ?? '',
    })));
  }

  async exportAppointments() {
    const appointments = await this.prisma.appointment.findMany({
      include: {
        visaCase: { select: { caseNumber: true, client: { select: { fullName: true } } } },
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { appointmentDate: 'desc' },
    });

    return this.buildWorkbook('Rendez-vous', [
      { header: 'N° dossier', key: 'caseNumber' },
      { header: 'Client', key: 'clientName' },
      { header: 'Date', key: 'appointmentDate' },
      { header: 'Heure', key: 'appointmentTime' },
      { header: 'Centre', key: 'appointmentCenter' },
      { header: 'Type', key: 'appointmentType' },
      { header: 'Créé par', key: 'createdBy' },
      { header: 'Notes', key: 'notes' },
    ], appointments.map((a: { visaCase: { caseNumber: string; client: { fullName: string } }; appointmentDate: Date; appointmentTime: string; appointmentCenter: string; appointmentType: string; user: { firstName: string; lastName: string }; notes: string | null }) => ({
      caseNumber: a.visaCase.caseNumber,
      clientName: a.visaCase.client.fullName,
      appointmentDate: a.appointmentDate.toISOString(),
      appointmentTime: a.appointmentTime,
      appointmentCenter: a.appointmentCenter,
      appointmentType: a.appointmentType,
      createdBy: `${a.user.firstName} ${a.user.lastName}`,
      notes: a.notes ?? '',
    })));
  }

  async exportApprovals() {
    const cases = await this.prisma.visaCase.findMany({
      where: { currentStatus: 'VISA_OK' },
      include: {
        client: { select: { fullName: true, passportNumber: true } },
        visaDetails: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return this.buildWorkbook('Visas approuvés', [
      { header: 'N° dossier', key: 'caseNumber' },
      { header: 'Client', key: 'clientName' },
      { header: 'Passeport', key: 'passportNumber' },
      { header: 'Pays', key: 'visaCountry' },
      { header: 'Type', key: 'visaType' },
      { header: 'N° visa', key: 'visaNumber' },
      { header: 'Valide du', key: 'validFrom' },
      { header: 'Valide jusqu\'au', key: 'validUntil' },
      { header: 'Durée (jours)', key: 'durationDays' },
      { header: 'Entrée', key: 'entryType' },
      { header: 'Date approbation', key: 'approvedAt' },
    ], cases.map((vc: { caseNumber: string; client: { fullName: string; passportNumber: string | null }; visaCountry: string; visaType: string; visaDetails: { visaNumber: string | null; validFrom: Date; validUntil: Date; durationDays: number; entryType: string } | null; updatedAt: Date }) => ({
      caseNumber: vc.caseNumber,
      clientName: vc.client.fullName,
      passportNumber: vc.client.passportNumber ?? '',
      visaCountry: vc.visaCountry,
      visaType: vc.visaType,
      visaNumber: vc.visaDetails?.visaNumber ?? '',
      validFrom: vc.visaDetails?.validFrom?.toISOString() ?? '',
      validUntil: vc.visaDetails?.validUntil?.toISOString() ?? '',
      durationDays: vc.visaDetails?.durationDays ?? 0,
      entryType: vc.visaDetails?.entryType ?? '',
      approvedAt: vc.updatedAt.toISOString(),
    })));
  }

  async exportRefusals() {
    const cases = await this.prisma.visaCase.findMany({
      where: { currentStatus: 'VISA_REFUSEE' },
      include: { client: { select: { fullName: true, passportNumber: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    return this.buildWorkbook('Visas refusés', [
      { header: 'N° dossier', key: 'caseNumber' },
      { header: 'Client', key: 'clientName' },
      { header: 'Passeport', key: 'passportNumber' },
      { header: 'Pays', key: 'visaCountry' },
      { header: 'Type', key: 'visaType' },
      { header: 'Date refus', key: 'refusedAt' },
      { header: 'Notes', key: 'notes' },
    ], cases.map((vc: { caseNumber: string; client: { fullName: string; passportNumber: string | null }; visaCountry: string; visaType: string; updatedAt: Date; notes: string | null }) => ({
      caseNumber: vc.caseNumber,
      clientName: vc.client.fullName,
      passportNumber: vc.client.passportNumber ?? '',
      visaCountry: vc.visaCountry,
      visaType: vc.visaType,
      refusedAt: vc.updatedAt.toISOString(),
      notes: vc.notes ?? '',
    })));
  }

  async buildWorkbook(
    sheetName: string,
    columns: Partial<ExcelJS.Column>[],
    rows: Record<string, unknown>[],
  ) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetName);

    sheet.columns = columns as ExcelJS.Column[];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1A73E8' },
    };

    rows.forEach((row) => sheet.addRow(row));

    sheet.columns.forEach((col: Partial<ExcelJS.Column>) => {
      if (col.eachCell) {
        let maxLength = (col.header?.toString().length ?? 0) + 2;
        col.eachCell?.((cell: ExcelJS.Cell) => {
          const val = cell.value?.toString().length ?? 0;
          if (val > maxLength) maxLength = val;
        });
        col.width = Math.min(Math.max(maxLength, 12), 40);
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
