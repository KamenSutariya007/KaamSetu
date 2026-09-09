import { Link } from 'react-router-dom';
import StatusBadge from '../StatusBadge';
import { ArrowUpRight, CalendarClock } from 'lucide-react';
import cn from '../../utils/cn';

/** Booking list item — timeline accent rail instead of plain bordered box. */
export default function BookingCard({ booking, to, statusLabel, compact = false }) {
  return (
    <Link
      to={to}
      className={cn(
        'group relative block overflow-hidden rounded-2xl border border-line bg-surface transition hover:border-brand/35 hover:shadow-md',
        compact ? 'p-3.5' : 'p-4 sm:p-5',
      )}
    >
      <span className="absolute inset-y-0 left-0 w-1 bg-brand opacity-80 transition group-hover:bg-coral" aria-hidden="true" />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-extrabold text-ink">{booking.category_detail?.name || 'Service'}</h3>
            <StatusBadge status={booking.status} label={statusLabel} />
          </div>
          <p className={cn('mt-1 text-sm text-muted', compact ? 'line-clamp-1' : 'line-clamp-2')}>
            {booking.issue_description || booking.customer_name || 'Booking'}
          </p>
          {(booking.preferred_date || booking.scheduled_at) && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
              <CalendarClock size={13} className="text-brand" />
              {booking.preferred_date || String(booking.scheduled_at).slice(0, 16)}
            </p>
          )}
        </div>
        <ArrowUpRight size={18} className="shrink-0 text-muted transition group-hover:text-brand" />
      </div>
    </Link>
  );
}
