import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingState from '../../components/LoadingState';
import StatusBadge from '../../components/StatusBadge';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TrustScore from '../../components/providers/TrustScore';
import { bookingsAPI, providersAPI, trackingAPI, calendarAPI } from '../../api/client';
import { Briefcase, Navigation, CheckCircle, Star, IndianRupee } from 'lucide-react';
import cn from '../../utils/cn';

export default function ProviderDashboard({ tab = 'overview' }) {
  const [bookings, setBookings] = useState([]);
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(tab);

  const load = () => {
    Promise.all([
      bookingsAPI.list(),
      providersAPI.profile().catch(() => ({ data: null })),
      calendarAPI.provider().catch(() => ({ data: { events: [] } })),
    ]).then(([b, p, c]) => {
      setBookings(b.data.results || b.data);
      setProfile(p.data);
      setEvents(c.data.events || []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const newRequests = bookings.filter((b) => b.status === 'requested');
  const todayJobs = bookings.filter((b) => ['accepted', 'preparing', 'on_the_way', 'arrived', 'started'].includes(b.status));
  const completed = bookings.filter((b) => b.status === 'completed');
  const activeTravel = bookings.filter((b) => b.status === 'on_the_way');

  const handleAction = async (id, action, extra = {}) => {
    const { data } = await bookingsAPI.action(id, action, extra);
    setBookings(bookings.map((b) => (b.id === id ? data : b)));
    if (action === 'start-travel') trackingAPI.start(id).catch(() => {});
  };

  const renderJobActions = (b) => (
    <div className="flex flex-wrap gap-2 mt-3">
      {b.status === 'requested' && (
        <>
          <Button onClick={() => handleAction(b.id, 'accept')} variant="success" size="sm">Accept</Button>
          <Button onClick={() => handleAction(b.id, 'reject-slot')} variant="secondary" size="sm" className="!border-danger !text-danger">Reject</Button>
        </>
      )}
      {b.status === 'accepted' && <Button onClick={() => handleAction(b.id, 'prepare')} variant="primary" size="sm">Prepare</Button>}
      {['accepted', 'preparing'].includes(b.status) && (
        <Button onClick={() => handleAction(b.id, 'start-travel')} variant="primary" size="sm">Start Travel</Button>
      )}
      {b.status === 'on_the_way' && <Button onClick={() => handleAction(b.id, 'arrive')} variant="secondary" size="sm">Mark Arrived</Button>}
      {b.status === 'arrived' && <Button onClick={() => handleAction(b.id, 'start-job')} variant="primary" size="sm">Start Job</Button>}
      {b.status === 'started' && <span className="text-sm text-muted">Share OTP with customer to complete</span>}
    </div>
  );

  if (loading) return <DashboardLayout role="INDIVIDUAL_PROVIDER"><LoadingState variant="dashboard" /></DashboardLayout>;

  const statCards = [
    { label: 'New Requests', count: newRequests.length, icon: Briefcase, color: 'bg-indigo/10 text-aqua' },
    { label: "Today's Jobs", count: todayJobs.length, icon: CheckCircle, color: 'bg-lime/10 text-lime' },
    { label: 'Active Travel', count: activeTravel.length, icon: Navigation, color: 'bg-indigo/10 text-midnight' },
    { label: 'Completed', count: completed.length, icon: Star, color: 'bg-lime/10 text-lime' },
  ];

  return (
    <DashboardLayout role="INDIVIDUAL_PROVIDER">
      <PageHeader title="Provider Workspace" subtitle="Manage jobs, calendar, and your profile" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {statCards.map(({ label, count, icon: Icon, color }) => (
          <Card key={label} className="!p-4">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-2', color.split(' ')[0])}>
              <Icon size={18} className={color.split(' ')[1]} />
            </div>
            <p className="text-2xl font-bold text-midnight">{count}</p>
            <p className="text-xs text-muted">{label}</p>
          </Card>
        ))}
      </div>

      {profile && (
        <Card className="mb-6 !p-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <TrustScore score={profile.trust_score} rating={profile.average_rating} completedJobs={profile.completed_jobs} verified={profile.verification_status === 'verified'} />
            <div><p className="text-xs text-muted">Rating</p><p className="text-xl font-bold text-midnight flex items-center gap-1"><Star size={16} className="text-aqua" /> {profile.average_rating ?? '—'}</p></div>
            <div><p className="text-xs text-muted">Visit Charge</p><p className="text-xl font-bold text-midnight flex items-center gap-1"><IndianRupee size={16} /> {profile.visit_charge ?? '—'}</p></div>
          </div>
        </Card>
      )}

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {['overview', 'jobs', 'calendar'].map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={cn('px-4 py-2 rounded-xl text-sm font-medium capitalize whitespace-nowrap transition-colors',
              activeTab === t ? 'bg-violet text-white' : 'bg-surface border border-line text-muted hover:bg-page')}>
            {t}
          </button>
        ))}
      </div>

      {(activeTab === 'overview' || activeTab === 'jobs') && (
        <>
          <CardHeader title="New Requests" subtitle={`${newRequests.length} pending`} className="mb-4" />
          {newRequests.length === 0 ? <Card className="mb-8 !p-4"><p className="text-muted text-sm">No new requests</p></Card> : (
            <div className="space-y-3 mb-8">
              {newRequests.map((b) => (
                <Card key={b.id} className="!p-4">
                  <div className="flex justify-between mb-2 gap-2">
                    <p className="font-medium text-midnight">{b.customer_name} — {b.category_detail?.name}</p>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="text-sm text-muted">{b.issue_description}</p>
                  {renderJobActions(b)}
                </Card>
              ))}
            </div>
          )}

          <CardHeader title="Active Jobs" subtitle={`${todayJobs.length} in progress`} className="mb-4" />
          <div className="space-y-3">
            {todayJobs.length === 0 ? <Card className="!p-4"><p className="text-muted text-sm">No active jobs</p></Card> : todayJobs.map((b) => (
              <Card key={b.id} className="!p-4">
                <div className="flex justify-between mb-2">
                  <p className="font-medium">#{b.id} {b.category_detail?.name}</p>
                  <StatusBadge status={b.status} />
                </div>
                {renderJobActions(b)}
              </Card>
            ))}
          </div>
        </>
      )}

      {activeTab === 'calendar' && (
        <div className="space-y-3">
          {events.length === 0 ? <Card className="!p-4"><p className="text-muted text-sm">No scheduled events</p></Card> : events.map((e) => (
            <Card key={e.id} className="!p-4">
              <p className="font-medium text-midnight">{e.title}</p>
              <p className="text-sm text-muted">{new Date(e.start).toLocaleString()}</p>
              <StatusBadge status={e.status} />
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
