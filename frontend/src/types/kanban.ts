import type { VisaCase, VisaStatus } from './visa-case';

export interface KanbanColumn {
  id: VisaStatus;
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
