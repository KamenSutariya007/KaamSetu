import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, MapPin, ChevronDown, LogOut, LayoutDashboard, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import cn from '../../utils/cn';

function getDashboardPath(role) {
  const p = { CUSTOMER: '/customer', INDIVIDUAL_PROVIDER: '/provider', THIRD_PARTY_PARTNER: '/partner', SUPPORT_AGENT: '/support-desk', SENIOR_SUPPORT_AGENT: '/support-desk', ADMIN: '/admin' };
  return p[role] || '/customer';
}

function getProfilePath(role) {
  const p = { CUSTOMER: '/customer/profile', INDIVIDUAL_PROVIDER: '/provider/profile', THIRD_PARTY_PARTNER: '/partner/profile', SUPPORT_AGENT: '/support-desk/profile', SENIOR_SUPPORT_AGENT: '/support-desk/profile', ADMIN: '/admin/profile' };
  return p[role] || '/login';
}

export default function Header({ showSearch = true, minimal = false }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/providers?search=${encodeURIComponent(query.trim())}`);
  };

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || user?.username?.[0] || 'U'}`.toUpperCase();

  return (
    <header className={cn(
      'sticky top-0 z-50 bg-surface transition-shadow duration-300 animate-fade-down',
      scrolled ? 'shadow-header' : 'border-b border-line',
    )}>
      <div className="flex items-center gap-4 h-14 sm:h-16 px-4 sm:px-6 lg:px-8 max-w-[1920px] mx-auto">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand to-pink flex items-center justify-center text-white font-bold text-sm shadow-sm">F</div>
          <span className="font-bold text-ink text-lg hidden sm:block">{t('appName')}</span>
        </Link>

        {!minimal && showSearch && (
          <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-xl mx-4">
            <div className="relative w-full">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search services, professionals, or issues..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-page border border-line text-sm text-ink placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-violet/25 focus:border-violet/40 transition-all"
              />
            </div>
          </form>
        )}

        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {!minimal && (
            <div className="hidden lg:flex items-center gap-1.5 text-sm text-muted px-3 py-1.5 rounded-lg bg-page border border-line">
              <MapPin size={14} className="text-brand shrink-0" />
              <span>Ahmedabad</span>
            </div>
          )}

          {isAuthenticated ? (
            <>
              <Link to="/customer/notifications" className="relative p-2 rounded-xl text-muted hover:text-ink hover:bg-page transition-colors" aria-label={t('notifications')}>
                <Bell size={20} />
              </Link>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-page transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet to-blue text-white text-xs font-bold flex items-center justify-center">{initials}</div>
                  <ChevronDown size={14} className="text-muted hidden sm:block" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-surface rounded-xl border border-line shadow-lg py-1 animate-scale-in origin-top-right">
                    <div className="px-4 py-2 border-b border-line">
                      <p className="text-sm font-semibold text-ink truncate">{user?.first_name || user?.username}</p>
                      <p className="text-xs text-muted truncate">{user?.email}</p>
                    </div>
                    <Link to={getDashboardPath(user?.role)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-page" onClick={() => setMenuOpen(false)}>
                      <LayoutDashboard size={16} /> {t('dashboard')}
                    </Link>
                    <Link to={getProfilePath(user?.role)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-page" onClick={() => setMenuOpen(false)}>
                      <User size={16} /> {t('profile')}
                    </Link>
                    <button type="button" onClick={() => { logout(); setMenuOpen(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-danger hover:bg-page">
                      <LogOut size={16} /> {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            !minimal && (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-sm font-medium text-muted hover:text-ink px-3 py-2 hidden sm:block">{t('login')}</Link>
                <Link to="/register" className="text-sm font-semibold text-white bg-brand hover:bg-brand-hover px-4 py-2 rounded-xl transition-all hover:scale-[1.02]">{t('register')}</Link>
              </div>
            )
          )}
        </div>
      </div>
    </header>
  );
}
