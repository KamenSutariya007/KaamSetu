import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingState, { EmptyState } from '../../components/LoadingState';
import StatusBadge from '../../components/StatusBadge';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import { useLanguage } from '../../context/LanguageContext';
import { bookingsAPI } from '../../api/client';
import { Calendar } from 'lucide-react';

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
    <DashboardLayout role="CUSTOMER">
      <PageHeader title={t('myBookings')} subtitle="View and manage all your service appointments" />

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              filter === key ? 'bg-violet text-white' : 'bg-surface border border-line text-muted hover:bg-page'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? <LoadingState variant="cards" /> : filtered.length === 0 ? (
        <EmptyState
          title={t('emptyBookingsTitle')}
          message={t('emptyBookingsDesc')}
          actionLabel={t('findProfessional')}
          actionTo="/providers"
          icon={Calendar}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <Link key={b.id} to={`/customer/bookings/${b.id}`}>
              <Card hover className="!p-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-midnight">#{b.id} — {b.category_detail?.name}</p>
                    <p className="text-sm text-muted truncate mt-0.5">{b.issue_description}</p>
                    <p className="text-xs text-muted mt-1">{b.scheduled_start ? new Date(b.scheduled_start).toLocaleString() : 'Flexible timing'}</p>
                    {b.is_demo && <span className="text-xs text-aqua mt-1 inline-block">{t('demoData')}</span>}
                  </div>
                  <StatusBadge status={b.status} label={t(`statuses.${b.status}`)} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
