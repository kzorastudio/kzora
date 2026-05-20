import type { ProductColor, ProductFull } from '@/types'

export interface ProductDisplayItem {
  key: string
  product: ProductFull
  forcedColor: ProductColor | null
  forcedSize: number | null
}

/**
 * When a size filter is active, expand each product into one display item per
 * matching color (color whose variant has stock > 0 at one of the requested sizes).
 * Products without color variants — or whose colors don't match — fall back to a
 * single display item with no forced color.
 */
export function expandProductsBySize(
  products: ProductFull[],
  sizes: number[]
): ProductDisplayItem[] {
  if (!sizes || sizes.length === 0) {
    return products.map(p => ({ key: p.id, product: p, forcedColor: null, forcedSize: null }))
  }

  return products.flatMap((p): ProductDisplayItem[] => {
    const colors = p.colors ?? []
    const variants = p.variants ?? []

    // For a size-only product (no variants OR no colors), just pick the first selected size that's listed on the product.
    const firstListedSize = (p.sizes ?? [])
      .map(s => s.size)
      .find(sz => sizes.includes(sz)) ?? sizes[0] ?? null

    if (colors.length === 0) {
      return [{ key: p.id, product: p, forcedColor: null, forcedSize: firstListedSize }]
    }

    type ColorMatch = { color: ProductColor; matchSize: number | null }
    const matchingColors: ColorMatch[] = colors
      .map((c): ColorMatch | null => {
        const colorVariants = variants.filter(v => v.color === c.name_ar)
        if (colorVariants.length === 0) {
          return { color: c, matchSize: firstListedSize }
        }
        const match = colorVariants.find(v => sizes.includes(v.size) && (v.quantity ?? 0) > 0)
        return match ? { color: c, matchSize: match.size } : null
      })
      .filter((x): x is ColorMatch => x !== null)

    if (matchingColors.length === 0) {
      return [{ key: p.id, product: p, forcedColor: null, forcedSize: firstListedSize }]
    }

    return matchingColors.map(({ color, matchSize }) => ({
      key: `${p.id}-${color.id}`,
      product: p,
      forcedColor: color,
      forcedSize: matchSize,
    }))
  })
}
