import type { VisaCase, VisaStatus } from './visa-case';

/** Column ids are statuses plus EN_ATTENTE_AGENCE, a view of EN_ATTENTE. */
export type KanbanColumnId = VisaStatus | 'EN_ATTENTE_AGENCE';

export interface KanbanColumn {
  id: KanbanColumnId;
  title: string;
  color: string;
  cards: VisaCase[];
  count: number;
}

export interface KanbanFilters {
  search: string;
  country: string;
  type: string;
  dateFrom: string;
  dateTo: string;
}
