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
        {title && <h3 className="text-base font-bold text-ink">{title}</h3>}
        {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
