import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import { Response } from 'express';
import { PassThrough } from 'stream';
import { join } from 'path';
import { readFileSync } from 'fs';

/**
 * The bordereau prints on a 15 x 10 cm receipt, so every measurement below is
 * in PostScript points at 72 dpi (1 cm = 28.3465 pt). Type is sized for that
 * sheet rather than scaled down from A4 — on a card this small, the numbers a
 * client actually reads have to stay legible at arm's length.
 */
const CM = 28.3465;
const PAGE = { width: 15 * CM, height: 10 * CM };
const MARGIN = 12;
const CONTENT_RIGHT = PAGE.width - MARGIN;
/** The data column and the QR column, side by side under the header. */
const LEFT_COL = { x: MARGIN, labelWidth: 78, valueX: MARGIN + 82, valueWidth: 164 };
const RIGHT_COL = { x: 268, width: PAGE.width - 268 - MARGIN };
const FONT = { agency: 18, docTitle: 10, caseNumber: 15, section: 12, label: 11, value: 12, caption: 8, footer: 7.5 };
const ROW_HEIGHT = 16;

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private logoBuffer: Buffer | null = null;
  /** Intrinsic pixel size of the logo, so the header can reserve the right width. */
  private logoAspect = 1;
  private qrCache = new Map<string, Buffer>();
  private pdfCache = new Map<string, { buffer: Buffer; timestamp: number }>();
  private readonly PDF_CACHE_TTL = 5 * 60 * 1000;

  constructor(private prisma: PrismaService) {
    try {
      const logoPath = join(process.cwd(), 'src', 'common', 'assets', 'logo.png');
      this.logoBuffer = readFileSync(logoPath);
      this.logoAspect = this.readPngAspect(this.logoBuffer) ?? 1;
      this.logger.log(`Logo cached in memory (aspect ${this.logoAspect.toFixed(2)})`);
    } catch {
      this.logger.warn('Logo not found, using text fallback');
    }
  }

  /**
   * Width/height from the PNG header. A square wordmark and a wide one need
   * very different amounts of the header band, and reserving a fixed box for
   * either leaves the other floating in dead space.
   */
  private readPngAspect(png: Buffer): number | null {
    // 8-byte signature, then the IHDR chunk: length, type, width, height.
    if (png.length < 24 || png.readUInt32BE(12) !== 0x49484452) return null;
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    if (!width || !height) return null;
    return width / height;
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
          },
        });

        if (!visaCase) throw new NotFoundException('Visa case not found');

        const appUrl = process.env.APP_URL || 'http://localhost:5173';
        const qrData = `${appUrl}/tracking?case=${visaCase.caseNumber}`;
        const qrBuffer = await QRCode.toBuffer(qrData, { width: 70, margin: 1 });

        const doc = new PDFDocument({
          size: [PAGE.width, PAGE.height],
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
          info: { Title: `Bordereau - ${visaCase.caseNumber}`, Author: 'HAKIMI SOLUTIONS' },
          bufferPages: false,
          autoFirstPage: false,
        });

        const chunks: Buffer[] = [];
        const passthrough = new PassThrough();
        passthrough.on('data', (chunk: Buffer) => chunks.push(chunk));
        passthrough.on('end', () => resolve(Buffer.concat(chunks)));
        passthrough.on('error', reject);

        doc.pipe(passthrough);

        doc.addPage({ size: [PAGE.width, PAGE.height], margins: { top: 0, bottom: 0, left: 0, right: 0 } });

        this.drawHeader(doc, visaCase.caseNumber);
        this.drawClientInfo(doc, visaCase.client);
        this.drawVisaInfo(doc, visaCase);
        const qrBottom = this.drawQRCode(doc, qrBuffer);
        if (visaCase.appointments.length > 0) {
          this.drawAppointmentInfo(doc, visaCase.appointments[0], qrBottom);
        }
        this.drawFooter(doc);

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Logo, agency, and case number share one band across the top. The logo sits
   * beside the wordmark rather than above it — stacked, it would eat a third of
   * a 10 cm sheet.
   */
  private drawHeader(doc: PDFKit.PDFDocument, caseNumber: string) {
    const top = MARGIN;
    const logoHeight = 50;
    let textX = MARGIN;

    if (this.logoBuffer) {
      // Scale by height and take whatever width the artwork needs, capped so a
      // very wide wordmark cannot crowd out the case number.
      const logoWidth = Math.min(logoHeight * this.logoAspect, 168);
      doc.image(this.logoBuffer, MARGIN, top, { fit: [logoWidth, logoHeight] });
      textX = MARGIN + logoWidth + 10;
    } else {
      // Only worth printing when there is no logo — the artwork carries the
      // name itself, and setting it twice reads as a mistake.
      doc.fillColor('#000').fontSize(FONT.agency).font('Helvetica-Bold');
      doc.text('HAKIMI SOLUTIONS', textX, top + 8, { width: 220, lineBreak: false });
      textX = MARGIN;
    }

    doc.fontSize(FONT.docTitle).font('Helvetica').fillColor('#555');
    doc.text('BORDEREAU DE DOSSIER', textX, top + (this.logoBuffer ? 20 : 30), {
      width: 150,
      lineBreak: false,
    });

    // The case number is what the desk looks for first, so it anchors the
    // opposite corner at the largest size on the card.
    doc.fontSize(FONT.caseNumber).font('Helvetica-Bold').fillColor('#000');
    doc.text(caseNumber, CONTENT_RIGHT - 190, top + 12, { width: 190, align: 'right', lineBreak: false });

    const y = top + logoHeight + 6;
    doc.moveTo(MARGIN, y).lineTo(CONTENT_RIGHT, y).lineWidth(0.8).strokeColor('#bbb').stroke();

    doc.y = y + 9;
  }

  /**
   * Cuts a value down to one line's worth of the current font. Rows sit on a
   * fixed grid, so a value that wraps lands on top of the row beneath it —
   * PDFKit's own `ellipsis` does not reliably prevent that here.
   */
  private fitToWidth(doc: PDFKit.PDFDocument, text: string, width: number): string {
    if (doc.widthOfString(text) <= width) return text;

    let cut = text;
    while (cut.length > 1 && doc.widthOfString(`${cut}…`) > width) {
      cut = cut.slice(0, -1);
    }
    return `${cut.trimEnd()}…`;
  }

  /** One label/value line inside the left-hand data column. */
  private drawRow(doc: PDFKit.PDFDocument, label: string, value: string, y: number) {
    doc.fontSize(FONT.label).font('Helvetica-Bold').fillColor('#444');
    doc.text(this.fitToWidth(doc, label, LEFT_COL.labelWidth), LEFT_COL.x, y, { lineBreak: false });

    doc.fontSize(FONT.value).font('Helvetica').fillColor('#000');
    doc.text(this.fitToWidth(doc, value || '-', LEFT_COL.valueWidth), LEFT_COL.valueX, y - 0.5, {
      lineBreak: false,
    });
    return y + ROW_HEIGHT;
  }

  private drawSectionTitle(doc: PDFKit.PDFDocument, title: string, y: number) {
    doc.fontSize(FONT.section).font('Helvetica-Bold').fillColor('#1a237e');
    doc.text(title, LEFT_COL.x, y, { width: 220, lineBreak: false });
    doc.fillColor('#000');
    return y + 17;
  }

  private drawClientInfo(doc: PDFKit.PDFDocument, client: {
    fullName: string; phoneNumber: string; passportNumber: string | null;
  }) {
    let y = this.drawSectionTitle(doc, 'CLIENT', doc.y);

    y = this.drawRow(doc, 'Nom', client.fullName, y);
    y = this.drawRow(doc, 'Téléphone', client.phoneNumber, y);
    y = this.drawRow(doc, 'Passeport', client.passportNumber || '-', y);

    doc.y = y + 5;
  }

  private drawVisaInfo(doc: PDFKit.PDFDocument, visaCase: {
    visaCountry: string; visaType: string; openingDate: Date; currentStatus: string; caseNumber: string;
  }) {
    let y = this.drawSectionTitle(doc, 'VISA', doc.y);

    y = this.drawRow(doc, 'Pays', visaCase.visaCountry, y);
    y = this.drawRow(doc, 'Type', visaCase.visaType, y);
    y = this.drawRow(doc, 'Ouverture', visaCase.openingDate.toLocaleDateString('fr-FR'), y);
    y = this.drawRow(doc, 'Statut', this.statusLabel(visaCase.currentStatus), y);

    doc.y = y + 5;
  }

  private drawAppointmentInfo(doc: PDFKit.PDFDocument, appointment: {
    appointmentDate: Date; appointmentTime: string; appointmentCenter: string; appointmentType: string;
  }, qrBottom: number) {
    // The appointment goes under the QR in the right column: the left column is
    // already full, and a client checking a date looks at the same corner they
    // scan from.
    const x = RIGHT_COL.x;
    const w = RIGHT_COL.width;
    let y = qrBottom + 6;

    doc.fontSize(FONT.section).font('Helvetica-Bold').fillColor('#1a237e');
    doc.text('RENDEZ-VOUS', x, y, { width: w, lineBreak: false });
    y += 16;

    const date = appointment.appointmentDate.toLocaleDateString('fr-FR');
    const lines = [
      `${date}  ${appointment.appointmentTime}`,
      appointment.appointmentCenter,
      appointment.appointmentType,
    ];

    doc.fontSize(FONT.label).font('Helvetica').fillColor('#000');
    for (const line of lines) {
      doc.text(this.fitToWidth(doc, line || '-', w), x, y, { lineBreak: false });
      y += 13.5;
    }
  }

  /** Returns where the QR block ended, so the appointment can sit under it. */
  private drawQRCode(doc: PDFKit.PDFDocument, qrBuffer: Buffer): number {
    const qrSize = 72;
    const x = RIGHT_COL.x + (RIGHT_COL.width - qrSize) / 2;
    const y = MARGIN + 68;

    doc.image(qrBuffer, x, y, { width: qrSize, height: qrSize });
    doc.fontSize(FONT.caption).fillColor('#666');
    doc.text('Scannez pour suivre', RIGHT_COL.x, y + qrSize + 3, {
      width: RIGHT_COL.width,
      align: 'center',
      lineBreak: false,
    });
    doc.fillColor('#000');

    return y + qrSize + 12;
  }

  private drawFooter(doc: PDFKit.PDFDocument) {
    const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const y = PAGE.height - MARGIN - 8;

    doc.moveTo(MARGIN, y - 5).lineTo(CONTENT_RIGHT, y - 5).lineWidth(0.5).strokeColor('#ddd').stroke();
    doc.fontSize(FONT.footer).fillColor('#999').font('Helvetica').text(
      `Généré le ${dateStr} par HAKIMI SOLUTIONS — document automatique, sans signature`,
      MARGIN,
      y,
      { align: 'center', width: PAGE.width - MARGIN * 2, lineBreak: false },
    );
    doc.fillColor('#000');
  }

  private statusLabel(status: string): string {
    const labels: Record<string, string> = {
      EN_ATTENTE: 'En Attente',
      DOSSIER_INCOMPLET: 'Dossier incomplet',
      EN_TRAITEMENT: 'En Traitement',
      RDV_OK: 'RDV OK',
      LIVREE: 'Livrée',
    };
    return labels[status] || status;
  }
}
