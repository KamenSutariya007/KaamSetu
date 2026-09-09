import { useEffect, useRef, useState } from 'react';
import { Mail, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../ui/Button';
import {
  firebaseRefreshVerifiedUser,
  firebaseResendVerification,
  firebaseApplyVerificationCode,
} from '../../utils/firebaseAuth';

function readVerificationCodeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  const oobCode = params.get('oobCode');
  if (mode === 'verifyEmail' && oobCode) return oobCode;
  return null;
}

function clearVerificationParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete('mode');
  url.searchParams.delete('oobCode');
  url.searchParams.delete('apiKey');
  url.searchParams.delete('lang');
  window.history.replaceState({}, '', url.pathname + url.search);
}

export default function FirebaseEmailVerifyStep({
  firebaseUser,
  email,
  password,
  onVerified,
  onCancel,
}) {
  const { t } = useLanguage();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [resent, setResent] = useState(false);
  const [autoChecking, setAutoChecking] = useState(false);
  const handledCode = useRef(false);

  const checkVerified = async (silent = false) => {
    if (!silent) setChecking(true);
    else setAutoChecking(true);
    if (!silent) setError('');
    try {
      const user = await firebaseRefreshVerifiedUser(email, password, firebaseUser);
      if (user?.emailVerified) {
        clearVerificationParams();
        onVerified(user);
        return true;
      }
      if (!silent) setError(t('firebaseEmailNotVerifiedYet'));
      return false;
    } catch {
      if (!silent) setError(t('firebaseVerifyCheckFailed'));
      return false;
    } finally {
      if (!silent) setChecking(false);
      else setAutoChecking(false);
    }
  };

  useEffect(() => {
    const oobCode = readVerificationCodeFromUrl();
    if (!oobCode || handledCode.current) return undefined;
    handledCode.current = true;
    setChecking(true);
    firebaseApplyVerificationCode(oobCode)
      .then(() => checkVerified(true))
      .catch(() => setError(t('firebaseVerifyLinkInvalid')))
      .finally(() => setChecking(false));
    return undefined;
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      checkVerified(true);
    }, 5000);
    return () => clearInterval(timer);
  }, [email, password, firebaseUser]);

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      await firebaseResendVerification(firebaseUser);
      setResent(true);
    } catch {
      setError(t('firebaseVerifyResendFailed'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-page/40 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
          <Mail size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-ink">{t('firebaseVerifyTitle')}</h3>
          <p className="text-sm text-muted mt-1">
            {t('firebaseVerifySentTo')}{' '}
            <span className="font-medium text-ink">{email}</span>
          </p>
          <p className="text-xs text-muted mt-2">{t('firebaseVerifyHint')}</p>
          <ul className="text-xs text-muted mt-2 space-y-1 list-disc list-inside">
            <li>{t('firebaseVerifyTipSpam')}</li>
            <li>{t('firebaseVerifyTipWait')}</li>
          </ul>
        </div>
      </div>

      {resent && (
        <p className="text-xs text-lime flex items-center gap-1">
          <CheckCircle2 size={14} /> {t('firebaseVerifyResent')}
        </p>
      )}
      {autoChecking && !checking && (
        <p className="text-xs text-muted">{t('firebaseVerifyAutoCheck')}</p>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="flex flex-col sm:flex-row gap-2">
        <Button type="button" className="flex-1" onClick={() => checkVerified(false)} disabled={checking}>
          {checking ? <Loader2 size={16} className="animate-spin" /> : t('firebaseVerifyConfirm')}
        </Button>
        <Button type="button" variant="secondary" className="flex-1" onClick={handleResend} disabled={resending}>
          {resending ? <Loader2 size={16} className="animate-spin" /> : (
            <><RefreshCw size={14} /> {t('firebaseVerifyResend')}</>
          )}
        </Button>
      </div>

      {onCancel && (
        <button type="button" onClick={onCancel} className="text-xs text-muted hover:text-ink underline">
          {t('firebaseVerifyCancel')}
        </button>
      )}
    </div>
  );
}
