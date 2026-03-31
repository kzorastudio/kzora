import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase'
import AdminHeader from '@/components/admin/AdminHeader'
import type { ProductFull, Category } from '@/types'
import EditProductClient from './EditProductClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface EditProductPageProps {
  params: { id: string }
}

async function getProduct(id: string): Promise<ProductFull | null> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(
      `
      *,
      category:categories(*),
      images:product_images(*),
      colors:product_colors(*),
      sizes:product_sizes(size, is_available),
      tags:product_tags(tag)
      `
    )
    .eq('id', id)
    .single()

  if (error || !data) return null

  return {
    ...data,
    sizes: (data.sizes as { size: number; is_available: boolean }[]).map((s) => ({
      size: s.size,
      is_available: s.is_available ?? true,
    })),
    tags: (data.tags as { tag: string }[]).map((t) => t.tag) as ProductFull['tags'],
  } as ProductFull
}

async function getCategories(): Promise<Category[]> {
  const { data } = await supabaseAdmin
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
  return (data as Category[]) ?? []
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const [product, categories] = await Promise.all([
    getProduct(params.id),
    getCategories(),
  ])

  if (!product) notFound()

  return (
    <div className="flex flex-col min-h-screen" dir="rtl">
      <AdminHeader />

      <div className="flex-1 p-6 flex flex-col gap-5 max-w-4xl w-full mx-auto">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors"
            title="رجوع"
          >
            <ArrowRight size={18} />
          </Link>
          <div>
            <p className="text-sm font-arabic text-secondary mt-0.5 font-medium truncate max-w-xs">
              {product.name}
            </p>
          </div>
        </div>

        <EditProductClient product={product} categories={categories} />
      </div>
    </div>
  )
}
