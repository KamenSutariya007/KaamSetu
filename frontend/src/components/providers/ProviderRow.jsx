import { Link } from 'react-router-dom';
import { Star, ShieldCheck, Briefcase, IndianRupee, Clock, Check } from 'lucide-react';
import Button from '../ui/Button';
import cn from '../../utils/cn';

export default function ProviderRow({ provider, type = 'provider', t, onCompare, isCompared }) {
  const isPartner = type === 'partner';
  const name = isPartner
    ? provider.organization_name
    : `${provider.user?.first_name || ''} ${provider.user?.last_name || ''}`.trim() || provider.user?.username;
  const initials = name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'P';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-surface border border-line rounded-2xl hover-lift transition-colors hover:border-brand/20 group">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand/20 to-teal/20 flex items-center justify-center text-brand font-bold text-lg shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-ink truncate">{name}</h3>
            {provider.is_verified && (
              <span className="inline-flex items-center gap-1 text-xs text-green bg-green/10 px-2 py-0.5 rounded-full">
                <ShieldCheck size={12} /> Verified
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted">
            <span className="flex items-center gap-1"><Star size={14} className="text-yellow fill-yellow" /> {provider.average_rating ?? '—'}</span>
            <span className="flex items-center gap-1"><Briefcase size={14} /> {provider.completed_jobs ?? 0} jobs</span>
            <span>Trust {provider.trust_score ?? '—'}/100</span>
            {provider.experience_years != null && <span>{provider.experience_years}y exp</span>}
          </div>
          <p className="text-xs text-muted mt-1 capitalize">{provider.primary_category || provider.categories?.[0]?.name || 'General'}</p>
        </div>
      </div>

      <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
        <div className="text-right">
          <p className="text-xs text-muted">Starting from</p>
          <p className="font-bold text-ink flex items-center gap-0.5"><IndianRupee size={14} />{provider.visit_charge ?? '—'}</p>
          {provider.eta_minutes && (
            <p className="text-xs text-muted flex items-center gap-1 mt-0.5"><Clock size={12} /> ~{provider.eta_minutes} min</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button as={Link} to={`/book?${type}=${provider.id}`} variant="primary" size="sm">{t('bookService')}</Button>
          <button
            type="button"
            onClick={onCompare}
            className={cn(
              'p-2 rounded-xl border transition-all',
              isCompared ? 'bg-brand/10 border-brand text-brand' : 'border-line text-muted hover:border-brand/30 hover:text-brand',
            )}
            aria-label="Compare"
          >
            <Check size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
