export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Package, MapPin, Truck, CreditCard, Clock } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase'
import AdminHeader from '@/components/admin/AdminHeader'
import StatusBadge from '@/components/admin/StatusBadge'
import { formatDate, formatPrice, SHIPPING_LABELS, normalizePhone } from '@/lib/utils'
import type { OrderFull } from '@/types'
import OrderStatusUpdater from './OrderStatusUpdater'
import OrderDetailsEditor from './OrderDetailsEditor'
import CopyOrderButton from './CopyOrderButton'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface OrderDetailPageProps {
  params: { id: string }
}

async function getOrder(id: string): Promise<OrderFull | null> {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(
      `
      *,
      items:order_items(*),
      status_history:order_status_history(*)
      `
    )
    .eq('id', id)
    .single()

  if (error || !data) return null

  // Sort history ascending
  if (data.status_history) {
    data.status_history.sort(
      (a: { changed_at: string }, b: { changed_at: string }) =>
        new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
    )
  }

  return data as OrderFull
}

async function getCustomerLoyalty(phone: string) {
  const normalizedPhone = normalizePhone(phone)
  const { data } = await supabaseAdmin
    .from('loyalty_points')
    .select('status, cycle_used')
    .eq('customer_phone', normalizedPhone)
    .eq('cycle_used', false)

  if (!data) return { confirmed_orders_count: 0, pending_orders_count: 0 }

  const confirmed_orders_count = data.filter(d => d.status === 'confirmed').length
  const pending_orders_count = data.filter(d => d.status === 'pending').length

  return { confirmed_orders_count, pending_orders_count }
}

async function getShippingMethodName(slug: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from('shipping_methods')
    .select('name')
    .eq('slug', slug)
    .maybeSingle()
  return data?.name || SHIPPING_LABELS[slug || ''] || slug
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await getServerSession(authOptions)
  const isEmployee = session?.user?.role === 'employee'

  const order = await getOrder(params.id)
  if (!order) notFound()

  const deliveryType = (order as any).delivery_type || 'shipping'
  const shippingName = deliveryType === 'delivery' ? 'توصيل عادي (حلب)' : (await getShippingMethodName(order.shipping_company || ''))
  const loyalty = await getCustomerLoyalty(order.customer_phone)

  const currency = order.currency_used
  const subtotalRaw = currency === 'USD' ? order.subtotal_usd : order.subtotal_syp
  const discountRaw = currency === 'USD' ? order.discount_amount_usd : order.discount_amount_syp
  const loyaltyDiscountRaw = currency === 'USD' ? order.loyalty_discount_usd : order.loyalty_discount_syp
  const baseDiscountRaw = discountRaw - loyaltyDiscountRaw

  const subtotal = formatPrice(subtotalRaw, currency)
  const baseDiscount = formatPrice(baseDiscountRaw, currency)
  const loyaltyDiscount = formatPrice(loyaltyDiscountRaw, currency)
  const total = formatPrice(currency === 'USD' ? order.total_usd : order.total_syp, currency)

  return (
    <div className="flex flex-col min-h-screen" dir="rtl">
      <AdminHeader />

      <div className="flex-1 p-6 flex flex-col gap-5">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors"
            title="رجوع"
          >
            <ArrowRight size={18} />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-lg font-arabic font-semibold text-on-surface">
                طلب {order.order_number}
              </h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-sm font-arabic text-secondary mt-0.5">
              {formatDate(order.created_at)}
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <CopyOrderButton order={order} />
          </div>
        </div>

        {/* Main layout: two columns */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* LEFT: Order items */}
          <div className="xl:col-span-2 flex flex-col gap-5">
            {/* Items card */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-ambient overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-outline-variant/40">
                <Package size={18} className="text-secondary" />
                <h2 className="text-sm font-arabic font-semibold text-on-surface">
                  المنتجات ({order.items.length})
                </h2>
              </div>
              <div className="divide-y divide-outline-variant/20">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 px-5 py-4">
                    {/* Image */}
                    <div className="h-16 w-16 rounded-xl overflow-hidden bg-surface-container shrink-0">
                      {item.product_image ? (
                        <Image
                          src={item.product_image}
                          alt={item.product_name}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-secondary/40 text-xs font-arabic">
                          لا صورة
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-arabic font-medium text-on-surface leading-tight">
                        {item.product_name}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-arabic text-secondary">
                        {item.color && <span>اللون: {item.color}</span>}
                        {item.size  && <span>المقاس: {item.size}</span>}
                        <span>الكمية: {item.quantity}</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right shrink-0" dir="rtl">
                      {!isEmployee && (
                        <p className="text-sm font-label font-semibold text-on-surface">
                          {order.currency_used === 'USD'
                            ? formatPrice(item.unit_price_usd * item.quantity, 'USD')
                            : formatPrice(item.unit_price_syp * item.quantity, 'SYP')}
                        </p>
                      )}
                      <p className="text-xs font-label text-secondary mt-0.5">
                        {item.quantity} قطعة
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status history timeline */}
            {order.status_history.length > 0 && (
              <div className="bg-surface-container-lowest rounded-2xl shadow-ambient p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={18} className="text-secondary" />
                  <h2 className="text-sm font-arabic font-semibold text-on-surface">سجل الحالات</h2>
                </div>
                <div className="flex flex-col gap-3">
                  {order.status_history.map((entry, idx) => (
                    <div key={entry.id} className="flex items-start gap-3">
                      {/* Timeline dot */}
                      <div className="flex flex-col items-center shrink-0 mt-1">
                        <div
                          className={`h-3 w-3 rounded-full border-2 ${
                            idx === order.status_history.length - 1
                              ? 'bg-primary border-primary'
                              : 'bg-surface-container-high border-outline-variant'
                          }`}
                        />
                        {idx < order.status_history.length - 1 && (
                          <div className="w-px flex-1 min-h-[20px] bg-outline-variant/40 mt-1" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 pb-1">
                        <StatusBadge status={entry.status} />
                        <p className="text-xs font-arabic text-secondary mt-1">
                          {new Date(entry.changed_at).toLocaleString('ar-SY', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Sidebar cards */}
          <div className="flex flex-col gap-4">
            {/* Customer info */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-ambient p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-secondary" />
                  <h3 className="text-sm font-arabic font-semibold text-on-surface">معلومات العميل</h3>
                </div>
                {/* Editor component (Client) */}
                <OrderDetailsEditor order={order} />
              </div>
              <div className="flex flex-col gap-2 text-sm font-arabic">
                <div className="flex justify-between">
                  <span className="text-secondary">الاسم</span>
                  <span className="text-on-surface font-medium">{order.customer_full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">الهاتف</span>
                  <span className="text-on-surface font-label" dir="ltr">{order.customer_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">المحافظة والمنطقة</span>
                  <span className="text-on-surface text-left">
                    {order.customer_governorate}
                    {(order as any).center_name && <><br/><span className="text-xs text-secondary">({(order as any).center_name})</span></>}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-secondary">العنوان بالتفصيل</span>
                  <span className="text-on-surface text-xs leading-relaxed bg-surface-container rounded-lg px-3 py-2">
                    {order.customer_address}
                  </span>
                </div>
              </div>
            </div>

            {/* Loyalty info (hide for employees) */}
            {!isEmployee && (
              <div className="bg-surface-container-lowest rounded-2xl shadow-ambient p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-secondary" />
                  <h3 className="text-sm font-arabic font-semibold text-on-surface">نقاط الولاء للعميل</h3>
                </div>
                <div className="flex flex-col gap-2 text-sm font-arabic text-on-surface">
                  <div className="flex justify-between items-center">
                    <span className="text-secondary">الطلبات المؤكدة</span>
                    <span className="text-[#006E1C] font-bold">{loyalty?.confirmed_orders_count || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-secondary">الطلبات القيد الانتظار</span>
                    <span className="text-amber-700 font-bold">{loyalty?.pending_orders_count || 0}</span>
                  </div>
                  <div className="mt-2 p-3 bg-blue-50 text-blue-800 text-[11px] rounded-xl border border-blue-100 flex items-start gap-1.5 leading-relaxed">
                    <span className="text-lg">💡</span>
                    <span className="flex-1 font-arabic">
                      تزداد النقاط المؤكدة للعميل بشكل فعلي فقط عند تغيير حالة هذا الطلب إلى "تم التوصيل". 
                      هذا يحمي من كسب النقاط لطلبات غير مستلمة.
                      عند وصول العدد لـ 3، يحصل العميل على خصم بقيمة 1000 ل.س في طلبه القادم.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Shipping info */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-ambient p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-secondary" />
                <h3 className="text-sm font-arabic font-semibold text-on-surface">معلومات الشحن</h3>
              </div>
              <div className="text-sm font-arabic">
                <span className="text-secondary">{deliveryType === 'delivery' ? 'نوع التوصيل: ' : 'شركة الشحن: '} </span>
                <span className="text-on-surface font-medium">
                  {deliveryType === 'delivery' ? '🚀 توصيل عادي (مندوب داخلي)' : shippingName}
                </span>
              </div>
              {(order as any).payment_transaction_id && (
                <div className="flex justify-between items-center bg-[#FFF3E0] px-3 py-2 rounded-xl border border-[#FFB74D]/30">
                  <span className="text-xs font-arabic text-[#5D4037]">رمز عملية التحويل</span>
                  <span className="text-xs font-label font-bold text-[#E65100]" dir="ltr">
                    {(order as any).payment_transaction_id}
                  </span>
                </div>
              )}
              {order.notes && (
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-arabic text-secondary">ملاحظات</span>
                  <p className="text-xs font-arabic text-on-surface bg-surface-container rounded-lg px-3 py-2 leading-relaxed">
                    {order.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Order totals (hide for employees) */}
            {!isEmployee && (
              <div className="bg-surface-container-lowest rounded-2xl shadow-ambient p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-secondary" />
                  <h3 className="text-sm font-arabic font-semibold text-on-surface">ملخص الطلب</h3>
                </div>
                <div className="flex flex-col gap-2 text-sm font-arabic">
                  <div className="flex justify-between">
                    <span className="text-secondary">المجموع الفرعي</span>
                    <span className="text-on-surface">{subtotal}</span>
                  </div>
                  {baseDiscountRaw > 0 && (
                    <div className="flex justify-between">
                      <span className="text-secondary">
                        خصم التوفير {order.coupon_code && `(${order.coupon_code})`}
                      </span>
                      <span className="text-tertiary font-medium" dir="rtl">
                        {baseDiscount}
                      </span>
                    </div>
                  )}
                  {loyaltyDiscountRaw > 0 && (
                    <div className="flex justify-between">
                      <span className="text-secondary">خصم الولاء 🎁</span>
                      <span className="text-[#BA1A1A] font-medium" dir="rtl">
                        {loyaltyDiscount}
                      </span>
                    </div>
                  )}
                  {order.shipping_fee_determined ? (
                    <div className="flex justify-between items-center">
                      <span className="text-secondary">أجرة الشحن</span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">تتحدد مع البائع</span>
                    </div>
                  ) : (order.shipping_fee_syp > 0 || order.shipping_fee_usd > 0) ? (
                    <div className="flex justify-between">
                      <span className="text-secondary">أجرة الشحن</span>
                      <span className="text-on-surface">
                        {order.currency_used === 'USD' ? formatPrice(order.shipping_fee_usd, 'USD') : formatPrice(order.shipping_fee_syp, 'SYP')}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex justify-between pt-2 border-t border-outline-variant/40">
                    <span className="text-on-surface font-semibold">الإجمالي</span>
                    <span className="text-on-surface font-bold text-base">{total}</span>
                  </div>
                  <div className="flex justify-between items-center bg-surface-container/50 px-3 py-2 rounded-xl border border-outline-variant/30 mt-1">
                    <span className="text-secondary text-xs">طريقة الدفع</span>
                    <span className="text-[11px] font-arabic font-bold text-on-surface">
                      {order.payment_method === 'sham_cash' ? '📱 شام كاش' : '💵 عند الاستلام'}
                    </span>
                  </div>
                  <div className="text-xs text-secondary text-center mt-1">
                    العملة المستخدمة: {order.currency_used}
                  </div>
                </div>
              </div>
            )}

            {/* Status update (client component) */}
            <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
          </div>
        </div>
      </div>
    </div>
  )
}
