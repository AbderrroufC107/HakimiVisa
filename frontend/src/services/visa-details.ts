import { api } from './api';
import type { VisaDetails, CreateVisaDetailsRequest, UpdateVisaDetailsRequest } from '@/types';

export const visaDetailsService = {
  async findByVisaCase(visaCaseId: string): Promise<VisaDetails | null> {
    return api.get<VisaDetails | null>(`/visa-cases/${visaCaseId}/visa-details`);
  },

  async create(visaCaseId: string, data: CreateVisaDetailsRequest): Promise<VisaDetails> {
    return api.post<VisaDetails>(`/visa-cases/${visaCaseId}/visa-details`, data);
  },

  async update(visaCaseId: string, data: UpdateVisaDetailsRequest): Promise<VisaDetails> {
    return api.patch<VisaDetails>(`/visa-cases/${visaCaseId}/visa-details`, data);
  },

  async remove(visaCaseId: string): Promise<void> {
    return api.delete<void>(`/visa-cases/${visaCaseId}/visa-details`);
  },
};
