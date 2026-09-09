import {
  Droplets, Zap, Wind, Wrench, Hammer, Sparkles, Paintbrush, Lock, Filter, Smartphone, ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import cn from '../../utils/cn';

const CATEGORIES = [
  { slug: 'plumbing', icon: Droplets, name: 'Plumbing', desc: 'Leaks, taps, pipes & drainage', count: '120+' },
  { slug: 'electrical', icon: Zap, name: 'Electrical', desc: 'Wiring, switches & power', count: '95+' },
  { slug: 'ac-refrigerator', icon: Wind, name: 'AC & Refrigerator', desc: 'Cooling & gas refill', count: '80+' },
  { slug: 'appliance-repair', icon: Wrench, name: 'Appliance Repair', desc: 'Washing machine, geyser', count: '110+' },
  { slug: 'carpentry', icon: Hammer, name: 'Carpentry', desc: 'Furniture & woodwork', count: '60+' },
  { slug: 'cleaning', icon: Sparkles, name: 'Cleaning', desc: 'Deep clean & maintenance', count: '75+' },
  { slug: 'wall-ceiling', icon: Paintbrush, name: 'Wall & Ceiling', desc: 'Cracks, paint & dampness', count: '45+' },
  { slug: 'door-lock', icon: Lock, name: 'Door & Lock', desc: 'Locks & security', count: '55+' },
  { slug: 'ro-water', icon: Filter, name: 'RO & Water Purifier', desc: 'Filter & servicing', count: '40+' },
  { slug: 'computer-mobile', icon: Smartphone, name: 'Computer & Mobile', desc: 'Device repair', count: '35+' },
];

export default function ServiceCategories({ className = '', compact = false }) {
  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 min-w-0', className)}>
      {CATEGORIES.map(({ slug, icon: Icon, name, desc, count }) => (
        <Link key={slug} to={`/providers?category=${slug}`} className="group min-w-0">
          <div className={cn('h-full p-4 border border-line rounded-[14px] bg-surface hover:border-indigo/40 hover:shadow-card-hover transition-all', compact && '!p-3')}>
            <div className="w-10 h-10 rounded-xl bg-indigo/10 flex items-center justify-center mb-3 group-hover:bg-indigo/15 transition-colors">
              <Icon size={20} className="text-indigo" />
            </div>
            <h3 className="font-bold text-ink text-sm mb-0.5 group-hover:text-indigo transition-colors">{name}</h3>
            {!compact && <p className="text-xs text-muted line-clamp-2 mb-2">{desc}</p>}
            <div className="flex items-center justify-between mt-auto">
              <span className="text-xs text-brand font-medium">{count} pros</span>
              <ChevronRight size={14} className="text-muted group-hover:text-indigo transition-colors" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
