/**
 * Reusable page width container.
 * Variants:
 *  narrow    — forms, profile settings (max-w-lg)
 *  form      — medium forms (max-w-2xl)
 *  prose     — readable content (max-w-3xl)
 *  default   — standard pages (max-w-5xl)
 *  wide      — dashboards, provider lists (max-w-screen-xl)
 *  auth      — login/register two-column (max-w-6xl)
 *  marketing — landing sections (max-w-7xl)
 *  full      — maps, calendars, admin tables (no max-width)
 */
const WIDTH = {
  narrow: 'max-w-lg',
  form: 'max-w-2xl',
  prose: 'max-w-3xl',
  default: 'max-w-5xl',
  wide: 'max-w-screen-xl',
  auth: 'max-w-6xl',
  marketing: 'max-w-7xl',
  full: 'max-w-none',
};

export default function PageContainer({
  variant = 'default',
  className = '',
  as: Tag = 'div',
  noPadding = false,
  children,
}) {
  const padding = noPadding ? '' : 'px-4 sm:px-6 lg:px-8';
  const width = WIDTH[variant] || WIDTH.default;

  return (
    <Tag className={`w-full min-w-0 mx-auto ${width} ${padding} ${className}`.trim()}>
      {children}
    </Tag>
  );
}

export function TableScroll({ children, className = '' }) {
  return (
    <div className={`w-full min-w-0 overflow-x-auto -mx-1 px-1 ${className}`.trim()}>
      {children}
    </div>
  );
}
