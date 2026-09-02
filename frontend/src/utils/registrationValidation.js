export const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka',
  'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

export const AHMEDABAD_CITIES = [
  'Ahmedabad', 'Satellite', 'Bopal', 'Maninagar', 'Navrangpura',
  'Vastrapur', 'Thaltej', 'Ghatlodiya', 'Naranpura', 'Paldi',
  'Bodakdev', 'SG Highway', 'Naroda', 'Vastral', 'Nikol',
];

export const WORKING_DAYS = [
  { value: 0, label: 'Mon' },
  { value: 1, label: 'Tue' },
  { value: 2, label: 'Wed' },
  { value: 3, label: 'Thu' },
  { value: 4, label: 'Fri' },
  { value: 5, label: 'Sat' },
  { value: 6, label: 'Sun' },
];

export const PARTNER_TYPES = [
  { value: 'repair_company', label: 'Local Repair Company' },
  { value: 'service_center', label: 'Authorized Service Center' },
  { value: 'home_maintenance', label: 'Home Maintenance Company' },
  { value: 'warranty', label: 'Warranty Center' },
  { value: 'spare_parts', label: 'Spare Parts Seller' },
  { value: 'emergency', label: 'Emergency Service' },
];

export const ROLE_PATHS = {
  CUSTOMER: '/customer',
  INDIVIDUAL_PROVIDER: '/provider',
  THIRD_PARTY_PARTNER: '/partner',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getPasswordStrength(password) {
  if (!password) return { level: '', score: 0 };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return { level: 'Weak', score };
  if (score <= 4) return { level: 'Medium', score };
  return { level: 'Strong', score };
}

export function validateField(name, value, form = {}) {
  switch (name) {
    case 'first_name':
      if (!value?.trim()) return 'Please enter your first name.';
      return '';
    case 'last_name':
      if (!value?.trim()) return 'Please enter your last name.';
      return '';
    case 'phone': {
      const digits = (value || '').replace(/\D/g, '');
      if (!digits) return 'Please enter your phone number.';
      if (digits.length !== 10) return 'Phone number must contain 10 digits.';
      return '';
    }
    case 'email':
      if (!value?.trim()) return 'Please enter your email address.';
      if (!EMAIL_RE.test(value)) return 'Please enter a valid email address.';
      return '';
    case 'date_of_birth':
      if (value && new Date(value) > new Date()) return 'Date of birth cannot be in the future.';
      return '';
    case 'city':
      if (!value?.trim()) return 'Please enter your city.';
      return '';
    case 'state':
      if (!value?.trim()) return 'Please select your state.';
      return '';
    case 'pin_code': {
      const digits = (value || '').replace(/\D/g, '');
      if (!digits) return 'Please enter your PIN code.';
      if (digits.length !== 6) return 'PIN code must contain 6 digits.';
      return '';
    }
    case 'password': {
      if (!value) return 'Please enter a password.';
      const s = getPasswordStrength(value);
      if (s.score < 5) return 'Password does not meet all requirements.';
      return '';
    }
    case 'password_confirm':
      if (!value) return 'Please confirm your password.';
      if (value !== form.password) return 'Passwords do not match.';
      return '';
    case 'terms_accepted':
      if (!value) return 'Please accept Terms & Conditions.';
      return '';
    case 'organization_name':
      if (form.role === 'THIRD_PARTY_PARTNER' && !value?.trim()) return 'Organization name is required.';
      return '';
    default:
      return '';
  }
}

export function validateForm(form) {
  const fields = [
    'first_name', 'last_name', 'phone', 'email', 'date_of_birth',
    'city', 'state', 'pin_code', 'password', 'password_confirm', 'terms_accepted',
  ];
  if (form.role === 'THIRD_PARTY_PARTNER') fields.push('organization_name');
  const errors = {};
  fields.forEach((f) => {
    const err = validateField(f, form[f], form);
    if (err) errors[f] = err;
  });
  return errors;
}

export function buildRegistrationPayload(form) {
  const payload = {
    email: form.email.trim().toLowerCase(),
    password: form.password,
    password_confirm: form.password_confirm,
    verification_token: form.verification_token || '',
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    phone: form.phone.replace(/\D/g, ''),
    role: form.role,
    language: form.language || 'en',
    address: form.address.trim(),
    city: form.city,
    state: form.state,
    pin_code: form.pin_code.replace(/\D/g, ''),
    date_of_birth: form.date_of_birth || null,
    gender: form.gender || '',
    referral_code: form.referral_code.trim(),
    terms_accepted: form.terms_accepted,
  };
  const area = (form.area || '').trim();
  if (area) {
    const base = payload.address;
    if (!base) payload.address = area;
    else if (!base.toLowerCase().includes(area.toLowerCase())) payload.address = `${base}, ${area}`;
  }
  if (form.role === 'INDIVIDUAL_PROVIDER') {
    payload.provider_profile = {
      category_ids: form.provider_category_ids.map(Number),
      experience_years: Number(form.experience_years) || 0,
      service_radius_km: form.service_radius_km || '10',
      visit_charge: form.visit_charge || '0',
      bio: form.bio.trim(),
      working_days: form.working_days,
      work_start: form.work_start,
      work_end: form.work_end,
    };
  }
  if (form.role === 'THIRD_PARTY_PARTNER') {
    payload.partner_profile = {
      organization_name: form.organization_name.trim(),
      partner_type: form.partner_type,
      authorized_brands: form.authorized_brands.split(',').map((b) => b.trim()).filter(Boolean),
      category_ids: form.partner_category_ids.map(Number),
      business_address: form.business_address.trim() || form.address.trim(),
      gst_number: form.gst_number.trim(),
      contact_person: form.contact_person.trim() || `${form.first_name} ${form.last_name}`.trim(),
    };
  }
  return payload;
}

export function parseApiErrors(err) {
  if (!err.response) {
    const offline = err.code === 'ERR_NETWORK' || err.message === 'Network Error';
    return {
      _form: offline
        ? 'Cannot connect to server. Start backend: cd backend && .\\runserver.bat'
        : (err.message || 'Registration failed. Please try again.'),
    };
  }
  const data = err.response.data;
  if (!data) {
    return { _form: `Registration failed (${err.response.status}). Please try again.` };
  }
  if (typeof data.detail === 'string') return { _form: data.detail };
  if (data.code === 'email_not_verified') {
    return { _form: data.detail || 'Please verify your email before continuing.', email: data.detail };
  }
  const errors = {};
  Object.entries(data).forEach(([key, val]) => {
    if (key === 'code') return;
    const msg = Array.isArray(val) ? val[0] : val;
    if (typeof msg === 'string') errors[key] = msg;
  });
  if (!errors._form) {
    errors._form = errors.email || errors.phone || errors.id_token
      || errors.detail
      || `Registration failed (${err.response.status}). Please check your details.`;
  }
  return errors;
}
