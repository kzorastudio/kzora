/**
 * Pure (no SDK) helpers for Cloudinary URLs.
 * Safe to import from client components — does not pull in the cloudinary Node SDK.
 */

/**
 * Inject `f_auto,q_auto` into an already-uploaded Cloudinary delivery URL.
 * Safe to call on any string: non-Cloudinary URLs are returned unchanged,
 * and already-transformed URLs are not double-transformed.
 */
export function optimizeCloudinaryUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (!url.includes('res.cloudinary.com')) return url
  const uploadMarker = '/upload/'
  const idx = url.indexOf(uploadMarker)
  if (idx === -1) return url
  const after = url.slice(idx + uploadMarker.length)
  // Already has f_/q_ transformation — leave alone
  if (/^(f_|q_)/.test(after) || after.startsWith('f_auto') || after.startsWith('q_auto')) return url
  return url.slice(0, idx + uploadMarker.length) + 'f_auto,q_auto/' + after
}
