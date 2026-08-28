import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { api } from '@/services/api';
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

/** The desk's own details, printed at the top of both sheets. */
export interface AgencyInfo {
  name: string;
  phones: string[];
  website?: string | null;
  /** Where a client downloads the app; both get a QR on the receipt. */
  appUrl: string;
  siteQr?: string | null;
  appQr?: string | null;
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
 * size (see `scaleFor`), so every preset prints on exactly one page.
 */
/** The agency prints on 100 x 150 mm roll stock, so that is the default. */
export const DEFAULT_LABEL_SIZE: LabelSize = {
  id: '100x150',
  name: '100 × 150 mm',
  width: 100,
  height: 150,
};

export const LABEL_SIZES: LabelSize[] = [
  DEFAULT_LABEL_SIZE,
  { id: '100x70', name: '100 × 70 mm', width: 100, height: 70 },
  { id: 'a6', name: 'A6 · 105 × 148 mm', width: 105, height: 148 },
  { id: 'a5', name: 'A5 · 148 × 210 mm', width: 148, height: 210 },
  { id: 'a4', name: 'A4 · 210 × 297 mm', width: 210, height: 297 },
];

/**
 * Font/spacing multiplier. The rows are laid out across the page, so width
 * drives the size; height only caps it so a short, wide label cannot overflow.
 * A 100 x 150 mm roll label reads about 1.2x rather than the 1x it used to
 * get, which was sized for a label less than half its height.
 */
function scaleFor(size: LabelSize): number {
  return Math.max(1, Math.min(size.width / 78, size.height / 128));
}

export function printClientLabel(
  data: LabelData,
  size: LabelSize = DEFAULT_LABEL_SIZE,
  agency?: AgencyInfo,
) {
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
  // The print window is about:blank, so a relative path would not resolve.
  const logoUrl = `${window.location.origin}/print-logo.png`;
  // Portrait sheets have vertical slack: spread the rows and separate them
  // instead of leaving a large blank band above and below.
  const isTall = size.height > size.width;
  // A portrait label gives each field its own line, so a long phone number or
  // visa type is not squeezed against its own caption.
  const rowLayout = isTall
    ? 'flex-direction: column; align-items: stretch;'
    : 'justify-content: space-between; align-items: baseline;';
  const rowGap = (isTall ? 0.5 : 3) * s;
  const rowRule = isTall ? `border-bottom: ${(0.15 * s).toFixed(2)}mm dashed #e5e7eb;` : '';
  const valAlign = isTall ? 'left' : 'right';
  // A short label has no room to stack the mark above the name, so there they
  // share a line (row-reverse keeps the name on the left, where it reads first).
  const headLayout = isTall
    ? 'flex-direction: column; align-items: flex-start;'
    : 'flex-direction: row-reverse; align-items: center; justify-content: space-between;';
  const logoHeight = (isTall ? 14 : 9) * s;
  // A short label has to fit the same five fields in half the height, so the
  // name and the row spacing give way rather than run over the footer.
  const nameSize = (isTall ? 16 : 11) * s;
  const rowPad = (isTall ? 1.2 : 0.45) * s;
  const rowsJustify = isTall ? 'space-evenly' : 'center';
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

  // The desk's name and lines head both sheets; a client keeps the second one
  // and needs to know who to call without hunting for the first.
  const phones = (agency?.phones ?? []).map((p) => p.trim()).filter(Boolean);
  // Fall back rather than drop the heading: the sheet is still the desk's.
  const agencyName = agency?.name?.trim() || 'HakimiVisa';
  const agencyHeader =
    `<span class="lbl-agency">${escapeHtml(agencyName)}</span>` +
    (phones.length
      ? `<span class="lbl-lines">${phones.map(escapeHtml).join(' · ')}</span>`
      : '');

  const qrBlock = (src: string | null | undefined, label: string, url: string) =>
    src
      ? `<div class="qr"><img src="${src}" alt="" /><b>${escapeHtml(label)}</b><span>${escapeHtml(url)}</span></div>`
      : '';

  // The client's copy always prints. Making it conditional on the settings
  // request meant any hiccup there silently produced a single sheet, with
  // nothing to say why.
  const siteUrl = agency?.website || window.location.origin;
  const appUrl = agency?.appUrl || `${window.location.origin}/download`;
  const receiptSheet = `<div class="lbl-box rcpt">
    <div class="lbl-head">
      <img class="lbl-logo" src="${logoUrl}" alt="" />
      <span class="lbl-agency">${escapeHtml(agencyName)}</span>
      ${phones.length ? `<span class="lbl-lines">${phones.map(escapeHtml).join(' · ')}</span>` : ''}
    </div>
    <div class="rcpt-title">VOTRE REÇU D'INSCRIPTION</div>
    <div class="lbl-rows">
      <div class="lbl-row"><span class="lbl-key">CLIENT</span><span class="lbl-val">${escapeHtml(data.fullName)}</span></div>
      ${rows}
    </div>
    <div class="qr-wrap">
      ${qrBlock(agency?.siteQr, 'Suivi en ligne', siteUrl)}
      ${qrBlock(agency?.appQr, 'Application', appUrl)}
    </div>
    <div class="lbl-foot">
      <span>${new Date().toLocaleDateString('fr-FR')}</span>
      <span>${escapeHtml(agencyName)}</span>
    </div>
  </div>`;

  win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Label - ${escapeHtml(data.fullName)} (${escapeHtml(size.name)})</title>
<style>
  @page { size: ${size.width}mm ${size.height}mm; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: ${size.width}mm;
    /* Locking the body to one page height clips anything after it, which
       silently dropped the client's receipt. Only fix the height when there
       is a single sheet to print. */
    ${receiptSheet ? '' : `height: ${size.height}mm; overflow: hidden;`}
  }
  body {
    font-family: Arial, Helvetica, sans-serif;
    background: #f1f5f9;
  }
  .lbl-box {
    width: ${size.width}mm; height: ${size.height}mm;
    padding: ${(5 * s).toFixed(2)}mm ${(6 * s).toFixed(2)}mm;
    display: flex; flex-direction: column;
    border: ${(0.3 * s).toFixed(2)}mm solid #1a1a2e; background: #ffffff;
    overflow: hidden;
  }
  .lbl-head {
    display: flex; gap: ${(1.5 * s).toFixed(2)}mm;
    ${headLayout}
    border-bottom: ${(0.4 * s).toFixed(2)}mm solid #1a73e8;
    padding-bottom: ${(1.5 * s).toFixed(2)}mm; margin-bottom: ${(1.5 * s).toFixed(2)}mm;
  }
  .lbl-logo { height: ${logoHeight.toFixed(2)}mm; width: auto; max-width: 100%; object-fit: contain; }
  .lbl-name {
    font-size: ${nameSize.toFixed(1)}pt; font-weight: 800; color: #1a1a2e;
    text-transform: uppercase; line-height: 1.1; overflow-wrap: anywhere;
  }
  .lbl-brand { font-size: ${(8 * s).toFixed(1)}pt; font-weight: 700; color: #1a73e8; letter-spacing: 0.5px; white-space: nowrap; }
  .lbl-rows {
    flex: 1; min-height: 0;
    display: flex; flex-direction: column;
    justify-content: ${rowsJustify};
  }
  .lbl-row {
    display: flex; gap: ${rowGap.toFixed(2)}mm;
    ${rowLayout}
    padding: ${rowPad.toFixed(2)}mm 0;
    ${rowRule}
  }
  .lbl-row:last-child { border-bottom: none; }
  .lbl-key { color: #374151; font-size: ${(8.5 * s).toFixed(1)}pt; font-weight: 700; white-space: nowrap; }
  .lbl-val { color: #111827; font-size: ${(11.5 * s).toFixed(1)}pt; font-weight: 800; text-align: ${valAlign}; overflow-wrap: anywhere; }
  .lbl-foot {
    margin-top: ${(1 * s).toFixed(2)}mm; padding-top: ${(1 * s).toFixed(2)}mm;
    border-top: ${(0.2 * s).toFixed(2)}mm dashed #d1d5db;
    display: flex; justify-content: space-between;
  }
  .lbl-foot span { font-size: ${(7.5 * s).toFixed(1)}pt; color: #6b7280; }

  /* The desk's name and lines, at the head of every sheet. */
  .lbl-agency { font-size: ${(9 * s).toFixed(1)}pt; font-weight: 800; color: #1a1a2e; letter-spacing: .2px; }
  .lbl-lines { font-size: ${(7.5 * s).toFixed(1)}pt; color: #374151; margin-top: ${(0.5 * s).toFixed(2)}mm; }

  /* Second sheet: the client's receipt. It carries more than the label — a
     title and two QR codes — so it grows to its content instead of being
     locked to one label height, which made the codes sit on top of the rows. */
  .rcpt {
    page-break-before: always; break-before: page;
    height: auto; min-height: ${size.height}mm; overflow: visible;
  }
  .rcpt .lbl-rows { flex: none; justify-content: flex-start; }
  /* The label's type is sized for a small card; at full-sheet scale the same
     figures push the QR codes onto a third page. The receipt sets its own,
     tighter, so it stays one sheet. */
  .rcpt .lbl-row { padding: ${(0.7 * s).toFixed(2)}mm 0; gap: ${(0.2 * s).toFixed(2)}mm; }
  .rcpt .lbl-key { font-size: ${(6.5 * s).toFixed(1)}pt; }
  .rcpt .lbl-val { font-size: ${(8 * s).toFixed(1)}pt; }
  .rcpt .rcpt-title { font-size: ${(10 * s).toFixed(1)}pt; margin: ${(1.2 * s).toFixed(2)}mm 0; }
  .rcpt .lbl-logo { height: ${(7 * s).toFixed(2)}mm; }
  .rcpt .qr img { width: ${(15 * s).toFixed(2)}mm; height: ${(15 * s).toFixed(2)}mm; }
  .rcpt-title {
    text-align: center; font-size: ${(13 * s).toFixed(1)}pt; font-weight: 800;
    color: #1a1a2e; margin: ${(2 * s).toFixed(2)}mm 0 ${(1.5 * s).toFixed(2)}mm;
    letter-spacing: .5px;
  }
  .qr-wrap { display: flex; gap: ${(4 * s).toFixed(2)}mm; justify-content: space-around; margin-top: ${(2.5 * s).toFixed(2)}mm; }
  .qr { text-align: center; }
  .qr img { width: ${(20 * s).toFixed(2)}mm; height: ${(20 * s).toFixed(2)}mm; display: block; }
  .qr b { display: block; font-size: ${(7 * s).toFixed(1)}pt; margin-top: ${(0.8 * s).toFixed(2)}mm; }
  .qr span { display: block; font-size: ${(6.2 * s).toFixed(1)}pt; color: #6b7280; word-break: break-all; }
  @media print {
    body { background: none; }
    .lbl-box { border-color: #1a1a2e; }
  }
</style>
</head>
<body>
  <div class="lbl-box">
    <div class="lbl-head">
      <img class="lbl-logo" src="${logoUrl}" alt="" />
      ${agencyHeader}
      <span class="lbl-name">${escapeHtml(data.fullName)}</span>
    </div>
    <div class="lbl-rows">${rows}</div>
    <div class="lbl-foot">
      <span>${new Date().toLocaleDateString('fr-FR')}</span>
      <span>${escapeHtml(siteUrl)}</span>
    </div>
  </div>
${receiptSheet}
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

  // Both sheets carry the desk's name and lines, and the receipt carries a QR
  // for each link. Built here so the print window receives plain data URIs —
  // it has no scripts of its own and cannot fetch anything.
  const { data: agency } = useQuery({
    queryKey: ['agency-settings', 'for-label'],
    queryFn: async (): Promise<AgencyInfo> => {
      const s = await api.get<{
        agencyName?: string;
        agencyPhone?: string | null;
        agencyPhone2?: string | null;
        agencyPhone3?: string | null;
        agencyWebsite?: string | null;
      }>('/agency-settings');
      const appUrl = `${window.location.origin}/download`;
      const website = s.agencyWebsite?.trim() || window.location.origin;
      const [siteQr, appQr] = await Promise.all([
        QRCode.toDataURL(website, { margin: 0, width: 320 }).catch(() => null),
        QRCode.toDataURL(appUrl, { margin: 0, width: 320 }).catch(() => null),
      ]);
      return {
        name: s.agencyName?.trim() || 'HakimiVisa',
        phones: [s.agencyPhone, s.agencyPhone2, s.agencyPhone3].filter(
          (p): p is string => !!p && p.trim().length > 0,
        ),
        website,
        appUrl,
        siteQr,
        appQr,
      };
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

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
          <div className="mb-1.5 space-y-1 border-b-2 border-blue-600 pb-1.5">
            <img src="/print-logo.png" alt="" className="h-6 w-auto" />
            {/* The sheets are headed by the desk's name and lines, so the
                preview has to show them or it misrepresents the print. */}
            {agency && (
              <>
                <span className="block text-xs font-extrabold text-slate-900">{agency.name}</span>
                {agency.phones.length > 0 && (
                  <span className="block text-[10px] text-slate-600">{agency.phones.join(' · ')}</span>
                )}
              </>
            )}
            <span className="block text-sm font-extrabold uppercase text-slate-900">{data.fullName}</span>
          </div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t('label:passport')}</span><span className="font-bold">{data.passportNumber || '—'}</span></div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t('label:passportExpiry')}</span><span className="font-bold">{formatExpiry(data.passportExpiry)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t('label:phone')}</span><span className="font-bold">{data.phoneNumber}</span></div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t('label:country')}</span><span className="font-bold">{data.visaCountry}</span></div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t('label:visaType')}</span><span className="font-bold">{data.visaType}</span></div>
        </div>

        <p
          className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900"
          data-testid="receipt-note"
        >
          {t('label:receiptNote')}
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common:cancel')}
          </Button>
          <Button onClick={() => printClientLabel(data, size, agency)}>
            <Printer className="h-4 w-4 mr-2" />
            {t('label:print')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
