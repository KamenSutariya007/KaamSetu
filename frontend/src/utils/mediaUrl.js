/**
 * Normalize media URLs from the API for img/src use.
 * - Absolute http(s) URLs are returned unchanged (Render host).
 * - Relative paths are rooted at /media/ for Vite/Vercel same-origin proxy.
 */
export function resolveMediaUrl(url) {
  if (!url) return '';
  const value = String(url).trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/media/')) return value;
  if (value.startsWith('media/')) return `/${value}`;
  if (value.startsWith('/')) return value;
  return `/media/${value.replace(/^\/+/, '')}`;
}
