import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Mail, MessageCircle, Send } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { templatesService } from '@/services';
import { cn } from '@/lib/utils';
import type { ApiError, TemplateChannel } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visaCaseId: string;
  channel: TemplateChannel;
  /** Only needed for email; the API refuses without a recipient. */
  clientEmail?: string | null;
  onSent?: () => void;
}

/**
 * Picks which message to send. The desk keeps several templates per channel —
 * a first notice, a reminder, a refusal — and which one fits is a judgement
 * the agent makes per case, so it is asked rather than guessed.
 */
export function SendMessageDialog({
  open,
  onOpenChange,
  visaCaseId,
  channel,
  clientEmail,
  onSent,
}: Props) {
  const { t } = useTranslation();
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates', channel],
    queryFn: () => templatesService.findAll(channel),
    enabled: open,
  });

  // Start on the first template so the preview is never blank on opening.
  useEffect(() => {
    if (open && templates.length > 0 && !templates.some((tpl) => tpl.id === templateId)) {
      setTemplateId(templates[0]!.id);
    }
  }, [open, templates, templateId]);

  const {
    data: preview,
    isLoading: previewLoading,
    error: previewError,
  } = useQuery({
    queryKey: ['template-preview', visaCaseId, templateId, channel],
    queryFn: () => templatesService.render({ visaCaseId, templateId: templateId!, channel }),
    enabled: open && !!templateId,
    retry: false,
  });

  const handleSend = async () => {
    if (!templateId) return;
    setSending(true);
    try {
      if (channel === 'WHATSAPP') {
        const res = await templatesService.whatsappLink({ visaCaseId, templateId, channel });
        window.open(res.url, '_blank');
      } else {
        if (!clientEmail) {
          toast.error(t('templates:clientNoEmail'));
          return;
        }
        await templatesService.sendEmail({ visaCaseId, templateId, channel, to: clientEmail });
      }
      toast.success(t('common:success'));
      onSent?.();
      onOpenChange(false);
    } catch (error) {
      // The API says exactly what is missing — a template that quotes an
      // appointment the case has not got, a client with no email. Replacing
      // that with a generic word hides the only useful part.
      toast.error((error as ApiError)?.message || t('common:error'));
    } finally {
      setSending(false);
    }
  };

  const Icon = channel === 'WHATSAPP' ? MessageCircle : Mail;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            {t('templates:chooseTemplate')}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : templates.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t('templates:noTemplateForChannel')}
          </p>
        ) : (
          <div className="space-y-3">
            <div
              className="flex flex-wrap gap-1.5"
              role="radiogroup"
              aria-label={t('templates:chooseTemplate')}
            >
              {templates.map((tpl) => {
                const active = tpl.id === templateId;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    data-testid={`template-option-${tpl.id}`}
                    onClick={() => setTemplateId(tpl.id)}
                    className={cn(
                      'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
                    )}
                  >
                    {tpl.name}
                  </button>
                );
              })}
            </div>

            <div
              className="max-h-56 overflow-y-auto rounded-lg border bg-muted/30 p-3"
              data-testid="template-preview"
            >
              {previewLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : previewError ? (
                // Better found here than after the client has been messaged.
                <p className="text-sm text-destructive">
                  {(previewError as unknown as ApiError)?.message || t('common:error')}
                </p>
              ) : (
                <>
                  {preview?.subject && (
                    <p className="mb-1.5 border-b pb-1.5 text-sm font-semibold">{preview.subject}</p>
                  )}
                  <p className="whitespace-pre-wrap text-sm text-foreground">{preview?.body}</p>
                </>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common:cancel')}
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || !templateId || !!previewError || previewLoading}
            data-testid="template-send"
          >
            {sending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {t('templates:send')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
