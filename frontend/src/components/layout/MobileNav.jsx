import { Link, useLocation } from 'react-router-dom';
import { Home, Wrench, Calendar, Headphones, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import cn from '../../utils/cn';

const LINKS = [
  { to: '/', icon: Home, labelKey: 'navHome' },
  { to: '/guides', icon: Wrench, labelKey: 'navServices' },
  { to: '/customer/bookings', icon: Calendar, labelKey: 'bookings', auth: true },
  { to: '/support', icon: Headphones, labelKey: 'support' },
  { to: '/customer/profile', icon: User, labelKey: 'profile', auth: true },
];

function profilePath(role) {
  const p = { CUSTOMER: '/customer/profile', INDIVIDUAL_PROVIDER: '/provider/profile', THIRD_PARTY_PARTNER: '/partner/profile', SUPPORT_AGENT: '/support-desk/profile', SENIOR_SUPPORT_AGENT: '/support-desk/profile', ADMIN: '/admin/profile' };
  return p[role] || '/login';
}

export default function MobileNav() {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();

  const links = LINKS.map((l) => {
    if (l.labelKey === 'profile') return { ...l, to: isAuthenticated ? profilePath(user?.role) : '/login' };
    if (l.labelKey === 'bookings') return { ...l, to: isAuthenticated ? '/customer/bookings' : '/login' };
    return l;
  });

  return (
    <nav className="lg:hidden fixed bottom-4 inset-x-4 z-50 bg-surface rounded-2xl border border-line shadow-lg safe-area-pb animate-fade-up" aria-label="Mobile navigation">
      <div className="flex justify-around items-center px-2 py-2">
        {links.map(({ to, icon: Icon, labelKey }) => {
          const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
          return (
            <Link
              key={labelKey}
              to={to}
              className={cn(
                'flex flex-col items-center gap-0.5 min-w-0 flex-1 py-1.5 rounded-xl transition-all duration-200',
                active ? 'text-brand scale-105' : 'text-muted hover:text-ink',
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{t(labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
