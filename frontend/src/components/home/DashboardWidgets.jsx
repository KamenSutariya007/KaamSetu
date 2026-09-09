import { Link } from 'react-router-dom';
import { Calendar, FileText, Headphones, MessageCircle, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';
import { InView } from '../../hooks/InView';

function HealthRing({ score = 87 }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg className="w-full h-full progress-ring" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#E8ECF2" strokeWidth="8" />
        <circle cx="44" cy="44" r={r} fill="none" stroke="#22C55E" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} className="transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold text-ink">{score}</span>
        <span className="text-[10px] text-muted">/ 100</span>
      </div>
    </div>
  );
}

export default function DashboardWidgets() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <InView className="pastel-blue rounded-2xl border border-line p-5 hover-lift">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={18} className="text-blue" />
          <h3 className="font-bold text-ink text-sm">Upcoming Booking</h3>
        </div>
        <p className="text-sm font-semibold text-ink">AC Service — Rajesh K.</p>
        <p className="text-xs text-muted mt-1">Tomorrow, 10:00 AM · Confirmed</p>
        <Link to="/customer/bookings" className="inline-flex items-center gap-1 text-xs font-semibold text-brand mt-3 hover:underline">
          Track Now <ArrowRight size={12} />
        </Link>
      </InView>

      <InView className="pastel-green rounded-2xl border border-line p-5 hover-lift delay-1">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={18} className="text-green" />
          <h3 className="font-bold text-ink text-sm">Home Health Score</h3>
        </div>
        <HealthRing score={87} />
        <p className="text-center text-xs font-medium text-green mt-2">Good Condition</p>
        <Button as={Link} to="/customer/passport" variant="secondary" size="sm" className="w-full mt-3">View Passport</Button>
      </InView>

      <InView className="pastel-purple rounded-2xl border border-line p-5 hover-lift delay-2">
        <h3 className="font-bold text-ink text-sm mb-3">Recent Activity</h3>
        <ul className="space-y-2 text-xs text-muted">
          <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green mt-1.5 shrink-0" /> Service completed</li>
          <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue mt-1.5 shrink-0" /> Invoice generated</li>
          <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0" /> Maintenance scheduled</li>
        </ul>
      </InView>

      <InView className="pastel-orange rounded-2xl border border-line p-5 hover-lift delay-3">
        <div className="flex items-center gap-2 mb-3">
          <Headphones size={18} className="text-brand" />
          <h3 className="font-bold text-ink text-sm">Need Help?</h3>
        </div>
        <p className="text-xs text-muted mb-4">Our support team is ready 24/7</p>
        <div className="space-y-2">
          <Button as={Link} to="/support" variant="violet" size="sm" className="w-full justify-center">
            <MessageCircle size={14} /> Chat with AI
          </Button>
          <Button as={Link} to="/support" variant="secondary" size="sm" className="w-full justify-center">Create Ticket</Button>
        </div>
      </InView>
    </div>
  );
}
