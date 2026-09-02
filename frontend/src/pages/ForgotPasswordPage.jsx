import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { authAPI } from '../api/client';
import AuthShell from '../components/auth/AuthShell';

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
  const [devResetUrl, setDevResetUrl] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  const sendOtp = async () => {
    const { data } = await authAPI.forgotPasswordSendOtp(email);
    setEmailMasked(data.email_masked || email);
    setResendIn(data.retry_after_seconds || 60);
    setDevResetUrl(data.dev_reset_url || '');
    setMsg(data.detail || t('forgotPasswordOtpSent'));
    setStep('otp');
    setOtp('');
    setTimeout(() => otpRef.current?.focus(), 100);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendOtp();
    } catch (err) {
      setError(parseForgotError(err, t));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== OTP_LENGTH) {
      setError(t('loginOtpRequired'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await authAPI.forgotPasswordVerifyOtp({ email, otp });
      setResetToken(data.reset_token);
      setStep('password');
    } catch (err) {
      setError(parseForgotError(err, t));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setError(t('resetPasswordMismatch'));
      return;
    }
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
      else if (detail) setError(detail);
      else setError(t('resetPasswordFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0 || loading) return;
    setError('');
    setLoading(true);
    try {
      await sendOtp();
    } catch (err) {
      setError(parseForgotError(err, t));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthShell title={t('resetPasswordSuccess')} subtitle={t('resetPasswordRedirecting')}>
        <div className="text-center py-6">
          <CheckCircle2 size={48} className="mx-auto text-green mb-4" />
          <p className="text-midnight font-semibold">{t('resetPasswordSuccess')}</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title={step === 'email' ? t('forgotPasswordTitle') : step === 'otp' ? t('forgotPasswordOtpTitle') : t('resetPasswordTitle')}
      subtitle={step === 'email' ? t('forgotPasswordDesc') : step === 'otp' ? t('forgotPasswordOtpHint') : t('resetPasswordSubtitle')}
      footer={
        <Link to="/login" className="text-brand font-semibold hover:underline">{t('login')}</Link>
      }
    >
      {error && (
        <div className="mb-4 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger flex gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {step === 'email' && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label htmlFor="forgot-email" className="block text-sm font-medium text-midnight mb-1">{t('email')}</label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-line bg-mist"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-brand text-white rounded-xl font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {loading ? t('loading') : t('forgotPasswordSendOtp')}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <button type="button" onClick={() => { setStep('email'); setOtp(''); setError(''); }} className="inline-flex items-center gap-1.5 text-sm text-brand font-medium hover:underline">
            <ArrowLeft size={16} /> {t('forgotPasswordBack')}
          </button>
          {msg && (
            <div className="rounded-xl border border-green/30 bg-green/5 px-4 py-3 text-sm text-midnight flex gap-2">
              <CheckCircle2 size={18} className="shrink-0 text-green" />
              <p>{msg} {emailMasked && <span className="font-medium">{emailMasked}</span>}</p>
            </div>
          )}
          <input
            ref={otpRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={OTP_LENGTH}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))}
            className="w-full px-4 py-3 rounded-xl border border-line bg-mist text-center text-2xl tracking-[0.4em] font-mono"
            placeholder="000000"
            required
          />
          <button type="submit" disabled={loading || otp.length !== OTP_LENGTH} className="w-full py-3 bg-brand text-white rounded-xl font-semibold disabled:opacity-60">
            {loading ? t('loading') : t('verifyCode')}
          </button>
          <button type="button" onClick={handleResend} disabled={resendIn > 0 || loading} className="w-full text-sm text-brand disabled:text-muted">
            {resendIn > 0 ? `${t('emailVerifyResendIn')} ${resendIn}s` : t('resendCode')}
          </button>
          {devResetUrl && (
            <div className="rounded-xl border border-line bg-mist px-4 py-3 text-sm break-all">
              <p className="font-medium text-midnight mb-1">{t('forgotPasswordLinkFallback')}</p>
              <a href={devResetUrl} className="text-brand hover:underline">{devResetUrl}</a>
            </div>
          )}
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-pw" className="block text-sm font-medium text-midnight mb-1">{t('resetPasswordNew')}</label>
            <div className="relative">
              <input
                id="new-pw"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-line bg-mist pr-11"
                required
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="confirm-pw" className="block text-sm font-medium text-midnight mb-1">{t('resetPasswordConfirm')}</label>
            <input
              id="confirm-pw"
              type={showPassword ? 'text' : 'password'}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-line bg-mist"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-brand text-white rounded-xl font-semibold disabled:opacity-60">
            {loading ? t('loading') : t('resetPasswordSubmit')}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
