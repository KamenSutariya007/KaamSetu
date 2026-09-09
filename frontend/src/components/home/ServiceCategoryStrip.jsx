import { Link } from 'react-router-dom';
import {
  Droplets, Zap, Wind, Wrench, Hammer, Sparkles, Filter, ChevronRight, Grid3X3,
} from 'lucide-react';
import ServiceTile from './ServiceTile';
import { InView } from '../../hooks/InView';

const SERVICES = [
  { slug: 'plumbing', icon: Droplets, name: 'Plumbing', desc: 'Leaks & pipes', color: 'bg-blue/10 text-blue' },
  { slug: 'electrical', icon: Zap, name: 'Electrical', desc: 'Wiring & fans', color: 'bg-warning/10 text-warning' },
  { slug: 'ac-refrigerator', icon: Wind, name: 'AC & Cooler', desc: 'Cooling repair', color: 'bg-teal/10 text-teal' },
  { slug: 'appliance-repair', icon: Wrench, name: 'Appliances', desc: 'Home devices', color: 'bg-brand/10 text-brand' },
  { slug: 'carpentry', icon: Hammer, name: 'Carpentry', desc: 'Wood work', color: 'bg-coral-soft text-coral' },
  { slug: 'ro-water', icon: Filter, name: 'RO & Water', desc: 'Purifier service', color: 'bg-green/10 text-green' },
  { slug: 'cleaning', icon: Sparkles, name: 'Cleaning', desc: 'Deep clean', color: 'bg-brand-soft text-brand' },
];

export default function ServiceCategoryStrip() {
  return (
    <InView>
      <div className="flex items-center justify-between mb-5 gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand mb-1">Popular services</p>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-ink">What do you need help with?</h2>
        </div>
        <Link to="/guides" className="text-sm font-semibold text-brand hover:underline flex items-center gap-1 shrink-0">
          View all <ChevronRight size={14} />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {SERVICES.map((s, i) => (
          <ServiceTile key={s.slug} {...s} to={`/providers?category=${s.slug}`} className={`animate-fade-up delay-${Math.min(i + 1, 6)}`} />
        ))}
        <Link
          to="/guides"
          className="shrink-0 w-[140px] flex flex-col items-center justify-center p-4 rounded-2xl bg-page border border-dashed border-line hover:border-brand/40 transition-colors"
        >
          <Grid3X3 size={24} className="text-muted mb-2" />
          <span className="font-semibold text-sm text-muted">More</span>
        </Link>
      </div>
    </InView>
  );
}
