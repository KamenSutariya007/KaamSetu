import { Link, useLocation } from 'react-router-dom';
import { Home, Wrench, Calendar, Headphones, User, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import cn from '../../utils/cn';

function profilePath(role) {
  const p = {
    CUSTOMER: '/customer/profile',
    INDIVIDUAL_PROVIDER: '/provider/profile',
    THIRD_PARTY_PARTNER: '/partner/profile',
    SUPPORT_AGENT: '/support-desk/profile',
    SENIOR_SUPPORT_AGENT: '/support-desk/profile',
    ADMIN: '/admin/profile',
  };
  return p[role] || '/login';
}

function dashboardPath(role) {
  const p = {
    CUSTOMER: '/customer',
    INDIVIDUAL_PROVIDER: '/provider',
    THIRD_PARTY_PARTNER: '/partner',
    SUPPORT_AGENT: '/support-desk',
    SENIOR_SUPPORT_AGENT: '/support-desk',
    ADMIN: '/admin',
  };
  return p[role] || '/customer';
}

function bookingsPath(role) {
  if (role === 'INDIVIDUAL_PROVIDER') return '/provider/jobs';
  if (role === 'THIRD_PARTY_PARTNER') return '/partner/jobs';
  if (role === 'ADMIN') return '/admin/bookings';
  if (role === 'SUPPORT_AGENT' || role === 'SENIOR_SUPPORT_AGENT') return '/support-desk';
  return '/customer/bookings';
}

export default function MobileNav() {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const role = user?.role;

  const links = isAuthenticated
    ? [
        { to: dashboardPath(role), icon: LayoutDashboard, labelKey: 'dashboard' },
        { to: '/guides', icon: Wrench, labelKey: 'navServices' },
        { to: bookingsPath(role), icon: Calendar, labelKey: 'bookings' },
        { to: '/support', icon: Headphones, labelKey: 'support' },
        { to: profilePath(role), icon: User, labelKey: 'profile' },
      ]
    : [
        { to: '/', icon: Home, labelKey: 'navHome' },
        { to: '/guides', icon: Wrench, labelKey: 'navServices' },
        { to: '/providers', icon: Calendar, labelKey: 'navProfessionals' },
        { to: '/support', icon: Headphones, labelKey: 'support' },
        { to: '/login', icon: User, labelKey: 'login' },
      ];

  return (
    <nav
      className="lg:hidden fixed bottom-3 inset-x-3 z-50 bg-surface/95 backdrop-blur-md rounded-2xl border border-line shadow-lg safe-area-pb"
      aria-label="Mobile navigation"
    >
      <div className="flex justify-around items-center px-1 py-1.5">
        {links.map(({ to, icon: Icon, labelKey }) => {
          const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
          return (
            <Link
              key={`${labelKey}-${to}`}
              to={to}
              className={cn(
                'flex flex-col items-center gap-0.5 min-w-0 flex-1 py-2 rounded-xl transition-colors',
                active ? 'text-brand' : 'text-muted hover:text-ink',
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-semibold truncate max-w-full px-0.5">{t(labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
