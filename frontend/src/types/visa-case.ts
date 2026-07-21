export type VisaStatus = 'EN_ATTENTE' | 'DOSSIER_INCOMPLET' | 'EN_TRAITEMENT' | 'RDV_OK' | 'VISA_OK' | 'VISA_REFUSEE' | 'LIVREE';

export interface VisaCaseAppointment {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentCenter: string;
  appointmentType: string;
}

export interface VisaCase {
  id: string;
  caseNumber: string;
  clientId: string;
  client?: {
    id: string;
    fullName: string;
    phoneNumber: string;
    passportNumber?: string | null;
    passportExpiry?: string | null;
  };
  creator?: { id: string; firstName: string; lastName: string };
  visaCountry: string;
  visaType: string;
  currentStatus: VisaStatus;
  incompleteReason?: string | null;
  openingDate: string;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  price?: number;
  isPaid?: boolean;
  statusHistories?: StatusHistory[];
  appointments?: VisaCaseAppointment[];
}

export interface StatusHistory {
  id: string;
  visaCaseId: string;
  oldStatus: VisaStatus;
  newStatus: VisaStatus;
  changedBy: string;
  changer?: { id: string; firstName: string; lastName: string };
  changedAt: string;
}

export interface CreateVisaCaseRequest {
  clientId: string;
  visaCountry: string;
  visaType: string;
  notes?: string;
}

export interface UpdateVisaCaseRequest extends Partial<CreateVisaCaseRequest> {
  price?: number;
  isPaid?: boolean;
}

export interface UpdateStatusRequest {
  status: VisaStatus;
  reason?: string;
}

export const VISA_STATUS_LABELS: Record<VisaStatus, string> = {
  EN_ATTENTE: 'En Attente',
  DOSSIER_INCOMPLET: 'Dossier Incomplet',
  EN_TRAITEMENT: 'En Traitement',
  RDV_OK: 'RDV OK',
  VISA_OK: 'VISA OK',
  VISA_REFUSEE: 'VISA Refusée',
  LIVREE: 'Livrée',
};

export const VISA_STATUS_COLORS: Record<VisaStatus, string> = {
  EN_ATTENTE: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  DOSSIER_INCOMPLET: 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  EN_TRAITEMENT: 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  RDV_OK: 'bg-purple-50 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
  VISA_OK: 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300',
  VISA_REFUSEE: 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300',
  LIVREE: 'bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
};
