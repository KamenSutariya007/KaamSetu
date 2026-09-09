import cn from '../../utils/cn';

const tones = {
  brand: 'bg-brand-soft text-brand border-brand/15',
  coral: 'bg-coral-soft text-coral border-coral/20',
  green: 'bg-green/10 text-green border-green/20',
  blue: 'bg-blue/10 text-blue border-blue/20',
  warning: 'bg-warning/10 text-warning border-warning/25',
  danger: 'bg-danger/10 text-danger border-danger/20',
  muted: 'bg-page text-muted border-line',
};

export default function Badge({ children, tone = 'brand', className = '', dot = false }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
        tones[tone] || tones.brand,
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
