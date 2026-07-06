import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { en } from './translations/en';
import { fr } from './translations/fr';
import { ar } from './translations/ar';

export const LANGUAGES = {
  en: { label: 'English', nativeLabel: 'English', dir: 'ltr' as const },
  fr: { label: 'Français', nativeLabel: 'Français', dir: 'ltr' as const },
  ar: { label: 'العربية', nativeLabel: 'العربية', dir: 'rtl' as const },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

export const DEFAULT_LANG: LanguageCode = 'en';

const NAMESPACES = [
  'common', 'nav', 'auth', 'dashboard', 'clients', 'visaCases',
  'kanban', 'appointments', 'tracking', 'notifications',
  'auditLogs', 'backup', 'systemHealth', 'systemLogs', 'pdf',
  'settings', 'validation', 'table', 'dialog', 'status',
  'appointmentType', 'entryType', 'trackingStep', 'caseTimeline',
] as const;

function buildResources(lang: Record<string, unknown>) {
  const resources: Record<string, Record<string, unknown>> = {};
  for (const ns of NAMESPACES) {
    const value = lang[ns];
    resources[ns] = (typeof value === 'object' && value !== null) ? value as Record<string, unknown> : {};
  }
  return resources;
}

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: buildResources(en as unknown as Record<string, unknown>),
      fr: buildResources(fr as unknown as Record<string, unknown>),
      ar: buildResources(ar as unknown as Record<string, unknown>),
    },
    ns: NAMESPACES,
    defaultNS: 'common',
    fallbackLng: DEFAULT_LANG,
    interpolation: {
      escapeValue: false,
      prefix: '{',
      suffix: '}',
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'hakimi-language',
      caches: ['localStorage'],
    },
  });

export default i18next;
