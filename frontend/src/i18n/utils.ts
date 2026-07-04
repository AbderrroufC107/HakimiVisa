import { LANGUAGES, type LanguageCode } from './i18n';

export function isRtl(lang: LanguageCode): boolean {
  return LANGUAGES[lang]?.dir === 'rtl';
}

export function getLanguageLabel(lang: LanguageCode): string {
  return LANGUAGES[lang]?.label ?? lang;
}

export function getLanguageNativeLabel(lang: LanguageCode): string {
  return LANGUAGES[lang]?.nativeLabel ?? lang;
}

export function getLanguageOptions() {
  return Object.entries(LANGUAGES).map(([code, info]) => ({
    code: code as LanguageCode,
    label: info.label,
    nativeLabel: info.nativeLabel,
  }));
}
