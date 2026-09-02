import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingState from '../../components/LoadingState';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import { adminAPI } from '../../api/client';
import { Users, Wrench, Building2, Calendar, CheckCircle, XCircle, Headphones, Sparkles, ArrowRight } from 'lucide-react';

const STAT_CONFIG = [
  { key: 'users', label: 'Users', icon: Users, color: 'text-midnight bg-indigo/10' },
  { key: 'providers', label: 'Providers', icon: Wrench, color: 'text-aqua bg-indigo/10' },
  { key: 'partners', label: 'Partners', icon: Building2, color: 'text-midnight bg-indigo/10' },
  { key: 'bookings', label: 'Bookings', icon: Calendar, color: 'text-lime bg-lime/10' },
  { key: 'completed_bookings', label: 'Completed', icon: CheckCircle, color: 'text-lime bg-lime/10' },
  { key: 'cancelled_bookings', label: 'Cancelled', icon: XCircle, color: 'text-danger bg-danger/10' },
  { key: 'open_tickets', label: 'Open Tickets', icon: Headphones, color: 'text-midnight bg-indigo/10' },
  { key: 'ai_diagnoses', label: 'AI Diagnoses', icon: Sparkles, color: 'text-aqua bg-indigo/10' },
];

const ADMIN_LINKS = [
  { to: '/admin/bookings', label: 'All Bookings', desc: 'Manage bookings' },
  { to: '/support-desk', label: 'Support Desk', desc: 'Agent workflow' },
  { to: '/providers', label: 'Providers', desc: 'View professionals' },
  { to: '/customer/passport', label: 'Passport', desc: 'View records' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.dashboard().then(({ data }) => setStats(data)).finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout role="ADMIN">
      <PageHeader title="Admin Dashboard" subtitle="Platform overview and management" />

      {loading ? <LoadingState variant="dashboard" /> : stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {STAT_CONFIG.map(({ key, label, icon: Icon, color }) => (
              <Card key={key} className="!p-4 sm:!p-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                  <Icon size={20} />
                </div>
                <p className="text-2xl font-bold text-midnight">{stats[key] ?? '—'}</p>
                <p className="text-sm text-muted">{label}</p>
              </Card>
            ))}
          </div>

          <h2 className="text-lg font-semibold text-midnight mb-4">Quick Access</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {ADMIN_LINKS.map(({ to, label, desc }) => (
              <Link key={to} to={to}>
                <Card hover className="!p-4 group">
                  <p className="font-semibold text-midnight group-hover:text-aqua transition-colors">{label}</p>
                  <p className="text-xs text-muted mt-0.5">{desc}</p>
                  <ArrowRight size={14} className="text-muted mt-2 group-hover:text-aqua transition-colors" />
                </Card>
              </Link>
            ))}
          </div>

          {stats.demo_data_label && (
            <p className="text-aqua text-sm font-medium px-3 py-2 bg-indigo/10 rounded-lg inline-block">{stats.demo_data_label}</p>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
