import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import type { ProductFull } from '@/types'
import { formatPrice, cn } from '@/lib/utils'
import { Star } from 'lucide-react'

interface Props {
  categorySlug: string
  excludeId:    string
}

async function fetchRelated(categorySlug: string, excludeId: string): Promise<ProductFull[]> {
  const { data: cat } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .maybeSingle()

  if (!cat) return []

  const { data, error } = await supabase
    .from('products')
    .select(`*, product_images (*), product_colors (*), product_sizes (*), product_tags (*), product_variants (*), categories (*)`)
    .eq('is_published', true)
    .eq('category_id', cat.id)
    .neq('id', excludeId)
    .order('stock_status', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(4)

  if (error || !data) return []

  return (data || []).map((p: any) => ({
    ...p,
    images:   [...((p.product_images as { display_order: number }[]) ?? [])].sort((a, b) => a.display_order - b.display_order),
    colors:   p.product_colors ?? [],
    sizes:    ((p.product_sizes as { size: number; is_available: boolean }[]) ?? []).sort((a, b) => a.size - b.size),
    tags:     ((p.product_tags as { tag: string }[]) ?? []).map((t) => t.tag),
    category: Array.isArray(p.categories) ? (p.categories[0] ?? null) : (p.categories ?? null),
    variants: p.product_variants ?? [],
  })) as ProductFull[]
}

export default async function RelatedProducts({ categorySlug, excludeId }: Props) {
  const products = await fetchRelated(categorySlug, excludeId)
  if (products.length === 0) return null

  return (
    <div
      dir="rtl"
      className="flex gap-6 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0"
    >
      {products.map((product) => {
        const imageUrl = product.images[0]?.url ?? ''
        const price = product.discount_price_usd ?? product.price_usd

        return (
          <Link
            key={product.id}
            href={`/product/${product.slug}`}
            className={cn(
              "min-w-[240px] sm:min-w-[280px] snap-start shrink-0 rounded-2xl overflow-hidden group transition-all duration-300",
              product.stock_status === 'out_of_stock'
                ? 'bg-[#F9F9F9] opacity-80 hover:opacity-100 grayscale-[0.2] border border-transparent hover:border-[#E8E3DB]' 
                : 'bg-white shadow-sm hover:shadow-md'
            )}
          >
            <div className="aspect-[3/4] overflow-hidden relative bg-[#F5F1EB]">
              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt={product.name}
                  fill
                  sizes="280px"
                  className={cn(
                    "object-cover transition-transform duration-500",
                    product.stock_status !== 'out_of_stock' && "group-hover:scale-105",
                    product.stock_status === 'out_of_stock' && "opacity-90"
                  )}
                />
              )}
              {/* Out of Stock subtle badge */}
              {product.stock_status === 'out_of_stock' && (
                <div className="absolute top-3 right-3 z-0">
                  <span className="text-[10px] font-arabic font-semibold px-2.5 py-1 rounded-full bg-[#E8E4DE] text-[#6B6560] shadow-sm">
                    نفدت الكمية
                  </span>
                </div>
              )}
              {/* Low Stock Badge */}
              {product.stock_status === 'low_stock' && (
                <div className="absolute top-3 right-3 z-0">
                   <span className="text-[10px] font-arabic font-bold px-2 py-1 rounded-full bg-[#BA1A1A]/10 text-[#BA1A1A] border border-[#BA1A1A]/20 shadow-sm">
                     كمية محدودة
                   </span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-arabic font-bold text-base text-[#1A1A1A] mb-2 line-clamp-2 flex items-start gap-1">
                {product.is_featured && (
                  <Star size={14} className="fill-[#C59B27] text-[#C59B27] shrink-0 mt-0.5" />
                )}
                <span>{product.name}</span>
              </h3>
              <div className="flex items-center justify-between">
                <span className={cn(
                  "font-arabic font-bold tabular-nums",
                  product.stock_status === 'out_of_stock' ? 'text-[#9E9890]' : 'text-[#785600]'
                )}>
                  {formatPrice(price, 'USD')}
                </span>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
