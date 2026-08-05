export interface AgencyUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

export interface Agency {
  id: string;
  name: string;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  isActive: boolean;
  createdAt: string;
  users?: AgencyUser[];
  _count?: { users: number; visaCases: number };
}

export interface CreateAgencyRequest {
  name: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  isActive?: boolean;
}

export interface CreateAgencyUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RequiredDocument {
  id: string;
  label: string;
  country?: string | null;
  visaType?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface CreateRequiredDocumentRequest {
  label: string;
  country?: string;
  visaType?: string;
  isActive?: boolean;
  sortOrder?: number;
}
