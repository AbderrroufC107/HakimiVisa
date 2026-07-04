import { api } from './api';
import type {
  VisaCase,
  StatusHistory,
  CreateVisaCaseRequest,
  UpdateVisaCaseRequest,
  UpdateStatusRequest,
  VisaStatus,
} from '@/types';
import type { PaginatedResponse } from '@/types';

export const visaCasesService = {
  async findAll(params?: {
    search?: string;
    status?: VisaStatus;
    clientId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<VisaCase>> {
    const searchParams: Record<string, string> = {};
    if (params?.search) searchParams.search = params.search;
    if (params?.status) searchParams.status = params.status;
    if (params?.clientId) searchParams.clientId = params.clientId;
    if (params?.page) searchParams.page = String(params.page);
    if (params?.limit) searchParams.limit = String(params.limit);
    return api.get<PaginatedResponse<VisaCase>>('/visa-cases', searchParams);
  },

  async findOne(id: string): Promise<VisaCase> {
    return api.get<VisaCase>(`/visa-cases/${id}`);
  },

  async create(data: CreateVisaCaseRequest): Promise<VisaCase> {
    return api.post<VisaCase>('/visa-cases', data);
  },

  async update(id: string, data: UpdateVisaCaseRequest): Promise<VisaCase> {
    return api.patch<VisaCase>(`/visa-cases/${id}`, data);
  },

  async updateStatus(id: string, data: UpdateStatusRequest): Promise<VisaCase> {
    return api.patch<VisaCase>(`/visa-cases/${id}/status`, data);
  },

  async getHistory(id: string): Promise<StatusHistory[]> {
    return api.get<StatusHistory[]>(`/visa-cases/${id}/history`);
  },

  async remove(id: string): Promise<void> {
    return api.delete<void>(`/visa-cases/${id}`);
  },
};
