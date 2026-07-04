import { api } from './api';
import type {
  Client,
  ClientProfile,
  ClientTimelineEvent,
  ClientStats,
  ClientNote,
  ClientDocument,
  CreateClientRequest,
  UpdateClientRequest,
  DashboardAnalytics,
} from '@/types';
import type { PaginatedResponse } from '@/types';

export const clientsService = {
  async findAll(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Client>> {
    const searchParams: Record<string, string> = {};
    if (params?.search) searchParams.search = params.search;
    if (params?.page) searchParams.page = String(params.page);
    if (params?.limit) searchParams.limit = String(params.limit);
    return api.get<PaginatedResponse<Client>>('/clients', searchParams);
  },

  async findOne(id: string): Promise<Client> {
    return api.get<Client>(`/clients/${id}`);
  },

  async getProfile(id: string): Promise<ClientProfile> {
    return api.get<ClientProfile>(`/clients/${id}/profile`);
  },

  async getTimeline(id: string): Promise<ClientTimelineEvent[]> {
    return api.get<ClientTimelineEvent[]>(`/clients/${id}/timeline`);
  },

  async getStats(id: string): Promise<ClientStats> {
    return api.get<ClientStats>(`/clients/${id}/stats`);
  },

  async getDocuments(id: string): Promise<ClientDocument[]> {
    return api.get<ClientDocument[]>(`/clients/${id}/documents`);
  },

  async getNotes(clientId: string): Promise<ClientNote[]> {
    return api.get<ClientNote[]>(`/clients/${clientId}/notes`);
  },

  async createNote(clientId: string, content: string): Promise<ClientNote> {
    return api.post<ClientNote>(`/clients/${clientId}/notes`, { content });
  },

  async updateNote(clientId: string, noteId: string, content: string): Promise<ClientNote> {
    return api.patch<ClientNote>(`/clients/${clientId}/notes/${noteId}`, { content });
  },

  async deleteNote(clientId: string, noteId: string): Promise<void> {
    return api.delete<void>(`/clients/${clientId}/notes/${noteId}`);
  },

  async create(data: CreateClientRequest): Promise<Client> {
    return api.post<Client>('/clients', data);
  },

  async update(id: string, data: UpdateClientRequest): Promise<Client> {
    return api.patch<Client>(`/clients/${id}`, data);
  },

  async remove(id: string): Promise<void> {
    return api.delete<void>(`/clients/${id}`);
  },

  async getDashboardStats(): Promise<{
    totalClients: number;
    totalCases: number;
    enAttente: number;
    enTraitement: number;
    rdvOk: number;
    visaOk: number;
    refuse: number;
  }> {
    return api.get('/clients/dashboard');
  },

  async getAnalytics(): Promise<DashboardAnalytics> {
    return api.get<DashboardAnalytics>('/clients/analytics');
  },
};
