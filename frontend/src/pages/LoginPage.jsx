import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LoadingState from '../components/LoadingState';
import Button from '../components/ui/Button';
import { ROLE_PATHS, parseLoginError, validateLoginForm } from '../utils/authConstants';
import { authAPI } from '../api/client';

const REMEMBER_KEY = 'remembered_login';
const OTP_LENGTH = 6;

function parseLoginOtpError(err, t) {
  const code = err.response?.data?.error;
  if (code === 'account_not_found') return t('loginErrors.accountNotFound');
  if (code === 'invalid_password') return t('loginErrors.wrongPassword');
  if (code === 'no_email') return t('loginErrors.noEmail');
  if (code === 'invalid_otp') return t('loginErrors.otpInvalid');
  if (code === 'expired') return t('loginErrors.otpExpired');
  if (code === 'too_many_attempts') return t('loginErrors.otpTooMany');
  if (code === 'invalid_challenge') return t('loginErrors.challengeExpired');
  if (code === 'resend_cooldown' || err.response?.status === 429) {
    return err.response?.data?.message || t('loginErrors.rateLimit');
  }
  if (err.response?.data?.message) return err.response.data.message;
  return parseLoginError(err, t);
}

/** Centered auth stage — not the old split AuthShell / two-column login. */
export default function LoginPage() {
  const { loginWithTokens, user, loading: authLoading, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState(() => localStorage.getItem(REMEMBER_KEY) || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem(REMEMBER_KEY));
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState({});
  const [step, setStep] = useState('credentials');
  const [otp, setOtp] = useState('');
  const [loginChallenge, setLoginChallenge] = useState('');
  const [emailMasked, setEmailMasked] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const otpRef = useRef(null);

  useEffect(() => {
    if (rememberMe && identifier) localStorage.setItem(REMEMBER_KEY, identifier);
    else if (!rememberMe) localStorage.removeItem(REMEMBER_KEY);
  }, [rememberMe, identifier]);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  if (authLoading) {
    return <div className="grid min-h-screen place-items-center bg-[#0B3D3A]"><LoadingState /></div>;
  }
  if (isAuthenticated && user) return <Navigate to={ROLE_PATHS[user.role] || '/'} replace />;

  const field =
    'w-full rounded-2xl border border-line bg-page px-4 py-3 text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';

  const finishLogin = (data) => {
    if (rememberMe) localStorage.setItem(REMEMBER_KEY, identifier.trim());
    else localStorage.removeItem(REMEMBER_KEY);
    loginWithTokens(data);
    setSuccess(true);
    const from = location.state?.from?.pathname;
    const safeFrom = from && from !== '/login' ? from : null;
    setTimeout(() => navigate(safeFrom || ROLE_PATHS[data.user?.role] || '/'), 800);
  };

  const sendLoginOtp = async () => {
    const { data } = await authAPI.loginSendOtp({ username: identifier.trim(), password });
    setLoginChallenge(data.login_challenge);
    setEmailMasked(data.email_masked || '');
    setResendIn(data.retry_after_seconds || 60);
    setOtp('');
    setStep('otp');
    setTimeout(() => otpRef.current?.focus(), 100);
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setTouched({ identifier: true, password: true });
    const validationErrors = validateLoginForm(identifier, password, t);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setFormError('');
    setLoading(true);
    try {
      await sendLoginOtp();
    } catch (err) {
      setFormError(parseLoginOtpError(err, t) || t('loginErrors.otpSendFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== OTP_LENGTH) {
      setFormError(t('loginOtpRequired'));
      return;
    }
    setFormError('');
    setLoading(true);
    try {
      const { data } = await authAPI.loginVerifyOtp({ login_challenge: loginChallenge, otp });
      finishLogin(data);
    } catch (err) {
      if (err.response?.data?.error === 'invalid_challenge') {
        setStep('credentials');
        setLoginChallenge('');
        setOtp('');
      }
      setFormError(parseLoginOtpError(err, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B3D3A]">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-16 top-20 h-64 w-64 rounded-full bg-teal/30 blur-3xl" />
        <div className="absolute bottom-10 right-0 h-72 w-72 rounded-full bg-coral/25 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2 text-white">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-coral text-sm font-extrabold">K</span>
          <span className="text-xl font-extrabold">{t('appName')}</span>
        </Link>

        <div className="overflow-hidden rounded-[28px] bg-surface shadow-lg">
          <div className="h-1.5 bg-gradient-to-r from-brand via-teal to-coral" />
          <div className="p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
              {step === 'otp' ? 'Verify' : 'Sign in'}
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
              {step === 'otp' ? t('loginOtpTitle') : t('welcomeBack')}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {step === 'otp' ? t('loginOtpHint') : t('loginWelcomeSubtitle')}
            </p>

            {success && (
              <div className="mt-5 flex items-center gap-2 rounded-2xl border border-green/25 bg-green/10 p-3 text-sm text-green">
                <CheckCircle2 size={18} /> {t('loginSuccess')}
              </div>
            )}
            {formError && (
              <div className="mt-5 flex items-center gap-2 rounded-2xl border border-danger/25 bg-danger/10 p-3 text-sm text-danger">
                <AlertCircle size={18} /> {formError}
              </div>
            )}

            {step === 'credentials' ? (
              <form onSubmit={handleCredentialsSubmit} className="mt-6 space-y-4" noValidate>
                <div>
                  <label htmlFor="login-identifier" className="mb-1.5 block text-sm font-semibold text-ink">{t('loginIdentifier')}</label>
                  <input
                    id="login-identifier"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    onBlur={() => {
                      setTouched((p) => ({ ...p, identifier: true }));
                      setErrors((prev) => ({ ...prev, identifier: validateLoginForm(identifier, password, t).identifier }));
                    }}
                    className={field}
                    autoComplete="username"
                    placeholder={t('loginIdentifierPlaceholder')}
                  />
                  {touched.identifier && errors.identifier && <p className="mt-1 text-xs text-danger">{errors.identifier}</p>}
                </div>
                <div>
                  <label htmlFor="login-password" className="mb-1.5 block text-sm font-semibold text-ink">{t('password')}</label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${field} pr-11`}
                      autoComplete="current-password"
                      placeholder={t('passwordPlaceholder')}
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" onClick={() => setShowPassword((v) => !v)}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-muted">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                    {t('rememberMe')}
                  </label>
                  <Link to="/forgot-password" className="font-semibold text-brand hover:underline">{t('forgotPassword')}</Link>
                </div>
                <Button type="submit" variant="coral" size="lg" className="w-full" loading={loading} disabled={success}>
                  {t('login')}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="mt-6 space-y-4" noValidate>
                <button type="button" onClick={() => { setStep('credentials'); setOtp(''); setFormError(''); }} className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
                  <ArrowLeft size={16} /> {t('loginOtpBack')}
                </button>
                <div className="flex gap-3 rounded-2xl bg-brand-soft/70 p-3 text-sm text-ink">
                  <Mail size={18} className="mt-0.5 text-brand" />
                  <p>{t('loginOtpSentTo')} <strong>{emailMasked || 'your email'}</strong></p>
                </div>
                <input
                  ref={otpRef}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))}
                  maxLength={OTP_LENGTH}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className={`${field} text-center text-2xl tracking-[0.4em]`}
                  placeholder="000000"
                />
                <Button type="submit" variant="coral" size="lg" className="w-full" loading={loading} disabled={otp.length !== OTP_LENGTH || success}>
                  {t('verifyCode')}
                </Button>
                <div className="text-center text-sm">
                  {resendIn > 0 ? (
                    <span className="text-muted">{t('emailVerifyResendIn')} {resendIn}s</span>
                  ) : (
                    <button type="button" className="font-semibold text-brand" onClick={async () => { setLoading(true); try { await sendLoginOtp(); } catch (err) { setFormError(parseLoginOtpError(err, t)); } finally { setLoading(false); } }}>
                      {t('resendCode')}
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-white/70">
          {t('noAccount')}{' '}
          <Link to="/register" className="font-bold text-coral hover:underline">{t('createAccount')}</Link>
        </p>
      </div>
    </div>
  );
}
