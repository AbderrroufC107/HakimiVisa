import { api } from './api';
import type { Appointment, CreateAppointmentRequest, UpdateAppointmentRequest, AppointmentType } from '@/types';

export const appointmentsService = {
  async findAll(params?: {
    visaCaseId?: string;
    dateFrom?: string;
    dateTo?: string;
    appointmentType?: AppointmentType;
    search?: string;
  }): Promise<Appointment[]> {
    const searchParams: Record<string, string> = {};
    if (params?.visaCaseId) searchParams.visaCaseId = params.visaCaseId;
    if (params?.dateFrom) searchParams.dateFrom = params.dateFrom;
    if (params?.dateTo) searchParams.dateTo = params.dateTo;
    if (params?.appointmentType) searchParams.appointmentType = params.appointmentType;
    if (params?.search) searchParams.search = params.search;
    return api.get<Appointment[]>('/appointments', searchParams);
  },

  async findOne(id: string): Promise<Appointment> {
    return api.get<Appointment>(`/appointments/${id}`);
  },

  async create(data: CreateAppointmentRequest): Promise<Appointment> {
    return api.post<Appointment>('/appointments', data);
  },

  async update(id: string, data: UpdateAppointmentRequest): Promise<Appointment> {
    return api.patch<Appointment>(`/appointments/${id}`, data);
  },

  async remove(id: string): Promise<void> {
    return api.delete<void>(`/appointments/${id}`);
  },
};
