import { useLanguage } from '../../context/LanguageContext';
import cn from '../../utils/cn';

const STEPS = ['requested', 'accepted', 'preparing', 'on_the_way', 'arrived', 'started', 'completed'];

export default function BookingTimeline({ currentStatus, className = '' }) {
  const { t } = useLanguage();
  const currentIdx = STEPS.indexOf(currentStatus);

  return (
    <ol className={cn('relative', className)} aria-label="Booking progress">
      {STEPS.map((step, idx) => {
        const done = currentIdx >= idx;
        const active = currentStatus === step;
        const isLast = idx === STEPS.length - 1;
        return (
          <li key={step} className="flex gap-4 min-w-0">
            <div className="flex flex-col items-center shrink-0">
              <div className={cn('w-3 h-3 rounded-full border-2 transition-colors', done ? 'bg-indigo border-indigo' : 'bg-surface border-line', active && 'ring-4 ring-indigo/20')} aria-current={active ? 'step' : undefined} />
              {!isLast && <div className={cn('w-px flex-1 min-h-[28px] my-1', done ? 'bg-indigo/40' : 'bg-line')} />}
            </div>
            <div className={cn('pb-5 min-w-0', isLast && 'pb-0')}>
              <p className={cn('text-sm font-medium', done ? 'text-ink' : 'text-muted')}>{t(`statuses.${step}`)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
