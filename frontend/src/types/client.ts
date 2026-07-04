import type { VisaCase, StatusHistory } from './visa-case';
import type { Appointment } from './appointment';
import type { VisaDetails } from './visa-details';

export interface Client {
  id: string;
  fullName: string;
  phoneNumber: string;
  whatsappNumber: string | null;
  email: string | null;
  passportNumber: string | null;
  nationality: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _count?: { visaCases: number };
  visaCases?: VisaCase[];
}

export interface ClientProfile extends Client {
  creator: { id: string; firstName: string; lastName: string };
  _count: { visaCases: number; internalNotes: number };
  visaCases: (VisaCase & {
    statusHistories: (StatusHistory & { changer: { id: string; firstName: string; lastName: string } })[];
    appointments: (Appointment & { user: { id: string; firstName: string; lastName: string } })[];
    visaDetails: VisaDetails | null;
  })[];
}

export interface ClientTimelineEvent {
  id: string;
  type: string;
  label: string;
  description: string;
  userId: string;
  user: { id: string; firstName: string; lastName: string } | null;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ClientStats {
  totalApplications: number;
  approved: number;
  refused: number;
  pending: number;
  approvalRate: number;
  refusalRate: number;
  totalCountries: number;
  countries: { country: string; count: number }[];
  avgProcessingTime: number;
  upcomingAppointments: {
    id: string;
    appointmentDate: string;
    appointmentTime: string;
    appointmentCenter: string;
    appointmentType: string;
    visaCase: { caseNumber: string };
  }[];
  pastAppointments: {
    id: string;
    appointmentDate: string;
    appointmentTime: string;
    appointmentCenter: string;
    appointmentType: string;
    visaCase: { caseNumber: string };
  }[];
}

export interface ClientNote {
  id: string;
  content: string;
  clientId: string;
  createdBy: string;
  creator: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface ClientDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  mimeType: string;
  size: number;
  visaCaseId: string;
  visaCase: { caseNumber: string; visaCountry: string; visaType: string };
  uploadedAt: string;
}

export interface CreateClientRequest {
  fullName: string;
  phoneNumber: string;
  whatsappNumber?: string;
  email?: string;
  passportNumber?: string;
  nationality?: string;
  notes?: string;
}

export type UpdateClientRequest = Partial<CreateClientRequest>;
