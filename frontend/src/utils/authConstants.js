export const ROLE_PATHS = {
  CUSTOMER: '/customer',
  INDIVIDUAL_PROVIDER: '/provider',
  THIRD_PARTY_PARTNER: '/partner',
  SUPPORT_AGENT: '/support-desk',
  SENIOR_SUPPORT_AGENT: '/support-desk',
  ADMIN: '/admin',
};

export function parseLoginError(err, t) {
  if (!err?.response) {
    if (err?.code === 'ERR_NETWORK' || String(err?.message || '').includes('Network Error')) {
      return t('loginErrors.apiUnreachable');
    }
    return t('loginErrors.network');
  }
  const { status, data } = err.response;
  if (status === 429) return t('loginErrors.rateLimit');
  if (status >= 500) return t('loginErrors.server');
  const detail = data?.detail;
  if (typeof detail === 'string') {
    const lower = detail.toLowerCase();
    if (lower.includes('inactive') || lower.includes('disabled')) {
      return t('loginErrors.inactive');
    }
    if (lower.includes('verify')) {
      return t('loginErrors.unverified');
    }
    if (lower.includes('credentials') || lower.includes('password') || lower.includes('account')) {
      return t('loginErrors.invalid');
    }
  }
  if (data?.non_field_errors?.length) {
    const msg = String(data.non_field_errors[0]).toLowerCase();
    if (msg.includes('inactive')) return t('loginErrors.inactive');
    return t('loginErrors.invalid');
  }
  return t('loginErrors.invalid');
}

export function validateLoginForm(identifier, password, t) {
  const errors = {};
  if (!identifier?.trim()) errors.identifier = t('loginErrors.identifierRequired');
  if (!password) errors.password = t('loginErrors.passwordRequired');
  return errors;
}
