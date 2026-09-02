/** Vertical section wrapper with optional top/bottom spacing */
export default function SectionContainer({
  className = '',
  as: Tag = 'section',
  children,
}) {
  return (
    <Tag className={`w-full min-w-0 py-12 sm:py-16 ${className}`.trim()}>
      {children}
    </Tag>
  );
}
