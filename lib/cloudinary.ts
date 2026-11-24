import { v2 as cloudinary } from 'cloudinary'
import { SB_PREFIX, deleteStorageMedia } from './mediaStorage'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})

export { cloudinary }

export async function uploadImage(
  file: string | Buffer,
  folder: string = 'kzora'
): Promise<{ url: string; public_id: string }> {
  const result = await cloudinary.uploader.upload(
    typeof file === 'string' ? file : `data:image/jpeg;base64,${file.toString('base64')}`,
    {
      folder,
      transformation: [
        { width: 1200, height: 1500, crop: 'limit', quality: 'auto:best', fetch_format: 'auto' },
      ],
    }
  )
  return { url: result.secure_url, public_id: result.public_id }
}

// Deletes accept both kinds of public_id: "sb:…" files in Supabase Storage (all uploads since
// Nov 2026, see lib/mediaStorage.ts) and older Cloudinary ids. Cloudinary failures are only
// logged — the account may be suspended, and a failed cleanup must never block a save.
async function destroyCloudinary(fn: () => Promise<unknown>, what: string) {
  try {
    await fn()
  } catch (e) {
    console.error(`Cloudinary delete skipped (${what}):`, e)
  }
}

export async function deleteImage(publicId: string): Promise<void> {
  if (publicId.startsWith(SB_PREFIX)) return deleteStorageMedia([publicId])
  await destroyCloudinary(() => cloudinary.uploader.destroy(publicId), publicId)
}

export async function deleteImages(publicIds: string[]): Promise<void> {
  if (publicIds.length === 0) return
  const legacy = publicIds.filter(id => !id.startsWith(SB_PREFIX))
  await deleteStorageMedia(publicIds)
  if (legacy.length) await destroyCloudinary(() => cloudinary.api.delete_resources(legacy), legacy.join(','))
}

export async function deleteVideo(publicId: string): Promise<void> {
  if (publicId.startsWith(SB_PREFIX)) return deleteStorageMedia([publicId])
  await destroyCloudinary(
    () => cloudinary.uploader.destroy(publicId, { resource_type: 'video', invalidate: true }),
    publicId
  )
}

// Re-export the pure URL helper from its SDK-free module so server-side callers can keep
// importing it from '@/lib/cloudinary'. Client components should import from '@/lib/cloudinaryUrl' directly.
export { optimizeCloudinaryUrl } from './cloudinaryUrl'

export function getOptimizedUrl(publicId: string, options: {
  width?: number
  height?: number
  quality?: string
  format?: string
} = {}): string {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      {
        width:  options.width   || 800,
        height: options.height  || 1000,
        crop:   'fill',
        gravity: 'center',
        quality: options.quality || 'auto:good',
        fetch_format: options.format || 'auto',
      },
    ],
  })
}
