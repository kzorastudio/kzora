import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import StatsDashboard from '@/components/admin/StatsDashboard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminStatsPage() {
  const session = await getServerSession(authOptions)

  // Redirect employees since stats are sensitive
  if (session?.user?.role === 'employee') {
    redirect('/admin/products')
  }

  // Fetch orders, order items, product variants, and products in parallel
  const [
    { data: ordersData },
    { data: orderItemsData },
    { data: variantsData },
    { data: productsData }
  ] = await Promise.all([
    supabaseAdmin
      .from('orders')
      .select('id, total_syp, total_usd, currency_used, status, customer_governorate, created_at')
      .order('created_at', { ascending: false })
      .limit(20000),
    supabaseAdmin
      .from('order_items')
      .select('order_id, quantity, product_name, product_id, unit_price_syp, unit_price_usd')
      .limit(50000),
    supabaseAdmin
      .from('product_variants')
      .select('product_id, color, size, quantity'),
    supabaseAdmin
      .from('products')
      .select('id, name, price_syp, price_usd, stock_status')
  ])

  const orders = ordersData || []
  const orderItems = orderItemsData || []
  const variants = variantsData || []
  const products = productsData || []

  return (
    <div className="flex flex-col min-h-screen bg-surface" dir="rtl">
      <StatsDashboard 
        initialOrders={orders} 
        initialOrderItems={orderItems} 
        initialVariants={variants} 
        initialProducts={products} 
      />
    </div>
  )
}
