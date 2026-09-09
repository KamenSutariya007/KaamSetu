import { Link } from 'react-router-dom';
import { Star, MapPin, Clock, ShieldCheck, BadgeCheck } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import cn from '../../utils/cn';

/**
 * Marketplace provider tile — horizontal media+meta layout (not the old stacked card).
 */
export default function ProviderCard({ provider, t, onCompare, isCompared, type = 'provider' }) {
  const isPartner = type === 'partner';
  const name = isPartner
    ? provider.organization_name
    : `${provider.user?.first_name || ''} ${provider.user?.last_name || ''}`.trim();
  const bookUrl = isPartner ? `/book?partner=${provider.id}` : `/book?provider=${provider.id}`;
  const verified = provider.verification_status === 'verified' || provider.is_verified;
  const photo = resolveMediaUrl(provider.profile_photo);
  const initials = (name || 'P')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="group overflow-hidden rounded-3xl border border-line bg-surface shadow-sm transition hover:border-brand/30 hover:shadow-md">
      <div className="grid sm:grid-cols-[140px_1fr]">
        <div className="relative min-h-[120px] bg-gradient-to-br from-brand-soft to-coral-soft">
          {photo ? (
            <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-2xl font-extrabold text-brand/50">{initials}</div>
          )}
          {verified && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-surface/95 px-2 py-0.5 text-[10px] font-bold text-brand shadow-sm">
              <BadgeCheck size={12} /> Verified
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-extrabold text-ink">{name || 'Professional'}</h3>
              <p className="mt-0.5 text-sm text-muted">
                {isPartner
                  ? (provider.partner_type || 'partner').replace(/_/g, ' ')
                  : `${provider.experience_years || 0} yrs · ${provider.primary_category || provider.categories?.[0]?.name || 'Home care'}`}
              </p>
            </div>
            <p className="shrink-0 text-right">
              <span className="block text-lg font-extrabold text-ink">₹{provider.visit_charge ?? '—'}</span>
              <span className="text-[11px] font-medium text-muted">visit fee</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted">
            <span className="inline-flex items-center gap-1 rounded-full bg-page px-2.5 py-1">
              <Star size={12} className="text-coral" /> {provider.average_rating ?? '—'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-page px-2.5 py-1">
              <ShieldCheck size={12} className="text-brand" /> Trust {provider.trust_score ?? '—'}
            </span>
            {provider.distance_km != null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-page px-2.5 py-1">
                <MapPin size={12} /> {provider.distance_km} km
              </span>
            )}
            {provider.eta_minutes && (
              <span className="inline-flex items-center gap-1 rounded-full bg-page px-2.5 py-1 text-brand">
                <Clock size={12} /> ~{provider.eta_minutes}m
              </span>
            )}
            {provider.is_demo && <Badge tone="muted">{t?.('demoData') || 'Demo'}</Badge>}
          </div>

          <div className="mt-auto flex gap-2 pt-1">
            <Button as={Link} to={bookUrl} variant="coral" size="sm" className="flex-1">
              {t?.('bookService') || 'Book'}
            </Button>
            <Button type="button" onClick={onCompare} variant={isCompared ? 'primary' : 'outline'} size="sm">
              {t?.('compare') || 'Compare'}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
