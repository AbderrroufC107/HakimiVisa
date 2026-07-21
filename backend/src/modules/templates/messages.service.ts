import {
  Injectable,
  BadRequestException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { TemplatesService } from './templates.service';
import { RenderTemplateDto } from './dto';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private templates: TemplatesService,
    private config: ConfigService,
  ) {}

  /**
   * Build a wa.me click-to-chat link with the rendered message.
   * Works without WhatsApp Business API: staff clicks the link to send.
   */
  async buildWhatsappLink(dto: RenderTemplateDto) {
    const rendered = await this.templates.render({
      ...dto,
      channel: dto.channel ?? 'WHATSAPP',
    });

    const rawPhone =
      rendered.client.whatsappNumber || rendered.client.phoneNumber;
    if (!rawPhone) {
      throw new BadRequestException('Client has no phone number');
    }

    let digits = rawPhone.replace(/\D/g, '');
    if (digits.startsWith('00')) digits = digits.slice(2);

    const url = `https://wa.me/${digits}?text=${encodeURIComponent(rendered.body)}`;

    return { url, body: rendered.body, phone: digits, templateId: rendered.templateId };
  }

  async sendEmail(dto: RenderTemplateDto & { to?: string }) {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      throw new ServiceUnavailableException(
        'SMTP is not configured on the server (SMTP_HOST/SMTP_USER/SMTP_PASS)',
      );
    }

    const rendered = await this.templates.render({
      ...dto,
      channel: dto.channel ?? 'EMAIL',
    });

    const to = dto.to || rendered.client.email;
    if (!to) {
      throw new BadRequestException('Client has no email address');
    }

    const port = Number(this.config.get<string>('SMTP_PORT') ?? 587);
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const from = this.config.get<string>('SMTP_FROM') ?? user;

    try {
      await transporter.sendMail({
        from,
        to,
        subject: rendered.subject ?? 'HakimiVisa',
        text: rendered.body,
      });
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error as Error);
      throw new ServiceUnavailableException('Failed to send email');
    }

    return { sent: true, to, subject: rendered.subject, body: rendered.body };
  }
}
