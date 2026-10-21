/**
 * Category image (category.image_url) → a 5:4 version laid out for phones / narrow cards.
 * Keyed by the wide URL so the override stops applying once the image is changed in admin.
 */
const MOBILE_CATEGORY_IMAGES: Record<string, string> = {
  'https://res.cloudinary.com/dqo6bkp4c/image/upload/v1792620347/categories/tq0t9ft4v997sxizewtu.jpg':
    'https://res.cloudinary.com/dqo6bkp4c/image/upload/v1792620560/categories/fou84wrekend7r2kcnzx.jpg',
  'https://res.cloudinary.com/dqo6bkp4c/image/upload/v1792620349/categories/thshdr6bv55bohqsb0kw.jpg':
    'https://res.cloudinary.com/dqo6bkp4c/image/upload/v1792620563/categories/ncgqoxdkmrlksnzi7yji.jpg',
}

export function getMobileCategoryImage(imageUrl: string | null | undefined): string | undefined {
  return imageUrl ? MOBILE_CATEGORY_IMAGES[imageUrl] : undefined
}
