import { supabaseAdmin } from '@/lib/supabase'
import AdminHeader from '@/components/admin/AdminHeader'
import type { Category } from '@/types'
import NavigationClient from './NavigationClient'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'إدارة شريط التنقل — لوحة تحكم كزورا',
}

async function getCategories() {
  const { data: categories } = await supabaseAdmin
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  return (categories as Category[]) || []
}

export default async function NavigationPage() {
  const categories = await getCategories()

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF8F5]" dir="rtl">
      <AdminHeader />
      <div className="flex-1">
        <NavigationClient categories={categories} />
      </div>
    </div>
  )
}
