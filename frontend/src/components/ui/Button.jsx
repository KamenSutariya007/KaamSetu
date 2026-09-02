import { Loader2 } from 'lucide-react';
import cn from '../../utils/cn';

const variants = {
  primary: 'bg-brand text-white hover:bg-brand-hover shadow-sm hover:scale-[1.02] active:scale-[0.98]',
  secondary: 'bg-surface text-ink border border-line hover:bg-page hover:border-muted/30',
  violet: 'bg-violet text-white hover:opacity-90 shadow-sm hover:scale-[1.02]',
  success: 'bg-green text-white hover:opacity-90',
  danger: 'bg-danger text-white hover:opacity-90',
  ghost: 'bg-transparent text-muted hover:bg-page hover:text-ink',
  outline: 'bg-transparent text-ink border border-line hover:bg-page',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-5 py-3 text-sm rounded-xl font-semibold',
};

export default function Button({
  variant = 'primary', size = 'md', loading = false, disabled = false,
  className = '', children, as: Tag = 'button', ...props
}) {
  const isDisabled = disabled || loading;
  return (
    <Tag
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/40 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none disabled:scale-100',
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className,
      )}
      disabled={Tag === 'button' ? isDisabled : undefined}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin shrink-0" />}
      {children}
    </Tag>
  );
}
