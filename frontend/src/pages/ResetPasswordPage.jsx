import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { authAPI } from '../api/client';
import AuthShell from '../components/auth/AuthShell';

function validatePassword(password) {
  const errors = [];
  if (password.length < 8) errors.push('minLength');
  if (!/[A-Z]/.test(password)) errors.push('uppercase');
  if (!/[a-z]/.test(password)) errors.push('lowercase');
  if (!/\d/.test(password)) errors.push('number');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('special');
  return errors;
}

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => (searchParams.get('token') || '').trim(), [searchParams]);

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordIssues = validatePassword(password);
  const passwordsMatch = password && password === passwordConfirm;

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError(t('resetPasswordInvalidLink'));
      return;
    }
    if (passwordIssues.length) {
      setError(t('resetPasswordRequirements'));
      return;
    }
    if (!passwordsMatch) {
      setError(t('resetPasswordMismatch'));
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword({ token, new_password: password });
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 2500);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const fieldErrors = err.response?.data?.new_password;
      if (Array.isArray(fieldErrors) && fieldErrors.length) {
        setError(fieldErrors.join(' '));
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError(t('resetPasswordFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthShell
        eyebrow={t('resetPasswordEyebrow')}
        title={t('resetPasswordTitle')}
        subtitle={t('resetPasswordSubtitle')}
        footer={
          <Link to="/forgot-password" className="text-brand font-semibold hover:underline">
            {t('resetPasswordRequestNew')}
          </Link>
        }
      >
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger flex gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p>{t('resetPasswordInvalidLink')}</p>
        </div>
        <Link
          to="/forgot-password"
          className="mt-6 block w-full py-3 text-center bg-brand text-white rounded-xl font-semibold"
        >
          {t('resetPasswordRequestNew')}
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow={t('resetPasswordEyebrow')}
      title={t('resetPasswordTitle')}
      subtitle={t('resetPasswordSubtitle')}
      footer={
        <Link to="/login" className="text-brand font-semibold hover:underline">
          {t('login')}
        </Link>
      }
    >
      {success ? (
        <div className="text-center py-6">
          <CheckCircle2 size={48} className="mx-auto text-green mb-4" />
          <p className="text-midnight font-semibold">{t('resetPasswordSuccess')}</p>
          <p className="text-sm text-muted mt-2">{t('resetPasswordRedirecting')}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-midnight mb-1">
              {t('resetPasswordNew')}
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-line bg-mist pr-11"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {password && (
              <ul className="mt-2 text-xs text-muted space-y-0.5">
                <li className={password.length >= 8 ? 'text-lime' : ''}>At least 8 characters</li>
                <li className={/[A-Z]/.test(password) ? 'text-lime' : ''}>One uppercase letter</li>
                <li className={/[a-z]/.test(password) ? 'text-lime' : ''}>One lowercase letter</li>
                <li className={/\d/.test(password) ? 'text-lime' : ''}>One number</li>
                <li className={/[^A-Za-z0-9]/.test(password) ? 'text-lime' : ''}>One special character</li>
              </ul>
            )}
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-midnight mb-1">
              {t('resetPasswordConfirm')}
            </label>
            <input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-line bg-mist"
              autoComplete="new-password"
              required
            />
            {passwordConfirm && !passwordsMatch && (
              <p className="mt-1 text-xs text-danger">{t('resetPasswordMismatch')}</p>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger flex gap-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || passwordIssues.length > 0 || !passwordsMatch}
            className="w-full py-3 bg-brand text-white rounded-xl font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {loading ? t('loading') : t('resetPasswordSubmit')}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
