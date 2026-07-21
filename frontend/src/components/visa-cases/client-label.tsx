import { useTranslation } from 'react-i18next';
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

export function printClientLabel(data: LabelData) {
  const win = window.open('', '_blank', 'width=420,height=320');
  if (!win) return;

  const rows = [
    ['PASSEPORT', escapeHtml(data.passportNumber || '—')],
    ['EXP. PASSEPORT', escapeHtml(formatExpiry(data.passportExpiry))],
    ['TÉLÉPHONE', escapeHtml(data.phoneNumber)],
    ['DESTINATION', escapeHtml(data.visaCountry)],
    ['TYPE DE VISA', escapeHtml(data.visaType)],
  ]
    .map(
      ([label, value]) =>
        `<div class="row"><span class="label">${label}</span><span class="value">${value}</span></div>`,
    )
    .join('');

  win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Label - ${escapeHtml(data.fullName)}</title>
<style>
  @page { size: 100mm 50mm; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; }
  .label {
    width: 100mm; height: 50mm; padding: 4mm 5mm;
    display: flex; flex-direction: column;
    border: 0.3mm solid #1a1a2e; border-radius: 2mm;
  }
  .header {
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 0.4mm solid #1a73e8; padding-bottom: 1.5mm; margin-bottom: 1.5mm;
  }
  .name { font-size: 13pt; font-weight: 800; color: #1a1a2e; text-transform: uppercase; }
  .brand { font-size: 7pt; font-weight: 700; color: #1a73e8; letter-spacing: 0.5px; }
  .row { display: flex; justify-content: space-between; align-items: baseline; padding: 0.6mm 0; }
  .label { color: #6b7280; font-size: 6.5pt; font-weight: 600; }
  .value { color: #111827; font-size: 8.5pt; font-weight: 700; }
  .footer { margin-top: auto; padding-top: 1mm; border-top: 0.2mm dashed #d1d5db; display: flex; justify-content: space-between; }
  .footer span { font-size: 6pt; color: #9ca3af; }
</style>
</head>
<body>
  <div class="label">
    <div class="header">
      <span class="name">${escapeHtml(data.fullName)}</span>
      <span class="brand">HakimiVisa</span>
    </div>
    ${rows}
    <div class="footer">
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
  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('label:printTitle')}</DialogTitle>
        </DialogHeader>

        {/* Preview */}
        <div className="rounded-lg border-2 border-slate-800 p-3 space-y-1 bg-white">
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
          <Button onClick={() => printClientLabel(data)}>
            <Printer className="h-4 w-4 mr-2" />
            {t('label:print')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
