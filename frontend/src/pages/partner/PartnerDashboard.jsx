import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingState, { EmptyState } from '../../components/LoadingState';
import StatusBadge from '../../components/StatusBadge';
import { useLanguage } from '../../context/LanguageContext';
import { providersAPI, bookingsAPI, calendarAPI } from '../../api/client';

export default function PartnerDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [warranty, setWarranty] = useState([]);
  const [parts, setParts] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([
      providersAPI.partnerDashboard(),
      bookingsAPI.list({ status: 'requested' }),
      providersAPI.technicians(),
      providersAPI.warrantyClaims(),
      providersAPI.spareParts(),
      providersAPI.quotations(),
    ]).then(([dash, b, tech, w, p, q]) => {
      setStats(dash.data);
      setBookings(b.data.results || b.data);
      setTechnicians(tech.data.results || tech.data);
      setWarranty(w.data.results || w.data);
      setParts(p.data.results || p.data);
      setQuotations(q.data.results || q.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAccept = async (id, technicianId) => {
    await bookingsAPI.action(id, 'accept', technicianId ? { technician_id: technicianId } : {});
    load();
  };

  const tabs = [
    ['overview', 'Overview'], ['requests', 'Incoming Requests'], ['technicians', 'Technicians'],
    ['warranty', 'Warranty Claims'], ['parts', 'Spare Parts'], ['quotations', 'Quotations'], ['jobs', 'Active Jobs'],
  ];

  if (loading) return <DashboardLayout role="THIRD_PARTY_PARTNER"><LoadingState /></DashboardLayout>;

  const org = stats?.organization;

  return (
    <DashboardLayout role="THIRD_PARTY_PARTNER">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">{org?.organization_name || 'Partner Dashboard'}</h1>
          <p className="text-muted text-sm">{org?.partner_type?.replace(/_/g, ' ')} · {org?.verification_status}</p>
          {stats?.demo_data_label && <span className="text-xs text-brand">{stats.demo_data_label}</span>}
        </div>
        <div className="flex flex-wrap gap-1">
          {org?.badges?.map((b) => <span key={b} className="text-xs bg-indigo/10 px-2 py-1 rounded-full">{b}</span>)}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          ['Incoming', stats?.incoming_requests], ['Active Jobs', stats?.active_jobs],
          ['Completed', stats?.completed_jobs], ['Technicians', stats?.technicians],
        ].map(([label, val]) => (
          <div key={label} className="bg-surface rounded-xl border border-line p-4">
            <p className="text-2xl font-bold text-ink">{val ?? 0}</p>
            <p className="text-sm text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto mb-6 pb-1">
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap ${tab === id ? 'bg-brand text-white' : 'bg-surface border border-line text-muted'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-surface rounded-xl border border-line p-5">
            <h2 className="font-semibold mb-3">Organization Profile</h2>
            <p className="text-sm text-muted mb-1">Brands: {(org?.authorized_brands || []).join(', ') || '—'}</p>
            <p className="text-sm text-muted mb-1">Rating: ★ {org?.average_rating} · Revenue: ₹{stats?.total_revenue}</p>
            <p className="text-sm text-muted">Address: {org?.address || 'Ahmedabad area'}</p>
          </div>
          <div className="bg-surface rounded-xl border border-line p-5">
            <h2 className="font-semibold mb-3">Analytics</h2>
            <p className="text-sm text-muted">Open warranty claims: {stats?.warranty_claims}</p>
            <p className="text-sm text-muted">Pending quotations: {stats?.quotations}</p>
            <p className="text-sm text-muted">Spare parts in stock: {stats?.spare_parts}</p>
          </div>
        </div>
      )}

      {tab === 'requests' && (
        bookings.length === 0 ? <EmptyState message="No incoming requests" /> : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="bg-surface rounded-xl border border-line p-4">
                <div className="flex justify-between mb-2">
                  <p className="font-medium">{b.customer_name} — {b.category_detail?.name}</p>
                  <StatusBadge status={b.status} />
                </div>
                <p className="text-sm text-muted mb-3">{b.issue_description}</p>
                <div className="flex flex-wrap gap-2 items-center">
                  <select id={`tech-${b.id}`} className="text-sm border border-line rounded-lg px-2 py-1">
                    <option value="">Assign technician</option>
                    {technicians.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <button onClick={() => {
                    const sel = document.getElementById(`tech-${b.id}`);
                    handleAccept(b.id, sel?.value || null);
                  }} className="px-3 py-1.5 bg-lime text-white rounded-lg text-sm">Accept</button>
                  <button onClick={() => bookingsAPI.action(b.id, 'reject-slot', {}).then(load)}
                    className="px-3 py-1.5 border border-danger text-danger rounded-lg text-sm">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'technicians' && (
        <div className="grid sm:grid-cols-2 gap-3">
          {technicians.map((tech) => (
            <div key={tech.id} className="bg-surface rounded-xl border border-line p-4">
              <p className="font-medium">{tech.name}</p>
              <p className="text-sm text-muted">{tech.phone || '—'}</p>
              <p className="text-xs text-lime mt-1">{tech.is_active ? 'Active' : 'Inactive'}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'warranty' && warranty.map((w) => (
        <div key={w.id} className="bg-surface rounded-xl border border-line p-4 mb-3">
          <p className="font-medium">{w.customer_name} — {w.appliance_brand}</p>
          <p className="text-sm text-muted">{w.issue_description}</p>
          <StatusBadge status={w.status} label={w.status} />
        </div>
      ))}

      {tab === 'parts' && parts.map((p) => (
        <div key={p.id} className="bg-surface rounded-xl border border-line p-4 mb-3 flex justify-between">
          <div><p className="font-medium">{p.name}</p><p className="text-sm text-muted">{p.brand}</p></div>
          <p className="font-semibold">₹{p.price}</p>
        </div>
      ))}

      {tab === 'quotations' && quotations.map((q) => (
        <div key={q.id} className="bg-surface rounded-xl border border-line p-4 mb-3">
          <p className="font-medium">{q.customer_name} — ₹{q.amount}</p>
          <p className="text-sm text-muted">{q.description}</p>
        </div>
      ))}

      {tab === 'jobs' && <PartnerJobsList />}
    </DashboardLayout>
  );
}

function PartnerJobsList() {
  const [jobs, setJobs] = useState([]);
  useEffect(() => {
    bookingsAPI.list().then(({ data }) => {
      const all = data.results || data;
      setJobs(all.filter((b) => !['completed', 'cancelled', 'rejected'].includes(b.status)));
    });
  }, []);
  return jobs.length === 0 ? <EmptyState /> : (
    <div className="space-y-3">{jobs.map((b) => (
      <div key={b.id} className="bg-surface rounded-xl border border-line p-4">
        <p className="font-medium">#{b.id} {b.category_detail?.name}</p>
        <StatusBadge status={b.status} />
        {b.technician && <p className="text-sm text-muted mt-1">Technician assigned</p>}
      </div>
    ))}</div>
  );
}
