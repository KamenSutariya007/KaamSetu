import { Droplets, Zap, Wind, Sparkles, Wrench, Home } from 'lucide-react';

const FLOATERS = [
  { icon: Droplets, color: 'bg-blue/15 text-blue', label: 'Plumbing', className: 'top-4 left-2 animate-float', delay: '0s' },
  { icon: Zap, color: 'bg-yellow/15 text-yellow', label: 'Electrical', className: 'top-8 right-4 animate-float-slow', delay: '1s' },
  { icon: Wind, color: 'bg-cyan/15 text-cyan', label: 'AC', className: 'bottom-20 left-0 animate-float', delay: '0.5s' },
  { icon: Wrench, color: 'bg-brand/15 text-brand', label: 'Appliances', className: 'bottom-8 right-8 animate-float-slow', delay: '1.5s' },
  { icon: Sparkles, color: 'bg-green/15 text-green', label: 'Cleaning', className: 'top-1/2 -right-2 animate-float', delay: '2s' },
];

export default function HeroIllustration() {
  return (
    <div className="relative w-full max-w-lg mx-auto aspect-square animate-scale-in delay-3">
      {/* House illustration — CSS-based */}
      <div className="absolute inset-8 rounded-3xl bg-gradient-to-br from-brand/10 via-teal/10 to-coral/10 border border-line shadow-card flex items-center justify-center">
        <div className="relative w-48 h-40 sm:w-56 sm:h-44">
          {/* Roof */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[80px] border-r-[80px] border-b-[50px] border-l-transparent border-r-transparent border-b-brand/80" />
          {/* Body */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-28 bg-surface rounded-b-xl border-2 border-line shadow-md flex flex-col items-center justify-end pb-3">
            <div className="absolute top-4 flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue/20 border border-blue/30" />
              <div className="w-8 h-8 rounded-lg bg-cyan/20 border border-cyan/30" />
            </div>
            <div className="w-10 h-14 bg-brand/20 rounded-t-lg border border-brand/30" />
          </div>
          <Home size={32} className="absolute bottom-10 left-1/2 -translate-x-1/2 text-brand/40" />
        </div>
      </div>

      {FLOATERS.map(({ icon: Icon, color, label, className }) => (
        <div
          key={label}
          className={`absolute ${className} flex flex-col items-center gap-1`}
        >
          <div className={`w-11 h-11 rounded-full ${color} flex items-center justify-center shadow-sm border border-white`}>
            <Icon size={20} />
          </div>
          <span className="text-[10px] font-semibold text-muted bg-surface/90 px-2 py-0.5 rounded-full border border-line shadow-sm">{label}</span>
        </div>
      ))}
    </div>
  );
}
