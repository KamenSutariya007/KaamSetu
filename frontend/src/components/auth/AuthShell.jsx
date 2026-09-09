import { Link } from 'react-router-dom';
import { Droplets, Zap, Wind, Wrench, Home, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const SERVICES = [
  { icon: Droplets, label: 'Plumbing', tone: 'text-blue bg-blue/10 border-blue/15' },
  { icon: Zap, label: 'Electrical', tone: 'text-warning bg-warning/10 border-warning/20' },
  { icon: Wind, label: 'AC & Cooling', tone: 'text-teal bg-teal/10 border-teal/15' },
  { icon: Wrench, label: 'Appliances', tone: 'text-coral bg-coral-soft border-coral/20' },
];

/**
 * Split-screen auth chrome — brand atmosphere left, form right.
 */
export default function AuthShell({ eyebrow, title, subtitle, children, footer, wide = false }) {
  const { t } = useLanguage();

  return (
    <div className="auth-home min-h-screen overflow-x-hidden">
      <div className="auth-home__glow" aria-hidden="true" />
      <div className="relative z-10 min-h-screen grid lg:grid-cols-2">
        <aside className="relative hidden lg:flex flex-col justify-between p-10 xl:p-14 overflow-hidden auth-home__panel">
          <div className="absolute inset-0 auth-home__panel-bg" aria-hidden="true" />
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <span className="w-12 h-12 rounded-2xl bg-brand text-white font-extrabold text-xl flex items-center justify-center shadow-md group-hover:bg-brand-hover transition-colors">
                K
              </span>
              <span className="font-extrabold text-2xl tracking-tight text-ink">{t('appName')}</span>
            </Link>
            <p className="mt-3 text-sm text-muted max-w-xs leading-relaxed font-gujarati">
              {t('taglineGu') || 'ઘરની સમસ્યા સમજો, સુરક્ષિત રીતે ઠીક કરો.'}
            </p>
          </div>

          <div className="relative z-10 my-10 flex-1 flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand mb-3 animate-fade-up">
              {eyebrow || 'Home care, made simple'}
            </p>
            <h2 className="text-3xl xl:text-4xl font-extrabold text-ink leading-tight tracking-tight animate-fade-up delay-1">
              {title || (
                <>
                  Understand. <span className="text-brand">Fix.</span>{' '}
                  <span className="text-coral">Relax.</span>
                </>
              )}
            </h2>
            <p className="mt-4 text-muted text-base max-w-md leading-relaxed animate-fade-up delay-2">
              {subtitle ||
                'AI diagnosis, verified professionals, fair prices and live tracking — all for your home.'}
            </p>

            <div className="mt-8 relative w-full max-w-sm aspect-[4/3] animate-scale-in delay-3">
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-brand/10 via-surface to-coral/10 border border-line shadow-md" />
              <div className="absolute inset-6 rounded-3xl bg-surface/95 border border-line flex items-center justify-center">
                <div className="relative w-36 h-32">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[56px] border-r-[56px] border-b-[36px] border-l-transparent border-r-transparent border-b-brand" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-20 bg-surface rounded-b-xl border-2 border-line flex items-end justify-center pb-2">
                    <div className="w-8 h-10 bg-brand/20 rounded-t-md border border-brand/25" />
                  </div>
                  <Home size={28} className="absolute bottom-8 left-1/2 -translate-x-1/2 text-brand/45" />
                </div>
              </div>
              <div className="absolute -top-2 -right-2 w-11 h-11 rounded-2xl bg-coral-soft text-coral border border-coral/25 flex items-center justify-center animate-float shadow-sm">
                <ShieldCheck size={20} />
              </div>
            </div>

            <ul className="mt-8 grid grid-cols-2 gap-3 animate-fade-up delay-4">
              {SERVICES.map(({ icon: Icon, label, tone }) => (
                <li
                  key={label}
                  className={`flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-sm font-semibold ${tone}`}
                >
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative z-10 text-xs text-muted">Trusted home maintenance for Gujarat homes.</p>
        </aside>

        <main className="relative flex flex-col justify-center px-4 sm:px-8 py-10 lg:py-12">
          <div className="lg:hidden mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-xl bg-brand text-white font-extrabold text-lg flex items-center justify-center">
                K
              </span>
              <span className="font-extrabold text-xl text-ink">{t('appName')}</span>
            </Link>
          </div>

          <div className={`w-full mx-auto animate-fade-up ${wide ? 'max-w-xl xl:max-w-2xl' : 'max-w-lg'}`}>
            <div className="auth-home__form rounded-3xl border border-line/80 bg-surface/95 backdrop-blur-sm p-6 sm:p-8">
              {children}
            </div>
            {footer ? <div className="mt-6 text-center">{footer}</div> : null}
          </div>
        </main>
      </div>
    </div>
  );
}
