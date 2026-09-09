import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingState from '../../components/LoadingState';
import Button from '../../components/ui/Button';
import { adminAPI } from '../../api/client';
import {
  Users, Wrench, Building2, Calendar, CheckCircle, XCircle, Headphones, Sparkles, ArrowUpRight,
} from 'lucide-react';

const KPI = [
  { key: 'users', label: 'Users', icon: Users },
  { key: 'providers', label: 'Providers', icon: Wrench },
  { key: 'partners', label: 'Partners', icon: Building2 },
  { key: 'bookings', label: 'Bookings', icon: Calendar },
  { key: 'completed_bookings', label: 'Completed', icon: CheckCircle },
  { key: 'cancelled_bookings', label: 'Cancelled', icon: XCircle },
  { key: 'open_tickets', label: 'Open tickets', icon: Headphones },
  { key: 'ai_diagnoses', label: 'AI diagnoses', icon: Sparkles },
];

/**
 * Admin console — dark workspace chrome + dense KPI strip + action table feel.
 */
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.dashboard().then(({ data }) => setStats(data)).finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout
      role="ADMIN"
      title="Operations overview"
      subtitle="Platform health across users, bookings, and support."
      actions={<Button as={Link} to="/admin/bookings" variant="coral">Manage bookings</Button>}
    >
      {loading ? (
        <LoadingState variant="dashboard" />
      ) : (
        stats && (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-line bg-surface">
              <div className="grid grid-cols-2 divide-x divide-y divide-line sm:grid-cols-4">
                {KPI.map(({ key, label, icon: Icon }) => (
                  <div key={key} className="p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</p>
                      <Icon size={14} className="text-brand" />
                    </div>
                    <p className="mt-2 text-3xl font-extrabold tabular-nums text-ink">{stats[key] ?? '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <section className="lg:col-span-2 rounded-3xl border border-line bg-surface p-5 sm:p-6">
                <h2 className="text-lg font-extrabold text-ink">Management shortcuts</h2>
                <p className="mt-1 text-sm text-muted">Jump into high-frequency admin workflows.</p>
                <div className="mt-5 divide-y divide-line rounded-2xl border border-line">
                  {[
                    { to: '/admin/bookings', title: 'Booking operations', desc: 'Search, filter, and review all bookings' },
                    { to: '/support-desk', title: 'Support desk', desc: 'Assign and resolve open tickets' },
                    { to: '/providers', title: 'Provider directory', desc: 'Inspect professionals and partners' },
                    { to: '/admin/profile', title: 'Admin settings', desc: 'Profile and account preferences' },
                  ].map((row) => (
                    <Link key={row.to} to={row.to} className="flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-page">
                      <div>
                        <p className="font-bold text-ink">{row.title}</p>
                        <p className="text-xs text-muted">{row.desc}</p>
                      </div>
                      <ArrowUpRight size={16} className="text-muted" />
                    </Link>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl bg-[#0B3D3A] p-6 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/50">Snapshot</p>
                <h3 className="mt-2 text-xl font-extrabold">Keep the marketplace healthy</h3>
                <ul className="mt-4 space-y-3 text-sm text-white/75">
                  <li>• Monitor open support tickets daily</li>
                  <li>• Review cancelled bookings for patterns</li>
                  <li>• Verify new provider KYC promptly</li>
                </ul>
                {stats.demo_data_label && (
                  <p className="mt-6 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white/90">
                    {stats.demo_data_label}
                  </p>
                )}
              </section>
            </div>
          </div>
        )
      )}
    </DashboardLayout>
  );
}
