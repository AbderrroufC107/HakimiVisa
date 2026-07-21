import type { VisaStatus } from './visa-case';

export interface TrackingCase {
  id: string;
  caseNumber: string;
  visaCountry: string;
  visaType: string;
  currentStatus: VisaStatus;
  incompleteReason?: string | null;
  openingDate: string;
  updatedAt: string;
}

export interface TrackingResult {
  clientName: string;
  passport: string;
  cases: TrackingCase[];
  total: number;
}

export interface TrackingAppointment {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentCenter: string;
  appointmentType: string;
}

export interface TrackingVisaDetails {
  validFrom: string;
  validUntil: string;
  durationDays: number;
  entryType: string;
  visaNumber: string | null;
}

export interface TrackingStatusHistory {
  oldStatus: VisaStatus;
  newStatus: VisaStatus;
  changedAt: string;
}

export interface TrackingCaseDetail {
  id: string;
  caseNumber: string;
  visaCountry: string;
  visaType: string;
  currentStatus: VisaStatus;
  incompleteReason?: string | null;
  openingDate: string;
  updatedAt: string;
  client: {
    id: string;
    fullName: string;
    phoneNumber: string;
    passportNumber?: string | null;
    passportExpiry?: string | null;
  };
  appointments: TrackingAppointment[];
  visaDetails: TrackingVisaDetails | null;
  statusHistories: TrackingStatusHistory[];
}
