import {
  ShieldCheck, Sparkles, IndianRupee, MapPin, Lock,
  Phone, Calendar, UserCheck, KeyRound,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const BENEFITS = [
  { icon: ShieldCheck, title: 'Trusted Professionals', desc: 'Verified & experienced service providers', color: 'bg-green/10 text-green' },
  { icon: Sparkles, title: 'AI-Powered Diagnosis', desc: 'Smart solutions for your home issues', color: 'bg-violet/10 text-violet' },
  { icon: IndianRupee, title: 'Transparent Pricing', desc: 'Clear, upfront & fair pricing', color: 'bg-brand/10 text-brand' },
  { icon: MapPin, title: 'Live Tracking', desc: 'Track your service provider in real-time', color: 'bg-cyan/10 text-cyan' },
  { icon: Lock, title: 'Secure & Reliable', desc: 'Your data and home are protected', color: 'bg-blue/10 text-blue' },
];

const INFO_ITEMS = [
  { icon: Phone, title: 'Phone & Email', desc: 'For account verification and important updates.' },
  { icon: MapPin, title: 'Address & Location', desc: 'PIN auto-fills area, city and state so nearby professionals can reach you.' },
  { icon: Calendar, title: 'Date of Birth', desc: 'For account security and personalization.' },
  { icon: UserCheck, title: 'Role Selection', desc: 'To provide the correct FixMitra experience.' },
  { icon: KeyRound, title: 'Password', desc: 'To keep your account secure.' },
];

export default function RegistrationInfoPanel() {
  const { t } = useLanguage();

  return (
    <aside className="space-y-6" aria-label="Why join FixMitra">
      <div className="bg-surface rounded-2xl border border-line p-6 shadow-sm">
        <h2 className="text-lg font-bold text-ink mb-4">Why Join FixMitra?</h2>
        <ul className="space-y-4">
          {BENEFITS.map(({ icon: Icon, title, desc, color }) => (
            <li key={title} className="flex gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={18} aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold text-ink text-sm">{title}</p>
                <p className="text-xs text-muted leading-relaxed">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-surface rounded-2xl border border-line p-6 shadow-sm">
        <h2 className="text-lg font-bold text-ink mb-4">We Need This Information</h2>
        <ul className="space-y-3">
          {INFO_ITEMS.map(({ icon: Icon, title, desc }) => (
            <li key={title} className="flex gap-3">
              <Icon size={16} className="text-violet mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-medium text-ink text-sm">{title}</p>
                <p className="text-xs text-muted">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="pastel-green rounded-2xl border border-line p-6">
        <h2 className="text-lg font-bold text-ink mb-2">Your Safety is Our Priority</h2>
        <p className="text-sm text-muted mb-4 leading-relaxed">
          We protect your personal information and only use it to provide FixMitra services.
        </p>
        <ul className="space-y-2 text-sm text-ink">
          <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-green" /> Secure Account</li>
          <li className="flex items-center gap-2"><Lock size={16} className="text-violet" /> Protected Information</li>
          <li className="flex items-center gap-2"><MapPin size={16} className="text-brand" /> Location Privacy</li>
        </ul>
        <p className="text-xs text-muted mt-4">{t('taglineGu')}</p>
      </div>
    </aside>
  );
}
