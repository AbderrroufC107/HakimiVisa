export type EntryType = 'SINGLE' | 'MULTIPLE';

export interface VisaDetails {
  id: string;
  visaCaseId: string;
  validFrom: string;
  validUntil: string;
  durationDays: number;
  entryType: EntryType;
  visaNumber: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVisaDetailsRequest {
  validFrom: string;
  validUntil: string;
  durationDays: number;
  entryType: EntryType;
  visaNumber?: string;
  notes?: string;
}

export type UpdateVisaDetailsRequest = Partial<CreateVisaDetailsRequest>;
