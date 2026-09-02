import { Link } from 'react-router-dom';
import {
  Droplets, Zap, Wind, Wrench, Hammer, Sparkles, Filter, ChevronRight, Grid3X3,
} from 'lucide-react';
import ServiceTile from './ServiceTile';
import { InView } from '../../hooks/InView';

const SERVICES = [
  { slug: 'plumbing', icon: Droplets, name: 'Plumbing', desc: 'Leaks & pipes', color: 'bg-blue/15 text-blue' },
  { slug: 'electrical', icon: Zap, name: 'Electrical', desc: 'Wiring & fans', color: 'bg-yellow/15 text-yellow' },
  { slug: 'ac-refrigerator', icon: Wind, name: 'AC & Cooler', desc: 'Cooling repair', color: 'bg-cyan/15 text-cyan' },
  { slug: 'appliance-repair', icon: Wrench, name: 'Appliances', desc: 'Home devices', color: 'bg-brand/15 text-brand' },
  { slug: 'carpentry', icon: Hammer, name: 'Carpentry', desc: 'Wood work', color: 'bg-purple/15 text-purple' },
  { slug: 'ro-water', icon: Filter, name: 'RO & Water', desc: 'Purifier service', color: 'bg-green/15 text-green' },
  { slug: 'cleaning', icon: Sparkles, name: 'Cleaning', desc: 'Deep clean', color: 'bg-pink/15 text-pink' },
];

export default function ServiceCategoryStrip() {
  return (
    <InView>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-ink">What do you need help with?</h2>
        <Link to="/guides" className="text-sm font-medium text-violet hover:underline flex items-center gap-1">
          View all <ChevronRight size={14} />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {SERVICES.map((s, i) => (
          <ServiceTile key={s.slug} {...s} to={`/providers?category=${s.slug}`} className={`animate-fade-up delay-${Math.min(i + 1, 6)}`} />
        ))}
        <Link to="/guides" className="shrink-0 w-[140px] flex flex-col items-center justify-center p-4 rounded-2xl bg-page border border-dashed border-line hover:border-violet/40 transition-colors">
          <Grid3X3 size={24} className="text-muted mb-2" />
          <span className="font-semibold text-sm text-muted">More</span>
        </Link>
      </div>
    </InView>
  );
}
