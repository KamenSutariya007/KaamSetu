import { describe, expect, it } from 'vitest';
import { resolveMediaUrl } from './mediaUrl';

describe('resolveMediaUrl', () => {
  it('returns absolute URLs unchanged', () => {
    const url = 'https://kaamsetu-api-vtac.onrender.com/media/profiles/a.jpg';
    expect(resolveMediaUrl(url)).toBe(url);
  });

  it('roots relative media paths', () => {
    expect(resolveMediaUrl('media/profiles/a.jpg')).toBe('/media/profiles/a.jpg');
  });

  it('keeps leading-slash media paths', () => {
    expect(resolveMediaUrl('/media/profiles/a.jpg')).toBe('/media/profiles/a.jpg');
  });

  it('handles bare filenames under media', () => {
    expect(resolveMediaUrl('profiles/a.jpg')).toBe('/media/profiles/a.jpg');
  });

  it('returns empty for falsy input', () => {
    expect(resolveMediaUrl('')).toBe('');
    expect(resolveMediaUrl(null)).toBe('');
  });
});
