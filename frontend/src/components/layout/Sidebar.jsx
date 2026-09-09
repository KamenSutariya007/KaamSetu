import { Link, useLocation } from 'react-router-dom';
import {
  Home, Sparkles, Wrench, Users, Calendar, FileText, DollarSign,
  Headphones, Bell, User, LayoutDashboard,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import cn from '../../utils/cn';

const CUSTOMER_LINKS = [
  { to: '/customer', icon: LayoutDashboard, label: 'dashboard', exact: true },
  { to: '/', icon: Home, label: 'navHome', exact: true },
  { to: '/ai-assistant', icon: Sparkles, label: 'navAIFix' },
  { to: '/guides', icon: Wrench, label: 'navServices' },
  { to: '/providers', icon: Users, label: 'navProfessionals' },
  { to: '/customer/bookings', icon: Calendar, label: 'bookings' },
  { to: '/customer/passport', icon: FileText, label: 'passport' },
  { to: '/fair-price', icon: DollarSign, label: 'fairPrice' },
  { to: '/support', icon: Headphones, label: 'support' },
  { to: '/customer/notifications', icon: Bell, label: 'notifications' },
  { to: '/customer/profile', icon: User, label: 'profile' },
];

const PROVIDER_LINKS = [
  { to: '/provider', icon: LayoutDashboard, label: 'dashboard', exact: true },
  { to: '/provider/jobs', icon: Calendar, label: 'bookings' },
  { to: '/provider/calendar', icon: Calendar, label: 'upcoming' },
  { to: '/support', icon: Headphones, label: 'support' },
  { to: '/provider/profile', icon: User, label: 'profile' },
];

const PARTNER_LINKS = [
  { to: '/partner', icon: LayoutDashboard, label: 'dashboard', exact: true },
  { to: '/partner/jobs', icon: Calendar, label: 'bookings' },
  { to: '/support', icon: Headphones, label: 'support' },
  { to: '/partner/profile', icon: User, label: 'profile' },
];

const ADMIN_LINKS = [
  { to: '/admin', icon: LayoutDashboard, label: 'dashboard', exact: true },
  { to: '/admin/bookings', icon: Calendar, label: 'bookings' },
  { to: '/support-desk', icon: Headphones, label: 'support' },
  { to: '/admin/profile', icon: User, label: 'profile' },
];

const SUPPORT_LINKS = [
  { to: '/support-desk', icon: LayoutDashboard, label: 'dashboard', exact: true },
  { to: '/support', icon: Headphones, label: 'support' },
  { to: '/support-desk/profile', icon: User, label: 'profile' },
];

function getLinks(role) {
  if (role === 'ADMIN') return ADMIN_LINKS;
  if (role === 'INDIVIDUAL_PROVIDER') return PROVIDER_LINKS;
  if (role === 'THIRD_PARTY_PARTNER') return PARTNER_LINKS;
  if (role === 'SUPPORT_AGENT' || role === 'SENIOR_SUPPORT_AGENT') return SUPPORT_LINKS;
  return CUSTOMER_LINKS;
}

function isActive(location, to, exact) {
  if (exact) return location.pathname === to;
  return location.pathname === to || location.pathname.startsWith(`${to}/`);
}

export default function Sidebar({ role = 'CUSTOMER' }) {
  const { t } = useLanguage();
  const location = useLocation();
  const links = getLinks(role);

  return (
    <aside className="hidden lg:flex flex-col w-[248px] shrink-0 bg-surface border-r border-line h-[calc(100vh-4rem)] sticky top-16">
      <div className="px-4 pt-5 pb-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Workspace</p>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {links.map(({ to, icon: Icon, label, exact }) => {
          const active = isActive(location, to, exact);
          return (
            <Link
              key={`${to}-${label}`}
              to={to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                active ? 'bg-brand text-white shadow-sm' : 'text-muted hover:text-ink hover:bg-page',
              )}
            >
              <Icon size={18} className="shrink-0" strokeWidth={active ? 2.5 : 2} />
              <span className="truncate">{t(label)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
