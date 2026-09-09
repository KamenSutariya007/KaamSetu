import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingState from '../../components/LoadingState';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/ui/Button';
import TrustScore from '../../components/providers/TrustScore';
import ProviderKYCSection from '../../components/providers/ProviderKYCSection';
import { bookingsAPI, providersAPI, trackingAPI, calendarAPI } from '../../api/client';
import { Briefcase, Navigation, CheckCircle, Star, IndianRupee } from 'lucide-react';
import cn from '../../utils/cn';

/**
 * Provider ops — inbox + detail columns (not the old equal KPI strip + stacked lists).
 */
export default function ProviderDashboard({ tab = 'overview' }) {
  const [bookings, setBookings] = useState([]);
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(tab);
  const [selectedId, setSelectedId] = useState(null);

  const load = () => {
    Promise.all([
      bookingsAPI.list(),
      providersAPI.profile().catch(() => ({ data: null })),
      calendarAPI.provider().catch(() => ({ data: { events: [] } })),
    ]).then(([b, p, c]) => {
      const list = b.data.results || b.data || [];
      setBookings(list);
      setProfile(p.data);
      setEvents(c.data.events || []);
      setSelectedId((prev) => prev || list[0]?.id || null);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const newRequests = bookings.filter((b) => b.status === 'requested');
  const todayJobs = bookings.filter((b) => ['accepted', 'preparing', 'on_the_way', 'arrived', 'started'].includes(b.status));
  const completed = bookings.filter((b) => b.status === 'completed');
  const queue = activeTab === 'calendar' ? [] : [...newRequests, ...todayJobs];
  const selected = bookings.find((b) => b.id === selectedId) || queue[0];

  const handleAction = async (id, action, extra = {}) => {
    const { data } = await bookingsAPI.action(id, action, extra);
    setBookings(bookings.map((b) => (b.id === id ? data : b)));
    if (action === 'start-travel') trackingAPI.start(id).catch(() => {});
  };

  if (loading) {
    return (
      <DashboardLayout role="INDIVIDUAL_PROVIDER" title="Job inbox">
        <LoadingState variant="dashboard" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="INDIVIDUAL_PROVIDER"
      title="Job inbox"
      subtitle={`${newRequests.length} new · ${todayJobs.length} active · ${completed.length} completed`}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {['overview', 'jobs', 'calendar', 'kyc'].map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-bold capitalize',
              activeTab === key ? 'bg-brand text-white' : 'border border-line bg-surface text-muted hover:bg-page',
            )}
          >
            {key === 'kyc' ? 'KYC' : key}
          </button>
        ))}
      </div>

      {activeTab === 'kyc' && <ProviderKYCSection profile={profile} onRefresh={load} />}

      {activeTab === 'calendar' && (
        <div className="space-y-3">
          {events.length === 0 ? (
            <div className="rounded-3xl border border-line bg-surface p-6 text-sm text-muted">No scheduled events</div>
          ) : (
            events.map((e) => (
              <div key={e.id} className="rounded-2xl border border-line bg-surface p-4">
                <p className="font-bold text-ink">{e.title}</p>
                <p className="text-sm text-muted">{new Date(e.start).toLocaleString()}</p>
                <div className="mt-2"><StatusBadge status={e.status} /></div>
              </div>
            ))
          )}
        </div>
      )}

      {(activeTab === 'overview' || activeTab === 'jobs') && (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-3xl border border-line bg-surface overflow-hidden">
            <div className="border-b border-line px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Queue</p>
              <p className="font-extrabold text-ink">{queue.length} jobs</p>
            </div>
            <div className="max-h-[70vh] overflow-y-auto divide-y divide-line">
              {queue.length === 0 && <p className="p-4 text-sm text-muted">No jobs in queue</p>}
              {queue.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedId(b.id)}
                  className={cn(
                    'w-full px-4 py-3 text-left transition hover:bg-page',
                    selected?.id === b.id && 'bg-brand-soft/60',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-ink">{b.customer_name || `Job #${b.id}`}</p>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="mt-1 truncate text-xs text-muted">{b.category_detail?.name} · {b.issue_description}</p>
                </button>
              ))}
            </div>
          </aside>

          <section className="space-y-4">
            {profile && (
              <div className="grid gap-3 rounded-3xl border border-line bg-surface p-4 sm:grid-cols-3 sm:p-5">
                <TrustScore score={profile.trust_score} rating={profile.average_rating} completedJobs={profile.completed_jobs} verified={profile.verification_status === 'verified'} />
                <div>
                  <p className="text-xs text-muted">Rating</p>
                  <p className="mt-1 flex items-center gap-1 text-xl font-extrabold text-ink"><Star size={16} className="text-coral" />{profile.average_rating ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Visit charge</p>
                  <p className="mt-1 flex items-center gap-1 text-xl font-extrabold text-ink"><IndianRupee size={16} />{profile.visit_charge ?? '—'}</p>
                </div>
              </div>
            )}

            {!selected ? (
              <div className="rounded-3xl border border-dashed border-line bg-surface p-10 text-center text-muted">Select a job from the queue</div>
            ) : (
              <div className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-brand">Selected job</p>
                    <h2 className="text-xl font-extrabold text-ink">{selected.customer_name} — {selected.category_detail?.name}</h2>
                    <p className="mt-1 text-sm text-muted">{selected.issue_description}</p>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {selected.status === 'requested' && (
                    <>
                      <Button onClick={() => handleAction(selected.id, 'accept')} variant="primary" size="sm">Accept</Button>
                      <Button onClick={() => handleAction(selected.id, 'reject-slot')} variant="outline" size="sm" className="!text-danger !border-danger/30">Reject</Button>
                    </>
                  )}
                  {selected.status === 'accepted' && <Button onClick={() => handleAction(selected.id, 'prepare')} variant="primary" size="sm">Prepare</Button>}
                  {['accepted', 'preparing'].includes(selected.status) && (
                    <Button onClick={() => handleAction(selected.id, 'start-travel')} variant="coral" size="sm">Start travel</Button>
                  )}
                  {selected.status === 'on_the_way' && <Button onClick={() => handleAction(selected.id, 'arrive')} variant="secondary" size="sm">Mark arrived</Button>}
                  {selected.status === 'arrived' && <Button onClick={() => handleAction(selected.id, 'start-job')} variant="primary" size="sm">Start job</Button>}
                  {selected.status === 'started' && <p className="text-sm text-muted">Share OTP with the customer to complete.</p>}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'New', count: newRequests.length, icon: Briefcase },
                    { label: 'Active', count: todayJobs.length, icon: CheckCircle },
                    { label: 'Travel', count: bookings.filter((b) => b.status === 'on_the_way').length, icon: Navigation },
                    { label: 'Done', count: completed.length, icon: Star },
                  ].map(({ label, count, icon: Icon }) => (
                    <div key={label} className="rounded-2xl bg-page p-3">
                      <Icon size={14} className="text-brand" />
                      <p className="mt-2 text-xl font-extrabold text-ink">{count}</p>
                      <p className="text-[11px] font-semibold text-muted">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="rounded-3xl border border-line bg-surface p-5">
                <ProviderKYCSection profile={profile} onRefresh={load} />
              </div>
            )}
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}
