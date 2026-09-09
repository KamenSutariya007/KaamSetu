import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, Mail, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { authAPI } from '../../api/client';
import Button from '../ui/Button';
import cn from '../../utils/cn';

const OTP_LENGTH = 6;

export default function EmailVerification({
  email,
  onEmailChange,
  verifiedEmail,
  verificationToken,
  onVerified,
  onReset,
  disabled = false,
}) {
  const { t } = useLanguage();
  const [status, setStatus] = useState(verifiedEmail ? 'verified' : 'idle');
  const [otpSentTo, setOtpSentTo] = useState('');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const otpRef = useRef(null);

  useEffect(() => {
    if (verifiedEmail && verificationToken) {
      setStatus('verified');
    }
  }, [verifiedEmail, verificationToken]);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  useEffect(() => {
    if (verifiedEmail && email.trim().toLowerCase() !== verifiedEmail.toLowerCase()) {
      onReset?.();
      setStatus('idle');
      setOtp('');
      setOtpSentTo('');
      setError('');
    }
  }, [email, verifiedEmail, onReset]);

  const handleSendOtp = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError(t('emailVerifyEnterEmail'));
      setStatus('idle');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError(t('emailVerifyInvalid'));
      return;
    }
    setLoading(true);
    setError('');
    setStatus('sending');
    try {
      const { data } = await authAPI.sendEmailOtp(trimmed);
      setOtpSentTo(trimmed.toLowerCase());
      setStatus('otp_sent');
      setResendIn(data.retry_after_seconds || 0);
      if (data.demo_otp) {
        setDemoOtp(data.demo_otp);
        setOtp(data.demo_otp);
      } else {
        setDemoOtp('');
        setOtp('');
      }
      setTimeout(() => otpRef.current?.focus(), 100);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.detail || t('emailVerifySendFailed');
      setError(msg);
      setStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== OTP_LENGTH) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await authAPI.verifyEmailOtp({ email: otpSentTo || email.trim().toLowerCase(), otp });
      onVerified?.({
        email: (otpSentTo || email).trim().toLowerCase(),
        verificationToken: data.verification_token,
      });
      setStatus('verified');
    } catch (err) {
      const code = err.response?.data?.error;
      if (code === 'expired') setError(t('emailVerifyExpired'));
      else if (code === 'too_many_attempts') setError(t('emailVerifyTooMany'));
      else setError(err.response?.data?.message || t('emailVerifyWrong'));
      setStatus('otp_sent');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtp(digits);
    setError('');
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtp(pasted);
  };

  const isVerified = status === 'verified' && verifiedEmail;

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="register-email" className="block text-sm font-medium text-ink mb-1">
          {t('emailAddress')} <span className="text-danger">*</span>
        </label>
        <div className="relative">
          <input
            id="register-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t('emailAddressPlaceholder')}
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            readOnly={isVerified}
            disabled={disabled || loading}
            className={cn(
              'w-full px-4 py-2.5 rounded-xl border bg-page text-ink placeholder:text-muted/60 transition-colors focus:outline-none focus:ring-2 focus:ring-brand/40',
              isVerified ? 'border-green/40 bg-green/5 pr-10' : 'border-line',
              error && !isVerified && 'border-danger',
            )}
            aria-invalid={!!error}
          />
          {isVerified && (
            <CheckCircle2 size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-green animate-scale-in" aria-hidden="true" />
          )}
        </div>
        {!isVerified && (
          <p className="text-xs text-muted mt-1.5">{t('emailNotVerified')}</p>
        )}
        {isVerified && (
          <p className="text-xs text-green mt-1.5 flex items-center gap-1 animate-fade-in">
            <CheckCircle2 size={14} /> {t('emailVerified')}
          </p>
        )}
      </div>

      {!isVerified && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleSendOtp}
          loading={loading && status === 'sending'}
          disabled={disabled || loading}
          className="w-full sm:w-auto"
        >
          <Mail size={16} />
          {status === 'sending' ? t('emailVerifySending') : t('verifyEmail')}
        </Button>
      )}

      {status === 'sending' && (
        <p className="text-sm text-muted flex items-center gap-2 animate-fade-in">
          <Loader2 size={16} className="animate-spin" /> {t('emailVerifySending')}
        </p>
      )}

      {status === 'otp_sent' && !isVerified && (
        <div className="rounded-2xl border border-line bg-page p-4 space-y-3 animate-fade-up">
          <div>
            <p className="text-sm font-semibold text-ink">{t('emailVerification')}</p>
            <p className="text-sm text-muted mt-1">
              {t('emailVerifySentTo')} <span className="font-medium text-ink">{otpSentTo || email}</span>
            </p>
          </div>
          {demoOtp && (
            <div className="p-2.5 rounded-lg bg-brand/10 border border-brand/20 text-xs text-brand font-medium text-center">
              🛡️ Demo Mode: Verification code <strong>{demoOtp}</strong> has been auto-filled!
            </div>
          )}
          <div>
            <label htmlFor="email-otp" className="sr-only">{t('emailVerification')}</label>
            <input
              ref={otpRef}
              id="email-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={OTP_LENGTH}
              value={otp}
              onChange={(e) => handleOtpChange(e.target.value)}
              onPaste={handleOtpPaste}
              placeholder="000000"
              className="w-full text-center tracking-[0.5em] text-lg font-semibold px-4 py-3 rounded-xl border border-line bg-surface focus:outline-none focus:ring-2 focus:ring-brand/40"
              aria-label={t('emailVerification')}
            />
          </div>
          <Button type="button" variant="violet" onClick={handleVerifyOtp} loading={loading} disabled={otp.length !== OTP_LENGTH} className="w-full">
            {t('verifyCode')}
          </Button>
          <div className="text-center">
            {resendIn > 0 ? (
              <p className="text-xs text-muted">{t('emailVerifyResendIn')} {resendIn}s</p>
            ) : (
              <button type="button" onClick={handleSendOtp} disabled={loading} className="text-sm text-brand hover:underline">
                {t('resendCode')}
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-danger flex items-center gap-1.5 animate-fade-in" role="alert">
          <AlertCircle size={16} className="shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
