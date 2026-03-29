import { supabaseAdmin } from '@/lib/supabase'
import AdminHeader from '@/components/admin/AdminHeader'
import type { Category } from '@/types'
import CategoriesClient from './CategoriesClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0
async function getCategoriesWithCounts() {
  // Fetch categories
  const { data: categories } = await supabaseAdmin
    .from('categories')
    .select('*')
    .order('created_at', { ascending: true })

  if (!categories || categories.length === 0) return []

  // Fetch product counts per category
  const { data: counts } = await supabaseAdmin
    .from('products')
    .select('category_id')
    .in('category_id', (categories as Category[]).map((c) => c.id))

  const countMap: Record<string, number> = {}
  if (counts) {
    for (const row of counts as { category_id: string }[]) {
      if (row.category_id) {
        countMap[row.category_id] = (countMap[row.category_id] ?? 0) + 1
      }
    }
  }

  return (categories as Category[]).map((cat) => ({
    ...cat,
    products_count: countMap[cat.id] ?? 0,
  }))
}

export default async function CategoriesPage() {
  const categories = await getCategoriesWithCounts()

  return (
    <div className="flex flex-col min-h-screen" dir="rtl">
      <AdminHeader />
      <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        <CategoriesClient categories={categories} />
      </div>
    </div>
  )
}
