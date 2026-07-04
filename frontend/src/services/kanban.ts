import { api } from './api';
import type { KanbanColumn } from '@/types/kanban';

const BASE = '/kanban';

export const kanbanService = {
  async getBoard(params?: {
    search?: string;
    country?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<KanbanColumn[]> {
    const searchParams: Record<string, string> = {};
    if (params?.search) searchParams.search = params.search;
    if (params?.country) searchParams.country = params.country;
    if (params?.type) searchParams.type = params.type;
    if (params?.dateFrom) searchParams.dateFrom = params.dateFrom;
    if (params?.dateTo) searchParams.dateTo = params.dateTo;
    return api.get<KanbanColumn[]>(BASE, searchParams);
  },
};
