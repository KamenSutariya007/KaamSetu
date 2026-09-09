import cn from '../../utils/cn';

export default function Card({ children, className = '', padding = true, hover = false, flat = false, as: Tag = 'div', ...props }) {
  return (
    <Tag
      className={cn(
        'min-w-0 rounded-2xl',
        flat ? 'bg-transparent' : 'bg-surface border border-line shadow-sm',
        padding && 'p-5 sm:p-6',
        hover && 'hover-lift cursor-default',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-4', className)}>
      <div className="min-w-0">
        {title && <h3 className="text-base font-bold text-ink tracking-tight">{title}</h3>}
        {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function KpiCard({ label, value, hint, icon: Icon, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-soft text-brand',
    coral: 'bg-coral-soft text-coral',
    green: 'bg-green/10 text-green',
    blue: 'bg-blue/10 text-blue',
  };
  return (
    <Card className="!p-4 sm:!p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight text-ink tabular-nums">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
        </div>
        {Icon ? (
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tones[tone] || tones.brand)}>
            <Icon size={18} aria-hidden="true" />
          </div>
        ) : null}
      </div>
    </Card>
  );
}
