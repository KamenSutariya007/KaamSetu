import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, Menu, X, MapPin, Bell, ChevronDown, LogOut, LayoutDashboard, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import cn from '../../utils/cn';

const PUBLIC_LINKS = [
  { to: '/providers', label: 'Find pros' },
  { to: '/guides', label: 'Services' },
  { to: '/ai-assistant', label: 'AI checkup' },
  { to: '/fair-price', label: 'Fair price' },
  { to: '/support', label: 'Support' },
];

function roleHome(role) {
  const map = {
    CUSTOMER: '/customer',
    INDIVIDUAL_PROVIDER: '/provider',
    THIRD_PARTY_PARTNER: '/partner',
    SUPPORT_AGENT: '/support-desk',
    SENIOR_SUPPORT_AGENT: '/support-desk',
    ADMIN: '/admin',
  };
  return map[role] || '/customer';
}

function roleProfile(role) {
  const map = {
    CUSTOMER: '/customer/profile',
    INDIVIDUAL_PROVIDER: '/provider/profile',
    THIRD_PARTY_PARTNER: '/partner/profile',
    SUPPORT_AGENT: '/support-desk/profile',
    SENIOR_SUPPORT_AGENT: '/support-desk/profile',
    ADMIN: '/admin/profile',
  };
  return map[role] || '/login';
}

/** Public marketplace top navigation — link bar + command search (not the old header). */
export default function MarketplaceNav({ solid = false }) {
  const { t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState('');

  const onSearch = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/providers?search=${encodeURIComponent(q.trim())}`);
  };

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || user?.username?.[0] || 'U'}`.toUpperCase();

  return (
    <header className={cn('sticky top-0 z-50 transition-colors', solid ? 'bg-surface border-b border-line' : 'bg-surface/80 backdrop-blur-xl border-b border-transparent')}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-sm font-extrabold text-white">K</span>
            <span className="hidden sm:block text-lg font-extrabold tracking-tight text-ink">{t('appName')}</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 ml-2">
            {PUBLIC_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                    isActive ? 'bg-brand-soft text-brand' : 'text-muted hover:text-ink hover:bg-page',
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <form onSubmit={onSearch} className="hidden md:block flex-1 max-w-md ml-auto">
            <label className="relative block">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search plumbers, AC, cleaning…"
                className="w-full rounded-full border border-line bg-page py-2.5 pl-9 pr-4 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </label>
          </form>

          <div className="ml-auto md:ml-0 flex items-center gap-2">
            <span className="hidden xl:inline-flex items-center gap-1.5 rounded-full border border-line bg-page px-3 py-1.5 text-xs font-semibold text-muted">
              <MapPin size={12} className="text-coral" /> Ahmedabad
            </span>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenu((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-2.5 hover:border-brand/30"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-xs font-bold text-white">{initials}</span>
                  <ChevronDown size={14} className="text-muted" />
                </button>
                {menu && (
                  <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-surface shadow-lg">
                    <div className="border-b border-line px-4 py-3">
                      <p className="truncate text-sm font-bold text-ink">{user?.first_name || user?.username}</p>
                      <p className="truncate text-xs text-muted">{user?.email}</p>
                    </div>
                    <Link to={roleHome(user?.role)} onClick={() => setMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-page">
                      <LayoutDashboard size={16} /> Dashboard
                    </Link>
                    <Link to={roleProfile(user?.role)} onClick={() => setMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-page">
                      <User size={16} /> Profile
                    </Link>
                    {user?.role === 'CUSTOMER' && (
                      <Link to="/customer/notifications" onClick={() => setMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-page">
                        <Bell size={16} /> Notifications
                      </Link>
                    )}
                    <button type="button" onClick={() => { logout(); setMenu(false); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-page">
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="hidden sm:inline-flex rounded-full px-4 py-2 text-sm font-semibold text-ink hover:bg-page">
                  {t('login')}
                </Link>
                <Link to="/register" className="inline-flex rounded-full bg-coral px-4 py-2 text-sm font-bold text-white hover:bg-coral-hover">
                  Get started
                </Link>
              </>
            )}

            <button type="button" className="lg:hidden rounded-lg p-2 text-muted hover:bg-page" onClick={() => setOpen((v) => !v)} aria-label="Menu">
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-line py-3 lg:hidden">
            <form onSubmit={onSearch} className="mb-3 md:hidden">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search services…"
                className="w-full rounded-xl border border-line bg-page px-3 py-2.5 text-sm"
              />
            </form>
            <div className="flex flex-col gap-1">
              {PUBLIC_LINKS.map((l) => (
                <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-semibold text-ink hover:bg-page">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
