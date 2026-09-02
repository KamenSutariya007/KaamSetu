import en from './en';
import gu from './gu';
import hi from './hi';

export const SUPPORTED_LANGUAGES = ['en', 'gu', 'hi'];

export const translations = { en, gu, hi };

export function t(lang, key) {
  const code = SUPPORTED_LANGUAGES.includes(lang) ? lang : 'en';
  const keys = key.split('.');
  let val = translations[code];
  for (const k of keys) {
    val = val?.[k];
    if (val === undefined) break;
  }
  return val ?? key;
}
