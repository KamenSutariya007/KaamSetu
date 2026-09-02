import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import HeroIllustration from '../components/home/HeroIllustration';
import ServiceCategoryStrip from '../components/home/ServiceCategoryStrip';
import DashboardWidgets from '../components/home/DashboardWidgets';
import Button from '../components/ui/Button';
import { InView } from '../hooks/InView';

const STATS = [
  { value: '5000+', label: 'Happy Customers' },
  { value: '24/7', label: 'Support' },
  { value: '4.8★', label: 'Average Rating' },
  { value: '98%', label: 'On-time Service' },
];

export default function LandingPage() {
  const { t, lang } = useLanguage();
  const fontClass = lang === 'gu' ? 'font-gujarati' : lang === 'hi' ? 'font-hindi' : '';

  return (
    <div className={`min-w-0 ${fontClass}`}>
      {/* Hero */}
      <section className="hero-pastel relative overflow-hidden">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="min-w-0 animate-fade-up">
              <span className="inline-block text-xs font-bold tracking-widest text-violet uppercase bg-violet/10 px-3 py-1.5 rounded-full mb-5 border border-violet/20">
                Smart Home Care Starts Here
              </span>
              <h1 className="text-display mb-5">
                <span className="text-ink">Understand.</span>{' '}
                <span className="text-brand">Fix.</span>{' '}
                <span className="text-green">Relax.</span>
              </h1>
              <p className="text-lg text-muted mb-8 leading-relaxed max-w-lg">
                AI-powered diagnosis, verified professionals, transparent pricing and real-time service tracking.
              </p>
              <div className="flex flex-wrap gap-3 mb-10">
                <Button as={Link} to="/ai-assistant" variant="violet" size="lg">Start Home Checkup</Button>
                <Button as={Link} to="/providers" variant="secondary" size="lg">{t('findPro')}</Button>
              </div>
              <div className="flex flex-wrap gap-3">
                {STATS.map((s, i) => (
                  <div
                    key={s.label}
                    className="bg-surface/90 backdrop-blur-sm border border-line rounded-full px-4 py-2 shadow-sm animate-fade-up"
                    style={{ animationDelay: `${100 + i * 50}ms` }}
                  >
                    <span className="font-bold text-ink text-sm">{s.value}</span>
                    <span className="text-muted text-xs ml-2">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <HeroIllustration />
          </div>
        </div>
      </section>

      {/* Services strip */}
      <section className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ServiceCategoryStrip />
      </section>

      {/* Dashboard widgets */}
      <section className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <InView>
          <h2 className="text-xl font-bold text-ink mb-6">Your Home at a Glance</h2>
        </InView>
        <DashboardWidgets />
      </section>

      {/* CTA */}
      <section className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <InView className="rounded-3xl pastel-purple border border-line p-8 sm:p-12 text-center">
          <h2 className="text-2xl font-bold text-ink mb-3">Ready to fix your home smarter?</h2>
          <p className="text-muted mb-6 max-w-md mx-auto">Join thousands of homeowners who trust KaamSetu for safe, transparent home services.</p>
          <Button as={Link} to="/register" variant="primary" size="lg">{t('register')}</Button>
        </InView>
      </section>
    </div>
  );
}
