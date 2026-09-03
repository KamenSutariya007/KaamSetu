import {
  clearAuthSession,
  getRefreshToken,
  persistTokens,
} from './authTokens';

/**
 * Single-flight refresh: concurrent 401s share one /auth/refresh/ call
 * and all waiters receive the same new access token.
 */
export function createTokenRefresher({
  axios,
  apiBase,
  storage = typeof localStorage !== 'undefined' ? localStorage : undefined,
}) {
  let inFlight = null;

  async function refreshSession() {
    if (inFlight) return inFlight;

    inFlight = (async () => {
      const refresh = getRefreshToken(storage);
      if (!refresh) {
        throw new Error('No refresh token');
      }
      const { data } = await axios.post(`${apiBase}/auth/refresh/`, { refresh });
      if (!data?.access) {
        throw new Error('Refresh response missing access token');
      }
      // ROTATE_REFRESH_TOKENS=True → SimpleJWT returns a new refresh; must persist it.
      persistTokens({ access: data.access, refresh: data.refresh }, storage);
      return data.access;
    })();

    try {
      return await inFlight;
    } finally {
      inFlight = null;
    }
  }

  function isRefreshRequest(config) {
    const url = `${config?.baseURL || ''}${config?.url || ''}`;
    return url.includes('/auth/refresh/');
  }

  async function handleUnauthorizedError(error, api) {
    const original = error.config;
    if (!original || error.response?.status !== 401) {
      return Promise.reject(error);
    }
    // Refresh endpoint 401 → clear session; never retry refresh via this path.
    if (isRefreshRequest(original)) {
      clearAuthSession(storage);
      return Promise.reject(error);
    }
    if (original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    const refresh = getRefreshToken(storage);
    if (!refresh) {
      clearAuthSession(storage);
      return Promise.reject(error);
    }

    try {
      const access = await refreshSession();
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${access}`;
      return api(original);
    } catch (refreshError) {
      clearAuthSession(storage);
      return Promise.reject(refreshError);
    }
  }

  return { refreshSession, handleUnauthorizedError, isRefreshRequest };
}
