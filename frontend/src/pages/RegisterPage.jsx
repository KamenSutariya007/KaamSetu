import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home, Wrench, Building2, Eye, EyeOff, MapPin, CheckCircle2, Loader2, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { authAPI, servicesAPI } from '../api/client';
import RegistrationInfoPanel from '../components/registration/RegistrationInfoPanel';
import GoogleSignIn from '../components/registration/GoogleSignIn';
import EmailVerification from '../components/registration/EmailVerification';
import PageContainer from '../components/layout/PageContainer';
import {
  INDIAN_STATES, WORKING_DAYS, PARTNER_TYPES, ROLE_PATHS,
  getPasswordStrength, validateField, validateForm, buildRegistrationPayload, parseApiErrors,
} from '../utils/registrationValidation';

const INITIAL_FORM = {
  first_name: '', last_name: '', phone: '', email: '', date_of_birth: '', gender: '',
  address: '', area: '', city: '', state: '', pin_code: '',
  role: 'CUSTOMER',
  password: '', password_confirm: '', referral_code: '', terms_accepted: false,
  language: 'en',
  verification_token: '',
  // Provider
  provider_category_ids: [], experience_years: '', service_radius_km: '10',
  visit_charge: '', bio: '', working_days: [0, 1, 2, 3, 4, 5], work_start: '09:00', work_end: '18:00',
  // Partner
  organization_name: '', partner_type: 'repair_company', authorized_brands: '',
  partner_category_ids: [], business_address: '', gst_number: '', contact_person: '',
};

function FieldLabel({ htmlFor, required, children }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-midnight mb-1">
      {children}{required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
    </label>
  );
}

function FieldError({ id, message }) {
  if (!message) return null;
  return <p id={id} role="alert" className="text-danger text-xs mt-1">{message}</p>;
}

function FieldSuccess({ message }) {
  if (!message) return null;
  return <p className="text-lime text-xs mt-1 flex items-center gap-1"><CheckCircle2 size={12} /> {message}</p>;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...INITIAL_FORM, language: lang });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState([]);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinHint, setPinHint] = useState('');
  const lastPinAreaRef = useRef('');

  useEffect(() => {
    servicesAPI.categories().then(({ data }) => setCategories(data.results || data)).catch(() => {});
  }, []);

  useEffect(() => {
    const pin = form.pin_code.replace(/\D/g, '');
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
        lastPinAreaRef.current = area;
        setForm((f) => ({
          ...f,
          city: data.city || f.city,
          state: data.state || f.state,
          area: area || f.area,
        }));
        setTouched((t) => ({ ...t, city: true, state: true, pin_code: true, area: true }));
        setErrors((e) => ({ ...e, city: undefined, state: undefined, pin_code: undefined }));
        setPinHint(area ? `Area found: ${area}` : 'City and state filled from PIN code.');
      } catch (err) {
        if (cancelled) return;
        const msg = err.response?.data?.message || 'Could not find city/state for this PIN code.';
        setPinHint(msg);
      } finally {
        if (!cancelled) setPinLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.pin_code]);

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (touched[field]) {
      setErrors((e) => ({ ...e, [field]: validateField(field, value, { ...form, [field]: value }) }));
    }
  };

  const blur = (field) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((e) => ({ ...e, [field]: validateField(field, form[field], form) }));
  };

  const toggleDay = (day) => {
    const days = form.working_days.includes(day)
      ? form.working_days.filter((d) => d !== day)
      : [...form.working_days, day].sort();
    update('working_days', days);
  };

  const toggleCategory = (field, id) => {
    const current = form[field];
    update(field, current.includes(id) ? current.filter((c) => c !== id) : [...current, id]);
  };

  const strength = getPasswordStrength(form.password);
  const passwordsMatch = form.password_confirm && form.password === form.password_confirm;
  const passwordsMismatch = form.password_confirm && form.password !== form.password_confirm;

  const handleEmailVerified = ({ email, verificationToken: token }) => {
    setVerifiedEmail(email);
    setVerificationToken(token);
    setForm((f) => ({ ...f, email, verification_token: token }));
    setErrors((e) => ({ ...e, email: undefined, verification_token: undefined }));
  };

  const handleEmailReset = () => {
    setVerifiedEmail('');
    setVerificationToken('');
    setForm((f) => ({ ...f, verification_token: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = Object.keys(INITIAL_FORM).reduce((acc, k) => ({ ...acc, [k]: true }), { terms_accepted: true });
    setTouched(allTouched);
    const validationErrors = validateForm(form);
    if (!verificationToken || !verifiedEmail) {
      validationErrors.email = 'Please verify your email with the OTP code first.';
    } else if (form.email.trim().toLowerCase() !== verifiedEmail.toLowerCase()) {
      validationErrors.email = 'Please verify your email with the OTP code first.';
    }
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      const payload = buildRegistrationPayload({
        ...form,
        email: verifiedEmail,
        verification_token: verificationToken,
      });
      const user = await register(payload);
      setSuccess(true);
      setTimeout(() => {
        navigate(ROLE_PATHS[user.role] || '/customer');
      }, 1200);
    } catch (err) {
      setErrors(parseApiErrors(err));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-4 py-2.5 rounded-xl border bg-mist text-midnight placeholder:text-muted/60 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo/40 ${
      errors[field] && touched[field] ? 'border-danger' : 'border-line'
    }`;

  const roles = [
    { value: 'CUSTOMER', label: 'Customer', desc: 'Book services for your home', icon: Home },
    { value: 'INDIVIDUAL_PROVIDER', label: 'Provider', desc: 'Offer services to customers', icon: Wrench },
    { value: 'THIRD_PARTY_PARTNER', label: 'Partner', desc: 'Organization / Company', icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-page overflow-x-hidden">
      <PageContainer variant="auth" className="py-8 lg:py-12">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Registration Form */}
          <div className="lg:col-span-3">
            <div className="bg-surface rounded-2xl border border-line shadow-lg p-6 sm:p-8">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand to-pink flex items-center justify-center text-white font-bold text-xl" aria-hidden="true">F</div>
                <span className="font-bold text-midnight text-xl">{t('appName')}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-midnight">Create your account</h1>
              <p className="font-gujarati text-sm text-muted mt-2 leading-relaxed">{t('taglineGu')}</p>
              <p className="text-sm text-muted mt-1 mb-6">Join KaamSetu and get trusted help for your home.</p>

              <GoogleSignIn role={form.role} className="mb-6" />

              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-line" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-surface px-2 text-muted">or register with email</span></div>
              </div>

              {success && (
                <div className="mb-6 p-4 bg-lime/10 border border-green rounded-xl flex items-center gap-2 text-lime" role="status">
                  <CheckCircle2 size={20} />
                  <span className="font-medium">Account created successfully! Redirecting to your dashboard...</span>
                </div>
              )}

              {errors._form && (
                <div className="mb-6 p-4 bg-danger/10 border border-danger rounded-xl flex items-center gap-2 text-danger" role="alert">
                  <AlertCircle size={18} />
                  <span className="text-sm">{errors._form}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-8">
                {/* Personal Information */}
                <section aria-labelledby="personal-info-heading">
                  <h2 id="personal-info-heading" className="text-lg font-semibold text-midnight mb-4 pb-2 border-b border-line">
                    Personal Information
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel htmlFor="first_name" required>First Name</FieldLabel>
                      <input id="first_name" type="text" placeholder="Enter first name" value={form.first_name}
                        onChange={(e) => update('first_name', e.target.value)} onBlur={() => blur('first_name')}
                        className={inputClass('first_name')} aria-invalid={!!errors.first_name} aria-describedby="first_name-error" />
                      <FieldError id="first_name-error" message={touched.first_name && errors.first_name} />
                    </div>
                    <div>
                      <FieldLabel htmlFor="last_name" required>Last Name</FieldLabel>
                      <input id="last_name" type="text" placeholder="Enter last name" value={form.last_name}
                        onChange={(e) => update('last_name', e.target.value)} onBlur={() => blur('last_name')}
                        className={inputClass('last_name')} aria-invalid={!!errors.last_name} />
                      <FieldError id="last_name-error" message={touched.last_name && errors.last_name} />
                    </div>
                  </div>

                  <div className="mt-4">
                    <FieldLabel htmlFor="phone" required>Phone Number</FieldLabel>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-line bg-mist text-sm text-midnight font-medium">+91</span>
                      <input id="phone" type="tel" inputMode="numeric" maxLength={10} placeholder="Phone Number"
                        value={form.phone} onChange={(e) => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                        onBlur={() => blur('phone')} className={`${inputClass('phone')} rounded-l-none`}
                        aria-invalid={!!errors.phone} />
                    </div>
                    <FieldError message={touched.phone && errors.phone} />
                  </div>

                  <div className="mt-4">
                    <EmailVerification
                      email={form.email}
                      onEmailChange={(value) => update('email', value)}
                      verifiedEmail={verifiedEmail}
                      verificationToken={verificationToken}
                      onVerified={handleEmailVerified}
                      onReset={handleEmailReset}
                      disabled={loading || success}
                    />
                    <FieldError message={touched.email && errors.email} />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <FieldLabel htmlFor="date_of_birth">Date of Birth</FieldLabel>
                      <input id="date_of_birth" type="date" max={new Date().toISOString().split('T')[0]}
                        value={form.date_of_birth} onChange={(e) => update('date_of_birth', e.target.value)}
                        onBlur={() => blur('date_of_birth')} className={inputClass('date_of_birth')} />
                      <FieldError message={touched.date_of_birth && errors.date_of_birth} />
                    </div>
                    <div>
                      <FieldLabel htmlFor="gender">Gender</FieldLabel>
                      <select id="gender" value={form.gender} onChange={(e) => update('gender', e.target.value)}
                        className={inputClass('gender')}>
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Address & Location */}
                <section aria-labelledby="address-heading">
                  <h2 id="address-heading" className="text-lg font-semibold text-midnight mb-4 pb-2 border-b border-line">
                    Address & Location
                  </h2>
                  <p className="text-sm text-muted mb-4 flex items-center gap-1.5">
                    <MapPin size={14} className="shrink-0" aria-hidden="true" />
                    Enter PIN code to auto-fill area, city and state — helps match nearby professionals.
                  </p>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <FieldLabel htmlFor="pin_code" required>PIN Code</FieldLabel>
                      <div className="relative">
                        <input
                          id="pin_code"
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="380001"
                          value={form.pin_code}
                          onChange={(e) => update('pin_code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                          onBlur={() => blur('pin_code')}
                          className={`${inputClass('pin_code')} ${pinLoading ? 'pr-10' : ''}`}
                          aria-invalid={!!errors.pin_code}
                        />
                        {pinLoading && (
                          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted" aria-hidden="true" />
                        )}
                      </div>
                      <FieldError message={touched.pin_code && errors.pin_code} />
                      {pinHint && !errors.pin_code && (
                        <p className={`text-xs mt-1 ${pinHint.startsWith('Area') || pinHint.startsWith('City') ? 'text-lime' : 'text-muted'}`}>
                          {pinHint}
                        </p>
                      )}
                    </div>
                    <div>
                      <FieldLabel htmlFor="city" required>City</FieldLabel>
                      <input
                        id="city"
                        type="text"
                        placeholder={pinLoading ? 'Fetching…' : 'City'}
                        value={form.city}
                        onChange={(e) => update('city', e.target.value)}
                        onBlur={() => blur('city')}
                        className={inputClass('city')}
                        aria-invalid={!!errors.city}
                      />
                      <FieldError message={touched.city && errors.city} />
                    </div>
                    <div>
                      <FieldLabel htmlFor="state" required>State</FieldLabel>
                      <select
                        id="state"
                        value={form.state}
                        onChange={(e) => update('state', e.target.value)}
                        onBlur={() => blur('state')}
                        className={inputClass('state')}
                      >
                        <option value="">Select state</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                        {form.state && !INDIAN_STATES.includes(form.state) && (
                          <option value={form.state}>{form.state}</option>
                        )}
                      </select>
                      <FieldError message={touched.state && errors.state} />
                    </div>
                  </div>

                  <div className="mt-4">
                    <FieldLabel htmlFor="area">Area / Locality</FieldLabel>
                    <input
                      id="area"
                      type="text"
                      placeholder="Area from PIN (editable)"
                      value={form.area}
                      onChange={(e) => update('area', e.target.value)}
                      className={inputClass('area')}
                    />
                  </div>

                  <div className="mt-4">
                    <FieldLabel htmlFor="address">House / Street Address</FieldLabel>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3 top-3 text-muted" aria-hidden="true" />
                      <input
                        id="address"
                        type="text"
                        placeholder="House / Flat No., Street, Landmark"
                        value={form.address}
                        onChange={(e) => update('address', e.target.value)}
                        className={`${inputClass('address')} pl-9`}
                      />
                    </div>
                  </div>
                </section>

                {/* Role Selection */}
                <section aria-labelledby="role-heading">
                  <h2 id="role-heading" className="text-lg font-semibold text-midnight mb-4 pb-2 border-b border-line">
                    Choose Your Role <span className="text-danger">*</span>
                  </h2>
                  <div className="grid sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Account role">
                    {roles.map(({ value, label, desc, icon: Icon }) => (
                      <button key={value} type="button" role="radio" aria-checked={form.role === value}
                        onClick={() => update('role', value)}
                        className={`p-4 rounded-xl border-2 text-left transition-all focus:outline-none focus:ring-2 focus:ring-indigo/40 ${
                          form.role === value
                            ? 'border-indigo bg-indigo/10 shadow-sm'
                            : 'border-line bg-mist hover:border-indigo/50'
                        }`}>
                        <Icon size={22} className={form.role === value ? 'text-aqua' : 'text-muted'} aria-hidden="true" />
                        <p className="font-semibold text-midnight mt-2">{label}</p>
                        <p className="text-xs text-muted mt-1">{desc}</p>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Role-specific fields */}
                {form.role === 'INDIVIDUAL_PROVIDER' && (
                  <section className="animate-in fade-in duration-200" aria-labelledby="provider-heading">
                    <h2 id="provider-heading" className="text-lg font-semibold text-midnight mb-4 pb-2 border-b border-line">
                      Provider Information
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <FieldLabel required>Service Categories</FieldLabel>
                        <div className="flex flex-wrap gap-2">
                          {categories.map((c) => (
                            <button key={c.id} type="button" onClick={() => toggleCategory('provider_category_ids', c.id)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                form.provider_category_ids.includes(c.id)
                                  ? 'bg-violet text-white border-violet'
                                  : 'bg-mist border-line text-muted'
                              }`}>{c.name}</button>
                          ))}
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                          <FieldLabel htmlFor="experience_years">Years of Experience</FieldLabel>
                          <input id="experience_years" type="number" min="0" max="60" value={form.experience_years}
                            onChange={(e) => update('experience_years', e.target.value)} className={inputClass('experience_years')} />
                        </div>
                        <div>
                          <FieldLabel htmlFor="service_radius_km">Service Area (km)</FieldLabel>
                          <input id="service_radius_km" type="number" min="1" value={form.service_radius_km}
                            onChange={(e) => update('service_radius_km', e.target.value)} className={inputClass('service_radius_km')} />
                        </div>
                        <div>
                          <FieldLabel htmlFor="visit_charge">Visit Charge (₹)</FieldLabel>
                          <input id="visit_charge" type="number" min="0" value={form.visit_charge}
                            onChange={(e) => update('visit_charge', e.target.value)} className={inputClass('visit_charge')} />
                        </div>
                      </div>
                      <div>
                        <FieldLabel>Preferred Working Days</FieldLabel>
                        <div className="flex flex-wrap gap-2">
                          {WORKING_DAYS.map(({ value, label }) => (
                            <button key={value} type="button" onClick={() => toggleDay(value)}
                              className={`w-10 h-10 rounded-lg text-xs font-medium border ${
                                form.working_days.includes(value) ? 'bg-lime text-white border-green' : 'bg-mist border-line'
                              }`}>{label}</button>
                          ))}
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <FieldLabel htmlFor="work_start">Working Hours From</FieldLabel>
                          <input id="work_start" type="time" value={form.work_start}
                            onChange={(e) => update('work_start', e.target.value)} className={inputClass('work_start')} />
                        </div>
                        <div>
                          <FieldLabel htmlFor="work_end">Working Hours To</FieldLabel>
                          <input id="work_end" type="time" value={form.work_end}
                            onChange={(e) => update('work_end', e.target.value)} className={inputClass('work_end')} />
                        </div>
                      </div>
                      <div>
                        <FieldLabel htmlFor="bio">Professional Bio</FieldLabel>
                        <textarea id="bio" rows={3} placeholder="Brief description of your experience and services"
                          value={form.bio} onChange={(e) => update('bio', e.target.value)} className={inputClass('bio')} />
                      </div>
                    </div>
                  </section>
                )}

                {form.role === 'THIRD_PARTY_PARTNER' && (
                  <section className="animate-in fade-in duration-200" aria-labelledby="partner-heading">
                    <h2 id="partner-heading" className="text-lg font-semibold text-midnight mb-4 pb-2 border-b border-line">
                      Partner Information
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <FieldLabel htmlFor="organization_name" required>Organization Name</FieldLabel>
                        <input id="organization_name" type="text" placeholder="Your company name"
                          value={form.organization_name} onChange={(e) => update('organization_name', e.target.value)}
                          onBlur={() => blur('organization_name')} className={inputClass('organization_name')} />
                        <FieldError message={touched.organization_name && errors.organization_name} />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <FieldLabel htmlFor="partner_type">Business Type</FieldLabel>
                          <select id="partner_type" value={form.partner_type} onChange={(e) => update('partner_type', e.target.value)}
                            className={inputClass('partner_type')}>
                            {PARTNER_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                          </select>
                        </div>
                        <div>
                          <FieldLabel htmlFor="contact_person">Contact Person</FieldLabel>
                          <input id="contact_person" type="text" placeholder="Primary contact name"
                            value={form.contact_person} onChange={(e) => update('contact_person', e.target.value)}
                            className={inputClass('contact_person')} />
                        </div>
                      </div>
                      <div>
                        <FieldLabel htmlFor="authorized_brands">Authorized Brands</FieldLabel>
                        <input id="authorized_brands" type="text" placeholder="Samsung, LG, Voltas (comma separated)"
                          value={form.authorized_brands} onChange={(e) => update('authorized_brands', e.target.value)}
                          className={inputClass('authorized_brands')} />
                      </div>
                      <div>
                        <FieldLabel>Service Categories</FieldLabel>
                        <div className="flex flex-wrap gap-2">
                          {categories.map((c) => (
                            <button key={c.id} type="button" onClick={() => toggleCategory('partner_category_ids', c.id)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                                form.partner_category_ids.includes(c.id)
                                  ? 'bg-violet text-white border-violet'
                                  : 'bg-mist border-line text-muted'
                              }`}>{c.name}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <FieldLabel htmlFor="business_address">Business Location</FieldLabel>
                        <input id="business_address" type="text" placeholder="Office / service center address"
                          value={form.business_address} onChange={(e) => update('business_address', e.target.value)}
                          className={inputClass('business_address')} />
                      </div>
                      <div>
                        <FieldLabel htmlFor="gst_number">GST / Business Registration</FieldLabel>
                        <input id="gst_number" type="text" placeholder="Optional — GSTIN or registration number"
                          value={form.gst_number} onChange={(e) => update('gst_number', e.target.value)}
                          className={inputClass('gst_number')} />
                      </div>
                    </div>
                  </section>
                )}

                {/* Account Information */}
                <section aria-labelledby="account-heading">
                  <h2 id="account-heading" className="text-lg font-semibold text-midnight mb-4 pb-2 border-b border-line">
                    Account Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <FieldLabel htmlFor="password" required>Password</FieldLabel>
                      <div className="relative">
                        <input id="password" type={showPassword ? 'text' : 'password'} placeholder="Create a strong password"
                          value={form.password} onChange={(e) => update('password', e.target.value)} onBlur={() => blur('password')}
                          className={`${inputClass('password')} pr-11`} aria-describedby="password-hint" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-midnight"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}>
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {form.password && (
                        <div id="password-hint" className="mt-2">
                          <div className="flex gap-1 mb-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength.score ? (
                                strength.level === 'Weak' ? 'bg-danger' : strength.level === 'Medium' ? 'bg-indigo' : 'bg-lime'
                              ) : 'bg-indigo/10'}`} />
                            ))}
                          </div>
                          <p className={`text-xs font-medium ${
                            strength.level === 'Weak' ? 'text-danger' : strength.level === 'Medium' ? 'text-aqua' : 'text-lime'
                          }`}>{strength.level || 'Enter password'}</p>
                          <ul className="text-xs text-muted mt-1 space-y-0.5">
                            <li className={form.password.length >= 8 ? 'text-lime' : ''}>Minimum 8 characters</li>
                            <li className={/[A-Z]/.test(form.password) ? 'text-lime' : ''}>One uppercase letter</li>
                            <li className={/[a-z]/.test(form.password) ? 'text-lime' : ''}>One lowercase letter</li>
                            <li className={/\d/.test(form.password) ? 'text-lime' : ''}>One number</li>
                            <li className={/[^A-Za-z0-9]/.test(form.password) ? 'text-lime' : ''}>One special character</li>
                          </ul>
                        </div>
                      )}
                      <FieldError message={touched.password && errors.password} />
                    </div>

                    <div>
                      <FieldLabel htmlFor="password_confirm" required>Confirm Password</FieldLabel>
                      <div className="relative">
                        <input id="password_confirm" type={showConfirm ? 'text' : 'password'} placeholder="Re-enter password"
                          value={form.password_confirm} onChange={(e) => update('password_confirm', e.target.value)}
                          onBlur={() => blur('password_confirm')} className={`${inputClass('password_confirm')} pr-11`} />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-midnight"
                          aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}>
                          {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {passwordsMatch && <FieldSuccess message="Passwords match" />}
                      {passwordsMismatch && <FieldError message="Passwords do not match" />}
                    </div>

                    <div>
                      <FieldLabel htmlFor="referral_code">Referral Code <span className="text-muted font-normal">(Optional)</span></FieldLabel>
                      <input id="referral_code" type="text" placeholder="Enter referral code if you have one"
                        value={form.referral_code} onChange={(e) => update('referral_code', e.target.value)}
                        className={inputClass('referral_code')} />
                    </div>
                  </div>
                </section>

                {/* Terms */}
                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.terms_accepted}
                      onChange={(e) => update('terms_accepted', e.target.checked)} onBlur={() => blur('terms_accepted')}
                      className="mt-1 w-4 h-4 rounded border-line text-aqua focus:ring-indigo" />
                    <span className="text-sm text-muted">
                      I agree to the{' '}
                      <Link to="/support" className="text-aqua font-medium hover:underline">Terms & Conditions</Link>
                      {' '}and{' '}
                      <Link to="/support" className="text-aqua font-medium hover:underline">Privacy Policy</Link>
                    </span>
                  </label>
                  <FieldError message={touched.terms_accepted && errors.terms_accepted} />
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading || success || !verificationToken}
                  className="w-full py-3.5 bg-violet text-white rounded-xl font-semibold text-base hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-violet/50 disabled:opacity-60 transition-all flex items-center justify-center gap-2">
                  {loading ? (
                    <><Loader2 size={20} className="animate-spin" /> Creating your account...</>
                  ) : success ? (
                    <><CheckCircle2 size={20} /> Account Created!</>
                  ) : (
                    'Create Account'
                  )}
                </button>

                <p className="text-center text-sm text-muted">
                  {t('haveAccount')}{' '}
                  <Link to="/login" className="text-aqua font-semibold hover:underline">{t('login')}</Link>
                </p>
              </form>
            </div>
          </div>

          {/* Info Panel — desktop right, mobile below */}
          <div className="lg:col-span-2 order-last lg:order-none">
            <RegistrationInfoPanel />
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
