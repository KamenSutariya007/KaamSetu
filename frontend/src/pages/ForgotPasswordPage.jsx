import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ArrowLeft, Eye, EyeOff, Mail } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { authAPI } from '../api/client';
import Button from '../components/ui/Button';

const OTP_LENGTH = 6;

function parseForgotError(err, t) {
  const code = err.response?.data?.error;
  if (code === 'invalid_otp') return t('loginErrors.otpInvalid');
  if (code === 'expired') return t('loginErrors.otpExpired');
  if (code === 'too_many_attempts') return t('loginErrors.otpTooMany');
  if (code === 'resend_cooldown' || err.response?.status === 429) {
    return err.response?.data?.message || t('loginErrors.rateLimit');
  }
  if (code === 'send_failed') return t('forgotPasswordSendFailed');
  return err.response?.data?.detail || err.response?.data?.message || t('forgotPasswordSendFailed');
}

/** Centered recovery stage matching the new login composition. */
export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const otpRef = useRef(null);
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [emailMasked, setEmailMasked] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  const field = 'w-full rounded-2xl border border-line bg-page px-4 py-3 text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';

  const sendOtp = async () => {
    const { data } = await authAPI.forgotPasswordSendOtp(email);
    setEmailMasked(data.email_masked || email);
    setResendIn(data.retry_after_seconds || 60);
    setStep('otp');
    setOtp('');
    setTimeout(() => otpRef.current?.focus(), 100);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try { await sendOtp(); } catch (err) { setError(parseForgotError(err, t)); } finally { setLoading(false); }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== OTP_LENGTH) { setError(t('loginOtpRequired')); return; }
    setError('');
    setLoading(true);
    try {
      const { data } = await authAPI.forgotPasswordVerifyOtp({ email, otp });
      setResetToken(data.reset_token);
      setStep('password');
    } catch (err) { setError(parseForgotError(err, t)); } finally { setLoading(false); }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (password !== passwordConfirm) { setError(t('resetPasswordMismatch')); return; }
    setError('');
    setLoading(true);
    try {
      await authAPI.resetPassword({ token: resetToken, new_password: password });
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 2500);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const fieldErrors = err.response?.data?.new_password;
      if (Array.isArray(fieldErrors) && fieldErrors.length) setError(fieldErrors.join(' '));
      else setError(detail || t('resetPasswordFailed'));
    } finally { setLoading(false); }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B3D3A]">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-10 top-24 h-56 w-56 rounded-full bg-teal/25 blur-3xl" />
        <div className="absolute bottom-0 right-10 h-64 w-64 rounded-full bg-coral/20 blur-3xl" />
      </div>
      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2 text-white">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-coral text-sm font-extrabold">K</span>
          <span className="text-xl font-extrabold">{t('appName')}</span>
        </Link>
        <div className="overflow-hidden rounded-[28px] bg-surface shadow-lg">
          <div className="h-1.5 bg-gradient-to-r from-brand via-teal to-coral" />
          <div className="p-6 sm:p-8">
            {done ? (
              <div className="py-8 text-center">
                <CheckCircle2 size={40} className="mx-auto text-green" />
                <h1 className="mt-4 text-xl font-extrabold text-ink">{t('resetPasswordSuccess')}</h1>
                <p className="mt-1 text-sm text-muted">{t('resetPasswordRedirecting')}</p>
              </div>
            ) : (
              <>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Recovery</p>
                <h1 className="mt-2 text-2xl font-extrabold text-ink">
                  {step === 'email' ? t('forgotPasswordTitle') : step === 'otp' ? t('forgotPasswordOtpTitle') : t('resetPasswordTitle')}
                </h1>
                <p className="mt-1 text-sm text-muted">
                  {step === 'email' ? t('forgotPasswordDesc') : step === 'otp' ? t('forgotPasswordOtpHint') : t('resetPasswordSubtitle')}
                </p>
                {error && (
                  <div className="mt-4 flex gap-2 rounded-2xl border border-danger/25 bg-danger/10 p-3 text-sm text-danger">
                    <AlertCircle size={18} /> {error}
                  </div>
                )}
                {step === 'email' && (
                  <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold" htmlFor="forgot-email">{t('email')}</label>
                      <input id="forgot-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
                    </div>
                    <Button type="submit" variant="coral" size="lg" className="w-full" loading={loading}>{t('forgotPasswordSendOtp')}</Button>
                  </form>
                )}
                {step === 'otp' && (
                  <form onSubmit={handleOtpSubmit} className="mt-6 space-y-4">
                    <button type="button" onClick={() => setStep('email')} className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
                      <ArrowLeft size={16} /> {t('forgotPasswordBack')}
                    </button>
                    <div className="flex gap-3 rounded-2xl bg-brand-soft p-3 text-sm">
                      <Mail size={18} className="text-brand" />
                      <p>{t('forgotPasswordOtpSent')} <strong>{emailMasked}</strong></p>
                    </div>
                    <input ref={otpRef} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))} maxLength={OTP_LENGTH} inputMode="numeric" className={`${field} text-center text-2xl tracking-[0.4em]`} placeholder="000000" />
                    <Button type="submit" variant="coral" size="lg" className="w-full" loading={loading} disabled={otp.length !== OTP_LENGTH}>{t('verifyCode')}</Button>
                    <button type="button" disabled={resendIn > 0 || loading} onClick={async () => { setLoading(true); try { await sendOtp(); } catch (err) { setError(parseForgotError(err, t)); } finally { setLoading(false); } }} className="w-full text-sm font-semibold text-brand disabled:text-muted">
                      {resendIn > 0 ? `${t('emailVerifyResendIn')} ${resendIn}s` : t('resendCode')}
                    </button>
                  </form>
                )}
                {step === 'password' && (
                  <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
                    <div className="relative">
                      <label className="mb-1.5 block text-sm font-semibold" htmlFor="new-pw">{t('resetPasswordNew')}</label>
                      <input id="new-pw" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className={`${field} pr-11`} />
                      <button type="button" className="absolute right-3 top-9 text-muted" onClick={() => setShowPassword((v) => !v)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold" htmlFor="confirm-pw">{t('resetPasswordConfirm')}</label>
                      <input id="confirm-pw" type={showPassword ? 'text' : 'password'} required value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} className={field} />
                    </div>
                    <Button type="submit" variant="coral" size="lg" className="w-full" loading={loading}>{t('resetPasswordSubmit')}</Button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-white/70">
          <Link to="/login" className="font-bold text-coral hover:underline">{t('login')}</Link>
        </p>
      </div>
    </div>
  );
}
