import { mediaUrl } from './cloudinaryUrl'

const MEDIA = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/image`

/**
 * Category image (category.image_url) → a 5:4 version laid out for phones / narrow cards.
 * Keyed by the file name of the wide image so the override stops applying once the image
 * is changed in admin. Matches both the Supabase URL and the old Cloudinary URL of a file.
 */
const MOBILE_CATEGORY_IMAGES: Record<string, string> = {
  'categories/tq0t9ft4v997sxizewtu.jpg': `${MEDIA}/categories/fou84wrekend7r2kcnzx.jpg`,
  'categories/thshdr6bv55bohqsb0kw.jpg': `${MEDIA}/categories/ncgqoxdkmrlksnzi7yji.jpg`,
  'categories/wwonvyqkcn8s7zzrr0dn.jpg': `${MEDIA}/categories/w4o5emr8sqkvkfysc098.jpg`,
}

export function getMobileCategoryImage(imageUrl: string | null | undefined): string | undefined {
  if (!imageUrl) return undefined
  const key = mediaUrl(imageUrl).match(/(categories\/[^/?#]+)$/)?.[1]
  return key ? MOBILE_CATEGORY_IMAGES[key] : undefined
}
