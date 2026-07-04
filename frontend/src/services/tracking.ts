import { api } from './api';
import type { TrackingResult, TrackingCaseDetail } from '@/types';

export const trackingService = {
  async findByPhone(phone: string, caseNumber?: string): Promise<TrackingResult> {
    const params: Record<string, string> = { phone };
    if (caseNumber) params.case = caseNumber;
    return api.get<TrackingResult>('/tracking', params);
  },

  async findOne(id: string): Promise<TrackingCaseDetail> {
    return api.get<TrackingCaseDetail>(`/tracking/${id}`);
  },
};
