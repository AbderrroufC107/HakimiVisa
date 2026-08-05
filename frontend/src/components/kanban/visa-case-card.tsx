import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDraggable } from '@dnd-kit/core';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { GripVertical, Eye, ChevronLeft, ChevronRight, CheckCircle2, CircleDollarSign, AlertTriangle, MessageCircle, Mail, Loader2, IdCard, Phone, Globe2, Building2 } from 'lucide-react';
import { templatesService } from '@/services';
import { AppointmentPicker } from './appointment-picker';
import { STATUS_PIPELINE } from '@/constants';
import type { VisaCase, VisaStatus, ApiError } from '@/types';

const COLUMN_FLOW = STATUS_PIPELINE;

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
  });
}

function initials(name?: string | null) {
  if (!name) return '—';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

/**
 * Most consulates refuse a passport with under six months left, so the board
 * flags that window rather than only the date itself.
 */
function passportValidity(expiry: string): {
  level: 'expired' | 'expiring' | 'ok';
  className: string;
  titleKey: string;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(expiry);

  if (due < today) {
    return {
      level: 'expired',
      className: 'text-red-600 dark:text-red-400',
      titleKey: 'kanban:passportExpired',
    };
  }

  const sixMonths = new Date(today);
  sixMonths.setMonth(sixMonths.getMonth() + 6);
  if (due < sixMonths) {
    return {
      level: 'expiring',
      className: 'text-amber-600 dark:text-amber-400',
      titleKey: 'kanban:passportExpiringSoon',
    };
  }

  return { level: 'ok', className: 'text-muted-foreground', titleKey: 'visaCases:passportExpiry' };
}

/** Left accent bar per status — keeps the board scannable at a glance. */
const statusAccent: Record<VisaStatus, string> = {
  DOSSIER_INCOMPLET: 'bg-amber-500',
  EN_ATTENTE: 'bg-yellow-500',
  EN_TRAITEMENT: 'bg-blue-500',
  RDV_OK: 'bg-orange-500',
  VISA_OK: 'bg-emerald-500',
  VISA_REFUSEE: 'bg-red-500',
  LIVREE: 'bg-teal-500',
};

const chipBase =
  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-4 ring-1 ring-inset';

const tone = {
  neutral: 'bg-muted text-muted-foreground ring-border',
  primary: 'bg-primary/10 text-primary ring-primary/20',
  success:
    'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/25',
  danger:
    'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/25',
  warning:
    'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/25',
} as const;

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
  const [sending, setSending] = useState<'whatsapp' | 'email' | null>(null);

  const handleSendWhatsApp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!card.id) return;
    setSending('whatsapp');
    try {
      const res = await templatesService.whatsappLink({ visaCaseId: card.id, channel: 'WHATSAPP' });
      window.open(res.url, '_blank');
      toast.success(t('common:success'));
    } catch (error) {
      // The API explains what is missing (no email, no template...); showing
      // a generic word instead would hide the one thing the agent needs.
      toast.error((error as ApiError)?.message || t('common:error'));
    } finally {
      setSending(null);
    }
  };

  const handleSendEmail = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!card.id) return;
    setSending('email');
    try {
      const client = card.client as { id: string; fullName: string; phoneNumber: string; email?: string | null; passportNumber?: string | null; passportExpiry?: string | null } | undefined;
      const to = client?.email;
      if (!to) { toast.error(t('templates:clientNoEmail')); setSending(null); return; }
      await templatesService.sendEmail({ visaCaseId: card.id, channel: 'EMAIL', to });
      toast.success(t('common:success'));
    } catch (error) {
      // The API explains what is missing (no email, no template...); showing
      // a generic word instead would hide the one thing the agent needs.
      toast.error((error as ApiError)?.message || t('common:error'));
    } finally {
      setSending(null);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid="kanban-card"
      data-case-id={card.id}
      data-status={card.currentStatus}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm',
        'transition-all duration-150 hover:border-primary/40 hover:shadow-md',
        isDragging && 'z-50 opacity-90 shadow-xl ring-2 ring-primary',
      )}
    >
      <span
        aria-hidden
        className={cn('absolute inset-y-0 start-0 w-1', statusAccent[card.currentStatus])}
      />

      <div className="ps-3.5 pe-2.5 py-3">
        {/* ─── Header: client identity ─────────────────────────── */}
        <div className="flex items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold uppercase text-primary">
            {initials(card.client?.fullName)}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight text-foreground">
              {card.client?.fullName ?? t('common:none')}
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0" />
              <span className="truncate tabular-nums" dir="ltr">
                {card.client?.phoneNumber ?? '—'}
              </span>
            </div>
            <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground/70">
              {card.caseNumber}
            </p>
            {/* Whose desk this came from matters at a glance once partners file. */}
            {card.submittedByAgency && (
              <span
                className="mt-1 inline-flex max-w-full items-center gap-1 truncate rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/25"
                title={card.submittedByAgency.name}
              >
                <Building2 className="h-3 w-3 shrink-0" />
                <span className="truncate">{card.submittedByAgency.name}</span>
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              data-testid="kanban-card-view"
              aria-label={t('kanban:viewCase', { caseNumber: card.caseNumber })}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onView(card);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <button
              type="button"
              className="flex h-7 w-6 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground/40 transition-colors hover:bg-accent hover:text-muted-foreground active:cursor-grabbing"
              data-testid="kanban-card-drag-handle"
              aria-label={t('kanban:moveCase', { caseNumber: card.caseNumber })}
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ─── Visa chips ──────────────────────────────────────── */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className={cn(chipBase, tone.primary)}>
            <Globe2 className="h-3 w-3" />
            {card.visaCountry}
          </span>
          <span className={cn(chipBase, tone.neutral)}>{card.visaType}</span>
        </div>

        {/* ─── Passport ────────────────────────────────────────────
            Shown on every card: the number and its expiry are what the
            desk checks first, whatever column the case sits in. */}
        {(card.client?.passportNumber || card.client?.passportExpiry) && (
          <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-muted/50 px-2 py-1.5">
            <IdCard className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate font-mono text-[12px] font-medium text-foreground" title={t('kanban:passport')}>
              {card.client?.passportNumber ?? '—'}
            </span>
            {card.client?.passportExpiry && (() => {
              const validity = passportValidity(card.client.passportExpiry);
              return (
                <span
                  className={cn(
                    'ml-auto flex shrink-0 items-center gap-1 text-[11px] font-medium',
                    validity.className,
                  )}
                  title={t(validity.titleKey)}
                >
                  {validity.level !== 'ok' && <AlertTriangle className="h-3 w-3 shrink-0" />}
                  {new Date(card.client.passportExpiry).toLocaleDateString(dateLocale, {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              );
            })()}
          </div>
        )}

        {/* ─── Incomplete reason ───────────────────────────────── */}
        {card.currentStatus === 'DOSSIER_INCOMPLET' && card.incompleteReason && (
          <div
            className="mt-2.5 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 dark:border-amber-500/25 dark:bg-amber-500/10"
            title={card.incompleteReason}
          >
            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="line-clamp-2 text-[11px] leading-4 text-amber-800 dark:text-amber-300">
              {card.incompleteReason}
            </span>
          </div>
        )}

        {/* ─── Price / payment (RDV OK) ────────────────────────── */}
        {isRdvOk && card.price != null && card.price > 0 && (
          <div className="mt-2.5 flex items-center justify-between rounded-lg bg-muted/60 px-2 py-1.5">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <CircleDollarSign className="h-4 w-4 text-orange-500" />
              <span className="tabular-nums">{card.price.toLocaleString()} DA</span>
            </div>
            <span className={cn(chipBase, card.isPaid ? tone.success : tone.danger)}>
              {card.isPaid ? t('clients:paid') : t('clients:unpaid')}
            </span>
          </div>
        )}

        {/* ─── Passport + appointment + messaging (RDV OK) ─────── */}
        {isRdvOk && (
          <div className="mt-2.5 space-y-2">
            <AppointmentPicker
              visaCaseId={card.id}
              appointment={card.appointments?.[0]}
              variant="card"
            />

            <div className="grid grid-cols-2 gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-full px-2 text-xs font-medium"
                onClick={handleSendWhatsApp}
                disabled={sending !== null}
              >
                {sending === 'whatsapp' ? (
                  <Loader2 className="me-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <MessageCircle className="me-1 h-3.5 w-3.5 text-emerald-600" />
                )}
                WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-full px-2 text-xs font-medium"
                onClick={handleSendEmail}
                disabled={sending !== null}
              >
                {sending === 'email' ? (
                  <Loader2 className="me-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Mail className="me-1 h-3.5 w-3.5 text-blue-600" />
                )}
                Email
              </Button>
            </div>
          </div>
        )}

        {/* ─── Payment toggle (Livrée) ─────────────────────────── */}
        {isLivree && (
          <div className="mt-2.5 flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-2 py-1.5">
            <span className={cn(chipBase, card.isPaid ? tone.success : tone.danger)}>
              {card.isPaid ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <CircleDollarSign className="h-3 w-3" />
              )}
              {card.isPaid ? t('clients:paid') : t('clients:unpaid')}
            </span>
            {onTogglePaid && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground"
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

        {/* ─── Footer: dates + step navigation ─────────────────── */}
        <div className="mt-3 border-t border-border/60 pt-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground/80">
            <span className="truncate">
              {t('kanban:opened')} {formatDate(card.openingDate, dateLocale)}
            </span>
            <span className="truncate">
              {t('kanban:updated')} {formatDate(card.updatedAt, dateLocale)}
            </span>
          </div>

          {(hasPrev || hasNext) && (
            <div className="mt-2 flex items-center gap-1.5">
              {hasPrev && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 flex-1 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove(card.id, prevStatus!);
                  }}
                >
                  <ChevronLeft className="me-0.5 h-3.5 w-3.5 rtl:rotate-180" />
                  {t('kanban:back')}
                </Button>
              )}
              {hasNext && (
                <Button
                  size="sm"
                  className={cn('h-7 flex-1 px-2 text-xs font-medium', !hasPrev && 'ms-auto')}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove(card.id, nextStatus!);
                  }}
                >
                  {t('kanban:next')}
                  <ChevronRight className="ms-0.5 h-3.5 w-3.5 rtl:rotate-180" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
