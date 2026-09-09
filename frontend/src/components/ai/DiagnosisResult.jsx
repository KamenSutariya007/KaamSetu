import { Link } from 'react-router-dom';
import { useState } from 'react';
import { AlertTriangle, Wrench, UserSearch, Save, Headphones, ShieldCheck, HelpCircle, IndianRupee, Clock, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { aiAPI } from '../../api/client';
import PageContainer from '../layout/PageContainer';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PageHeader from '../ui/PageHeader';
import cn from '../../utils/cn';

const DECISION_STYLES = {
  'safe diy': { bg: 'bg-green/10', border: 'border-green/30', text: 'text-green', icon: ShieldCheck, label: 'Safe DIY' },
  'diy with caution': { bg: 'bg-yellow/10', border: 'border-yellow/30', text: 'text-yellow', icon: AlertTriangle, label: 'DIY with Caution' },
  'call professional': { bg: 'bg-danger/10', border: 'border-danger/30', text: 'text-danger', icon: AlertTriangle, label: 'Call Professional' },
  'need more information': { bg: 'bg-brand/10', border: 'border-brand/30', text: 'text-brand', icon: HelpCircle, label: 'Need More Information' },
};

function getDecisionStyle(decision) {
  return DECISION_STYLES[(decision || '').toLowerCase()] || DECISION_STYLES['need more information'];
}

export default function DiagnosisResult({ result }) {
  const { t } = useLanguage();
  const [saved, setSaved] = useState(false);
  const isDangerous = result.is_dangerous;
  const isDemo = result.is_demo_mode;
  const style = getDecisionStyle(result.decision);
  const DecisionIcon = style.icon;

  const saveToPassport = async () => {
    if (!result.id) return;
    try { await aiAPI.savePassport(result.id); setSaved(true); } catch { alert('Login required to save to passport'); }
  };

  return (
    <div className="bg-page min-h-[60vh] animate-fade-in">
      <PageContainer variant="wide" className="py-8">
        {isDemo && (
          <div className="mb-4 px-4 py-2.5 bg-cyan/10 border border-cyan/30 rounded-xl text-sm font-medium text-cyan flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan animate-pulse" /> {t('demoAI')}
          </div>
        )}

        <PageHeader
          title="Problem Identified"
          subtitle={result.possible_issue}
          badge={<span className="text-xs bg-brand/10 text-brand px-2.5 py-1 rounded-full font-medium border border-brand/20">{result.category}</span>}
        />

        {isDangerous && (
          <div className="mb-6 p-5 rounded-2xl border border-danger/30 bg-danger/5">
            <div className="flex items-center gap-2 text-danger font-bold mb-2"><AlertTriangle size={20} /> Safety Alert</div>
            <p className="font-gujarati text-ink">{result.safety_warning || 'આ problem ઘરે જાતે solve કરવાનો પ્રયાસ ન કરો.'}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 mb-6 min-w-0">
          {/* Left — Issue summary */}
          <Card className="lg:col-span-1 pastel-purple !border-brand/10" hover={false}>
            <p className="text-xs font-bold text-brand uppercase tracking-wide mb-3">Diagnosis</p>
            <p className="font-semibold text-ink mb-4">{result.possible_issue}</p>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Severity</span>
                <span className="font-medium text-ink capitalize">{result.severity || 'Moderate'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Category</span>
                <span className="font-medium text-ink capitalize">{result.category}</span>
              </div>
            </div>
          </Card>

          {/* Center — Details */}
          <Card className="lg:col-span-1" hover={false}>
            <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-5 border', style.bg, style.border, style.text)}>
              <DecisionIcon size={16} /> {style.label}
            </div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-page rounded-xl p-3 text-center border border-line">
                <p className="text-2xl font-extrabold text-brand">{result.confidence_score}%</p>
                <p className="text-xs text-muted mt-1">Confidence</p>
              </div>
              <div className="bg-page rounded-xl p-3 border border-line">
                <div className="flex items-center gap-1 text-muted text-xs mb-1"><IndianRupee size={12} /> Est. Cost</div>
                <p className="font-bold text-ink text-sm">₹{result.estimated_cost_min}–{result.estimated_cost_max}</p>
              </div>
              <div className="bg-page rounded-xl p-3 border border-line">
                <div className="flex items-center gap-1 text-muted text-xs mb-1"><Clock size={12} /> Time</div>
                <p className="font-bold text-ink text-sm">{result.estimated_time}</p>
              </div>
            </div>
            {result.safety_warning && !isDangerous && (
              <div className="flex items-start gap-2 p-3 bg-yellow/10 border border-yellow/30 rounded-xl text-sm text-ink mb-4">
                <AlertTriangle size={16} className="text-yellow shrink-0" /> {result.safety_warning}
              </div>
            )}
            {result.instructions?.length > 0 && (
              <div>
                <h3 className="font-bold text-ink mb-3 text-sm">Recommended Steps</h3>
                <ol className="space-y-2">
                  {result.instructions.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="w-6 h-6 rounded-full bg-brand text-white font-bold flex items-center justify-center shrink-0 text-xs">{i + 1}</span>
                      <span className="text-muted pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </Card>

          {/* Right — Next steps */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-brand uppercase tracking-wide">Recommended Next Step</p>
            <Card hover={false} className="pastel-blue !border-blue/10">
              <p className="text-sm text-muted mb-4">{style.label === 'Safe DIY' ? 'You can try fixing this safely at home with our guide.' : 'We recommend booking a verified professional for this issue.'}</p>
              <div className="space-y-2">
                {(style.label === 'Safe DIY' || style.label === 'DIY with Caution') && (
                  <Button as={Link} to="/guides" variant="success" className="w-full justify-start" size="md"><Wrench size={18} /> {t('viewGuide')}</Button>
                )}
                <Button as={Link} to={`/providers?category=${result.recommended_provider_category}`} variant="violet" className="w-full justify-start" size="md"><UserSearch size={18} /> {t('findProfessional')}</Button>
                <Button as={Link} to="/support" variant="secondary" className="w-full justify-start" size="md"><Headphones size={18} /> {t('contactSupport')}</Button>
                {result.id && (
                  <Button onClick={saveToPassport} disabled={saved} variant="secondary" className="w-full justify-start" size="md">
                    <Save size={18} /> {saved ? 'Saved to Passport' : 'Save to Passport'}
                  </Button>
                )}
                <Button as={Link} to="/ai-assistant" variant="ghost" className="w-full justify-start" size="md">
                  Analyze Another <ArrowRight size={16} />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
