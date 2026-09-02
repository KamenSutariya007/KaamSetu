import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LoadingState from '../components/LoadingState';
import LoginInfoPanel from '../components/login/LoginInfoPanel';
import PageContainer from '../components/layout/PageContainer';
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
    if (rememberMe && identifier) {
      localStorage.setItem(REMEMBER_KEY, identifier);
    } else if (!rememberMe) {
      localStorage.removeItem(REMEMBER_KEY);
    }
  }, [rememberMe, identifier]);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-mist flex items-center justify-center">
        <LoadingState />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={ROLE_PATHS[user.role] || '/'} replace />;
  }

  const inputClass = (field) =>
    `w-full px-4 py-2.5 rounded-xl border bg-mist text-midnight placeholder:text-muted/60 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo/40 ${
      errors[field] && touched[field] ? 'border-danger' : 'border-line'
    }`;

  const finishLogin = (data) => {
    if (rememberMe) {
      localStorage.setItem(REMEMBER_KEY, identifier.trim());
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
    loginWithTokens(data);
    setSuccess(true);
    const from = location.state?.from?.pathname;
    const safeFrom = from && from !== '/login' ? from : null;
    setTimeout(() => {
      navigate(safeFrom || ROLE_PATHS[data.user?.role] || '/');
    }, 800);
  };

  const sendLoginOtp = async () => {
    const { data } = await authAPI.loginSendOtp({
      username: identifier.trim(),
      password,
    });
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
      const { data } = await authAPI.loginVerifyOtp({
        login_challenge: loginChallenge,
        otp,
      });
      finishLogin(data);
    } catch (err) {
      const code = err.response?.data?.error;
      if (code === 'invalid_challenge') {
        setStep('credentials');
        setLoginChallenge('');
        setOtp('');
      }
      setFormError(parseLoginOtpError(err, t));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendIn > 0 || loading) return;
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

  const handleBackToCredentials = () => {
    setStep('credentials');
    setOtp('');
    setLoginChallenge('');
    setEmailMasked('');
    setFormError('');
    setResendIn(0);
  };

  return (
    <div className="min-h-screen bg-page overflow-x-hidden">
      <PageContainer variant="auth" className="py-8 lg:py-12">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-10">
          <div className="lg:col-span-3">
            <div className="bg-surface rounded-2xl border border-line shadow-lg p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand to-pink flex items-center justify-center text-white font-bold text-xl" aria-hidden="true">F</div>
                <span className="font-bold text-midnight text-xl">{t('appName')}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-midnight">
                {step === 'otp' ? t('loginOtpTitle') : t('welcomeBack')}
              </h1>
              <p className="text-sm text-muted mt-2 mb-8">
                {step === 'otp' ? t('loginOtpHint') : t('loginWelcomeSubtitle')}
              </p>

              {success && (
                <div className="mb-6 p-4 bg-lime/10 border border-green rounded-xl flex items-center gap-2 text-lime" role="status">
                  <CheckCircle2 size={20} aria-hidden="true" />
                  <span className="font-medium text-sm">{t('loginSuccess')}</span>
                </div>
              )}

              {formError && (
                <div className="mb-6 p-4 bg-danger/10 border border-danger rounded-xl flex items-center gap-2 text-danger" role="alert">
                  <AlertCircle size={18} aria-hidden="true" />
                  <span className="text-sm">{formError}</span>
                </div>
              )}

              {step === 'credentials' ? (
                <form onSubmit={handleCredentialsSubmit} noValidate className="space-y-5">
                  <div>
                    <label htmlFor="login-identifier" className="block text-sm font-medium text-midnight mb-1">
                      {t('loginIdentifier')} <span className="text-danger" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="login-identifier"
                      type="text"
                      autoComplete="username"
                      placeholder={t('loginIdentifierPlaceholder')}
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        if (touched.identifier) {
                          setErrors((prev) => ({
                            ...prev,
                            identifier: validateLoginForm(e.target.value, password, t).identifier,
                          }));
                        }
                      }}
                      onBlur={() => {
                        setTouched((p) => ({ ...p, identifier: true }));
                        setErrors((prev) => ({
                          ...prev,
                          identifier: validateLoginForm(identifier, password, t).identifier,
                        }));
                      }}
                      className={inputClass('identifier')}
                      aria-invalid={!!errors.identifier}
                    />
                    {touched.identifier && errors.identifier && (
                      <p role="alert" className="text-danger text-xs mt-1">{errors.identifier}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="login-password" className="block text-sm font-medium text-midnight mb-1">
                      {t('password')} <span className="text-danger" aria-hidden="true">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder={t('passwordPlaceholder')}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (touched.password) {
                            setErrors((prev) => ({
                              ...prev,
                              password: validateLoginForm(identifier, e.target.value, t).password,
                            }));
                          }
                        }}
                        onBlur={() => {
                          setTouched((p) => ({ ...p, password: true }));
                          setErrors((prev) => ({
                            ...prev,
                            password: validateLoginForm(identifier, password, t).password,
                          }));
                        }}
                        className={`${inputClass('password')} pr-11`}
                        aria-invalid={!!errors.password}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-midnight focus:outline-none focus:ring-2 focus:ring-indigo/40 rounded"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {touched.password && errors.password && (
                      <p role="alert" className="text-danger text-xs mt-1">{errors.password}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-muted">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-line text-aqua focus:ring-indigo"
                      />
                      {t('rememberMe')}
                    </label>
                    <Link to="/forgot-password" className="text-sm text-aqua font-medium hover:underline">
                      {t('forgotPassword')}
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || success}
                    className="w-full py-3.5 bg-violet text-white rounded-xl font-semibold text-base hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-violet/50 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <><Loader2 size={20} className="animate-spin" aria-hidden="true" /> {t('sendingLoginOtp')}</>
                    ) : success ? (
                      <><CheckCircle2 size={20} aria-hidden="true" /> {t('loginSuccess')}</>
                    ) : (
                      t('login')
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleOtpSubmit} noValidate className="space-y-5">
                  <button
                    type="button"
                    onClick={handleBackToCredentials}
                    className="inline-flex items-center gap-1.5 text-sm text-aqua font-medium hover:underline"
                  >
                    <ArrowLeft size={16} aria-hidden="true" />
                    {t('loginOtpBack')}
                  </button>

                  <p className="text-sm text-muted">
                    {t('loginOtpSentTo')}{' '}
                    <span className="font-medium text-midnight">{emailMasked || 'your email'}</span>
                  </p>

                  <div>
                    <label htmlFor="login-otp" className="sr-only">{t('loginOtpTitle')}</label>
                    <input
                      ref={otpRef}
                      id="login-otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={OTP_LENGTH}
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH));
                        setFormError('');
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, OTP_LENGTH);
                        setOtp(pasted);
                      }}
                      placeholder="000000"
                      className="w-full text-center tracking-[0.5em] text-lg font-semibold px-4 py-3 rounded-xl border border-line bg-mist focus:outline-none focus:ring-2 focus:ring-indigo/40"
                      aria-label={t('loginOtpTitle')}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || success || otp.length !== OTP_LENGTH}
                    className="w-full py-3.5 bg-violet text-white rounded-xl font-semibold text-base hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-violet/50 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <><Loader2 size={20} className="animate-spin" aria-hidden="true" /> {t('verifyingLoginOtp')}</>
                    ) : success ? (
                      <><CheckCircle2 size={20} aria-hidden="true" /> {t('loginSuccess')}</>
                    ) : (
                      t('verifyCode')
                    )}
                  </button>

                  <div className="text-center">
                    {resendIn > 0 ? (
                      <p className="text-xs text-muted">{t('emailVerifyResendIn')} {resendIn}s</p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={loading}
                        className="text-sm text-aqua font-medium hover:underline disabled:opacity-60"
                      >
                        {t('resendCode')}
                      </button>
                    )}
                  </div>
                </form>
              )}

              <p className="mt-6 text-center text-sm text-muted">
                {t('noAccount')}{' '}
                <Link to="/register" className="text-aqua font-semibold hover:underline">
                  {t('createAccount')}
                </Link>
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 order-last lg:order-none">
            <LoginInfoPanel />
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
