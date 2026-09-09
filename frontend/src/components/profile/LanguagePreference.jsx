import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'gu', label: 'ગુજરાતી' },
  { value: 'hi', label: 'हिन्दी' },
];

export default function LanguagePreference() {
  const { lang, setLang, t } = useLanguage();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSelect = async (value) => {
    if (value === lang) return;
    setSaving(true);
    setSaved(false);
    await setLang(value);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <section className="bg-surface rounded-2xl border border-line p-6" aria-labelledby="language-pref-heading">
      <h2 id="language-pref-heading" className="text-lg font-semibold text-ink mb-1">
        {t('languagePreference')}
      </h2>
      <p className="text-sm text-muted mb-4">{t('languagePreferenceDesc')}</p>

      <p className="text-sm font-medium text-ink mb-3">{t('languageLabel')}</p>

      <div className="space-y-2" role="radiogroup" aria-label={t('languageLabel')}>
        {LANGUAGE_OPTIONS.map(({ value, label }) => (
          <label
            key={value}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors ${
              lang === value
                ? 'border-indigo bg-indigo/10'
                : 'border-line bg-page hover:border-indigo/50'
            }`}
          >
            <input
              type="radio"
              name="language"
              value={value}
              checked={lang === value}
              onChange={() => handleSelect(value)}
              disabled={saving}
              className="w-4 h-4 text-brand focus:ring-brand"
            />
            <span className={`text-sm font-medium text-ink ${value === 'gu' ? 'font-gujarati' : ''}`}>
              {label}
            </span>
          </label>
        ))}
      </div>

      {saved && (
        <p className="text-indigo text-sm mt-3 flex items-center gap-1" role="status">
          <CheckCircle2 size={14} className="text-lime" aria-hidden="true" /> {t('languageSaved')}
        </p>
      )}
    </section>
  );
}
