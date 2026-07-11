import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseAdmin, fetchAllRows } from '@/lib/supabase'
import StatsDashboard from '@/components/admin/StatsDashboard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminStatsPage() {
  const session = await getServerSession(authOptions)

  // Redirect employees since stats are sensitive
  if (session?.user?.role === 'employee') {
    redirect('/admin/products')
  }

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  // Fetch orders, order items, product variants, products, and site visits in parallel.
  // NOTE: PostgREST caps every response at 1000 rows regardless of `.limit()`, so
  // large datasets (orders, order_items, site_visits) MUST be paginated with
  // fetchAllRows — otherwise the "actual visit count" and sales totals are wrong.
  const [
    orders,
    orderItems,
    { data: variantsData },
    { data: productsData },
    visits
  ] = await Promise.all([
    fetchAllRows((from, to) =>
      supabaseAdmin
        .from('orders')
        .select('id, total_syp, total_usd, currency_used, status, customer_governorate, created_at')
        .order('created_at', { ascending: false })
        .range(from, to)
    ),
    fetchAllRows((from, to) =>
      supabaseAdmin
        .from('order_items')
        .select('order_id, quantity, product_name, product_id, unit_price_syp, unit_price_usd')
        .order('order_id', { ascending: true })
        .range(from, to)
    ),
    supabaseAdmin
      .from('product_variants')
      .select('product_id, color, size, quantity'),
    supabaseAdmin
      .from('products')
      .select('id, name, price_syp, price_usd, stock_status'),
    fetchAllRows((from, to) =>
      supabaseAdmin
        .from('site_visits')
        .select('session_id, page_path, user_agent, visited_at')
        .gte('visited_at', ninetyDaysAgo)
        .order('visited_at', { ascending: true })
        .range(from, to)
    )
  ])

  const variants = variantsData || []
  const products = productsData || []

  return (
    <div className="flex flex-col min-h-screen bg-surface w-full max-w-full overflow-x-hidden" dir="rtl">
      <StatsDashboard 
        initialOrders={orders} 
        initialOrderItems={orderItems} 
        initialVariants={variants} 
        initialProducts={products} 
        initialVisits={visits}
      />
    </div>
  )
}
