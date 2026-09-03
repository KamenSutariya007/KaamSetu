import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function PWAInstallBanner() {
  const { lang } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferredPrompt || dismissed || isInstalled) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const isGu = lang === 'gu';

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-bounce-short">
      <div className="bg-surface border border-violet/30 rounded-2xl shadow-2xl p-4 flex items-center gap-3 backdrop-blur-md bg-white/95">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-pink flex items-center justify-center text-white shrink-0 shadow-sm">
          <Smartphone size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-midnight truncate">
            {isGu ? 'KaamSetu એપ ઇન્સ્ટોલ કરો' : 'Install KaamSetu App'}
          </h4>
          <p className="text-[11px] text-muted truncate">
            {isGu ? 'ઝડપી એક્સેસ & ઑફલાઇન સપોર્ટ' : 'Fast home access & offline support'}
          </p>
        </div>
        <button
          onClick={handleInstall}
          className="px-3 py-1.5 bg-violet text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-all flex items-center gap-1 shrink-0 shadow-sm"
        >
          <Download size={13} />
          {isGu ? 'ઇન્સ્ટોલ' : 'Install'}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted hover:text-midnight p-1 rounded-md"
          aria-label="Close"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
