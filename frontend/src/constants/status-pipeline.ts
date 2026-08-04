import type { VisaStatus } from '@/types';

/**
 * The order a case advances through. The board and the case detail page both
 * drive their "next"/"back" buttons from this, so a step cannot be skipped in
 * one place and honoured in the other — skipping VISA_OK used to lose the
 * approval and undercount the dashboard.
 *
 * DOSSIER_INCOMPLET sits first because a case returns to EN_ATTENTE once the
 * missing pieces arrive. VISA_REFUSEE is deliberately absent: a refusal ends
 * the case rather than advancing it, so it is chosen explicitly.
 */
export const STATUS_PIPELINE: VisaStatus[] = [
  'DOSSIER_INCOMPLET',
  'EN_ATTENTE',
  'EN_TRAITEMENT',
  'RDV_OK',
  'VISA_OK',
  'LIVREE',
];
