import { api } from './api';
import type {
  MessageTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  RenderTemplateRequest,
  RenderedMessage,
  WhatsappLinkResponse,
  TemplateChannel,
} from '@/types';

export const templatesService = {
  async findAll(channel?: TemplateChannel): Promise<MessageTemplate[]> {
    const params: Record<string, string> = {};
    if (channel) params.channel = channel;
    return api.get<MessageTemplate[]>('/templates', params);
  },

  async findOne(id: string): Promise<MessageTemplate> {
    return api.get<MessageTemplate>(`/templates/${id}`);
  },

  async create(data: CreateTemplateRequest): Promise<MessageTemplate> {
    return api.post<MessageTemplate>('/templates', data);
  },

  async update(id: string, data: UpdateTemplateRequest): Promise<MessageTemplate> {
    return api.patch<MessageTemplate>(`/templates/${id}`, data);
  },

  async remove(id: string): Promise<void> {
    return api.delete<void>(`/templates/${id}`);
  },

  async render(data: RenderTemplateRequest): Promise<RenderedMessage> {
    return api.post<RenderedMessage>('/templates/render', data);
  },

  async whatsappLink(data: RenderTemplateRequest): Promise<WhatsappLinkResponse> {
    return api.post<WhatsappLinkResponse>('/templates/whatsapp-link', data);
  },

  async sendEmail(data: RenderTemplateRequest & { to?: string }): Promise<{ sent: boolean; to: string }> {
    return api.post<{ sent: boolean; to: string }>('/templates/send-email', data);
  },
};
