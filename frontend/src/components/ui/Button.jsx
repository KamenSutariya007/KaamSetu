import { Loader2 } from 'lucide-react';
import cn from '../../utils/cn';

const variants = {
  primary: 'bg-brand text-white hover:bg-brand-hover shadow-sm',
  secondary: 'bg-surface text-ink border border-line hover:bg-page hover:border-muted/30',
  coral: 'bg-coral text-white hover:bg-coral-hover shadow-sm',
  accent: 'bg-coral text-white hover:bg-coral-hover shadow-sm',
  violet: 'bg-brand text-white hover:bg-brand-hover shadow-sm',
  success: 'bg-green text-white hover:opacity-90',
  danger: 'bg-danger text-white hover:opacity-90',
  ghost: 'bg-transparent text-muted hover:bg-page hover:text-ink',
  outline: 'bg-transparent text-ink border border-line hover:bg-page',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl font-semibold',
};

export default function Button({
  variant = 'primary', size = 'md', loading = false, disabled = false,
  className = '', children, as: Tag = 'button', ...props
}) {
  const isDisabled = disabled || loading;
  return (
    <Tag
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className,
      )}
      disabled={Tag === 'button' ? isDisabled : undefined}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin shrink-0" aria-hidden="true" />}
      {children}
    </Tag>
  );
}
