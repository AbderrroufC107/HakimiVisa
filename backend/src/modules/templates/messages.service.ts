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
   * wa.me only accepts a full international number with no `+` and no leading
   * zero. Clients are usually stored with a local number (`0778423001`), which
   * WhatsApp rejects outright, so fall back to the agency's country code.
   */
  private toInternationalDigits(rawPhone: string): string {
    const countryCode = (
      this.config.get<string>('WHATSAPP_COUNTRY_CODE') ?? '213'
    ).replace(/\D/g, '');

    const trimmed = rawPhone.trim();
    const digits = trimmed.replace(/\D/g, '');

    // An explicit + or 00 means the client already carries their own country
    // code (e.g. a Moroccan +212...), so never prepend ours.
    if (trimmed.startsWith('+')) return digits;
    if (digits.startsWith('00')) return digits.slice(2);

    // Local trunk form: 0778423001 -> 213778423001
    if (digits.startsWith('0')) return countryCode + digits.slice(1);

    // Bare subscriber number: 778423001 -> 213778423001
    return countryCode + digits;
  }

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
      throw new BadRequestException(
        "Ce client n'a pas de numéro de téléphone. Ajoutez-le sur sa fiche avant d'envoyer un WhatsApp.",
      );
    }

    const digits = this.toInternationalDigits(rawPhone);

    const url = `https://wa.me/${digits}?text=${encodeURIComponent(rendered.body)}`;

    return { url, body: rendered.body, phone: digits, templateId: rendered.templateId };
  }

  async sendEmail(dto: RenderTemplateDto & { to?: string }) {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      throw new ServiceUnavailableException(
        "L'envoi d'emails n'est pas configuré sur le serveur. Contactez l'administrateur, ou utilisez WhatsApp en attendant.",
      );
    }

    const rendered = await this.templates.render({
      ...dto,
      channel: dto.channel ?? 'EMAIL',
    });

    const to = dto.to || rendered.client.email;
    if (!to) {
      throw new BadRequestException(
        "Ce client n'a pas d'adresse email. Ajoutez-la sur sa fiche, ou contactez-le par WhatsApp.",
      );
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
      throw new ServiceUnavailableException(
        "L'email n'a pas pu être envoyé. Vérifiez l'adresse du client puis réessayez.",
      );
    }

    return { sent: true, to, subject: rendered.subject, body: rendered.body };
  }
}
