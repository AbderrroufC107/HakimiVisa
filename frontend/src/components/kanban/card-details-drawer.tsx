import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { visaCasesService } from '@/services';
import { ROUTES } from '@/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/shared/badge';
import { X, ExternalLink, Clock, User, FileText, Globe, Phone, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VisaCase, VisaStatus, Client } from '@/types';

interface CardDetailsDrawerProps {
  card: VisaCase | null;
  onClose: () => void;
}

const statusColors: Record<VisaStatus, string> = {
  EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
  EN_TRAITEMENT: 'bg-blue-100 text-blue-800',
  RDV_OK: 'bg-orange-100 text-orange-800',
  VISA_OK: 'bg-green-100 text-green-800',
  VISA_REFUSEE: 'bg-red-100 text-red-800',
};

function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CardDetailsDrawer({ card, onClose }: CardDetailsDrawerProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dateLocale = i18n.language?.replace('_', '-') ?? 'en-US';
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: fullData } = useQuery({
    queryKey: ['visa-case', card?.id],
    queryFn: () => visaCasesService.findOne(card!.id),
    enabled: !!card,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (card) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [card, onClose]);

  useEffect(() => {
    if (card) {
      panelRef.current?.focus();
    }
  }, [card]);

  const visaCase = fullData;
  const client = visaCase?.client as Client | undefined;
  const statusHistory = visaCase?.statusHistories;

  return (
    <>
      {card && <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />}

      <div
        ref={panelRef}
        tabIndex={-1}
        data-testid="kanban-card-drawer"
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l bg-background shadow-xl transition-transform duration-300 focus:outline-none',
          card ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {card && (
          <>
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate font-mono text-sm font-semibold">
                  {card.caseNumber}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => navigate(ROUTES.VISA_CASES_DETAIL(card.id))}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <div>
                <Badge className={cn('text-xs', statusColors[card.currentStatus])}>
                  {t('status:' + card.currentStatus)}
                </Badge>
              </div>

              <section>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  {t('kanban:client')}
                </h4>
                <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                  <p className="text-sm font-medium">{client?.fullName ?? t('common:none')}</p>
                  {client && (
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {client.phoneNumber}
                      </div>
                      {client?.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {client.email}
                        </div>
                      )}
                      {client?.passportNumber && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-3 w-3" />
                          {client.passportNumber}
                        </div>
                      )}
                      {client?.nationality && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-3 w-3" />
                          {client.nationality}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  {t('kanban:visa')}
                </h4>
                <div className="space-y-1.5 rounded-lg border bg-muted/30 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('kanban:country')}</span>
                    <span className="font-medium">{card.visaCountry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('kanban:type')}</span>
                    <span className="font-medium">{card.visaType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('kanban:opened')}</span>
                    <span className="font-medium">{formatDate(card.openingDate, dateLocale)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('kanban:updated')}</span>
                    <span className="font-medium">{formatDate(card.updatedAt, dateLocale)}</span>
                  </div>
                  {visaCase?.creator && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('kanban:createdBy')}</span>
                      <span className="font-medium">
                        {visaCase.creator.firstName} {visaCase.creator.lastName}
                      </span>
                    </div>
                  )}
                </div>
              </section>

              {card.notes && (
                <section>
                  <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('kanban:notes')}
                  </h4>
                  <p className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                    {card.notes}
                  </p>
                </section>
              )}

              {statusHistory && statusHistory.length > 0 && (
                <section>
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {t('kanban:history')}
                  </h4>
                  <div className="space-y-2">
                    {(statusHistory ?? []).map((h: import('@/types').StatusHistory) => (
                      <div
                        key={h.id}
                        className="flex items-start gap-2 rounded-lg border bg-muted/30 p-2.5 text-xs"
                      >
                        <div className="flex flex-col items-center pt-0.5">
                          <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge className={cn('text-[10px]', statusColors[h.oldStatus])}>
                              {t('status:' + h.oldStatus)}
                            </Badge>
                            <span className="text-muted-foreground">&rarr;</span>
                            <Badge className={cn('text-[10px]', statusColors[h.newStatus])}>
                              {t('status:' + h.newStatus)}
                            </Badge>
                          </div>
                          <div className="mt-0.5 text-muted-foreground">
                            {h.changer
                              ? `${h.changer.firstName} ${h.changer.lastName}`
                              : t('kanban:unknownUser')}
                            <span className="ml-1">· {formatDate(h.changedAt, dateLocale)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {(!statusHistory || statusHistory.length === 0) && (
                <p className="text-center text-xs text-muted-foreground">
                  {t('kanban:noHistory')}
                </p>
              )}
            </div>

            <div className="border-t p-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  navigate(ROUTES.VISA_CASES_DETAIL(card.id));
                  onClose();
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {t('kanban:viewFullPage')}
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
