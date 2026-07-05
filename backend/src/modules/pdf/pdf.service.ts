import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import { Response } from 'express';
import { PassThrough } from 'stream';
import { join } from 'path';
import { readFileSync } from 'fs';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private logoBuffer: Buffer | null = null;
  private qrCache = new Map<string, Buffer>();
  private pdfCache = new Map<string, { buffer: Buffer; timestamp: number }>();
  private readonly PDF_CACHE_TTL = 5 * 60 * 1000;

  constructor(private prisma: PrismaService) {
    try {
      const logoPath = join(process.cwd(), 'src', 'common', 'assets', 'logo.png');
      this.logoBuffer = readFileSync(logoPath);
      this.logger.log('Logo cached in memory');
    } catch {
      this.logger.warn('Logo not found, using text fallback');
    }
  }

  async generateBordereau(visaCaseId: string, res: Response) {
    const cached = this.pdfCache.get(visaCaseId);
    if (cached && Date.now() - cached.timestamp < this.PDF_CACHE_TTL) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="bordereau.pdf"`);
      res.setHeader('X-Cache', 'HIT');
      res.end(cached.buffer);
      return;
    }

    const buffer = await this.generateBordereauBuffer(visaCaseId);

    this.pdfCache.set(visaCaseId, { buffer, timestamp: Date.now() });
    if (this.pdfCache.size > 100) {
      const oldest = this.pdfCache.keys().next().value!;
      this.pdfCache.delete(oldest);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="bordereau.pdf"`);
    res.setHeader('X-Cache', 'MISS');
    res.end(buffer);
  }

  async generateBordereauBuffer(visaCaseId: string): Promise<Buffer> {
    return new Promise<Buffer>(async (resolve, reject) => {
      try {
        const visaCase = await this.prisma.visaCase.findUnique({
          where: { id: visaCaseId },
          include: {
            client: true,
            creator: { select: { id: true, firstName: true, lastName: true } },
            appointments: { orderBy: { appointmentDate: 'asc' }, take: 1 },
            visaDetails: true,
          },
        });

        if (!visaCase) throw new NotFoundException('Visa case not found');

        const appUrl = process.env.APP_URL || 'http://localhost:5173';
        const qrData = `${appUrl}/tracking?case=${visaCase.caseNumber}`;
        const qrBuffer = await QRCode.toBuffer(qrData, { width: 70, margin: 1 });

        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
          info: { Title: `Bordereau - ${visaCase.caseNumber}`, Author: 'HakimiVisa' },
          bufferPages: false,
          autoFirstPage: false,
        });

        const chunks: Buffer[] = [];
        const passthrough = new PassThrough();
        passthrough.on('data', (chunk: Buffer) => chunks.push(chunk));
        passthrough.on('end', () => resolve(Buffer.concat(chunks)));
        passthrough.on('error', reject);

        doc.pipe(passthrough);

        doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });

        this.drawHeader(doc, visaCase.caseNumber);
        this.drawClientInfo(doc, visaCase.client);
        this.drawVisaInfo(doc, visaCase);
        if (visaCase.appointments.length > 0) {
          this.drawAppointmentInfo(doc, visaCase.appointments[0]);
        }
        if (visaCase.visaDetails) {
          this.drawVisaDetails(doc, visaCase.visaDetails);
        }
        this.drawQRCode(doc, qrBuffer);
        this.drawFooter(doc);

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  private drawHeader(doc: PDFKit.PDFDocument, caseNumber: string) {
    const cx = 35;
    const w = 525;
    let y = 20;

    if (this.logoBuffer) {
      doc.image(this.logoBuffer, cx + (w - 120) / 2, y, { width: 120, height: 120 });
      y += 130;
    } else {
      doc.fontSize(22).font('Helvetica-Bold').fillColor('#000');
      doc.text('HAKIMI VISA', cx, y, { align: 'center', width: w });
      y += 26;
    }

    doc.fillColor('#000');
    doc.moveTo(cx, y).lineTo(cx + w, y).strokeColor('#ccc').stroke();
    y += 8;

    doc.fontSize(14).font('Helvetica-Bold');
    doc.text('BORDEREAU DE DOSSIER', cx, y, { align: 'center', width: w });
    y += 20;

    doc.fontSize(10).font('Helvetica');
    doc.text(`N° ${caseNumber}`, cx, y, { align: 'center', width: w });
    y += 16;

    doc.moveTo(cx, y).lineTo(cx + w, y).strokeColor('#ddd').stroke();
    y += 10;

    doc.y = y;
  }

  private drawClientInfo(doc: PDFKit.PDFDocument, client: {
    fullName: string; phoneNumber: string; passportNumber: string | null; nationality: string | null;
  }) {
    const lx = 40;
    const vx = 170;
    let y = doc.y;

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000');
    doc.text('Informations du Client', lx, y, { underline: true });
    y += 18;

    const rows: [string, string][] = [
      ['Nom Complet', client.fullName],
      ['Téléphone', client.phoneNumber],
      ['Passeport', client.passportNumber || '-'],
      ['Nationalité', client.nationality || '-'],
    ];

    for (const [label, value] of rows) {
      doc.fontSize(9).font('Helvetica-Bold').text(label, lx, y, { width: 120 });
      doc.font('Helvetica').text(value ?? '-', vx, y, { width: 300 });
      y += 14;
    }

    y += 4;
    doc.moveTo(35, y).lineTo(560, y).strokeColor('#eee').stroke();
    y += 8;

    doc.y = y;
  }

  private drawVisaInfo(doc: PDFKit.PDFDocument, visaCase: {
    visaCountry: string; visaType: string; openingDate: Date; currentStatus: string; caseNumber: string;
  }) {
    const lx = 40;
    const vx = 170;
    let y = doc.y;

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000');
    doc.text('Informations du Visa', lx, y, { underline: true });
    y += 18;

    const rows: [string, string][] = [
      ['Pays', visaCase.visaCountry],
      ['Type de Visa', visaCase.visaType],
      ['Date d\'Ouverture', visaCase.openingDate.toLocaleDateString('fr-FR')],
      ['Statut Actuel', this.statusLabel(visaCase.currentStatus)],
    ];

    for (const [label, value] of rows) {
      doc.fontSize(9).font('Helvetica-Bold').text(label, lx, y, { width: 120 });
      doc.font('Helvetica').text(value ?? '-', vx, y, { width: 300 });
      y += 14;
    }

    y += 4;
    doc.moveTo(35, y).lineTo(560, y).strokeColor('#eee').stroke();
    y += 8;

    doc.y = y;
  }

  private drawAppointmentInfo(doc: PDFKit.PDFDocument, appointment: {
    appointmentDate: Date; appointmentTime: string; appointmentCenter: string; appointmentType: string;
  }) {
    const lx = 40;
    const vx = 170;
    let y = doc.y;

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000');
    doc.text('Rendez-vous', lx, y, { underline: true });
    y += 18;

    const rows: [string, string][] = [
      ['Date', appointment.appointmentDate.toLocaleDateString('fr-FR')],
      ['Heure', appointment.appointmentTime],
      ['Centre', appointment.appointmentCenter],
      ['Type', appointment.appointmentType],
    ];

    for (const [label, value] of rows) {
      doc.fontSize(9).font('Helvetica-Bold').text(label, lx, y, { width: 120 });
      doc.font('Helvetica').text(value ?? '-', vx, y, { width: 300 });
      y += 14;
    }

    y += 4;
    doc.moveTo(35, y).lineTo(560, y).strokeColor('#eee').stroke();
    y += 8;

    doc.y = y;
  }

  private drawVisaDetails(doc: PDFKit.PDFDocument, details: {
    validFrom: Date; validUntil: Date; durationDays: number; entryType: string; visaNumber: string | null; notes: string | null;
  }) {
    const lx = 40;
    const vx = 170;
    let y = doc.y;

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000');
    doc.text('Détails du Visa (Approuvé)', lx, y, { underline: true });
    y += 18;

    const rows: [string, string][] = [
      ['Valide du', details.validFrom.toLocaleDateString('fr-FR')],
      ['Valide jusqu\'au', details.validUntil.toLocaleDateString('fr-FR')],
      ['Durée (Jours)', String(details.durationDays)],
      ['Type d\'Entrée', details.entryType === 'MULTIPLE' ? 'Entrées Multiples' : 'Entrée Unique'],
      ['Numéro de Visa', details.visaNumber || '-'],
    ];

    for (const [label, value] of rows) {
      doc.fontSize(9).font('Helvetica-Bold').text(label, lx, y, { width: 120 });
      doc.font('Helvetica').text(value ?? '-', vx, y, { width: 300 });
      y += 14;
    }

    if (details.notes) {
      y += 4;
      doc.fontSize(9).font('Helvetica-Bold').text('Notes:', lx, y, { width: 120 });
      doc.font('Helvetica').text(details.notes, vx, y, { width: 300 });
      y += 14;
    }

    doc.y = y;
  }

  private drawQRCode(doc: PDFKit.PDFDocument, qrBuffer: Buffer) {
    const qrSize = 65;
    const x = 470;
    const y = 700;

    doc.image(qrBuffer, x, y, { width: qrSize, height: qrSize });
    doc.fontSize(7).fillColor('#666').text('Scannez pour', x, y + qrSize + 3, { width: qrSize, align: 'center' });
    doc.text('suivre votre dossier', x, y + qrSize + 12, { width: qrSize, align: 'center' });
    doc.fillColor('#000');
  }

  private drawFooter(doc: PDFKit.PDFDocument) {
    const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

    doc.fontSize(7).fillColor('#999').text(
      `Généré le ${dateStr} par HakimiVisa | Document automatique - pas de signature requise`,
      35,
      810,
      { align: 'center', width: 525 },
    );
    doc.fillColor('#000');
  }

  private statusLabel(status: string): string {
    const labels: Record<string, string> = {
      EN_ATTENTE: 'En Attente',
      EN_TRAITEMENT: 'En Traitement',
      RDV_OK: 'RDV OK',
      VISA_OK: 'VISA OK',
      VISA_REFUSEE: 'VISA Refusée',
    };
    return labels[status] || status;
  }
}
