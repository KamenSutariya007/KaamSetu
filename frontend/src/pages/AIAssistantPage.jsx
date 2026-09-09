import { useLocation } from 'react-router-dom';
import HomeCheckupStation from '../components/HomeCheckupStation';
import DiagnosisResult from '../components/ai/DiagnosisResult';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import { Shield, CheckCircle, Clock, Users } from 'lucide-react';
import cn from '../utils/cn';

export default function AIAssistantPage() {
  const location = useLocation();
  const result = location.state?.result;

  if (result) return <DiagnosisResult result={result} />;

  return (
    <div className="bg-page min-h-[70vh]">
      <PageContainer variant="wide" className="py-8 sm:py-10 animate-fade-in">
        <PageHeader title="AI Fix Assistant" subtitle="Structured home issue diagnosis — clean, safe, and professional" />
        <div className="grid lg:grid-cols-3 gap-6 items-start min-w-0">
          <div className="lg:col-span-1 min-w-0">
            <p className="text-xs font-bold text-brand uppercase tracking-wide mb-3">Issue Input</p>
            <HomeCheckupStation compact />
          </div>
          <div className="lg:col-span-1 pastel-purple rounded-2xl border border-line p-6 min-h-[200px] flex flex-col items-center justify-center text-center">
            <p className="text-sm font-bold text-ink mb-2">Diagnosis</p>
            <p className="text-muted text-sm">Upload an issue to see AI analysis, confidence score, and severity here.</p>
          </div>
          <div className="lg:col-span-1 space-y-4">
            <p className="text-xs font-bold text-brand uppercase tracking-wide mb-1">How it works</p>
            <div className="bg-surface rounded-2xl border border-line p-5 shadow-sm">
              <ol className="space-y-3">
                {[
                  { icon: CheckCircle, text: 'Describe or upload your home issue', color: 'text-green' },
                  { icon: Shield, text: 'Get AI safety-first diagnosis', color: 'text-brand' },
                  { icon: Users, text: 'Follow DIY guide or book a pro', color: 'text-blue' },
                  { icon: Clock, text: 'Track service with OTP verify', color: 'text-brand' },
                ].map(({ icon: Icon, text, color }, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <Icon size={18} className={cn('shrink-0 mt-0.5', color)} />
                    <span className="text-muted">{text}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="pastel-blue rounded-2xl border border-line p-4 text-sm text-muted">
              Never attempt DIY for gas leaks, electrical hazards, or structural damage.
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
