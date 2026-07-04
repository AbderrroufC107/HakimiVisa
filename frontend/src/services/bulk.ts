import { api, getAccessToken } from './api';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

export interface BulkResultItem {
  id: string;
  caseNumber?: string;
  success: boolean;
  error?: string;
}

export interface BulkResult {
  total: number;
  successful: number;
  failed: number;
  items: BulkResultItem[];
}

export interface BulkStatusChangeRequest {
  ids: string[];
  status: string;
}

export interface BulkAppointmentRequest {
  ids: string[];
  appointmentDate: string;
  appointmentTime: string;
  appointmentCenter: string;
  appointmentType: string;
  notes?: string;
}

export interface BulkIdsRequest {
  ids: string[];
}

export const bulkService = {
  async statusChange(data: BulkStatusChangeRequest): Promise<BulkResult> {
    return api.post<BulkResult>('/bulk/status-change', data);
  },

  async createAppointments(data: BulkAppointmentRequest): Promise<BulkResult> {
    return api.post<BulkResult>('/bulk/appointment', data);
  },

  async exportPdf(data: BulkIdsRequest): Promise<Blob> {
    const token = getAccessToken();
    const res = await fetch(`${API_URL}/bulk/pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to generate PDF archive');
    return res.blob();
  },

  async exportExcel(data: BulkIdsRequest): Promise<Blob> {
    const token = getAccessToken();
    const res = await fetch(`${API_URL}/bulk/excel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to export Excel');
    return res.blob();
  },

  async archive(data: BulkIdsRequest): Promise<BulkResult> {
    return api.post<BulkResult>('/bulk/archive', data);
  },

  async restore(data: BulkIdsRequest): Promise<BulkResult> {
    return api.post<BulkResult>('/bulk/restore', data);
  },

  async delete(data: BulkIdsRequest): Promise<BulkResult> {
    return api.post<BulkResult>('/bulk/delete', data);
  },
};
