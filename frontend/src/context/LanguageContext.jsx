import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { authAPI } from '../api/client';
import { t as translate, SUPPORTED_LANGUAGES } from '../i18n/translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const { user, updateUser, isAuthenticated } = useAuth();
  const [lang, setLangState] = useState(() => {
    const stored = localStorage.getItem('language');
    return SUPPORTED_LANGUAGES.includes(stored) ? stored : 'en';
  });

  // Authenticated user's profile preference takes precedence
  useEffect(() => {
    if (user?.language && SUPPORTED_LANGUAGES.includes(user.language)) {
      setLangState(user.language);
      localStorage.setItem('language', user.language);
    }
  }, [user?.language]);

  useEffect(() => {
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    document.documentElement.classList.toggle('font-gujarati', lang === 'gu');
  }, [lang]);

  const setLang = useCallback(async (newLang) => {
    if (!SUPPORTED_LANGUAGES.includes(newLang)) return;
    setLangState(newLang);
    localStorage.setItem('language', newLang);
    if (isAuthenticated && user) {
      try {
        const { data } = await authAPI.updateProfile({ language: newLang });
        updateUser(data);
      } catch {
        // Local preference still applied
      }
    }
  }, [isAuthenticated, user, updateUser]);

  const t = useCallback((key) => translate(lang, key), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
};
