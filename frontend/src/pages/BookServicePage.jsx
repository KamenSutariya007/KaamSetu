import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { bookingsAPI, servicesAPI } from '../api/client';
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
      const payload = { ...form, category: parseInt(form.category, 10) };
      if (form.provider) payload.provider = parseInt(form.provider, 10);
      if (form.partner) payload.partner = parseInt(form.partner, 10);
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
  const categoryName = categories.find((c) => c.id === parseInt(form.category, 10))?.name;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Guided booking</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">{t('bookService')}</h1>
        <p className="mt-1 text-sm text-muted">A clear path from service selection to confirmation.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-3xl bg-[#0B3D3A] p-5 text-white lg:sticky lg:top-24">
          <p className="text-xs font-bold uppercase tracking-wider text-white/50">Steps</p>
          <ol className="mt-4 space-y-3">
            {STEPS.map((label, i) => (
              <li key={label} className="flex items-center gap-3">
                <span
                  className={cn(
                    'grid h-8 w-8 place-items-center rounded-full text-xs font-extrabold',
                    i < step ? 'bg-coral text-white' : i === step ? 'bg-white text-brand' : 'bg-white/10 text-white/60',
                  )}
                >
                  {i < step ? <Check size={14} /> : i + 1}
                </span>
                <span className={cn('text-sm font-semibold', i === step ? 'text-white' : 'text-white/60')}>{label}</span>
              </li>
            ))}
          </ol>
          <div className="mt-6 rounded-2xl bg-white/10 p-3 text-xs text-white/75">
            Est. ₹{form.estimated_price_min}–{form.estimated_price_max}
          </div>
        </aside>

        <section className="rounded-3xl border border-line bg-surface p-5 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 0 && (
              <Select label="Service category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            )}
            {step === 1 && (
              <Textarea label="Describe the problem" value={form.issue_description} onChange={(e) => setForm({ ...form, issue_description: e.target.value })} required rows={5} />
            )}
            {step === 2 && (
              <Input label="Service address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            )}
            {step === 3 && (
              <>
                <Input type="date" label="Preferred date" value={form.preferred_date} onChange={(e) => setForm({ ...form, preferred_date: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <Input type="time" label="From" value={form.preferred_time_start} onChange={(e) => setForm({ ...form, preferred_time_start: e.target.value })} />
                  <Input type="time" label="To" value={form.preferred_time_end} onChange={(e) => setForm({ ...form, preferred_time_end: e.target.value })} />
                </div>
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input type="checkbox" checked={form.flexible_timing} onChange={(e) => setForm({ ...form, flexible_timing: e.target.checked })} />
                  Flexible timing
                </label>
              </>
            )}
            {step === 4 && (
              <div className="space-y-3 rounded-2xl bg-page p-4 text-sm">
                <div className="flex justify-between gap-3"><span className="text-muted">Service</span><span className="font-bold text-ink">{categoryName}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted">Issue</span><span className="max-w-[60%] text-right font-semibold text-ink">{form.issue_description || '—'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted">Address</span><span className="max-w-[60%] text-right font-semibold text-ink">{form.address}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted">Date</span><span className="font-semibold text-ink">{form.preferred_date}</span></div>
                <div className="flex justify-between gap-3 border-t border-line pt-3"><span className="text-muted">Est. price</span><span className="font-extrabold text-ink">₹{form.estimated_price_min}–{form.estimated_price_max}</span></div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {step > 0 && <Button type="button" onClick={back} variant="secondary" className="flex-1">Back</Button>}
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={next} variant="coral" className="flex-1">Continue</Button>
              ) : (
                <Button type="submit" loading={loading} variant="coral" className="flex-1">{t('bookService')}</Button>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

export default function BookServicePage() {
  return (
    <ProtectedRoute allowedRoles={['CUSTOMER']}>
      <BookServiceForm />
    </ProtectedRoute>
  );
}
