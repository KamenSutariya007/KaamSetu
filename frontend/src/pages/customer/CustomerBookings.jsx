import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingState, { EmptyState } from '../../components/LoadingState';
import BookingCard from '../../components/booking/BookingCard';
import Button from '../../components/ui/Button';
import { useLanguage } from '../../context/LanguageContext';
import { bookingsAPI } from '../../api/client';
import { Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import cn from '../../utils/cn';

export default function CustomerBookings() {
  const { t } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    bookingsAPI.list().then(({ data }) => {
      setBookings(data.results || data);
      setLoading(false);
    });
  }, []);

  const filtered = bookings.filter((b) => {
    if (filter === 'upcoming') return !['completed', 'cancelled', 'rejected'].includes(b.status);
    if (filter === 'completed') return b.status === 'completed';
    if (filter === 'cancelled') return ['cancelled', 'rejected'].includes(b.status);
    return true;
  });

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'upcoming', label: t('upcoming') },
    { key: 'completed', label: t('completed') },
    { key: 'cancelled', label: t('cancelled') },
  ];

  return (
    <DashboardLayout
      role="CUSTOMER"
      title={t('myBookings')}
      subtitle="Track every request from booking to completion."
      actions={<Button as={Link} to="/book" variant="coral">New booking</Button>}
    >
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap',
              filter === key ? 'bg-brand text-white' : 'border border-line bg-surface text-muted hover:bg-page',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState variant="cards" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t('emptyBookingsTitle')}
          message={t('emptyBookingsDesc')}
          actionLabel={t('findProfessional')}
          actionTo="/providers"
          icon={Calendar}
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((b) => (
            <BookingCard
              key={b.id}
              booking={{ ...b, preferred_date: b.scheduled_start ? new Date(b.scheduled_start).toLocaleString() : 'Flexible timing' }}
              to={`/customer/bookings/${b.id}`}
              statusLabel={t(`statuses.${b.status}`)}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
