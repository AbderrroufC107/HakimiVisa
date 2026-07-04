import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { Clock, ArrowRight, User, FileText, Calendar, Shield } from 'lucide-react';

export interface TimelineEvent {
  id: string;
  type: 'created' | 'status_change' | 'appointment' | 'visa_details' | 'note' | 'document' | 'system';
  title: string;
  description?: string;
  timestamp: string;
  user?: { firstName: string; lastName: string };
  metadata?: Record<string, unknown>;
}

interface CaseTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const typeConfig: Record<TimelineEvent['type'], { icon: typeof FileText; color: string; bg: string; labelKey: string }> = {
  created: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-100', labelKey: 'caseTimeline:createdStatus' },
  status_change: { icon: ArrowRight, color: 'text-indigo-500', bg: 'bg-indigo-100', labelKey: 'caseTimeline:status' },
  appointment: { icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-100', labelKey: 'caseTimeline:appointment' },
  visa_details: { icon: Shield, color: 'text-green-500', bg: 'bg-green-100', labelKey: 'caseTimeline:visaDetails' },
  note: { icon: FileText, color: 'text-orange-500', bg: 'bg-orange-100', labelKey: 'caseTimeline:note' },
  document: { icon: FileText, color: 'text-cyan-500', bg: 'bg-cyan-100', labelKey: 'caseTimeline:document' },
  system: { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100', labelKey: 'caseTimeline:system' },
};

export function CaseTimeline({ events, className }: CaseTimelineProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('fr') ? fr : enUS;

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        {t('common:noData')}
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-border" />
      <div className="space-y-0">
        {events.map((event) => {
          const config = typeConfig[event.type] ?? typeConfig.system;
          const Icon = config.icon;

          return (
            <div key={event.id} className="relative flex gap-4 pb-6 group">
              <div className="relative z-10 flex-shrink-0 mt-0.5">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-full border-2 border-background', config.bg)}>
                  <Icon className={cn('h-4 w-4', config.color)} />
                </div>
              </div>

              <div className="flex-1 min-w-0 pt-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{event.title}</p>
                    {event.description && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{event.description}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <time className="block text-xs text-muted-foreground" dateTime={event.timestamp}>
                      {format(new Date(event.timestamp), 'dd/MM/yyyy', { locale })}
                    </time>
                    <time className="block text-[10px] text-muted-foreground">
                      {format(new Date(event.timestamp), 'HH:mm', { locale })}
                    </time>
                  </div>
                </div>

                <div className="mt-1.5 flex items-center gap-2">
                  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium', config.bg, config.color)}>
                    {t(config.labelKey)}
                  </span>
                  {event.user && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <User className="h-3 w-3" />
                      {event.user.firstName} {event.user.lastName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
