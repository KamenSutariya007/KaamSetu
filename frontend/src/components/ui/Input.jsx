import cn from '../../utils/cn';

export function Label({ htmlFor, children, required, className = '' }) {
  return (
    <label htmlFor={htmlFor} className={cn('block text-sm font-medium text-ink mb-1.5', className)}>
      {children}
      {required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
    </label>
  );
}

export function Input({ label, error, id, className = '', ...props }) {
  const inputId = id || props.name;
  return (
    <div className="w-full min-w-0">
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <input
        id={inputId}
        className={cn(
          'w-full px-4 py-2.5 rounded-xl border bg-surface text-ink',
          'placeholder:text-muted/70 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-indigo/30 focus:border-indigo',
          error ? 'border-danger' : 'border-line',
          className,
        )}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger" role="alert">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, id, className = '', rows = 3, ...props }) {
  const inputId = id || props.name;
  return (
    <div className="w-full min-w-0">
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <textarea
        id={inputId}
        rows={rows}
        className={cn(
          'w-full px-4 py-3 rounded-xl border bg-surface text-ink resize-none',
          'placeholder:text-muted/70 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-indigo/30 focus:border-indigo',
          error ? 'border-danger' : 'border-line',
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger" role="alert">{error}</p>}
    </div>
  );
}

export function Select({ label, error, id, children, className = '', ...props }) {
  const inputId = id || props.name;
  return (
    <div className="w-full min-w-0">
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <select
        id={inputId}
        className={cn(
          'w-full px-4 py-2.5 rounded-xl border bg-surface text-ink',
          'focus:outline-none focus:ring-2 focus:ring-indigo/30 focus:border-indigo',
          error ? 'border-danger' : 'border-line',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-danger" role="alert">{error}</p>}
    </div>
  );
}
