import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTemplateDto, UpdateTemplateDto, RenderTemplateDto } from './dto';
import type { TemplateChannel } from '@prisma/client';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(channel?: string) {
    return this.prisma.messageTemplate.findMany({
      where: channel ? { channel: channel as TemplateChannel } : {},
      orderBy: [{ channel: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.messageTemplate.findUnique({
      where: { id },
    });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async create(dto: CreateTemplateDto) {
    return this.prisma.messageTemplate.create({
      data: {
        name: dto.name,
        channel: dto.channel,
        country: dto.country || null,
        visaType: dto.visaType || null,
        appointmentType: dto.appointmentType || null,
        subject: dto.subject || null,
        body: dto.body,
      },
    });
  }

  async update(id: string, dto: UpdateTemplateDto) {
    await this.findOne(id);
    return this.prisma.messageTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.channel !== undefined ? { channel: dto.channel } : {}),
        ...(dto.country !== undefined ? { country: dto.country || null } : {}),
        ...(dto.visaType !== undefined ? { visaType: dto.visaType || null } : {}),
        ...(dto.appointmentType !== undefined
          ? { appointmentType: dto.appointmentType || null }
          : {}),
        ...(dto.subject !== undefined ? { subject: dto.subject || null } : {}),
        ...(dto.body !== undefined ? { body: dto.body } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.messageTemplate.delete({ where: { id } });
  }

  /**
   * Pick the best matching template for a channel:
   * score = number of matching criteria (country/visaType/appointmentType).
   * Templates with a criterion set that does NOT match are excluded.
   */
  async findBestTemplate(
    channel: TemplateChannel,
    context: { country?: string | null; visaType?: string | null; appointmentType?: string | null },
  ) {
    const templates = await this.prisma.messageTemplate.findMany({
      where: { channel },
    });

    let best: (typeof templates)[number] | null = null;
    let bestScore = -1;

    for (const tpl of templates) {
      if (tpl.country && tpl.country !== context.country) continue;
      if (tpl.visaType && tpl.visaType !== context.visaType) continue;
      if (tpl.appointmentType && tpl.appointmentType !== context.appointmentType)
        continue;

      const score =
        (tpl.country ? 1 : 0) + (tpl.visaType ? 1 : 0) + (tpl.appointmentType ? 1 : 0);
      if (score > bestScore) {
        best = tpl;
        bestScore = score;
      }
    }

    return best;
  }

  private formatDate(date: Date | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getUTCFullYear()}`;
  }

  buildVariables(
    visaCase: {
      caseNumber: string;
      visaCountry: string;
      visaType: string;
      client: {
        fullName: string;
        phoneNumber: string;
        whatsappNumber?: string | null;
        email?: string | null;
        passportNumber?: string | null;
        passportExpiry?: Date | null;
      };
    },
    appointment?: {
      appointmentDate: Date;
      appointmentTime: string;
      appointmentCenter: string;
      appointmentType: string;
    } | null,
  ): Record<string, string> {
    return {
      client_name: visaCase.client.fullName,
      passport: visaCase.client.passportNumber ?? '',
      passport_expiry: this.formatDate(visaCase.client.passportExpiry),
      phone: visaCase.client.phoneNumber,
      case_number: visaCase.caseNumber,
      country: visaCase.visaCountry,
      visa_type: visaCase.visaType,
      appointment_date: appointment ? this.formatDate(appointment.appointmentDate) : '',
      appointment_time: appointment?.appointmentTime ?? '',
      appointment_center: appointment?.appointmentCenter ?? '',
      appointment_type: appointment?.appointmentType ?? '',
    };
  }

  renderText(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }

  async render(dto: RenderTemplateDto) {
    const visaCase = await this.prisma.visaCase.findUnique({
      where: { id: dto.visaCaseId },
      include: { client: true },
    });
    if (!visaCase) throw new NotFoundException('Visa case not found');

    let appointment: {
      appointmentDate: Date;
      appointmentTime: string;
      appointmentCenter: string;
      appointmentType: string;
    } | null = null;

    if (dto.appointmentId) {
      appointment = await this.prisma.appointment.findUnique({
        where: { id: dto.appointmentId },
        select: {
          appointmentDate: true,
          appointmentTime: true,
          appointmentCenter: true,
          appointmentType: true,
        },
      });
    } else {
      appointment = await this.prisma.appointment.findFirst({
        where: { visaCaseId: dto.visaCaseId },
        orderBy: { appointmentDate: 'desc' },
        select: {
          appointmentDate: true,
          appointmentTime: true,
          appointmentCenter: true,
          appointmentType: true,
        },
      });
    }

    let template: Awaited<ReturnType<TemplatesService['findOne']>> | null = null;
    if (dto.templateId) {
      template = await this.findOne(dto.templateId);
    } else if (dto.channel) {
      template = await this.findBestTemplate(dto.channel, {
        country: visaCase.visaCountry,
        visaType: visaCase.visaType,
        appointmentType: appointment?.appointmentType,
      });
    }

    if (!template) {
      throw new NotFoundException('No matching template found');
    }

    const variables = this.buildVariables(visaCase, appointment);

    return {
      templateId: template.id,
      templateName: template.name,
      channel: template.channel,
      subject: template.subject ? this.renderText(template.subject, variables) : null,
      body: this.renderText(template.body, variables),
      client: {
        fullName: visaCase.client.fullName,
        phoneNumber: visaCase.client.phoneNumber,
        whatsappNumber: visaCase.client.whatsappNumber,
        email: visaCase.client.email,
      },
    };
  }
}
