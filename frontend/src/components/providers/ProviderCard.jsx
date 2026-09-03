import { Link } from 'react-router-dom';
import { Star, MapPin, Shield, Clock, CheckCircle } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import TrustScore from './TrustScore';
import cn from '../../utils/cn';
import { resolveMediaUrl } from '../../utils/mediaUrl';

function Avatar({ name, photo }) {
  const initials = (name || 'P').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const photoUrl = resolveMediaUrl(photo);
  if (photoUrl) return <img src={photoUrl} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />;
  return (
    <div className="w-12 h-12 rounded-xl bg-indigo/10 text-indigo font-bold flex items-center justify-center shrink-0 text-sm border border-indigo/20">
      {initials}
    </div>
  );
}

export default function ProviderCard({ provider, t, onCompare, isCompared, type = 'provider' }) {
  const isPartner = type === 'partner';
  const name = isPartner ? provider.organization_name : `${provider.user?.first_name || ''} ${provider.user?.last_name || ''}`.trim();
  const bookUrl = isPartner ? `/book?partner=${provider.id}` : `/book?provider=${provider.id}`;
  const verified = provider.verification_status === 'verified' || provider.is_verified;

  return (
    <Card hover className="flex flex-col h-full !p-5">
      <div className="flex gap-3 mb-4">
        <Avatar name={name} photo={provider.profile_photo} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-midnight truncate">{name}</h3>
            {verified && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0 font-semibold shadow-2xs">
                <CheckCircle size={12} className="text-emerald-600" />
                <span>Verified Pro</span>
              </span>
            )}
          </div>
          <p className="text-sm text-muted truncate">
            {isPartner ? provider.partner_type?.replace(/_/g, ' ') : `${provider.experience_years || 0} yrs experience`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
        <div className="flex items-center gap-1.5 text-muted"><Star size={14} className="text-indigo shrink-0" /><span className="font-medium text-midnight">{provider.average_rating ?? '—'}</span></div>
        <div className="flex items-center gap-1.5 text-muted"><CheckCircle size={14} className="text-lime shrink-0" /><span>{provider.completed_jobs ?? '—'} jobs</span></div>
        {provider.distance_km != null && <div className="flex items-center gap-1.5 text-muted"><MapPin size={14} className="shrink-0" /><span>{provider.distance_km} km</span></div>}
        {provider.eta_minutes && <div className="flex items-center gap-1.5 text-aqua"><Clock size={14} className="shrink-0" /><span>ETA ~{provider.eta_minutes}m</span></div>}
      </div>

      <div className="mb-4"><TrustScore score={provider.trust_score} rating={provider.average_rating} completedJobs={provider.completed_jobs} verified={verified} /></div>

      <p className="text-sm font-bold text-midnight mb-1">₹{provider.visit_charge ?? '—'} <span className="text-muted font-normal text-xs">visit</span></p>
      {provider.is_demo && <span className="text-xs text-aqua font-medium mb-3 inline-block">{t('demoData')}</span>}

      <div className="flex gap-2 mt-auto pt-3">
        <Button as={Link} to={bookUrl} variant="accent" size="sm" className="flex-1">{t('bookService')}</Button>
        <Button type="button" onClick={onCompare} variant={isCompared ? 'primary' : 'secondary'} size="sm" aria-pressed={isCompared}>{t('compare')}</Button>
      </div>
    </Card>
  );
}

export function PartnerCard(props) {
  return <ProviderCard {...props} type="partner" />;
}
