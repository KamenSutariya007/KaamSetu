/** localStorage keys for JWT session (login / refresh / logout). */

export const ACCESS_TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const USER_KEY = 'user';

export function getAccessToken(storage = localStorage) {
  return storage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(storage = localStorage) {
  return storage.getItem(REFRESH_TOKEN_KEY);
}

/** Persist access; replace refresh only when the server returns a new one (rotation). */
export function persistTokens({ access, refresh } = {}, storage = localStorage) {
  if (access) storage.setItem(ACCESS_TOKEN_KEY, access);
  if (refresh) storage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function clearAuthSession(storage = localStorage) {
  storage.removeItem(ACCESS_TOKEN_KEY);
  storage.removeItem(REFRESH_TOKEN_KEY);
  storage.removeItem(USER_KEY);
}
