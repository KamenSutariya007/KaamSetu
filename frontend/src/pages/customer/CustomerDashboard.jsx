import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingState, { EmptyState } from '../../components/LoadingState';
import StatusBadge from '../../components/StatusBadge';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { useLanguage } from '../../context/LanguageContext';
import { bookingsAPI, notificationsAPI } from '../../api/client';
import { Wrench, Calendar, Home, Bell, ArrowRight, Sparkles } from 'lucide-react';

export default function CustomerDashboard() {
  const { t } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([bookingsAPI.list(), notificationsAPI.list()])
      .then(([b, n]) => {
        setBookings(b.data.results || b.data);
        setNotifications((n.data.results || n.data).slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  const upcoming = bookings.filter((b) => !['completed', 'cancelled', 'rejected'].includes(b.status));

  const quickActions = [
    { icon: Sparkles, label: t('startAI'), to: '/ai-assistant', bg: 'bg-indigo/15', iconColor: 'text-aqua' },
    { icon: Calendar, label: t('bookings'), to: '/customer/bookings', bg: 'bg-lime/10', iconColor: 'text-lime' },
    { icon: Home, label: t('passport'), to: '/customer/passport', bg: 'bg-indigo/10', iconColor: 'text-midnight' },
    { icon: Bell, label: t('notifications'), to: '/customer/notifications', bg: 'bg-danger/10', iconColor: 'text-danger' },
  ];

  return (
    <DashboardLayout role="CUSTOMER">
      <PageHeader
        title={t('dashboard')}
        subtitle="Manage your home repairs and service appointments"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {quickActions.map(({ icon: Icon, label, to, bg, iconColor }) => (
          <Link key={to} to={to}>
            <Card hover className="!p-4 sm:!p-5 h-full">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
                <Icon size={22} className={iconColor} />
              </div>
              <p className="font-semibold text-midnight text-sm">{label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 min-w-0">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-midnight">{t('upcoming')}</h2>
            <Link to="/customer/bookings" className="text-sm text-aqua hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {loading ? <DashboardSkeleton /> : upcoming.length === 0 ? (
            <EmptyState
              title={t('emptyBookingsTitle')}
              message={t('emptyBookingsDesc')}
              actionLabel={t('findProfessional')}
              actionTo="/providers"
              icon={Calendar}
            />
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 5).map((b) => (
                <Link key={b.id} to={`/customer/bookings/${b.id}`}>
                  <Card hover className="!p-4">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-midnight">{b.category_detail?.name || 'Service'}</p>
                        <p className="text-sm text-muted truncate">{b.issue_description}</p>
                      </div>
                      <StatusBadge status={b.status} label={t(`statuses.${b.status}`)} />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-midnight mb-4">{t('notifications')}</h2>
          {loading ? <LoadingState /> : notifications.length === 0 ? (
            <Card className="!p-4 text-center">
              <p className="text-sm font-medium text-midnight">{t('emptyNotificationsTitle')}</p>
              <p className="text-xs text-muted mt-1">{t('emptyNotificationsDesc') || 'No new updates'}</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <Card key={n.id} className="!p-3">
                  <p className="text-sm text-midnight">{n.message || n.title}</p>
                  {n.is_demo && <span className="text-xs text-aqua">{t('demoData')}</span>}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
