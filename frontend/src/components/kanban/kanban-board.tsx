import { DndContext, DragOverlay, PointerSensor, pointerWithin, useSensor, useSensors, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core';
import { Minimize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { KanbanColumn } from './kanban-column';
import { VisaCaseCard } from './visa-case-card';
import type { KanbanColumn as KanbanColumnType, KanbanColumnId, VisaCase, VisaStatus } from '@/types';

interface KanbanBoardProps {
  columns: KanbanColumnType[];
  activeCard: VisaCase | null;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onViewCard: (card: VisaCase) => void;
  onMoveCard: (caseId: string, newStatus: VisaStatus) => void;
  onTogglePaid?: (caseId: string, isPaid: boolean) => void;
  expandedColumnId: KanbanColumnId | null;
  onToggleColumn: (columnId: KanbanColumnId) => void;
}

export function KanbanBoard({
  columns,
  activeCard,
  onDragStart,
  onDragEnd,
  onViewCard,
  onMoveCard,
  onTogglePaid,
  expandedColumnId,
  onToggleColumn,
}: KanbanBoardProps) {
  const { t } = useTranslation();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );
  const expandedColumn = expandedColumnId
    ? columns.find((column) => column.id === expandedColumnId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      // The dragged card is drawn wider than a column, so matching by overlap
      // area drops it into whichever column the graphic happens to cover most —
      // often one over from where the cursor is. Go by the cursor instead.
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {expandedColumn ? (
        <div
          data-testid={`kanban-expanded-${expandedColumn.id}`}
          className="flex h-full min-h-[32rem] flex-col rounded-xl border border-border bg-muted/20 p-3 sm:p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-bold">{expandedColumn.title}</p>
              <p className="text-sm text-muted-foreground">
                {t('kanban:expandedColumn', { count: expandedColumn.count })}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              data-testid="kanban-collapse-column"
              onClick={() => onToggleColumn(expandedColumn.id)}
            >
              <Minimize2 className="me-1.5 h-4 w-4" />
              {t('kanban:collapseColumn')}
            </Button>
          </div>
          <KanbanColumn
            column={expandedColumn}
            expanded
            onExpand={onToggleColumn}
            onViewCard={onViewCard}
            onMoveCard={onMoveCard}
            onTogglePaid={onTogglePaid}
          />
        </div>
      ) : (
        <div className="scrollbar-thin flex h-full gap-4 overflow-x-auto pb-3">
          {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            onExpand={onToggleColumn}
            onViewCard={onViewCard}
            onMoveCard={onMoveCard}
            onTogglePaid={onTogglePaid}
          />
          ))}
        </div>
      )}

      {/* The card in hand is the same width as a column, so it reads as
          belonging to the column it is over. */}
      <DragOverlay>
        {activeCard && (
          <div className="w-[17rem] rotate-2 cursor-grabbing opacity-95 drop-shadow-xl">
            <VisaCaseCard card={activeCard} onView={() => {}} onMove={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
