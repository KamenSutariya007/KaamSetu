import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import LoadingState, { EmptyState } from '../components/LoadingState';
import { useLanguage } from '../context/LanguageContext';
import { providersAPI } from '../api/client';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import ProviderRow from '../components/providers/ProviderRow';
import VoiceInputButton from '../components/VoiceInputButton';
import { InView } from '../hooks/InView';

const SECTION_LABELS = {
  best_match: 'Best Match',
  nearest_available: 'Nearest Available',
  highest_rated: 'Highest Rated',
  lowest_cost: 'Lowest Estimated Cost',
  fastest_arrival: 'Fastest Arrival',
  authorized_brand_partner: 'Authorized Brand Partner',
  emergency_available: 'Emergency Available',
  top_local_professional: 'Top Local Professional',
};

const FILTERS = ['All', 'Plumbing', 'Electrical', 'AC', 'Appliances', 'Cleaning'];

export default function ProvidersPage() {
  const { t } = useLanguage();
  const [providers, setProviders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [sections, setSections] = useState({});
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
      category ? providersAPI.recommendations({ category, lat: 23.0225, lon: 72.5714 }) : Promise.resolve({ data: { sections: {} } }),
    ]).then(([p, pt, rec]) => {
      setProviders(p.data.results || p.data);
      setPartners(pt.data.results || pt.data);
      setSections(rec.data.sections || {});
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

  return (
    <PageContainer variant="full" className="py-8 animate-fade-in">
      <PageHeader
        title="Find the right professional"
        subtitle={`${t('compareProviders')} — select up to 3 to compare side by side`}
      />

      {/* Search + filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="relative flex-1 flex items-center">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search') || "Search by name, service, or location..."}
            className="w-full pl-10 pr-12 py-3 rounded-xl bg-surface border border-line text-sm focus:outline-none focus:ring-2 focus:ring-violet/25"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <VoiceInputButton
              onTranscript={(spoken) => setSearch(spoken)}
              size={16}
              className="!p-1.5 !border-0 !bg-transparent hover:!bg-slate-100"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <SlidersHorizontal size={16} className="text-muted shrink-0" />
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                activeFilter === f ? 'bg-brand/10 text-brand border border-brand/20 font-medium' : 'bg-surface border border-line text-muted hover:border-violet/30'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {compare.length > 0 && (
        <Card className="mb-8 pastel-purple" hover={false}>
          <h3 className="font-semibold text-ink mb-4">Comparing {compare.length} provider{compare.length > 1 ? 's' : ''}</h3>
          <div className="grid sm:grid-cols-3 gap-4 min-w-0">
            {compare.map(({ key, item, type }) => (
              <div key={key} className="bg-surface rounded-xl p-4 border border-line text-sm min-w-0">
                <p className="font-semibold text-ink truncate">{type === 'provider' ? item.user?.first_name : item.organization_name}</p>
                <div className="grid grid-cols-2 gap-2 mt-3 text-muted">
                  <div><span className="text-xs block">Visit</span><span className="font-medium text-ink">₹{item.visit_charge || '—'}</span></div>
                  <div><span className="text-xs block">Rating</span><span className="font-medium text-ink">★ {item.average_rating}</span></div>
                  <div><span className="text-xs block">Trust</span><span className="font-medium text-ink">{item.trust_score}/100</span></div>
                  <div><span className="text-xs block">Jobs</span><span className="font-medium text-ink">{item.completed_jobs ?? '—'}</span></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {loading ? <LoadingState variant="cards" /> : (
        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          {/* Left filters — desktop */}
          <aside className="hidden lg:block space-y-4">
            <Card hover={false} className="!p-4">
              <h3 className="font-semibold text-ink text-sm mb-3">Filters</h3>
              <div className="space-y-2 text-sm text-muted">
                <p>Service: {category || 'All'}</p>
                <p>Location: Ahmedabad</p>
                <p>Rating: 4+ stars</p>
                <p>Availability: Today</p>
              </div>
            </Card>
          </aside>

          <div className="min-w-0 space-y-10">
            {Object.keys(sections).length > 0 && (
              <div className="space-y-8">
                {Object.entries(sections).map(([key, items]) => items?.length > 0 && (
                  <InView key={key}>
                    <h2 className="text-lg font-semibold text-ink mb-4">{SECTION_LABELS[key] || key}</h2>
                    <div className="space-y-3">
                      {items.slice(0, 3).map((item) => (
                        <ProviderRow
                          key={`${item.entity_type || 'provider'}-${item.id}`}
                          provider={item}
                          type={item.entity_type || 'provider'}
                          t={t}
                          onCompare={() => toggleCompare(item, item.entity_type || 'provider')}
                          isCompared={compare.some((c) => c.key === `${item.entity_type || 'provider'}-${item.id}`)}
                        />
                      ))}
                    </div>
                  </InView>
                ))}
              </div>
            )}

            <section>
              <h2 className="text-lg font-semibold text-ink mb-4">Individual Professionals</h2>
              {filterList(providers, 'provider').length === 0 ? (
                <EmptyState message="No providers found" actionLabel={t('findPro')} actionTo="/ai-assistant" />
              ) : (
                <div className="space-y-3">
                  {filterList(providers, 'provider').map((p) => (
                    <ProviderRow key={p.id} provider={p} type="provider" t={t}
                      onCompare={() => toggleCompare(p, 'provider')}
                      isCompared={compare.some((c) => c.key === `provider-${p.id}`)} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink mb-4">Third-Party Partners</h2>
              {filterList(partners, 'partner').length === 0 ? (
                <EmptyState message="No partners found" />
              ) : (
                <div className="space-y-3">
                  {filterList(partners, 'partner').map((p) => (
                    <ProviderRow key={p.id} provider={p} type="partner" t={t}
                      onCompare={() => toggleCompare(p, 'partner')}
                      isCompared={compare.some((c) => c.key === `partner-${p.id}`)} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
