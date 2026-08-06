import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { VisaCaseCard } from './visa-case-card';
import type { KanbanColumn as KanbanColumnType, VisaCase, VisaStatus } from '@/types';

/** Dot color per column — mirrors the card accent bar so both themes stay readable. */
const columnAccent: Record<string, string> = {
  DOSSIER_INCOMPLET: 'bg-amber-500',
  EN_ATTENTE: 'bg-yellow-500',
  EN_TRAITEMENT: 'bg-blue-500',
  RDV_OK: 'bg-orange-500',
  LIVREE: 'bg-teal-500',
};

interface KanbanColumnProps {
  column: KanbanColumnType;
  onViewCard: (card: VisaCase) => void;
  onMoveCard: (caseId: string, newStatus: VisaStatus) => void;
  onTogglePaid?: (caseId: string, isPaid: boolean) => void;
}

export const KanbanColumn = memo(function KanbanColumn({
  column,
  onViewCard,
  onMoveCard,
  onTogglePaid,
}: KanbanColumnProps) {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const accent = columnAccent[column.id] ?? 'bg-muted-foreground';

  return (
    <div
      data-testid={`kanban-column-${column.id}`}
      className={cn(
        'flex w-[17rem] shrink-0 flex-col rounded-xl border border-border bg-muted/30 transition-colors',
        isOver && 'border-primary/50 bg-primary/5 ring-2 ring-primary/30',
      )}
    >
      <div className="flex items-center justify-between gap-2 rounded-t-xl border-b border-border/70 bg-card/60 px-3 py-2.5 backdrop-blur-sm">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn('h-2 w-2 shrink-0 rounded-full', accent)} />
          <span className="truncate text-sm font-semibold tracking-tight">{column.title}</span>
        </div>
        <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-bold tabular-nums text-muted-foreground">
          {column.count}
        </span>
      </div>

      <div
        ref={setNodeRef}
        data-testid={`kanban-dropzone-${column.id}`}
        data-drop-active={isOver}
        className="flex flex-col gap-2.5 overflow-y-auto p-2.5"
        style={{ minHeight: 120 }}
      >
        {column.cards.length === 0 && (
          <p className="rounded-lg border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
            {t('kanban:noCards')}
          </p>
        )}
        {column.cards.map((card) => (
          <VisaCaseCard
            key={card.id}
            card={card}
            onView={onViewCard}
            onMove={onMoveCard}
            onTogglePaid={onTogglePaid}
          />
        ))}
      </div>
    </div>
  );
});
