import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import LoadingState, { ErrorState } from '../components/LoadingState';
import { useLanguage } from '../context/LanguageContext';
import { servicesAPI } from '../api/client';
import { CheckCircle } from 'lucide-react';

import PageContainer from '../components/layout/PageContainer';

export default function GuideDetailPage() {
  const { slug } = useParams();
  const { t } = useLanguage();
  const [guide, setGuide] = useState(null);
  const [checked, setChecked] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    servicesAPI.guide(slug).then(({ data }) => setGuide(data)).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <LoadingState />;
  if (!guide) return <ErrorState message="Guide not found" />;

  return (
    <PageContainer variant="prose" className="py-8">
      <Link to="/guides" className="text-brand text-sm mb-4 inline-block">← Back to guides</Link>
      <h1 className="text-2xl font-bold text-ink mb-2">{guide.title}</h1>
      <p className="text-muted mb-4">{guide.problem}</p>

      {guide.safety_warning && (
        <div className="bg-danger/10 border border-danger rounded-xl p-4 mb-6 text-sm">⚠ {guide.safety_warning}</div>
      )}

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-page rounded-xl p-3"><p className="text-xs text-muted">Difficulty</p><p className="font-semibold">{guide.difficulty}</p></div>
        <div className="bg-page rounded-xl p-3"><p className="text-xs text-muted">Time</p><p className="font-semibold">{guide.estimated_time}</p></div>
        <div className="bg-page rounded-xl p-3"><p className="text-xs text-muted">Cost</p><p className="font-semibold">₹{guide.estimated_cost_min}–{guide.estimated_cost_max}</p></div>
      </div>

      <h2 className="font-semibold text-ink mb-3">Progress Checklist</h2>
      <div className="space-y-3 mb-8">
        {guide.steps?.map((step, i) => (
          <label key={i} className="flex items-start gap-3 bg-surface rounded-xl p-4 border border-line cursor-pointer">
            <input type="checkbox" checked={checked.includes(i)} onChange={() => {
              setChecked(checked.includes(i) ? checked.filter((x) => x !== i) : [...checked, i]);
            }} className="mt-1" />
            <div>
              <p className="font-medium text-ink">{step.title || `Step ${step.step || i + 1}`}</p>
              <p className="text-sm text-muted">{step.description}</p>
            </div>
          </label>
        ))}
      </div>

      <div className="flex gap-3">
        <Link to="/providers" className="flex-1 text-center py-3 bg-indigo text-ink rounded-xl font-medium">{t('findProfessional')}</Link>
        <Link to="/support" className="flex-1 text-center py-3 border border-line rounded-xl font-medium">Still Need Help</Link>
      </div>
    </PageContainer>
  );
}
