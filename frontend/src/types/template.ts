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

/**
 * Grouped so the picker stays readable as the list grows, and so it is obvious
 * which values only exist once a step has happened — a template quoting the
 * appointment or the granted visa is refused until that data is recorded.
 */
export const TEMPLATE_VARIABLE_GROUPS = [
  {
    key: 'client',
    variables: ['client_name', 'phone', 'passport', 'passport_expiry'],
  },
  {
    key: 'case',
    variables: ['case_number', 'country', 'visa_type', 'today'],
  },
  {
    key: 'appointment',
    variables: ['appointment_date', 'appointment_time', 'appointment_center', 'appointment_type'],
  },
  {
    key: 'visa',
    variables: ['visa_valid_from', 'visa_valid_until', 'visa_duration', 'visa_number', 'entry_type'],
  },
  {
    key: 'agency',
    variables: ['agency_name', 'agency_phone', 'agency_email', 'agency_address'],
  },
] as const;

export const TEMPLATE_VARIABLES = TEMPLATE_VARIABLE_GROUPS.flatMap(
  (g) => g.variables,
) as readonly string[];
