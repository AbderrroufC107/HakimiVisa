import { api } from './api';
import type {
  Agency,
  AgencyUser,
  CreateAgencyRequest,
  CreateAgencyUserRequest,
  RequiredDocument,
  CreateRequiredDocumentRequest,
} from '@/types';

export const agenciesService = {
  findAll() {
    return api.get<Agency[]>('/agencies');
  },
  findOne(id: string) {
    return api.get<Agency>(`/agencies/${id}`);
  },
  create(data: CreateAgencyRequest) {
    return api.post<Agency>('/agencies', data);
  },
  update(id: string, data: Partial<CreateAgencyRequest>) {
    return api.patch<Agency>(`/agencies/${id}`, data);
  },
  remove(id: string) {
    return api.delete<void>(`/agencies/${id}`);
  },
  createUser(id: string, data: CreateAgencyUserRequest) {
    return api.post<AgencyUser>(`/agencies/${id}/users`, data);
  },
};

export const requiredDocumentsService = {
  findAll() {
    return api.get<RequiredDocument[]>('/required-documents');
  },
  /** The checklist that applies to one application. */
  forCase(country?: string, visaType?: string) {
    const params = new URLSearchParams();
    if (country) params.set('country', country);
    if (visaType) params.set('visaType', visaType);
    const qs = params.toString();
    return api.get<RequiredDocument[]>(`/required-documents/for-case${qs ? `?${qs}` : ''}`);
  },
  create(data: CreateRequiredDocumentRequest) {
    return api.post<RequiredDocument>('/required-documents', data);
  },
  update(id: string, data: Partial<CreateRequiredDocumentRequest>) {
    return api.patch<RequiredDocument>(`/required-documents/${id}`, data);
  },
  remove(id: string) {
    return api.delete<void>(`/required-documents/${id}`);
  },
};
