import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

/**
 * Standalone banner — avoids context hooks so a provider/HMR glitch
 * cannot take down the whole app with "Invalid hook call".
 */
export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [lang, setLang] = useState(() => localStorage.getItem('language') || 'en');

  useEffect(() => {
    const onStorage = () => setLang(localStorage.getItem('language') || 'en');
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (window.matchMedia?.('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return undefined;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!deferredPrompt || dismissed || isInstalled) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  const isGu = lang === 'gu';

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-6 sm:max-w-sm">
      <div className="flex items-center gap-3 rounded-2xl border border-brand/30 bg-surface/95 p-4 shadow-lg backdrop-blur-md">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
          <Smartphone size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-xs font-bold text-ink">
            {isGu ? 'KaamSetu એપ ઇન્સ્ટોલ કરો' : 'Install KaamSetu App'}
          </h4>
          <p className="truncate text-[11px] text-muted">
            {isGu ? 'ઝડપી એક્સેસ & ઑફલાઇન સપોર્ટ' : 'Fast home access & offline support'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleInstall}
          className="flex shrink-0 items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover"
        >
          <Download size={13} />
          {isGu ? 'ઇન્સ્ટોલ' : 'Install'}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-md p-1 text-muted hover:text-ink"
          aria-label="Close"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
