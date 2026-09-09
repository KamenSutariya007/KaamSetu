import Badge from './ui/Badge';

const toneByStatus = {
  requested: 'brand',
  accepted: 'blue',
  rejected: 'danger',
  preparing: 'warning',
  on_the_way: 'brand',
  arrived: 'blue',
  started: 'coral',
  completed: 'green',
  cancelled: 'muted',
  disputed: 'danger',
  assigned: 'brand',
  resolved: 'green',
  open: 'warning',
};

export default function StatusBadge({ status, label }) {
  const tone = toneByStatus[status] || 'muted';
  return (
    <Badge tone={tone} dot>
      {label || status?.replace(/_/g, ' ')}
    </Badge>
  );
}
