import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
  getRefreshToken,
  persistTokens,
} from './authTokens';
import { createTokenRefresher } from './createTokenRefresher';

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  };
}

describe('persistTokens', () => {
  it('stores access and rotated refresh when both are present', () => {
    const storage = memoryStorage();
    persistTokens({ access: 'a1', refresh: 'r1' }, storage);
    expect(storage.getItem(ACCESS_TOKEN_KEY)).toBe('a1');
    expect(storage.getItem(REFRESH_TOKEN_KEY)).toBe('r1');
  });

  it('does not clear existing refresh when response omits refresh', () => {
    const storage = memoryStorage({ [REFRESH_TOKEN_KEY]: 'r-old' });
    persistTokens({ access: 'a2' }, storage);
    expect(storage.getItem(ACCESS_TOKEN_KEY)).toBe('a2');
    expect(storage.getItem(REFRESH_TOKEN_KEY)).toBe('r-old');
  });
});

describe('createTokenRefresher', () => {
  let storage;
  let axiosMock;
  let apiMock;

  beforeEach(() => {
    storage = memoryStorage({
      [ACCESS_TOKEN_KEY]: 'access-old',
      [REFRESH_TOKEN_KEY]: 'refresh-v1',
      [USER_KEY]: '{"id":1}',
    });
    axiosMock = { post: vi.fn() };
    apiMock = vi.fn(async (config) => ({ data: { ok: true }, config }));
  });

  it('persists rotated refresh and returns new access on success', async () => {
    axiosMock.post.mockResolvedValue({
      data: { access: 'access-v2', refresh: 'refresh-v2' },
    });
    const { refreshSession } = createTokenRefresher({
      axios: axiosMock,
      apiBase: '/api',
      storage,
    });

    const access = await refreshSession();
    expect(access).toBe('access-v2');
    expect(storage.getItem(ACCESS_TOKEN_KEY)).toBe('access-v2');
    expect(storage.getItem(REFRESH_TOKEN_KEY)).toBe('refresh-v2');
    expect(axiosMock.post).toHaveBeenCalledWith('/api/auth/refresh/', { refresh: 'refresh-v1' });
  });

  it('uses the newly persisted refresh on the next refresh call', async () => {
    axiosMock.post
      .mockResolvedValueOnce({ data: { access: 'a2', refresh: 'r2' } })
      .mockResolvedValueOnce({ data: { access: 'a3', refresh: 'r3' } });

    const { refreshSession } = createTokenRefresher({
      axios: axiosMock,
      apiBase: '/api',
      storage,
    });

    await refreshSession();
    expect(getRefreshToken(storage)).toBe('r2');

    await refreshSession();
    expect(axiosMock.post).toHaveBeenNthCalledWith(2, '/api/auth/refresh/', { refresh: 'r2' });
    expect(storage.getItem(REFRESH_TOKEN_KEY)).toBe('r3');
  });

  it('shares one in-flight refresh across concurrent callers', async () => {
    let resolvePost;
    axiosMock.post.mockReturnValue(
      new Promise((resolve) => {
        resolvePost = resolve;
      }),
    );
    const { refreshSession } = createTokenRefresher({
      axios: axiosMock,
      apiBase: '/api',
      storage,
    });

    const p1 = refreshSession();
    const p2 = refreshSession();
    expect(axiosMock.post).toHaveBeenCalledTimes(1);

    resolvePost({ data: { access: 'a-shared', refresh: 'r-shared' } });
    await expect(Promise.all([p1, p2])).resolves.toEqual(['a-shared', 'a-shared']);
    expect(axiosMock.post).toHaveBeenCalledTimes(1);
    expect(storage.getItem(REFRESH_TOKEN_KEY)).toBe('r-shared');
  });

  it('clears session when refresh token is invalid and does not retry forever', async () => {
    axiosMock.post.mockRejectedValue({ response: { status: 401 } });
    const { handleUnauthorizedError } = createTokenRefresher({
      axios: axiosMock,
      apiBase: '/api',
      storage,
    });

    const error = {
      response: { status: 401 },
      config: { url: '/auth/profile/', headers: {}, _retry: false },
    };

    await expect(handleUnauthorizedError(error, apiMock)).rejects.toBeTruthy();
    expect(storage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(storage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
    expect(storage.getItem(USER_KEY)).toBeNull();
    expect(apiMock).not.toHaveBeenCalled();

    // Second failure with _retry already set must not call refresh again
    axiosMock.post.mockClear();
    storage.setItem(REFRESH_TOKEN_KEY, 'stale');
    const retried = {
      response: { status: 401 },
      config: { url: '/auth/profile/', headers: {}, _retry: true },
    };
    await expect(handleUnauthorizedError(retried, apiMock)).rejects.toBeTruthy();
    expect(axiosMock.post).not.toHaveBeenCalled();
  });

  it('retries the original request once after a successful refresh', async () => {
    axiosMock.post.mockResolvedValue({
      data: { access: 'access-new', refresh: 'refresh-new' },
    });
    const { handleUnauthorizedError } = createTokenRefresher({
      axios: axiosMock,
      apiBase: '/api',
      storage,
    });

    const error = {
      response: { status: 401 },
      config: { url: '/auth/profile/', headers: {} },
    };

    const result = await handleUnauthorizedError(error, apiMock);
    expect(result.data.ok).toBe(true);
    expect(apiMock).toHaveBeenCalledTimes(1);
    expect(error.config._retry).toBe(true);
    expect(error.config.headers.Authorization).toBe('Bearer access-new');
  });

  it('clears session on refresh-endpoint 401 without looping', async () => {
    const { handleUnauthorizedError } = createTokenRefresher({
      axios: axiosMock,
      apiBase: '/api',
      storage,
    });
    const error = {
      response: { status: 401 },
      config: { url: '/auth/refresh/', headers: {} },
    };
    await expect(handleUnauthorizedError(error, apiMock)).rejects.toBe(error);
    expect(axiosMock.post).not.toHaveBeenCalled();
    expect(apiMock).not.toHaveBeenCalled();
    expect(storage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(storage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
  });
});
