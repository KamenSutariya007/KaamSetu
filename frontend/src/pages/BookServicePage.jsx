import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { bookingsAPI, servicesAPI } from '../api/client';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input, Textarea, Select } from '../components/ui/Input';
import ProtectedRoute from '../components/ProtectedRoute';
import cn from '../utils/cn';
import { Check } from 'lucide-react';

const STEPS = ['Service', 'Problem', 'Location', 'Appointment', 'Review'];

function BookServiceForm() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    category: 1,
    provider: params.get('provider') || '',
    partner: params.get('partner') || '',
    issue_description: '',
    address: 'Satellite, Ahmedabad, Gujarat',
    latitude: '23.0225',
    longitude: '72.5714',
    preferred_date: new Date().toISOString().split('T')[0],
    preferred_time_start: '10:00',
    preferred_time_end: '12:00',
    flexible_timing: true,
    estimated_price_min: 200,
    estimated_price_max: 800,
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    servicesAPI.categories().then(({ data }) => {
      const cats = data.results || data;
      setCategories(cats);
      if (cats.length) setForm((f) => ({ ...f, category: cats[0].id }));
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, category: parseInt(form.category) };
      if (form.provider) payload.provider = parseInt(form.provider);
      if (form.partner) payload.partner = parseInt(form.partner);
      const { data } = await bookingsAPI.create(payload);
      navigate(`/customer/bookings/${data.id}`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const categoryName = categories.find((c) => c.id === parseInt(form.category))?.name;

  return (
    <PageContainer variant="narrow" className="py-8">
      <PageHeader title={t('bookService')} subtitle="Book a verified professional in a few simple steps" />

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center min-w-0">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
              i < step ? 'bg-lime text-midnight' : i === step ? 'bg-indigo text-white' : 'bg-mist text-muted border border-line',
            )}>
              {i < step ? <Check size={14} /> : i + 1}
            </div>
            <span className={cn('text-xs ml-1.5 mr-3 hidden sm:inline whitespace-nowrap', i === step ? 'text-midnight font-medium' : 'text-muted')}>{s}</span>
            {i < STEPS.length - 1 && <div className={cn('w-4 sm:w-8 h-0.5 shrink-0', i < step ? 'bg-lime' : 'bg-indigo/10')} />}
          </div>
        ))}
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 0 && (
            <Select label="Service Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          )}
          {step === 1 && (
            <Textarea label="Describe the problem" value={form.issue_description} onChange={(e) => setForm({ ...form, issue_description: e.target.value })} required rows={4} />
          )}
          {step === 2 && (
            <Input label="Service Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          )}
          {step === 3 && (
            <>
              <Input type="date" label="Preferred Date" value={form.preferred_date} onChange={(e) => setForm({ ...form, preferred_date: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input type="time" label="From" value={form.preferred_time_start} onChange={(e) => setForm({ ...form, preferred_time_start: e.target.value })} />
                <Input type="time" label="To" value={form.preferred_time_end} onChange={(e) => setForm({ ...form, preferred_time_end: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" checked={form.flexible_timing} onChange={(e) => setForm({ ...form, flexible_timing: e.target.checked })} className="rounded" />
                Flexible timing
              </label>
            </>
          )}
          {step === 4 && (
            <div className="space-y-3 text-sm">
              <h3 className="font-semibold text-midnight">Review your booking</h3>
              <div className="bg-mist rounded-xl p-4 space-y-2">
                <div className="flex justify-between"><span className="text-muted">Service</span><span className="font-medium">{categoryName}</span></div>
                <div className="flex justify-between"><span className="text-muted">Issue</span><span className="font-medium text-right max-w-[60%] truncate">{form.issue_description || '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted">Address</span><span className="font-medium text-right max-w-[60%]">{form.address}</span></div>
                <div className="flex justify-between"><span className="text-muted">Date</span><span className="font-medium">{form.preferred_date}</span></div>
                <div className="flex justify-between pt-2 border-t border-line">
                  <span className="text-muted">Est. Price</span>
                  <span className="font-bold text-midnight">₹{form.estimated_price_min}–{form.estimated_price_max}</span>
                </div>
                <p className="text-xs text-aqua">{t('approxDemoPrice')}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {step > 0 && <Button type="button" onClick={back} variant="secondary" className="flex-1">Back</Button>}
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={next} variant="primary" className="flex-1">Continue</Button>
            ) : (
              <Button type="submit" loading={loading} variant="primary" className="flex-1">{t('bookService')}</Button>
            )}
          </div>
        </form>
      </Card>
    </PageContainer>
  );
}

export default function BookServicePage() {
  return (
    <ProtectedRoute allowedRoles={['CUSTOMER']}>
      <BookServiceForm />
    </ProtectedRoute>
  );
}
