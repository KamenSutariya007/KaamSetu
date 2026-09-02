import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { servicesAPI } from '../api/client';
import LoadingState from '../components/LoadingState';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import cn from '../utils/cn';

export default function FairPricePage() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ quoted_price: '', category_id: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    servicesAPI.categories().then(({ data }) => {
      const cats = data.results || data;
      setCategories(cats);
      if (cats.length) setForm((f) => ({ ...f, category_id: cats[0].id }));
    });
  }, []);

  const check = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await servicesAPI.fairPriceCheck({
        quoted_price: parseFloat(form.quoted_price),
        category_id: form.category_id,
        city: 'Ahmedabad',
      });
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  const quotePct = result ? Math.min(100, (result.quoted_price / result.typical_range_max) * 100) : 0;
  const isOverpriced = result && result.quoted_price > result.typical_range_max;

  return (
    <PageContainer variant="form" className="py-8">
      <PageHeader
        title={t('fairPrice')}
        subtitle="Compare a provider quote against typical local ranges in Ahmedabad"
      />

      <Card className="mb-6">
        <form onSubmit={check} className="space-y-4">
          <Select label="Service Category" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input type="number" label="Provider Quote (₹)" value={form.quoted_price} onChange={(e) => setForm({ ...form, quoted_price: e.target.value })} placeholder="Enter quoted price" required />
          <Button type="submit" variant="primary" className="w-full" loading={loading}>Check Price</Button>
        </form>
      </Card>

      {loading && <LoadingState />}
      {result && (
        <Card>
          <span className="text-xs bg-indigo/20 text-midnight px-2.5 py-1 rounded-full font-medium">{result.demo_price_label}</span>

          <div className="grid sm:grid-cols-2 gap-6 mt-6">
            <div className="text-center p-5 bg-mist rounded-xl">
              <p className="text-xs text-muted uppercase tracking-wide mb-1">Provider Quote</p>
              <p className="text-3xl font-bold text-midnight">₹{result.quoted_price}</p>
            </div>
            <div className="text-center p-5 bg-lime/5 rounded-xl border border-green/20">
              <p className="text-xs text-muted uppercase tracking-wide mb-1">Typical Range</p>
              <p className="text-3xl font-bold text-lime">₹{result.typical_range_min}–{result.typical_range_max}</p>
            </div>
          </div>

          {/* Range visualization */}
          <div className="mt-6">
            <div className="flex justify-between text-xs text-muted mb-2">
              <span>₹{result.typical_range_min}</span>
              <span>₹{result.typical_range_max}</span>
            </div>
            <div className="relative h-3 bg-indigo/10 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-lime/30 rounded-full" style={{ width: '100%' }} />
              <div
                className={cn('absolute inset-y-0 w-1 rounded-full', isOverpriced ? 'bg-danger' : 'bg-indigo')}
                style={{ left: `${Math.min(quotePct, 100)}%` }}
                title={`Quote: ₹${result.quoted_price}`}
              />
            </div>
            <p className="text-xs text-muted mt-2 flex items-center gap-1">
              <TrendingUp size={12} /> {isOverpriced ? 'Quote is above typical range' : 'Quote is within typical range'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6 text-sm">
            <div className="bg-mist rounded-xl p-3"><p className="text-xs text-muted mb-1">Visit</p><p className="font-medium">₹{result.visit_charge.min}–{result.visit_charge.max}</p></div>
            <div className="bg-mist rounded-xl p-3"><p className="text-xs text-muted mb-1">Labour</p><p className="font-medium">₹{result.labour.min}–{result.labour.max}</p></div>
            <div className="bg-mist rounded-xl p-3"><p className="text-xs text-muted mb-1">Material</p><p className="font-medium">₹{result.material.min}–{result.material.max}</p></div>
          </div>

          <div className="mt-5 p-3 bg-danger/5 border border-danger/20 rounded-xl flex gap-2 text-sm">
            <AlertTriangle size={16} className="text-danger shrink-0 mt-0.5" />
            <p className="text-midnight">{result.transparency_warning}</p>
          </div>
          <p className="mt-3 text-sm text-midnight font-medium">{result.suggestion}</p>
        </Card>
      )}
    </PageContainer>
  );
}
