import { api } from './api';
import type { TrackingResult, TrackingCaseDetail } from '@/types';

export const trackingService = {
  async findByPhone(phone: string, reference?: string): Promise<TrackingResult> {
    const params: Record<string, string> = { phone };
    if (reference) params.reference = reference;
    return api.get<TrackingResult>('/public/tracking', params);
  },

  async findOne(caseNumber: string): Promise<TrackingCaseDetail> {
    return api.get<TrackingCaseDetail>(`/public/tracking/${caseNumber}`);
  },
};
