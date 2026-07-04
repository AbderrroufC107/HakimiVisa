import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, DEFAULT_LANG, type LanguageCode } from './i18n';

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  dir: 'ltr' | 'rtl';
  resolvedLanguage: LanguageCode;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getDirection(lang: LanguageCode): 'ltr' | 'rtl' {
  return LANGUAGES[lang]?.dir ?? 'ltr';
}

function applyDocumentDirection(dir: 'ltr' | 'rtl', lang: LanguageCode) {
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
}

function getInitialLanguage(): LanguageCode {
  try {
    const stored = localStorage.getItem('hakimi-language');
    if (stored && stored in LANGUAGES) return stored as LanguageCode;
  } catch { /* ignore */ }
  return DEFAULT_LANG;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<LanguageCode>(getInitialLanguage);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    try {
      localStorage.setItem('hakimi-language', lang);
    } catch { /* ignore */ }
    applyDocumentDirection(getDirection(lang), lang);
  };

  useEffect(() => {
    const dir = getDirection(language);
    applyDocumentDirection(dir, language);
  }, [language]);

  const value: LanguageContextValue = {
    language,
    setLanguage,
    dir: getDirection(language),
    resolvedLanguage: language,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
