import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingState, { EmptyState } from '../components/LoadingState';
import { useLanguage } from '../context/LanguageContext';
import { servicesAPI } from '../api/client';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import { Clock, Wrench, AlertTriangle } from 'lucide-react';

export default function GuidesPage() {
  const { t } = useLanguage();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    servicesAPI.guides().then(({ data }) => {
      setGuides(data.results || data);
      setLoading(false);
    });
  }, []);

  const difficultyColor = { easy: 'bg-lime/10 text-lime', medium: 'bg-indigo/10 text-midnight', hard: 'bg-danger/10 text-danger' };

  return (
    <PageContainer variant="wide" className="py-8">
      <PageHeader
        title={t('safeDIY')}
        subtitle="Step-by-step repair guides with safety warnings and tool lists"
      />
      {loading ? <LoadingState variant="cards" /> : guides.length === 0 ? <EmptyState message="No guides available yet" /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0">
          {guides.map((g) => (
            <Link key={g.id} to={`/guides/${g.slug}`}>
              <Card hover className="h-full !p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${difficultyColor[g.difficulty] || 'bg-indigo/10 text-midnight'}`}>
                    {g.difficulty}
                  </span>
                  <span className="text-xs text-muted">{g.category_name}</span>
                </div>
                <h3 className="font-semibold text-midnight mb-2 line-clamp-2">{g.title}</h3>
                <div className="flex gap-4 text-xs text-muted mt-auto">
                  <span className="flex items-center gap-1"><Clock size={12} /> {g.estimated_time}</span>
                  <span className="flex items-center gap-1"><Wrench size={12} /> ₹{g.estimated_cost_min}–{g.estimated_cost_max}</span>
                </div>
                {g.is_demo && <span className="text-xs text-aqua mt-3 inline-flex items-center gap-1"><AlertTriangle size={10} /> {t('demoData')}</span>}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
