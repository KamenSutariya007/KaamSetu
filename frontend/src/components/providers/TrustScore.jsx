import { useState } from 'react';
import { Star, Shield, Clock, CheckCircle, MessageCircle, Info } from 'lucide-react';
import cn from '../../utils/cn';

export default function TrustScore({ score, rating, completedJobs, verified, className = '' }) {
  const [showInfo, setShowInfo] = useState(false);
  const numScore = Number(score) || 0;
  const pct = Math.min(100, Math.max(0, numScore));

  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs font-semibold text-muted uppercase tracking-wide">Trust Score</span>
        <button type="button" onClick={() => setShowInfo(!showInfo)} className="text-muted hover:text-indigo p-0.5 rounded" aria-label="How is trust score calculated?" aria-expanded={showInfo}>
          <Info size={14} />
        </button>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-extrabold text-midnight">{numScore}</span>
        <span className="text-sm text-muted">/100</span>
      </div>
      <div className="h-1.5 bg-line rounded-full mt-2 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-lime rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      {showInfo && (
        <div className="mt-3 p-3 bg-mist rounded-xl border border-line text-xs space-y-1.5 animate-fade-in">
          <p className="font-semibold text-midnight mb-1">How is this calculated?</p>
          <div className="flex items-center gap-2 text-muted"><Star size={12} className="text-indigo shrink-0" /> Rating: {rating ?? '—'}</div>
          <div className="flex items-center gap-2 text-muted"><CheckCircle size={12} className="text-lime shrink-0" /> Completed: {completedJobs ?? '—'}</div>
          <div className="flex items-center gap-2 text-muted"><Shield size={12} className="text-aqua shrink-0" /> Verification: {verified ? 'Verified' : 'Pending'}</div>
          <div className="flex items-center gap-2 text-muted"><Clock size={12} className="text-indigo shrink-0" /> On-time completion</div>
          <div className="flex items-center gap-2 text-muted"><MessageCircle size={12} className="text-indigo shrink-0" /> Response rate</div>
        </div>
      )}
    </div>
  );
}
