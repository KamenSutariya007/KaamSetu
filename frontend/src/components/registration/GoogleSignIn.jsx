import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { authAPI } from '../../api/client';
import { ROLE_PATHS } from '../../utils/authConstants';
import Button from '../ui/Button';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      const check = setInterval(() => {
        if (window.google?.accounts?.id) { clearInterval(check); resolve(); }
      }, 100);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function GoogleSignIn({ role = 'CUSTOMER', onSuccess, className = '' }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { loginWithTokens } = useAuth();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const btnRef = useRef(null);

  useEffect(() => {
    if (!CLIENT_ID) return undefined;
    let cancelled = false;
    loadGoogleScript().then(() => {
      if (cancelled || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (response) => {
          setError('');
          try {
            const { data } = await authAPI.googleAuth({ id_token: response.credential, role });
            loginWithTokens(data);
            onSuccess?.(data.user);
            navigate(ROLE_PATHS[data.user?.role] || '/customer');
          } catch (err) {
            setError(err.response?.data?.detail || t('googleSignInFailed'));
          }
        },
      });
      setReady(true);
    }).catch(() => setError(t('googleSignInUnavailable')));
    return () => { cancelled = true; };
  }, [role, loginWithTokens, navigate, onSuccess, t]);

  const handleClick = () => {
    if (!CLIENT_ID) {
      setError(t('googleSignInUnavailable'));
      return;
    }
    window.google?.accounts?.id?.prompt();
  };

  if (!CLIENT_ID) return null;

  return (
    <div className={className}>
      <Button type="button" variant="secondary" className="w-full" onClick={handleClick} disabled={!ready}>
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6.01c4.51-4.18 7.09-10.36 7.09-17.66z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6.01c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        {t('continueWithGoogle')}
      </Button>
      <div ref={btnRef} className="hidden" />
      {error && <p className="text-xs text-danger mt-2 text-center">{error}</p>}
    </div>
  );
}
