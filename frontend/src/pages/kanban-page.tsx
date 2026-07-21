import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@/hooks';
import { useKanbanBoard } from '@/hooks';
import { KanbanBoard, KanbanFilters, CardDetailsDrawer } from '@/components/kanban';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export function KanbanPage() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [incompleteReason, setIncompleteReason] = useState('');

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
    pendingIncomplete,
    confirmIncomplete,
    cancelIncomplete,
    totalCards,
  } = useKanbanBoard();

  const handleConfirmIncomplete = () => {
    confirmIncomplete(incompleteReason.trim());
    setIncompleteReason('');
  };

  const handleCancelIncomplete = () => {
    cancelIncomplete();
    setIncompleteReason('');
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="page-heading">{t('nav:kanbanBoard')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('kanban:totalCases', { count: totalCards })}
          </p>
        </div>
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

      {/* Incomplete dossier reason dialog */}
      <Dialog open={!!pendingIncomplete} onOpenChange={(open) => !open && handleCancelIncomplete()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('kanban:incompleteTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-sm text-muted-foreground">
              {t('kanban:incompleteDescription', { caseNumber: pendingIncomplete?.caseNumber ?? '' })}
            </p>
            <Label htmlFor="incomplete-reason">{t('kanban:incompleteReasonLabel')}</Label>
            <textarea
              id="incomplete-reason"
              data-testid="incomplete-reason-input"
              className="flex min-h-[90px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              placeholder={t('kanban:incompleteReasonPlaceholder')}
              value={incompleteReason}
              onChange={(e) => setIncompleteReason(e.target.value)}
              maxLength={500}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelIncomplete}>
              {t('common:cancel')}
            </Button>
            <Button onClick={handleConfirmIncomplete} disabled={!incompleteReason.trim()}>
              {t('common:save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
