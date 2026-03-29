import { v2 as cloudinary } from 'cloudinary'

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

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}

export async function deleteImages(publicIds: string[]): Promise<void> {
  if (publicIds.length === 0) return
  await cloudinary.api.delete_resources(publicIds)
}

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
