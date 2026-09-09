import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import LoadingState, { EmptyState } from '../components/LoadingState';
import { useLanguage } from '../context/LanguageContext';
import { providersAPI } from '../api/client';
import ProviderCard from '../components/providers/ProviderCard';
import VoiceInputButton from '../components/VoiceInputButton';
import cn from '../utils/cn';

const FILTERS = ['All', 'Plumbing', 'Electrical', 'AC', 'Appliances', 'Cleaning'];

/**
 * Marketplace discovery — sticky filter bar + card grid (not the old narrow list + purple compare).
 */
export default function ProvidersPage() {
  const { t } = useLanguage();
  const [providers, setProviders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [compare, setCompare] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category') || '';

  useEffect(() => {
    setSearch(params.get('search') || '');
  }, []);

  useEffect(() => {
    Promise.all([
      providersAPI.list(category ? { category } : {}),
      providersAPI.partners(),
    ]).then(([p, pt]) => {
      setProviders(p.data.results || p.data);
      setPartners(pt.data.results || pt.data);
      setLoading(false);
    });
  }, [category]);

  const toggleCompare = (item, type) => {
    const key = `${type}-${item.id}`;
    if (compare.find((c) => c.key === key)) setCompare(compare.filter((c) => c.key !== key));
    else if (compare.length < 3) setCompare([...compare, { key, item, type }]);
  };

  const filterList = (list, type) => {
    let filtered = list;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((p) => {
        const name = type === 'partner' ? p.organization_name : `${p.user?.first_name} ${p.user?.last_name}`;
        return name?.toLowerCase().includes(q);
      });
    }
    if (activeFilter !== 'All') {
      filtered = filtered.filter((p) =>
        (p.primary_category || p.categories?.[0]?.name || '').toLowerCase().includes(activeFilter.toLowerCase()),
      );
    }
    return filtered;
  };

  const pros = filterList(providers, 'provider');
  const orgs = filterList(partners, 'partner');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Discover</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Find the right professional</h1>
        <p className="mt-2 text-sm text-muted">Compare visit fees, trust, and availability — then book in a guided flow.</p>
      </div>

      <div className="sticky top-16 z-20 -mx-4 mb-8 border-y border-line bg-surface/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or service…"
              className="w-full rounded-full border border-line bg-page py-2.5 pl-9 pr-12 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <VoiceInputButton onTranscript={(spoken) => setSearch(spoken)} size={16} className="!border-0 !bg-transparent" />
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <SlidersHorizontal size={14} className="shrink-0 text-muted" />
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFilter(f)}
                className={cn(
                  'whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold',
                  activeFilter === f ? 'bg-brand text-white' : 'border border-line bg-page text-muted hover:text-ink',
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {compare.length > 0 && (
        <div className="mb-8 overflow-hidden rounded-3xl border border-brand/20 bg-brand-soft/40 p-4 sm:p-5">
          <h2 className="mb-3 font-extrabold text-ink">Comparing {compare.length}/3</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {compare.map(({ key, item, type }) => (
              <div key={key} className="rounded-2xl border border-line bg-surface p-4 text-sm">
                <p className="truncate font-bold text-ink">{type === 'provider' ? item.user?.first_name : item.organization_name}</p>
                <p className="mt-2 text-muted">₹{item.visit_charge || '—'} · ★ {item.average_rating} · Trust {item.trust_score}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <LoadingState variant="cards" />
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="mb-4 text-lg font-extrabold text-ink">Individual professionals</h2>
            {pros.length === 0 ? (
              <EmptyState message="No providers found" actionLabel={t('findPro')} actionTo="/ai-assistant" />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {pros.map((p) => (
                  <ProviderCard
                    key={p.id}
                    provider={p}
                    type="provider"
                    t={t}
                    onCompare={() => toggleCompare(p, 'provider')}
                    isCompared={compare.some((c) => c.key === `provider-${p.id}`)}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-lg font-extrabold text-ink">Partner companies</h2>
            {orgs.length === 0 ? (
              <EmptyState message="No partners found" />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {orgs.map((p) => (
                  <ProviderCard
                    key={p.id}
                    provider={p}
                    type="partner"
                    t={t}
                    onCompare={() => toggleCompare(p, 'partner')}
                    isCompared={compare.some((c) => c.key === `partner-${p.id}`)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
