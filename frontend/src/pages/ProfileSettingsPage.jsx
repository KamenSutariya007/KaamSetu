import { useEffect, useRef, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import LanguagePreference from '../components/profile/LanguagePreference';
import PageHeader from '../components/ui/PageHeader';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Globe, Bell, Lock, Loader2 } from 'lucide-react';
import { authAPI } from '../api/client';
import { INDIAN_STATES } from '../utils/registrationValidation';

const ROLE_MAP = {
  CUSTOMER: 'CUSTOMER',
  INDIVIDUAL_PROVIDER: 'INDIVIDUAL_PROVIDER',
  THIRD_PARTY_PARTNER: 'THIRD_PARTY_PARTNER',
  SUPPORT_AGENT: 'SUPPORT_AGENT',
  SENIOR_SUPPORT_AGENT: 'SENIOR_SUPPORT_AGENT',
  ADMIN: 'ADMIN',
};

export default function ProfileSettingsPage({ role = 'CUSTOMER' }) {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pin_code: '',
  });
  const [saved, setSaved] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinHint, setPinHint] = useState('');
  const skipPinLookup = useRef(true);

  useEffect(() => {
    if (user) {
      skipPinLookup.current = true;
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        pin_code: user.pin_code || '',
      });
    }
  }, [user]);

  useEffect(() => {
    const pin = (form.pin_code || '').replace(/\D/g, '');
    if (skipPinLookup.current) {
      skipPinLookup.current = false;
      return undefined;
    }
    if (pin.length !== 6) {
      setPinHint('');
      setPinLoading(false);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setPinLoading(true);
      setPinHint('');
      try {
        const { data } = await authAPI.lookupPincode(pin);
        if (cancelled) return;
        const area = (data.area || data.post_office || '').trim();
        setForm((f) => {
          let address = (f.address || '').trim();
          if (area) {
            if (!address) address = area;
            else if (!address.toLowerCase().includes(area.toLowerCase())) address = `${address}, ${area}`;
          }
          return {
            ...f,
            city: data.city || f.city,
            state: data.state || f.state,
            address,
          };
        });
        setPinHint(area ? `Area found: ${area}` : 'City and state updated.');
      } catch (err) {
        if (!cancelled) setPinHint(err.response?.data?.message || 'Could not find location for this PIN.');
      } finally {
        if (!cancelled) setPinLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.pin_code]);

  const save = async (e) => {
    e.preventDefault();
    const { data } = await authAPI.updateProfile({
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone,
      address: form.address,
      city: form.city,
      state: form.state,
      pin_code: form.pin_code,
    });
    updateUser(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const layoutRole = ROLE_MAP[role] || role;
  const initials = `${form.first_name?.[0] || ''}${form.last_name?.[0] || ''}`.toUpperCase() || 'U';
  const isProfessional = role === 'INDIVIDUAL_PROVIDER' || role === 'THIRD_PARTY_PARTNER';

  return (
    <DashboardLayout role={layoutRole}>
      <PageHeader
        title={t('profile')}
        subtitle={isProfessional ? 'Keep your service location accurate for nearby bookings' : t('profileSettings')}
      />

      <div className="grid lg:grid-cols-3 gap-6 min-w-0">
        <div className="lg:col-span-1">
          <Card className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-indigo/20 text-ink font-bold text-2xl flex items-center justify-center mx-auto mb-4">
              {initials}
            </div>
            <p className="font-semibold text-ink">{form.first_name} {form.last_name}</p>
            <p className="text-sm text-muted">{user?.email}</p>
            <p className="text-xs text-muted mt-1 capitalize">{user?.role?.replace(/_/g, ' ').toLowerCase()}</p>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6 max-w-2xl min-w-0">
          <Card>
            <CardHeader title={t('personalInfo')} subtitle="Update your name and contact details" />
            <form onSubmit={save} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input id="first_name" label={t('firstName')} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                <Input id="last_name" label={t('lastName')} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </div>
              <Input id="phone" label={t('phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />

              <div className="pt-2 border-t border-line">
                <p className="text-sm font-medium text-ink mb-3">Service / Home Address</p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="pin_code" className="block text-sm font-medium text-ink mb-1">PIN Code</label>
                    <div className="relative">
                      <input
                        id="pin_code"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={form.pin_code}
                        onChange={(e) => setForm({ ...form, pin_code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                        className="w-full px-3 py-2 rounded-xl border border-line bg-page text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
                        placeholder="380001"
                      />
                      {pinLoading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted" />}
                    </div>
                    {pinHint && <p className="text-xs text-muted mt-1">{pinHint}</p>}
                  </div>
                  <Input id="city" label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-ink mb-1">State</label>
                    <select
                      id="state"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-line bg-page text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
                    >
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      {form.state && !INDIAN_STATES.includes(form.state) && (
                        <option value={form.state}>{form.state}</option>
                      )}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <Textarea
                    id="address"
                    label={t('address')}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    rows={2}
                    placeholder="House / Flat No., Street, Area, Landmark"
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" className="w-full sm:w-auto">{t('saveProfile')}</Button>
              {saved && <p className="text-lime text-sm font-medium">{t('profileSaved')}</p>}
            </form>
          </Card>

          <Card>
            <CardHeader
              title="Language"
              subtitle="Choose your preferred language for the app"
              action={<Globe size={20} className="text-brand" />}
            />
            <LanguagePreference />
          </Card>

          <Card className="opacity-80">
            <CardHeader title="Security" subtitle="Password and account security" action={<Lock size={20} className="text-muted" />} />
            <p className="text-sm text-muted">Password change and two-factor authentication coming soon.</p>
          </Card>

          <Card className="opacity-80">
            <CardHeader title="Notifications" subtitle="Manage notification preferences" action={<Bell size={20} className="text-muted" />} />
            <p className="text-sm text-muted">Notification preferences will be available in a future update.</p>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
