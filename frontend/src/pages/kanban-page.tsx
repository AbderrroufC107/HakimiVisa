import { Loader2, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useMediaQuery } from '@/hooks';
import { useKanbanBoard } from '@/hooks';
import { ROUTES } from '@/constants';
import { Button } from '@/components/ui/button';
import { KanbanBoard, KanbanFilters, CardDetailsDrawer } from '@/components/kanban';

export function KanbanPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const {
    columns,
    isLoading,
    filters,
    setFilters,
    activeCard,
    selectedCard,
    handleDragStart,
    handleDragEnd,
    openDrawer,
    closeDrawer,
    moveCard,
    togglePaid,
    totalCards,
  } = useKanbanBoard();

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="page-heading">{t('nav:kanbanBoard')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('kanban:totalCases', { count: totalCards })}
          </p>
        </div>
        <Button onClick={() => navigate(ROUTES.VISA_CASES_NEW)}>
          <Plus className="h-4 w-4 mr-1" />
          {t('common:newDossier')}
        </Button>
      </div>

      <KanbanFilters filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className={isMobile ? 'overflow-x-auto' : 'flex-1 overflow-hidden'}>
          <KanbanBoard
            columns={columns}
            activeCard={activeCard}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onViewCard={openDrawer}
            onMoveCard={moveCard}
            onTogglePaid={togglePaid}
          />
        </div>
      )}

      <CardDetailsDrawer card={selectedCard} onClose={closeDrawer} />
    </div>
  );
}
