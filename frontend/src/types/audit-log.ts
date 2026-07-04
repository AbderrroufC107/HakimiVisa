export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'LOGIN' | 'LOGOUT';

export interface AuditLog {
  id: string;
  action: AuditAction;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  userId: string;
  user?: { id: string; firstName: string; lastName: string };
  createdAt: string;
}
