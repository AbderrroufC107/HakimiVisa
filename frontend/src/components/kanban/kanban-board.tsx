import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core';
import { KanbanColumn } from './kanban-column';
import { VisaCaseCard } from './visa-case-card';
import type { KanbanColumn as KanbanColumnType, VisaCase, VisaStatus } from '@/types';

interface KanbanBoardProps {
  columns: KanbanColumnType[];
  activeCard: VisaCase | null;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onViewCard: (card: VisaCase) => void;
  onMoveCard: (caseId: string, newStatus: VisaStatus) => void;
  onTogglePaid?: (caseId: string, isPaid: boolean) => void;
}

export function KanbanBoard({
  columns,
  activeCard,
  onDragStart,
  onDragEnd,
  onViewCard,
  onMoveCard,
  onTogglePaid,
}: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="scrollbar-thin flex h-full gap-4 overflow-x-auto pb-3">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            onViewCard={onViewCard}
            onMoveCard={onMoveCard}
            onTogglePaid={onTogglePaid}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCard && (
          <div className="w-[19rem] rotate-2 cursor-grabbing opacity-95 drop-shadow-xl">
            <VisaCaseCard card={activeCard} onView={() => {}} onMove={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
