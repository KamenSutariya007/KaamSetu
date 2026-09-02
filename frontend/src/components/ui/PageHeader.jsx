import cn from '../../utils/cn';

export default function PageHeader({ title, subtitle, action, badge, className = '', dark = false }) {
  return (
    <header className={cn('mb-6 sm:mb-8 min-w-0', className)}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          {badge && <div className="mb-2">{badge}</div>}
          <h1 className={cn(
            'text-2xl sm:text-3xl font-bold tracking-tight',
            dark ? 'text-white' : 'text-ink',
          )}>{title}</h1>
          {subtitle && (
            <p className={cn('mt-1.5 text-sm sm:text-base max-w-2xl', dark ? 'text-white/70' : 'text-muted')}>{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}

export function SectionHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={cn('flex items-center justify-between gap-4 mb-4', className)}>
      <div className="min-w-0">
        <h2 className="text-base font-bold text-ink">{title}</h2>
        {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
