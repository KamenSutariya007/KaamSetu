import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { EmptyState } from '../../components/LoadingState';
import BookingCard from '../../components/booking/BookingCard';
import Button from '../../components/ui/Button';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { bookingsAPI, notificationsAPI } from '../../api/client';
import { Calendar, Sparkles, Users, Bell, ArrowRight, Home, Wrench } from 'lucide-react';

/**
 * Customer hub — bento layout prioritizing upcoming jobs + quick book (not 4 equal tiles).
 */
export default function CustomerDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([bookingsAPI.list(), notificationsAPI.list()])
      .then(([b, n]) => {
        setBookings(b.data.results || b.data || []);
        const nList = n.data.results || (Array.isArray(n.data) ? n.data : []);
        setNotifications(nList.slice(0, 4));
      })
      .finally(() => setLoading(false));
  }, []);

  const upcoming = bookings.filter((b) => !['completed', 'cancelled', 'rejected'].includes(b.status));
  const completed = bookings.filter((b) => b.status === 'completed');
  const name = user?.first_name || user?.username || 'there';

  return (
    <DashboardLayout
      role="CUSTOMER"
      title={`Hi ${name}`}
      subtitle="Here’s what’s happening with your home care."
      actions={
        <>
          <Button as={Link} to="/book" variant="coral">Book a service</Button>
          <Button as={Link} to="/ai-assistant" variant="outline">AI checkup</Button>
        </>
      }
    >
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Hero upcoming panel */}
          <section className="lg:col-span-8 rounded-3xl border border-line bg-surface p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">Up next</p>
                <h2 className="text-xl font-extrabold text-ink">{upcoming.length} active booking{upcoming.length === 1 ? '' : 's'}</h2>
              </div>
              <Link to="/customer/bookings" className="inline-flex items-center gap-1 text-sm font-bold text-brand">
                All <ArrowRight size={14} />
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <EmptyState
                title={t('emptyBookingsTitle')}
                message={t('emptyBookingsDesc')}
                actionLabel="Book now"
                actionTo="/book"
                icon={Calendar}
              />
            ) : (
              <div className="space-y-3">
                {upcoming.slice(0, 4).map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    to={`/customer/bookings/${b.id}`}
                    statusLabel={t(`statuses.${b.status}`)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Side stack */}
          <aside className="lg:col-span-4 flex flex-col gap-4">
            <div className="rounded-3xl bg-[#0B3D3A] p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Quick book</p>
              <h3 className="mt-2 text-lg font-extrabold">Need help today?</h3>
              <p className="mt-1 text-sm text-white/70">Match a verified pro near you in minutes.</p>
              <div className="mt-4 flex flex-col gap-2">
                <Button as={Link} to="/providers" variant="coral" className="justify-center">Find professionals</Button>
                <Button as={Link} to="/guides" variant="outline" className="justify-center !border-white/20 !text-white hover:!bg-white/10">Browse guides</Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-line bg-surface p-4">
                <Calendar className="text-brand" size={18} />
                <p className="mt-3 text-2xl font-extrabold text-ink">{upcoming.length}</p>
                <p className="text-xs font-semibold text-muted">Upcoming</p>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-4">
                <Sparkles className="text-coral" size={18} />
                <p className="mt-3 text-2xl font-extrabold text-ink">{completed.length}</p>
                <p className="text-xs font-semibold text-muted">Completed</p>
              </div>
            </div>

            <div className="rounded-3xl border border-line bg-surface p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-extrabold text-ink">{t('notifications')}</h3>
                <Link to="/customer/notifications" className="text-xs font-bold text-brand">View</Link>
              </div>
              {notifications.length === 0 ? (
                <p className="text-sm text-muted">You’re all caught up.</p>
              ) : (
                <ul className="space-y-3">
                  {notifications.map((n) => (
                    <li key={n.id} className="rounded-xl bg-page px-3 py-2.5 text-sm text-ink">
                      {n.message || n.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          {/* Shortcut row */}
          <section className="lg:col-span-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { to: '/ai-assistant', icon: Sparkles, label: t('startAI'), hint: 'Diagnose first' },
              { to: '/providers', icon: Users, label: t('findProfessional'), hint: 'Verified pros' },
              { to: '/customer/passport', icon: Home, label: t('passport'), hint: 'Home assets' },
              { to: '/support', icon: Wrench, label: t('support'), hint: 'Get help' },
            ].map(({ to, icon: Icon, label, hint }) => (
              <Link key={to} to={to} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition hover:border-brand/30 hover:shadow-sm">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand"><Icon size={18} /></span>
                <span>
                  <span className="block text-sm font-extrabold text-ink">{label}</span>
                  <span className="text-xs text-muted">{hint}</span>
                </span>
              </Link>
            ))}
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}
