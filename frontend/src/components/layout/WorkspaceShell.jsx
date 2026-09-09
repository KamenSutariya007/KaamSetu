import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Sparkles, Users, Wrench, FileText, DollarSign,
  Headphones, Bell, User, Briefcase,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import cn from '../../utils/cn';

function linksFor(role) {
  if (role === 'ADMIN') {
    return [
      { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
      { to: '/admin/bookings', icon: Calendar, label: 'Bookings' },
      { to: '/support-desk', icon: Headphones, label: 'Support' },
      { to: '/admin/profile', icon: User, label: 'Profile' },
    ];
  }
  if (role === 'INDIVIDUAL_PROVIDER') {
    return [
      { to: '/provider', icon: LayoutDashboard, label: 'Overview', end: true },
      { to: '/provider/jobs', icon: Briefcase, label: 'Jobs' },
      { to: '/provider/calendar', icon: Calendar, label: 'Calendar' },
      { to: '/provider/profile', icon: User, label: 'Profile' },
    ];
  }
  if (role === 'THIRD_PARTY_PARTNER') {
    return [
      { to: '/partner', icon: LayoutDashboard, label: 'Overview', end: true },
      { to: '/partner/jobs', icon: Briefcase, label: 'Jobs' },
      { to: '/partner/profile', icon: User, label: 'Profile' },
    ];
  }
  if (role === 'SUPPORT_AGENT' || role === 'SENIOR_SUPPORT_AGENT') {
    return [
      { to: '/support-desk', icon: Headphones, label: 'Queue', end: true },
      { to: '/support-desk/profile', icon: User, label: 'Profile' },
    ];
  }
  return [
    { to: '/customer', icon: LayoutDashboard, label: 'Home', end: true },
    { to: '/customer/bookings', icon: Calendar, label: 'Bookings' },
    { to: '/ai-assistant', icon: Sparkles, label: 'AI Fix' },
    { to: '/providers', icon: Users, label: 'Pros' },
    { to: '/guides', icon: Wrench, label: 'Guides' },
    { to: '/customer/passport', icon: FileText, label: 'Passport' },
    { to: '/fair-price', icon: DollarSign, label: 'Pricing' },
    { to: '/customer/notifications', icon: Bell, label: 'Alerts' },
    { to: '/support', icon: Headphones, label: 'Help' },
    { to: '/customer/profile', icon: User, label: 'Profile' },
  ];
}

/**
 * Workspace chrome: top brand strip + horizontal nav (desktop) + bottom dock (mobile).
 * Replaces the old left-sidebar + floating pill pattern.
 */
export default function WorkspaceShell({ role = 'CUSTOMER', title, subtitle, actions, children }) {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const links = linksFor(role);
  const isAdmin = role === 'ADMIN';
  const mobileLinks = links.slice(0, 5);

  return (
    <div className={cn('min-h-screen', isAdmin ? 'bg-[#0B3D3A]' : 'bg-page')}>
      {/* Top strip */}
      <div className={cn('border-b', isAdmin ? 'border-white/10 bg-[#0B3D3A] text-white' : 'border-line bg-surface')}>
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className={cn('grid h-8 w-8 place-items-center rounded-md text-xs font-extrabold', isAdmin ? 'bg-coral text-white' : 'bg-brand text-white')}>K</span>
            <span className="hidden sm:block font-extrabold tracking-tight">{t('appName')}</span>
          </Link>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className={cn('hidden md:inline text-xs font-semibold uppercase tracking-wider', isAdmin ? 'text-white/50' : 'text-muted')}>
              {role.replace(/_/g, ' ').toLowerCase()}
            </span>
            <span className={cn('rounded-full px-3 py-1 text-xs font-bold', isAdmin ? 'bg-white/10' : 'bg-page text-ink')}>
              {user?.first_name || user?.username || 'User'}
            </span>
            <button
              type="button"
              onClick={logout}
              className={cn('rounded-lg px-2 py-1 text-xs font-semibold', isAdmin ? 'text-white/70 hover:bg-white/10' : 'text-muted hover:bg-page')}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Horizontal primary nav */}
        <div className="mx-auto hidden max-w-7xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6 md:flex">
          {links.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={`${to}-${label}`}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold transition-colors',
                  isAdmin
                    ? isActive
                      ? 'bg-coral text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                    : isActive
                      ? 'bg-brand text-white'
                      : 'text-muted hover:bg-page hover:text-ink',
                )
              }
            >
              <Icon size={15} />
              {t(label) !== label ? t(label) : label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Content canvas */}
      <div className={cn('mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8', isAdmin && 'min-h-[calc(100vh-8rem)] rounded-t-3xl bg-page mt-0 md:mt-2')}>
        {(title || actions) && (
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {title && <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>}
              {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>
        )}
        <div className="pb-24 md:pb-8">{children}</div>
      </div>

      {/* Mobile dock — segmented control style */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface/95 backdrop-blur md:hidden safe-area-pb">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 py-2">
          {mobileLinks.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={`${to}-${label}`}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-bold',
                  isActive ? 'bg-brand-soft text-brand' : 'text-muted',
                )
              }
            >
              <Icon size={18} />
              <span className="truncate max-w-full px-0.5">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

/** Thin adapter so existing DashboardLayout imports keep working with new chrome. */
export function DashboardLayoutAdapter({ children, role = 'CUSTOMER' }) {
  return <WorkspaceShell role={role}>{children}</WorkspaceShell>;
}
