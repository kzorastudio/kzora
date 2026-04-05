import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppFAB } from '@/components/layout/WhatsAppFAB'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { formatPrice, SHIPPING_LABELS } from '@/lib/utils'
import type { OrderFull, OrderItem, HomepageSettings } from '@/types'
import { CreditCard } from 'lucide-react'

export const metadata: Metadata = {
  title: 'تم استلام طلبك — كزورا',
}

interface PageProps {
  params: Promise<{ orderId: string }>
}

async function getOrder(orderId: string): Promise<OrderFull | null> {
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle()

  if (error || !order) return null

  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)

  const { data: history } = await supabaseAdmin
    .from('order_status_history')
    .select('*')
    .eq('order_id', orderId)
    .order('changed_at')

  return {
    ...order,
    items:          items          ?? [],
    status_history: history        ?? [],
  } as OrderFull
}

async function getHomepageSettings(): Promise<HomepageSettings | null> {
  const { data, error } = await supabaseAdmin
    .from('homepage_settings')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data as HomepageSettings
}

const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER ?? '963964514765'

export default async function OrderSuccessPage({ params }: PageProps) {
  const { orderId } = await params

  // ── Demo mode: orderId is "demo-KZ-XXXX" ─────────────────────────────────
  if (orderId.startsWith('demo-')) {
    const orderNumber = orderId.replace('demo-', '')
    const whatsappFollowUp = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      `مرحباً، أريد الاستفسار عن طلبي رقم ${orderNumber}`
    )}`
    return (
      <>
        <Header />
        <main dir="rtl" className="min-h-screen bg-surface pt-28 pb-12 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-surface-container-lowest rounded-2xl shadow-ambient-lg overflow-hidden">
              <div className="bg-gradient-to-l from-[#785600] to-[#986D00] px-8 py-10 text-center text-white">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-10 h-10 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h1 className="font-arabic text-3xl font-bold mb-2">تم استلام طلبك! 🎉</h1>
                <p className="font-arabic text-white/85 text-base leading-relaxed">
                  شكراً لثقتك بكزورا. سيتواصل معك فريقنا على واتساب خلال ساعات لتأكيد الطلب وترتيب التوصيل.
                </p>
              </div>
              <div className="px-8 py-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-arabic text-secondary mb-1">رقم الطلب</p>
                    <p className="font-brand text-2xl font-bold text-primary">{orderNumber}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 font-arabic text-sm font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    قيد المراجعة
                  </span>
                </div>
                <div className="bg-[#25D366]/8 rounded-xl p-4">
                  <p className="font-arabic text-sm text-on-surface leading-relaxed">
                    <span className="font-semibold">تذكير:</span> سيتواصل معك فريقنا عبر واتساب لتأكيد الطلب وترتيب التوصيل.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link href="/" className="flex-1 h-11 rounded-xl flex items-center justify-center font-arabic font-semibold text-sm bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors duration-150">
                    العودة للرئيسية
                  </Link>
                  <Link href="/products" className="flex-1 h-11 rounded-xl flex items-center justify-center bg-gradient-to-l from-[#785600] to-[#986D00] text-white font-arabic font-semibold text-sm hover:from-[#986D00] hover:to-[#B8860B] transition-all duration-200">
                    متابعة التسوق
                  </Link>
                </div>
                <div className="text-center pt-1">
                  <a href={whatsappFollowUp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-arabic text-sm text-[#25D366] hover:text-[#20BC5C] transition-colors">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    استفسار عن طلبك على واتساب
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
        <WhatsAppFAB />
        <CartDrawer />
      </>
    )
  }

  const order = await getOrder(orderId)
  const settings = await getHomepageSettings()

  if (!order) notFound()

  const currency = order.currency_used

  const total   = currency === 'SYP' ? order.total_syp   : order.total_usd
  const subtotal = currency === 'SYP' ? order.subtotal_syp : order.subtotal_usd
  const discount = currency === 'SYP' ? order.discount_amount_syp : order.discount_amount_usd
  const loyaltyDiscount = currency === 'SYP' ? order.loyalty_discount_syp : order.loyalty_discount_usd
  // The base discount (coupons/multi-item) is total discount minus loyalty discount
  const baseDiscount = discount - loyaltyDiscount

  const shippingFee = currency === 'SYP' ? (order.shipping_fee_syp || 0) : (order.shipping_fee_usd || 0)

  const whatsappFollowUp = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `مرحباً، أريد الاستفسار عن طلبي رقم ${order.order_number}`
  )}`

  return (
    <>
      <Header />

      <main dir="rtl" className="min-h-screen bg-surface pt-28 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Success card */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-ambient-lg overflow-hidden">
            {/* Top banner */}
            <div className="bg-gradient-to-l from-[#785600] to-[#986D00] px-8 py-10 text-center text-white">
              {/* Checkmark */}
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  className="w-10 h-10 text-white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>

              <h1 className="font-arabic text-3xl font-bold mb-2">
                تم استلام طلبك! 🎉
              </h1>
              <p className="font-arabic text-white/85 text-base leading-relaxed">
                شكراً لثقتك بكزورا. سيتواصل معك فريقنا على واتساب خلال ساعات لتأكيد الطلب وترتيب التوصيل.
              </p>
            </div>

            {/* Order info */}
            <div className="px-8 py-6 space-y-6">
              {/* Order number + status */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-arabic text-secondary mb-1">رقم الطلب</p>
                  <p className="font-brand text-2xl font-bold text-primary">
                    {order.order_number}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-arabic text-secondary mb-1">حالة الطلب</p>
                  <span className="inline-flex items-center gap-1.5 font-arabic text-sm font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    قيد المراجعة
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-surface-container-high" />

              {/* Customer info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-arabic text-secondary mb-1">الاسم</p>
                  <p className="font-arabic text-sm font-medium text-on-surface">
                    {order.customer_full_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-arabic text-secondary mb-1">رقم الهاتف</p>
                  <p className="font-body text-sm font-medium text-on-surface" dir="ltr">
                    {order.customer_phone}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-arabic text-secondary mb-1">المحافظة</p>
                  <p className="font-arabic text-sm font-medium text-on-surface">
                    {order.customer_governorate}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-arabic text-secondary mb-1">
                    {(order as any).delivery_type === 'delivery' ? 'نوع التوصيل' : 'شركة الشحن'}
                  </p>
                  <p className="font-arabic text-sm font-medium text-on-surface">
                    {(order as any).delivery_type === 'delivery' 
                      ? '🚀 توصيل عادي (حلب)'
                      : (SHIPPING_LABELS[order.shipping_company || ''] || order.shipping_company || 'شحن للمحافظات')}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-arabic text-secondary mb-1">العنوان</p>
                  <p className="font-arabic text-sm font-medium text-on-surface leading-relaxed">
                    {order.customer_address}
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-surface-container-high" />

              {/* Order items */}
              <div>
                <h2 className="font-arabic font-semibold text-on-surface mb-4">المنتجات</h2>
                <ul className="space-y-3">
                  {order.items.map((item: OrderItem) => {
                    const itemPrice = currency === 'SYP' ? item.unit_price_syp : item.unit_price_usd
                    return (
                      <li
                        key={item.id}
                        className="flex items-start gap-3"
                      >
                        {/* Thumbnail */}
                        <div className="relative w-14 h-14 rounded-lg bg-surface-container overflow-hidden shrink-0">
                          {item.product_image ? (
                            <Image
                              src={item.product_image}
                              alt={item.product_name}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-surface-container-high" />
                          )}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-arabic text-sm font-medium text-on-surface leading-snug line-clamp-2">
                            {item.product_name}
                          </p>
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                            {item.color && (
                              <span className="text-xs font-arabic text-secondary">{item.color}</span>
                            )}
                            {item.size && (
                              <span className="text-xs font-arabic text-secondary">مقاس {item.size}</span>
                            )}
                          </div>
                        </div>
                        {/* Price × qty */}
                        <div className="text-right shrink-0" dir="rtl">
                          <p className="font-body text-sm font-semibold text-on-surface tabular-nums">
                            {formatPrice(itemPrice, currency)}
                          </p>
                          <p className="text-xs text-secondary">{item.quantity} قطعة</p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {/* Divider */}
              <div className="h-px bg-surface-container-high" />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-arabic text-secondary">المجموع الفرعي</span>
                  <span className="font-body tabular-nums text-on-surface" dir="rtl">
                    {formatPrice(subtotal, currency)}
                  </span>
                </div>
                {baseDiscount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-arabic text-secondary">
                      خصم التوفير
                      {order.coupon_code && (
                        <span className="font-body text-primary mr-1">({order.coupon_code})</span>
                      )}
                    </span>
                    <span className="font-body tabular-nums text-[#BA1A1A]" dir="rtl">
                      {formatPrice(baseDiscount, currency)}
                    </span>
                  </div>
                )}
                {loyaltyDiscount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-arabic text-[#006E1C] font-semibold">
                      خصم الولاء 🎁
                    </span>
                    <span className="font-body tabular-nums text-[#006E1C] font-bold" dir="rtl">
                      {formatPrice(loyaltyDiscount, currency)}
                    </span>
                  </div>
                )}
                {order.shipping_fee_determined ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-arabic text-secondary">أجرة الشحن</span>
                    <span className="font-arabic text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                      يتم تحديد السعر مع البائع 
                    </span>
                  </div>
                ) : shippingFee > 0 ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-arabic text-secondary">
                      أجرة الشحن
                    </span>
                    <span className="font-body tabular-nums text-[#2E7D32]" dir="rtl">
                      {formatPrice(shippingFee, currency)}
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between pt-2 border-t border-surface-container-high">
                  <span className="font-arabic font-bold text-on-surface">الإجمالي</span>
                  <span className="font-body font-bold text-lg text-primary tabular-nums" dir="rtl">
                    {formatPrice(total, currency)}
                  </span>
                </div>
                <p className="text-xs font-arabic text-secondary text-left" dir="ltr">
                  {order.payment_method === 'sham_cash' ? (
                    <span className="flex flex-col items-end gap-1">
                      <span className="text-[#785600] font-bold">شام كاش (تحويل مسبق) 📱</span>
                      <span className="text-[10px] text-secondary">رقم المحفظة: {order.customer_phone}</span>
                    </span>
                  ) : (
                    'الدفع عند الاستلام 💵'
                  )}
                </p>
              </div>

              {/* Sham Cash Post-Purchase Instructions */}
              {order.payment_method === 'sham_cash' && (
                <div className="bg-[#785600]/5 border border-[#785600]/20 rounded-xl p-5 space-y-4 animate-in fade-in zoom-in duration-500">
                  <div className="flex items-center gap-2 text-[#785600]">
                    <CreditCard size={18} />
                    <h3 className="font-arabic font-bold text-sm">خطوات إتمام الدفع (شام كاش)</h3>
                  </div>
                  
                  <div className="flex flex-col items-center gap-5 text-center">
                    <p className="font-arabic text-xs text-[#4A4742] leading-relaxed">
                      يرجى تحويل المبلغ الإجمالي إلى الرقم أدناه وإرفاق صورة الإشعار عبر الواتساب لتأكيد الطلب.
                    </p>
                    
                    <div className="w-full space-y-4">
                       <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-arabic text-secondary">رقم المحفظة (التحويل إلى):</span>
                          <span className="font-body text-xl font-black text-primary select-all bg-white px-6 py-2 rounded-xl border border-primary/20 shadow-sm transition-all active:scale-95">
                             {settings?.sham_cash_number || '0964514765'}
                          </span>
                       </div>

                       {settings?.sham_cash_image_url && (
                          <div className="bg-white p-3 rounded-2xl shadow-sm border border-outline-variant/10 inline-block mx-auto">
                             <img 
                                src={settings.sham_cash_image_url} 
                                alt="Sham Cash QR" 
                                className="w-[180px] h-auto rounded-lg"
                             />
                             <p className="text-[9px] font-arabic text-secondary mt-2 opacity-60">صورة الحساب / QR Code</p>
                          </div>
                       )}

                       {settings?.sham_cash_instructions && (
                          <div className="mt-2 text-right bg-white/50 p-3 rounded-lg border border-[#785600]/5">
                             <p className="font-arabic text-[11px] text-[#4A4742] leading-relaxed whitespace-pre-line">
                                {settings.sham_cash_instructions}
                             </p>
                          </div>
                       )}
                    </div>
                  </div>
                </div>
              )}

              {/* WhatsApp reminder */}
              <div className="bg-[#25D366]/8 rounded-xl p-4">
                <p className="font-arabic text-sm text-on-surface leading-relaxed">
                  <span className="font-semibold">تذكير:</span> سيتواصل معك فريقنا عبر واتساب على الرقم{' '}
                  <span className="font-body" dir="ltr">{order.customer_phone}</span>{' '}
                  خلال ساعات لتأكيد الطلب.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="/"
                  className={[
                    'flex-1 h-11 rounded-xl flex items-center justify-center',
                    'font-arabic font-semibold text-sm',
                    'bg-surface-container-high text-on-surface',
                    'hover:bg-surface-container-highest transition-colors duration-150',
                  ].join(' ')}
                >
                  العودة للرئيسية
                </Link>
                <Link
                  href="/products"
                  className={[
                    'flex-1 h-11 rounded-xl flex items-center justify-center',
                    'bg-gradient-to-l from-[#785600] to-[#986D00] text-white',
                    'font-arabic font-semibold text-sm',
                    'hover:from-[#986D00] hover:to-[#B8860B] transition-all duration-200',
                  ].join(' ')}
                >
                  متابعة التسوق
                </Link>
              </div>

              {/* WhatsApp follow-up link */}
              <div className="text-center pt-1">
                <a
                  href={whatsappFollowUp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-arabic text-sm text-[#25D366] hover:text-[#20BC5C] transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  استفسار عن طلبك على واتساب
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppFAB />
      <CartDrawer />
    </>
  )
}
