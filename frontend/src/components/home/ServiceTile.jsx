import { Link } from 'react-router-dom';
import cn from '../../utils/cn';

export default function ServiceTile({ icon: Icon, name, desc, color, to, className = '' }) {
  return (
    <Link to={to} className={cn('group shrink-0 w-[140px] sm:w-[160px]', className)}>
      <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-surface border border-line hover-lift transition-all duration-200 group-hover:border-brand/20">
        <div className={cn('w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-110', color)}>
          <Icon size={24} />
        </div>
        <p className="font-semibold text-ink text-sm">{name}</p>
        {desc && <p className="text-[11px] text-muted mt-1 line-clamp-2">{desc}</p>}
      </div>
    </Link>
  );
}
