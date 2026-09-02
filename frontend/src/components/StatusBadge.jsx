const colors = {
  requested: 'bg-indigo/10 text-indigo border-indigo/20',
  accepted: 'bg-lime/30 text-midnight border-lime/50',
  rejected: 'bg-danger/10 text-danger border-danger/20',
  preparing: 'bg-aqua/10 text-midnight border-aqua/30',
  on_the_way: 'bg-indigo/15 text-indigo border-indigo/25',
  arrived: 'bg-aqua/15 text-midnight border-aqua/30',
  started: 'bg-indigo/20 text-indigo border-indigo/30',
  completed: 'bg-lime text-midnight border-lime',
  cancelled: 'bg-muted/10 text-muted border-line',
  disputed: 'bg-danger text-white border-danger',
  assigned: 'bg-indigo/10 text-indigo border-indigo/20',
  resolved: 'bg-lime/30 text-midnight border-lime/50',
  open: 'bg-warning/10 text-warning border-warning/30',
};

export default function StatusBadge({ status, label }) {
  const cls = colors[status] || 'bg-mist text-muted border-line';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
      {label || status?.replace(/_/g, ' ')}
    </span>
  );
}
