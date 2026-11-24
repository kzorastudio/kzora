/**
 * Media storage in the public Supabase Storage bucket "media" (server only).
 *
 * Since Nov 2026 every new upload goes here instead of Cloudinary. Files use the same
 * layout as the Cloudinary mirror made by scripts/backup-media-to-supabase.mjs:
 *   images → media/image/<folder>/<id>.<ext>
 *   videos → media/video/<folder>/<id>.mp4  + its poster media/video/<folder>/<id>.jpg
 *
 * public_id values stored in the database for these files start with "sb:" followed by
 * the object path (e.g. "sb:image/products/ab12cd.webp"), so delete code can tell them
 * apart from old Cloudinary public_ids.
 */
import { randomBytes } from 'node:crypto'
import sharp from 'sharp'
import { supabaseAdmin } from '@/lib/supabase'

export const MEDIA_BUCKET = 'media'
export const SB_PREFIX = 'sb:'

export function publicMediaUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`
}

function newId(): string {
  return randomBytes(10).toString('hex')
}

function safeFolder(folder: string): string {
  return folder.replace(/[^a-zA-Z0-9/_-]/g, '').replace(/^\/+|\/+$/g, '') || 'kzora'
}

/**
 * Resizes like the old Cloudinary upload preset (fit inside 1200×1500, never enlarged),
 * re-encodes to WebP and stores it. GIFs are kept as-is so animation survives.
 */
export async function uploadImageToStorage(
  input: Buffer,
  folder: string,
  mime: string
): Promise<{ url: string; public_id: string }> {
  let body: Buffer = input
  let ext = 'webp'
  let contentType = 'image/webp'
  if (mime === 'image/gif') {
    ext = 'gif'
    contentType = 'image/gif'
  } else {
    body = await sharp(input)
      .rotate() // respect phone EXIF orientation
      .resize({ width: 1200, height: 1500, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer()
  }

  const path = `image/${safeFolder(folder)}/${newId()}.${ext}`
  const { error } = await supabaseAdmin.storage.from(MEDIA_BUCKET).upload(path, body, {
    contentType,
    cacheControl: '31536000',
    upsert: false,
  })
  if (error) throw new Error(`Supabase upload failed: ${error.message}`)
  return { url: publicMediaUrl(path), public_id: SB_PREFIX + path }
}

/** Signed upload slots so the browser can send a video + its poster straight to storage. */
export async function createVideoUploadSlots(folder = 'products/videos') {
  const base = `video/${safeFolder(folder)}/${newId()}`
  const bucket = supabaseAdmin.storage.from(MEDIA_BUCKET)
  const [video, poster] = await Promise.all([
    bucket.createSignedUploadUrl(`${base}.mp4`),
    bucket.createSignedUploadUrl(`${base}.jpg`),
  ])
  if (video.error || poster.error) {
    throw new Error(video.error?.message || poster.error?.message || 'signed url failed')
  }
  return {
    video_upload_url: video.data.signedUrl,
    poster_upload_url: poster.data.signedUrl,
    url: publicMediaUrl(`${base}.mp4`),
    public_id: `${SB_PREFIX}${base}.mp4`,
  }
}

/** Removes "sb:" files from storage (a video's poster goes with it). Other ids are ignored. */
export async function deleteStorageMedia(publicIds: string[]): Promise<void> {
  const paths = publicIds
    .filter(id => id?.startsWith(SB_PREFIX))
    .flatMap(id => {
      const p = id.slice(SB_PREFIX.length)
      return p.startsWith('video/') && p.endsWith('.mp4') ? [p, p.replace(/\.mp4$/, '.jpg')] : [p]
    })
  if (paths.length === 0) return
  const { error } = await supabaseAdmin.storage.from(MEDIA_BUCKET).remove(paths)
  if (error) throw new Error(`Supabase delete failed: ${error.message}`)
}
