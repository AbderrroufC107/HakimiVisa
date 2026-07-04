import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { VisaCaseCard } from './visa-case-card';
import type { KanbanColumn as KanbanColumnType } from '@/types';
import type { VisaCase } from '@/types';

interface KanbanColumnProps {
  column: KanbanColumnType;
  onViewCard: (card: VisaCase) => void;
}

export const KanbanColumn = memo(function KanbanColumn({
  column,
  onViewCard,
}: KanbanColumnProps) {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const headerColor = column.color.split(' ')[0] ?? 'bg-gray-100';

  return (
    <div
      data-testid={`kanban-column-${column.id}`}
      className={cn(
        'flex w-72 shrink-0 flex-col rounded-xl border bg-muted/40',
        isOver && 'ring-2 ring-primary/50 bg-primary/5',
      )}
    >
      <div className={cn('flex items-center justify-between rounded-t-xl px-3 py-2.5', headerColor)}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate text-sm font-semibold">{column.title}</span>
        </div>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background/60 text-[11px] font-bold tabular-nums">
          {column.count}
        </span>
      </div>

      <div
        ref={setNodeRef}
        data-testid={`kanban-dropzone-${column.id}`}
        className="flex flex-col gap-2 overflow-y-auto p-2"
        style={{ minHeight: 120 }}
      >
        {column.cards.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">
            {t('kanban:noCards')}
          </p>
        )}
        {column.cards.map((card) => (
          <VisaCaseCard key={card.id} card={card} onView={onViewCard} />
        ))}
      </div>
    </div>
  );
});
