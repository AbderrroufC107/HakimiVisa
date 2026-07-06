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
      <div className="flex gap-4 overflow-x-auto pb-4">
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
          <div className="w-72 rotate-3 opacity-90">
            <VisaCaseCard card={activeCard} onView={() => {}} onMove={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
