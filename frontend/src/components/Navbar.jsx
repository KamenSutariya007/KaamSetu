import { Link, useLocation } from 'react-router-dom';
import { Bell, User, Sparkles, Wrench, Users, Calendar, Headphones, Home, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import PageContainer from './layout/PageContainer';
import Button from './ui/Button';
import cn from '../utils/cn';

const NAV_LINKS = [
  { to: '/', icon: Home, labelKey: 'navHome', exact: true },
  { to: '/ai-assistant', icon: Sparkles, labelKey: 'navAIFix' },
  { to: '/guides', icon: Wrench, labelKey: 'navServices' },
  { to: '/providers', icon: Users, labelKey: 'navProfessionals' },
  { to: '/support', icon: Headphones, labelKey: 'support' },
];

function getDashboardPath(role) {
  const paths = { CUSTOMER: '/customer', INDIVIDUAL_PROVIDER: '/provider', THIRD_PARTY_PARTNER: '/partner', SUPPORT_AGENT: '/support-desk', SENIOR_SUPPORT_AGENT: '/support-desk', ADMIN: '/admin' };
  return paths[role] || '/customer';
}

function getProfilePath(role) {
  const paths = { CUSTOMER: '/customer/profile', INDIVIDUAL_PROVIDER: '/provider/profile', THIRD_PARTY_PARTNER: '/partner/profile', SUPPORT_AGENT: '/support-desk/profile', SENIOR_SUPPORT_AGENT: '/support-desk/profile', ADMIN: '/admin/profile' };
  return paths[role] || '/login';
}

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  const isActive = (to, exact) => exact ? location.pathname === to : location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <header className="sticky top-0 z-50 bg-midnight shadow-nav">
      <PageContainer variant="wide" className="flex items-center justify-between h-14 sm:h-16" noPadding>
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo flex items-center justify-center text-white font-bold text-sm">K</div>
          <span className="font-bold text-white text-lg tracking-tight">{t('appName')}</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-0.5" aria-label="Main">
          {NAV_LINKS.map(({ to, icon: Icon, labelKey, exact }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive(to, exact) ? 'text-white bg-indigo' : 'text-white/70 hover:text-white hover:bg-white/5',
              )}
            >
              <Icon size={16} className={isActive(to, exact) ? 'text-brand' : ''} />
              {t(labelKey)}
            </Link>
          ))}
          {isAuthenticated && (
            <Link to="/customer/bookings" className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors', isActive('/customer/bookings') ? 'text-white bg-indigo' : 'text-white/70 hover:text-white hover:bg-white/5')}>
              <Calendar size={16} /> {t('bookings')}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {isAuthenticated ? (
            <>
              <Link to="/customer/notifications" className="p-2 rounded-lg text-white/70 hover:text-brand hover:bg-white/5 transition-colors" aria-label={t('notifications')}>
                <Bell size={20} />
              </Link>
              <Link to={getProfilePath(user?.role)} className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 hidden sm:flex" aria-label={t('profile')}>
                <User size={20} />
              </Link>
              <Link to={getDashboardPath(user?.role)} className="hidden md:block">
                <Button variant="outline" size="sm"><LayoutDashboard size={14} /> {t('dashboard')}</Button>
              </Link>
              <button onClick={logout} className="hidden sm:block px-3 py-1.5 text-sm text-white/60 hover:text-white transition-colors">{t('logout')}</button>
            </>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost" size="sm" className="!text-white/80 hover:!text-white hover:!bg-white/5">{t('login')}</Button></Link>
              <Link to="/register"><Button variant="accent" size="sm">{t('register')}</Button></Link>
            </>
          )}
        </div>
      </PageContainer>
    </header>
  );
}
