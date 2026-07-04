import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { kanbanService, visaCasesService } from '@/services';
import type { KanbanColumn, KanbanFilters, VisaCase, VisaStatus } from '@/types';
export type { KanbanFilters } from '@/types';

const COLUMN_ORDER: VisaStatus[] = [
  'EN_ATTENTE',
  'EN_TRAITEMENT',
  'RDV_OK',
  'VISA_OK',
  'VISA_REFUSEE',
];

const defaultFilters: KanbanFilters = {
  search: '',
  country: '',
  type: '',
  dateFrom: '',
  dateTo: '',
};

export function useKanbanBoard() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<KanbanFilters>(defaultFilters);
  const [activeCard, setActiveCard] = useState<VisaCase | null>(null);
  const [selectedCard, setSelectedCard] = useState<VisaCase | null>(null);

  const { data: rawColumns = [], isLoading } = useQuery({
    queryKey: ['kanban', 'board'],
    queryFn: () => kanbanService.getBoard(),
    refetchInterval: 30_000,
  });

  const sortedColumns = useMemo(() => {
    const map = new Map(rawColumns.map((c) => [c.id, c]));
    const fallback = (id: VisaStatus): KanbanColumn => ({
      id,
      title: id.replace(/_/g, ' '),
      color: '',
      cards: [],
      count: 0,
    });
    return COLUMN_ORDER.map((id) => map.get(id) ?? fallback(id));
  }, [rawColumns]);

  const filteredColumns = useMemo(() => {
    const { search, country, type, dateFrom, dateTo } = filters;

    if (!search && !country && !type && !dateFrom && !dateTo) {
      return sortedColumns;
    }

    const searchLower = search.toLowerCase();
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;
    if (toDate) toDate.setHours(23, 59, 59, 999);

    return sortedColumns.map((col) => {
      const cards = col.cards.filter((c) => {
        if (searchLower) {
          const clientName = c.client?.fullName?.toLowerCase() ?? '';
          const phone = c.client?.phoneNumber ?? '';
          const caseNum = c.caseNumber.toLowerCase();
          if (
            !clientName.includes(searchLower) &&
            !phone.includes(searchLower) &&
            !caseNum.includes(searchLower)
          ) {
            return false;
          }
        }
        if (country && !c.visaCountry.toLowerCase().includes(country.toLowerCase())) {
          return false;
        }
        if (type && !c.visaType.toLowerCase().includes(type.toLowerCase())) {
          return false;
        }
        if (fromDate && new Date(c.openingDate) < fromDate) {
          return false;
        }
        if (toDate && new Date(c.openingDate) > toDate) {
          return false;
        }
        return true;
      });

      return { ...col, cards, count: cards.length };
    });
  }, [sortedColumns, filters]);

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: VisaStatus;
    }) => visaCasesService.updateStatus(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['kanban', 'board'] });
      const previous = queryClient.getQueryData<KanbanColumn[]>(['kanban', 'board']);

      queryClient.setQueryData<KanbanColumn[]>(['kanban', 'board'], (old) => {
        if (!old) return old;
        let movedCard: VisaCase | undefined;
        const updated = old.map((col) => {
          if (col.cards.some((c) => c.id === id)) {
            movedCard = col.cards.find((c) => c.id === id);
            return {
              ...col,
              cards: col.cards.filter((c) => c.id !== id),
              count: col.count - 1,
            };
          }
          return col;
        });

        if (movedCard) {
          return updated.map((col) => {
            if (col.id === status) {
              return {
                ...col,
                cards: [{ ...movedCard!, currentStatus: status }, ...col.cards],
                count: col.count + 1,
              };
            }
            return col;
          });
        }
        return updated;
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['kanban', 'board'], context.previous);
      }
      toast.error('Erreur lors du déplacement de la carte');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'board'] });
    },
  });

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const card = (event.active.data.current as { card: VisaCase } | undefined)?.card;
      if (card) setActiveCard(card);
    },
    [],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveCard(null);

      const { active, over } = event;
      if (!over) return;

      const newStatus = over.id as VisaStatus;
      const fromColumn = sortedColumns.find((col) =>
        col.cards.some((c) => c.id === active.id),
      );

      if (!fromColumn || fromColumn.id === newStatus) return;

      statusMutation.mutate({ id: String(active.id), status: newStatus });
    },
    [sortedColumns, statusMutation],
  );

  const openDrawer = useCallback((card: VisaCase) => {
    setSelectedCard(card);
  }, []);

  const closeDrawer = useCallback(() => {
    setSelectedCard(null);
  }, []);

  return {
    columns: filteredColumns,
    isLoading,
    filters,
    setFilters,
    activeCard,
    selectedCard,
    handleDragStart,
    handleDragEnd,
    openDrawer,
    closeDrawer,
    totalCards: sortedColumns.reduce((sum, col) => sum + col.count, 0),
  };
}
