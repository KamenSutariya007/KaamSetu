import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { CardSkeleton, DashboardSkeleton } from './ui/Skeleton';
import Button from './ui/Button';
import { AlertCircle, Inbox } from 'lucide-react';

export default function LoadingState({ message, variant = 'spinner' }) {
  const { t } = useLanguage();

  if (variant === 'dashboard') return <DashboardSkeleton />;
  if (variant === 'cards') {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
        {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4" aria-busy="true">
      <div className="w-9 h-9 border-2 border-indigo border-t-transparent rounded-full animate-spin" />
      <p className="text-muted text-sm">{message || t('loading')}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry, title }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-4 max-w-md mx-auto" role="alert">
      <div className="w-14 h-14 rounded-2xl bg-danger/10 flex items-center justify-center text-danger">
        <AlertCircle size={28} />
      </div>
      <div>
        <h3 className="font-bold text-midnight mb-1">{title || 'Something went wrong'}</h3>
        <p className="text-muted text-sm">{message || t('error')}</p>
      </div>
      {onRetry && <Button onClick={onRetry} variant="accent">{t('retry')}</Button>}
    </div>
  );
}

export function EmptyState({ message, title, actionLabel, actionTo, onAction, icon: Icon = Inbox }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-4 max-w-md mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-mist border border-line flex items-center justify-center text-muted">
        <Icon size={28} strokeWidth={1.5} />
      </div>
      <div>
        <h3 className="font-bold text-midnight mb-1">{title || t('empty')}</h3>
        {message && <p className="text-muted text-sm">{message}</p>}
      </div>
      {actionLabel && onAction && <Button onClick={onAction} variant="accent">{actionLabel}</Button>}
      {actionLabel && actionTo && <Button as={Link} to={actionTo} variant="accent">{actionLabel}</Button>}
    </div>
  );
}
