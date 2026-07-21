export type TemplateChannel = 'WHATSAPP' | 'EMAIL';

export interface MessageTemplate {
  id: string;
  name: string;
  channel: TemplateChannel;
  country: string | null;
  visaType: string | null;
  appointmentType: string | null;
  subject: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRequest {
  name: string;
  channel: TemplateChannel;
  country?: string;
  visaType?: string;
  appointmentType?: string;
  subject?: string;
  body: string;
}

export interface UpdateTemplateRequest extends Partial<CreateTemplateRequest> {}

export interface RenderTemplateRequest {
  templateId?: string;
  visaCaseId: string;
  appointmentId?: string;
  channel?: TemplateChannel;
}

export interface RenderedMessage {
  templateId: string;
  templateName: string;
  channel: TemplateChannel;
  subject: string | null;
  body: string;
  client: {
    fullName: string;
    phoneNumber: string;
    whatsappNumber?: string | null;
    email?: string | null;
  };
}

export interface WhatsappLinkResponse {
  url: string;
  body: string;
  phone: string;
  templateId: string;
}

export const TEMPLATE_VARIABLES = [
  'client_name',
  'passport',
  'passport_expiry',
  'phone',
  'case_number',
  'country',
  'visa_type',
  'appointment_date',
  'appointment_time',
  'appointment_center',
  'appointment_type',
] as const;
