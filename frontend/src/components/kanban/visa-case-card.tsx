import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/shared/badge';
import { Button } from '@/components/ui/button';
import { GripVertical, Eye, ChevronLeft, ChevronRight, CheckCircle2, CircleDollarSign, AlertTriangle } from 'lucide-react';
import type { VisaCase, VisaStatus } from '@/types';

const COLUMN_FLOW: VisaStatus[] = ['EN_ATTENTE', 'DOSSIER_INCOMPLET', 'EN_TRAITEMENT', 'RDV_OK', 'LIVREE'];

interface VisaCaseCardProps {
  card: VisaCase;
  onView: (card: VisaCase) => void;
  onMove: (caseId: string, newStatus: VisaStatus) => void;
  onTogglePaid?: (caseId: string, isPaid: boolean) => void;
}

function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const statusBadgeColors: Record<VisaStatus, string> = {
  EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
  DOSSIER_INCOMPLET: 'bg-amber-100 text-amber-800',
  EN_TRAITEMENT: 'bg-blue-100 text-blue-800',
  RDV_OK: 'bg-orange-100 text-orange-800',
  VISA_OK: 'bg-green-100 text-green-800',
  VISA_REFUSEE: 'bg-red-100 text-red-800',
  LIVREE: 'bg-teal-100 text-teal-800',
};

export const VisaCaseCard = memo(function VisaCaseCard({
  card,
  onView,
  onMove,
  onTogglePaid,
}: VisaCaseCardProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.replace('_', '-') ?? 'en-US';
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: card.id,
    data: { card, fromStatus: card.currentStatus },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const currentIndex = COLUMN_FLOW.indexOf(card.currentStatus);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < COLUMN_FLOW.length - 1;
  const prevStatus = hasPrev ? COLUMN_FLOW[currentIndex - 1] : null;
  const nextStatus = hasNext ? COLUMN_FLOW[currentIndex + 1] : null;
  const isLivree = card.currentStatus === 'LIVREE';
  const isRdvOk = card.currentStatus === 'RDV_OK';

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid="kanban-card"
      data-case-id={card.id}
      data-status={card.currentStatus}
      className={cn(
        'group rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md',
        isDragging && 'z-50 opacity-80 shadow-xl ring-2 ring-primary',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <button
            className="mt-0.5 cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground"
            data-testid="kanban-card-drag-handle"
            aria-label={t('kanban:moveCase', { caseNumber: card.caseNumber })}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-sm font-semibold">
              {card.client?.fullName ?? t('common:none')}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {card.client?.phoneNumber ?? ''}
            </p>
            <p className="truncate text-xs font-mono text-muted-foreground">
              {card.caseNumber}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          data-testid="kanban-card-view"
          aria-label={t('kanban:viewCase', { caseNumber: card.caseNumber })}
          className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onView(card);
          }}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge className={cn('text-[10px]', statusBadgeColors[card.currentStatus])}>
          {card.visaCountry}
        </Badge>
        <Badge className="bg-gray-100 text-gray-700 text-[10px]">
          {card.visaType}
        </Badge>
      </div>

      {card.currentStatus === 'DOSSIER_INCOMPLET' && card.incompleteReason && (
        <div
          className="mt-2 flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 p-1.5 dark:bg-amber-950/40"
          title={card.incompleteReason}
        >
          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0 text-amber-600" />
          <span className="line-clamp-2 text-[10px] text-amber-800 dark:text-amber-300">
            {card.incompleteReason}
          </span>
        </div>
      )}

      {isRdvOk && card.price != null && card.price > 0 && (
        <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-orange-700">
          <CircleDollarSign className="h-3.5 w-3.5" />
          <span>{card.price.toLocaleString()} DA</span>
          {card.isPaid && (
            <Badge className="ml-1 bg-green-100 text-green-700 text-[10px]">{t('clients:paid')}</Badge>
          )}
          {!card.isPaid && (
            <Badge className="ml-1 bg-red-100 text-red-700 text-[10px]">{t('clients:unpaid')}</Badge>
          )}
        </div>
      )}

      {isLivree && (
        <div className="mt-2 flex items-center gap-1.5">
          {card.isPaid ? (
            <Badge className="bg-green-100 text-green-700 text-[10px]">
              <CheckCircle2 className="mr-0.5 h-3 w-3" />
              {t('clients:paid')}
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-700 text-[10px]">
              <CircleDollarSign className="mr-0.5 h-3 w-3" />
              {t('clients:unpaid')}
            </Badge>
          )}
          {onTogglePaid && (
            <Button
              variant="outline"
              size="sm"
              className="h-5 px-1.5 text-[10px]"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePaid(card.id, !card.isPaid);
              }}
            >
              {card.isPaid ? t('clients:markUnpaid') : t('clients:markPaid')}
            </Button>
          )}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{t('kanban:opened') + ':'} {formatDate(card.openingDate, dateLocale)}</span>
        <span>{t('kanban:updated') + ':'} {formatDate(card.updatedAt, dateLocale)}</span>
      </div>

      <div className="mt-2 flex items-center gap-1">
        {hasPrev && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 flex-1 text-[10px] px-1"
            onClick={(e) => {
              e.stopPropagation();
              onMove(card.id, prevStatus!);
            }}
          >
            <ChevronLeft className="h-3 w-3 mr-0.5" />
            {t('kanban:back')}
          </Button>
        )}
        {hasNext && (
          <Button
            variant="outline"
            size="sm"
            className={cn("h-6 flex-1 text-[10px] px-1", !hasPrev && "ml-auto")}
            onClick={(e) => {
              e.stopPropagation();
              onMove(card.id, nextStatus!);
            }}
          >
            {t('kanban:next')}
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </Button>
        )}
      </div>
    </div>
  );
});
