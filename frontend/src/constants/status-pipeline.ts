import type { VisaStatus } from '@/types';

/** The only operational path used by the board and case detail page. */
export const STATUS_PIPELINE: VisaStatus[] = [
  'DOSSIER_INCOMPLET',
  'EN_ATTENTE',
  'EN_TRAITEMENT',
  'RDV_OK',
  'LIVREE',
];

export const NEXT_WORKFLOW_STATUS: Partial<Record<VisaStatus, VisaStatus>> = {
  DOSSIER_INCOMPLET: 'EN_ATTENTE',
  EN_ATTENTE: 'EN_TRAITEMENT',
  EN_TRAITEMENT: 'RDV_OK',
  RDV_OK: 'LIVREE',
};

export const PREVIOUS_WORKFLOW_STATUS: Partial<Record<VisaStatus, VisaStatus>> = {
  EN_ATTENTE: 'DOSSIER_INCOMPLET',
  EN_TRAITEMENT: 'EN_ATTENTE',
  LIVREE: 'RDV_OK',
};
