import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDroppable } from '@dnd-kit/core';
import { Maximize2, Minimize2 } from 'lucide-react';
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
  onExpand: (columnId: KanbanColumnType['id']) => void;
  expanded?: boolean;
}

export const KanbanColumn = memo(function KanbanColumn({
  column,
  onViewCard,
  onMoveCard,
  onTogglePaid,
  onExpand,
  expanded = false,
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
        'flex shrink-0 flex-col rounded-xl border border-border bg-muted/30 transition-colors',
        expanded ? 'h-full min-h-[28rem] w-full' : 'w-[17rem]',
        isOver && 'border-primary/50 bg-primary/5 ring-2 ring-primary/30',
      )}
    >
      <div className="flex items-center justify-between gap-2 rounded-t-xl border-b border-border/70 bg-card/60 px-3 py-2.5 backdrop-blur-sm">
        <button
          type="button"
          data-testid={`kanban-column-toggle-${column.id}`}
          aria-label={t(expanded ? 'kanban:collapseColumn' : 'kanban:expandColumn', { column: column.title })}
          onClick={() => onExpand(column.id)}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md text-start outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className={cn('h-2 w-2 shrink-0 rounded-full', accent)} />
          <span className="truncate text-sm font-semibold tracking-tight">{column.title}</span>
          {expanded ? (
            <Minimize2 className="ms-auto h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <Maximize2 className="ms-auto h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </button>
        <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-bold tabular-nums text-muted-foreground">
          {column.count}
        </span>
      </div>

      <div
        ref={setNodeRef}
        data-testid={`kanban-dropzone-${column.id}`}
        data-drop-active={isOver}
        className={cn(
          'flex-1 overflow-y-auto',
          expanded ? 'grid content-start grid-cols-1 gap-4 p-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4' : 'flex flex-col gap-2.5 p-2.5',
        )}
        style={{ minHeight: expanded ? 320 : 120 }}
      >
        {column.cards.length === 0 && (
          <p className={cn('rounded-lg border border-dashed border-border py-8 text-center text-xs text-muted-foreground', expanded && 'col-span-full')}>
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
