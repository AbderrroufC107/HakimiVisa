import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

export interface LabelData {
  fullName: string;
  phoneNumber: string;
  passportNumber?: string | null;
  passportExpiry?: string | null;
  visaCountry: string;
  visaType: string;
}

function formatExpiry(date?: string | null): string {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getUTCFullYear()}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface LabelSize {
  /** Stable id used as the radio value. */
  id: string;
  /** Human label shown in the picker. */
  name: string;
  /** Page width in millimetres. */
  width: number;
  /** Page height in millimetres. */
  height: number;
}

/**
 * Page presets offered in the print dialog. Typography scales with the page
 * width (see `scaleFor`), so every preset prints on exactly one page.
 */
export const DEFAULT_LABEL_SIZE: LabelSize = {
  id: '100x50',
  name: '100 × 50 mm',
  width: 100,
  height: 50,
};

export const LABEL_SIZES: LabelSize[] = [
  DEFAULT_LABEL_SIZE,
  { id: '100x70', name: '100 × 70 mm', width: 100, height: 70 },
  { id: 'a6', name: 'A6 · 105 × 148 mm', width: 105, height: 148 },
  { id: 'a5', name: 'A5 · 148 × 210 mm', width: 148, height: 210 },
  { id: 'a4', name: 'A4 · 210 × 297 mm', width: 210, height: 297 },
];

/** Font/'spacing multiplier: the 100 mm-wide roll label is the 1× baseline. */
function scaleFor(size: LabelSize): number {
  return size.width / 100;
}

export function printClientLabel(data: LabelData, size: LabelSize = DEFAULT_LABEL_SIZE) {
  const winWidth = 560;
  const winHeight = 480;
  const left = Math.max(0, Math.round((window.screen.width - winWidth) / 2));
  const top = Math.max(0, Math.round((window.screen.height - winHeight) / 2));
  const win = window.open(
    '',
    '_blank',
    `width=${winWidth},height=${winHeight},left=${left},top=${top},resizable=yes,scrollbars=yes`,
  );
  if (!win) return;

  const s = scaleFor(size);
  // Portrait sheets have vertical slack: spread the rows and separate them
  // instead of leaving a large blank band above and below.
  const isTall = size.height > size.width;
  const rows = [
    ['PASSEPORT', escapeHtml(data.passportNumber || '—')],
    ['EXP. PASSEPORT', escapeHtml(formatExpiry(data.passportExpiry))],
    ['TÉLÉPHONE', escapeHtml(data.phoneNumber)],
    ['DESTINATION', escapeHtml(data.visaCountry)],
    ['TYPE DE VISA', escapeHtml(data.visaType)],
  ]
    .map(
      ([l, v]) =>
        `<div class="lbl-row"><span class="lbl-key">${l}</span><span class="lbl-val">${v}</span></div>`,
    )
    .join('');

  win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Label - ${escapeHtml(data.fullName)} (${escapeHtml(size.name)})</title>
<style>
  @page { size: ${size.width}mm ${size.height}mm; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: ${size.width}mm; height: ${size.height}mm;
    overflow: hidden;
  }
  body {
    font-family: Arial, Helvetica, sans-serif;
    background: #f1f5f9;
  }
  .lbl-box {
    width: ${size.width}mm; height: ${size.height}mm;
    padding: ${(3 * s).toFixed(2)}mm ${(4 * s).toFixed(2)}mm;
    display: flex; flex-direction: column;
    border: ${(0.3 * s).toFixed(2)}mm solid #1a1a2e; background: #ffffff;
    overflow: hidden;
  }
  .lbl-head {
    display: flex; align-items: center; justify-content: space-between; gap: ${(2 * s).toFixed(2)}mm;
    border-bottom: ${(0.4 * s).toFixed(2)}mm solid #1a73e8;
    padding-bottom: ${(1.5 * s).toFixed(2)}mm; margin-bottom: ${(1.5 * s).toFixed(2)}mm;
  }
  .lbl-name {
    font-size: ${(13 * s).toFixed(1)}pt; font-weight: 800; color: #1a1a2e;
    text-transform: uppercase; line-height: 1.1; overflow-wrap: anywhere;
  }
  .lbl-brand { font-size: ${(7 * s).toFixed(1)}pt; font-weight: 700; color: #1a73e8; letter-spacing: 0.5px; white-space: nowrap; }
  .lbl-rows {
    flex: 1; min-height: 0;
    display: flex; flex-direction: column;
    justify-content: ${isTall ? 'space-evenly' : 'center'};
  }
  .lbl-row {
    display: flex; justify-content: space-between; align-items: baseline; gap: ${(3 * s).toFixed(2)}mm;
    padding: ${(0.6 * s).toFixed(2)}mm 0;
    ${isTall ? `border-bottom: ${(0.15 * s).toFixed(2)}mm dashed #e5e7eb;` : ''}
  }
  .lbl-row:last-child { border-bottom: none; }
  .lbl-key { color: #6b7280; font-size: ${(6.5 * s).toFixed(1)}pt; font-weight: 600; white-space: nowrap; }
  .lbl-val { color: #111827; font-size: ${(8.5 * s).toFixed(1)}pt; font-weight: 700; text-align: right; overflow-wrap: anywhere; }
  .lbl-foot {
    margin-top: ${(1 * s).toFixed(2)}mm; padding-top: ${(1 * s).toFixed(2)}mm;
    border-top: ${(0.2 * s).toFixed(2)}mm dashed #d1d5db;
    display: flex; justify-content: space-between;
  }
  .lbl-foot span { font-size: ${(6 * s).toFixed(1)}pt; color: #9ca3af; }
  @media print {
    body { background: none; }
    .lbl-box { border-color: #1a1a2e; }
  }
</style>
</head>
<body>
  <div class="lbl-box">
    <div class="lbl-head">
      <span class="lbl-name">${escapeHtml(data.fullName)}</span>
      <span class="lbl-brand">HakimiVisa</span>
    </div>
    <div class="lbl-rows">${rows}</div>
    <div class="lbl-foot">
      <span>${new Date().toLocaleDateString('fr-FR')}</span>
      <span>hakimivisa.cloud</span>
    </div>
  </div>
  <script>window.onload = function () { window.print(); window.onafterprint = function () { window.close(); }; };</script>
</body>
</html>`);
  win.document.close();
}

interface LabelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: LabelData | null;
}

export function LabelDialog({ open, onOpenChange, data }: LabelDialogProps) {
  const { t } = useTranslation();
  const [sizeId, setSizeId] = useState(DEFAULT_LABEL_SIZE.id);
  const size = LABEL_SIZES.find((s) => s.id === sizeId) ?? DEFAULT_LABEL_SIZE;
  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('label:printTitle')}</DialogTitle>
        </DialogHeader>

        {/* Page size picker */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('label:size')}
          </p>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t('label:size')}>
            {LABEL_SIZES.map((option) => {
              const isActive = option.id === sizeId;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  data-testid={`label-size-${option.id}`}
                  onClick={() => setSizeId(option.id)}
                  className={cn(
                    'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
                  )}
                >
                  {option.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview — mirrors the chosen page ratio */}
        <div
          className="mx-auto w-full space-y-1 rounded-lg border-2 border-slate-800 bg-white p-3"
          style={{ aspectRatio: `${size.width} / ${size.height}`, maxHeight: '46vh' }}
        >
          <div className="flex items-center justify-between border-b-2 border-blue-600 pb-1.5 mb-1.5">
            <span className="text-sm font-extrabold uppercase text-slate-900">{data.fullName}</span>
            <span className="text-[10px] font-bold text-blue-600">HakimiVisa</span>
          </div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t('label:passport')}</span><span className="font-bold">{data.passportNumber || '—'}</span></div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t('label:passportExpiry')}</span><span className="font-bold">{formatExpiry(data.passportExpiry)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t('label:phone')}</span><span className="font-bold">{data.phoneNumber}</span></div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t('label:country')}</span><span className="font-bold">{data.visaCountry}</span></div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t('label:visaType')}</span><span className="font-bold">{data.visaType}</span></div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common:cancel')}
          </Button>
          <Button onClick={() => printClientLabel(data, size)}>
            <Printer className="h-4 w-4 mr-2" />
            {t('label:print')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
