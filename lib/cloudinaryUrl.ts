/**
 * Pure (no SDK) helpers for Cloudinary URLs.
 * Safe to import from client components — does not pull in the cloudinary Node SDK.
 */

// ─── Emergency media fallback ────────────────────────────────────────────────
// Every Cloudinary asset is mirrored into the public Supabase Storage bucket
// "media" by scripts/backup-media-to-supabase.mjs. Setting the env var
// NEXT_PUBLIC_MEDIA_FALLBACK=supabase (and redeploying) makes the whole site read
// media from that mirror instead of Cloudinary. See docs/media-fallback.md.
export const MEDIA_FALLBACK = process.env.NEXT_PUBLIC_MEDIA_FALLBACK === 'supabase'
const MIRROR_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media`

/** `<public_id>.<ext>` of a Cloudinary delivery URL (transformations and version stripped). */
function cloudinaryAssetPath(url: string): string | null {
  const m = url.match(/res\.cloudinary\.com\/[^/]+\/(?:image|video)\/upload\/(.+)$/)
  if (!m) return null
  const parts = m[1].split(/[?#]/)[0].split('/')
  const v = parts.findIndex(p => /^v\d+$/.test(p))
  if (v !== -1) return parts.slice(v + 1).join('/')
  // No version segment: drop leading transformation segments like "f_auto,q_auto"
  while (parts.length > 1 && /^[a-z]{1,3}_[^/]*$/.test(parts[0])) parts.shift()
  return parts.join('/')
}

/** Cloudinary image URL → its copy in the Supabase mirror (other URLs unchanged). */
export function mirrorImageUrl(url: string): string {
  if (!url.includes('res.cloudinary.com/') || !url.includes('/image/upload/')) return url
  const path = cloudinaryAssetPath(url)
  return path ? `${MIRROR_BASE}/image/${path}` : url
}

/** Use for any stored media URL rendered outside next/image (plain <img>, etc.). */
export function mediaUrl(url: string | null | undefined): string {
  if (!url) return ''
  return MEDIA_FALLBACK ? mirrorImageUrl(url) : url
}

/**
 * Inject `f_auto,q_auto` into an already-uploaded Cloudinary delivery URL.
 * Safe to call on any string: non-Cloudinary URLs are returned unchanged,
 * and already-transformed URLs are not double-transformed.
 */
export function optimizeCloudinaryUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (!url.includes('res.cloudinary.com')) return url
  if (MEDIA_FALLBACK) return mirrorImageUrl(url)
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
// visitor never waits. 480px H.264 MP4 with a capped bitrate, cut at 15s, keeps
// each view around 1–1.5MB (the earlier 720px/q_auto version was ~4.3MB).
export const PRODUCT_VIDEO_MAX_SECONDS = 15
const VIDEO_TRANSFORM  = `vc_h264,q_auto:eco,br_600k,w_480,c_limit,du_${PRODUCT_VIDEO_MAX_SECONDS}`
const POSTER_TRANSFORM = 'so_0,w_720,c_limit,q_auto'
export const PRODUCT_VIDEO_EAGER = `${VIDEO_TRANSFORM}/mp4|${POSTER_TRANSFORM}/jpg`

function withVideoTransform(url: string, transform: string, ext: string): string {
  const uploadMarker = '/video/upload/'
  const idx = url.indexOf(uploadMarker)
  if (!url.includes('res.cloudinary.com') || idx === -1) return url
  if (MEDIA_FALLBACK) {
    // The mirror holds the delivery versions: media/video/<public_id>.mp4 / .jpg
    const path = cloudinaryAssetPath(url)
    if (path) return `${MIRROR_BASE}/video/${path.replace(/\.[a-z0-9]+$/i, '')}.${ext}`
  }
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
