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

// ─── Product videos ──────────────────────────────────────────────────────────
// Videos are uploaded untouched and delivered through these transformations,
// which are also pre-generated at upload time (PRODUCT_VIDEO_EAGER) so the first
// visitor never waits. 720px H.264 MP4 capped at 15s keeps each view ~1–1.5MB.
export const PRODUCT_VIDEO_MAX_SECONDS = 15
const VIDEO_TRANSFORM  = `vc_h264,q_auto,w_720,c_limit,du_${PRODUCT_VIDEO_MAX_SECONDS}`
const POSTER_TRANSFORM = 'so_0,w_720,c_limit,q_auto'
export const PRODUCT_VIDEO_EAGER = `${VIDEO_TRANSFORM}/mp4|${POSTER_TRANSFORM}/jpg`

function withVideoTransform(url: string, transform: string, ext: string): string {
  const uploadMarker = '/video/upload/'
  const idx = url.indexOf(uploadMarker)
  if (!url.includes('res.cloudinary.com') || idx === -1) return url
  const after = url.slice(idx + uploadMarker.length).replace(/\.[a-z0-9]+$/i, '')
  return url.slice(0, idx + uploadMarker.length) + transform + '/' + after + '.' + ext
}

/** Playable, compressed MP4 for a product video uploaded to Cloudinary. */
export function productVideoUrl(url: string): string {
  return withVideoTransform(url, VIDEO_TRANSFORM, 'mp4')
}

/** First-frame JPG of a product video, used as the thumbnail and poster. */
export function productVideoPosterUrl(url: string): string {
  return withVideoTransform(url, POSTER_TRANSFORM, 'jpg')
}

/** 7 → "0:07" */
export function formatVideoDuration(seconds: number | null | undefined): string {
  const s = Math.min(Math.round(seconds ?? 0), PRODUCT_VIDEO_MAX_SECONDS)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
