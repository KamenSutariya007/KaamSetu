import { Link } from 'react-router-dom';
import {
  Search, ShieldCheck, Sparkles, BadgeCheck, Clock3, ArrowRight, Star, Wrench, Droplets, Zap, Wind,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/ui/Button';

const CATEGORIES = [
  { slug: 'plumbing', name: 'Plumbing', icon: Droplets },
  { slug: 'electrical', name: 'Electrical', icon: Zap },
  { slug: 'ac-refrigerator', name: 'AC & Cooler', icon: Wind },
  { slug: 'appliance-repair', name: 'Appliances', icon: Wrench },
];

const STEPS = [
  { title: 'Tell us the issue', desc: 'Use AI checkup or pick a category in seconds.' },
  { title: 'Match a verified pro', desc: 'Compare trust, ratings, ETA, and visit fees.' },
  { title: 'Track until done', desc: 'Live status, fair pricing, and easy support.' },
];

/**
 * Search-first marketplace landing — new composition (not the old split hero + stats pills).
 */
export default function LandingPage() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const fontClass = lang === 'gu' ? 'font-gujarati' : lang === 'hi' ? 'font-hindi' : '';

  const submit = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/providers?search=${encodeURIComponent(q.trim())}` : '/providers');
  };

  return (
    <div className={fontClass}>
      {/* Search-first hero — full-bleed teal wash + floating command panel */}
      <section className="relative overflow-hidden bg-[#0B3D3A] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden="true">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-teal/40 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-coral/30 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6 sm:pb-24 sm:pt-20">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white/80">
            <Sparkles size={12} className="text-coral" /> Home care marketplace
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            <span className="text-white">{t('appName')}</span>
            <span className="mt-2 block text-white/90">Book trusted help for every home problem.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/70 sm:text-lg">
            Search verified professionals, run an AI checkup, and track every job — built for Gujarat homes.
          </p>

          <form onSubmit={submit} className="mt-8 max-w-2xl rounded-2xl bg-white p-2 shadow-lg sm:p-2.5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="What do you need fixed today?"
                  className="w-full rounded-xl border-0 bg-transparent py-3 pl-10 pr-3 text-ink placeholder:text-muted focus:outline-none"
                />
              </div>
              <Button type="submit" variant="coral" size="lg" className="sm:min-w-[140px]">
                Find help
              </Button>
            </div>
          </form>

          <div className="mt-5 flex flex-wrap gap-2">
            {CATEGORIES.map(({ slug, name }) => (
              <Link
                key={slug}
                to={`/providers?category=${slug}`}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/85 hover:bg-white/10"
              >
                {name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Category discovery strip overlapping hero */}
      <section className="relative z-10 mx-auto -mt-10 max-w-7xl px-4 sm:-mt-12 sm:px-6">
        <div className="grid grid-cols-2 gap-3 rounded-3xl border border-line bg-surface p-3 shadow-lg sm:grid-cols-4 sm:p-4">
          {CATEGORIES.map(({ slug, name, icon: Icon }) => (
            <Link
              key={slug}
              to={`/providers?category=${slug}`}
              className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-page"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
                <Icon size={20} />
              </span>
              <span>
                <span className="block text-sm font-extrabold text-ink">{name}</span>
                <span className="text-xs text-muted">Book nearby</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works — numbered horizontal */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">How it works</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">From problem to pro in three moves</h2>
          </div>
          <Button as={Link} to="/ai-assistant" variant="outline">
            Try AI checkup <ArrowRight size={16} />
          </Button>
        </div>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative rounded-3xl border border-line bg-surface p-6">
              <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-coral text-sm font-extrabold text-white">
                {i + 1}
              </span>
              <h3 className="text-lg font-extrabold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Trust band */}
      <section className="bg-brand-soft/50">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:grid-cols-3 sm:px-6">
          {[
            { icon: BadgeCheck, title: 'Verified professionals', desc: 'KYC and trust signals before you book.' },
            { icon: ShieldCheck, title: 'Safer decisions', desc: 'Understand the issue with AI before hiring.' },
            { icon: Clock3, title: 'Live job tracking', desc: 'Follow status from request to completion.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface text-brand shadow-sm">
                <Icon size={22} />
              </span>
              <div>
                <h3 className="font-extrabold text-ink">{title}</h3>
                <p className="mt-1 text-sm text-muted">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dual CTA panels */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl bg-[#0B3D3A] p-8 text-white sm:p-10">
            <Star className="mb-4 text-coral" />
            <h2 className="text-2xl font-extrabold tracking-tight">Need a pro today?</h2>
            <p className="mt-2 max-w-md text-sm text-white/70">Browse ratings, visit fees, and availability — then book in a guided flow.</p>
            <Button as={Link} to="/providers" variant="coral" className="mt-6">
              Explore professionals
            </Button>
          </div>
          <div className="rounded-3xl border border-line bg-surface p-8 sm:p-10">
            <Sparkles className="mb-4 text-brand" />
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">Not sure what’s wrong?</h2>
            <p className="mt-2 max-w-md text-sm text-muted">Start with an AI home checkup, then decide DIY or hire with confidence.</p>
            <Button as={Link} to="/ai-assistant" variant="primary" className="mt-6">
              Start checkup
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-lg font-extrabold text-ink">{t('appName')}</p>
            <p className="text-sm text-muted">Modern home care for Gujarat.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-semibold text-muted">
            <Link to="/providers" className="hover:text-brand">Pros</Link>
            <Link to="/guides" className="hover:text-brand">Guides</Link>
            <Link to="/support" className="hover:text-brand">Support</Link>
            <Link to="/register" className="hover:text-brand">Join</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
