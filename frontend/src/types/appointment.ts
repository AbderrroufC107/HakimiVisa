export type AppointmentType = 'TLS' | 'VFS' | 'EMBASSY' | 'BIOMETRICS' | 'INTERVIEW' | 'OTHER';

export interface Appointment {
  id: string;
  visaCaseId: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentCenter: string;
  appointmentType: AppointmentType;
  notes: string | null;
  userId: string;
  user?: { id: string; firstName: string; lastName: string };
  visaCase?: {
    id: string;
    caseNumber: string;
    visaCountry: string;
    visaType: string;
    currentStatus: string;
    client: { id: string; fullName: string; phoneNumber: string };
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentRequest {
  visaCaseId: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentCenter: string;
  appointmentType: AppointmentType;
  notes?: string;
}

export type UpdateAppointmentRequest = Partial<CreateAppointmentRequest>;

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  TLS: 'TLS',
  VFS: 'VFS',
  EMBASSY: 'Ambassade',
  BIOMETRICS: 'Biométrie',
  INTERVIEW: 'Entretien',
  OTHER: 'Autre',
};

export const APPOINTMENT_TYPE_COLORS: Record<AppointmentType, string> = {
  TLS: 'bg-blue-100 text-blue-800',
  VFS: 'bg-purple-100 text-purple-800',
  EMBASSY: 'bg-green-100 text-green-800',
  BIOMETRICS: 'bg-orange-100 text-orange-800',
  INTERVIEW: 'bg-yellow-100 text-yellow-800',
  OTHER: 'bg-gray-100 text-gray-800',
};
