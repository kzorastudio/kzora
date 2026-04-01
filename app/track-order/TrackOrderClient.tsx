'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import {
  Search,
  Package,
  Clock,
  MapPin,
  Truck,
  Phone,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  PackageCheck,
  Timer,
} from 'lucide-react'
import type { OrderFull, OrderStatus } from '@/types'
import { ORDER_STATUS_OPTIONS } from '@/lib/constants'
import { SHIPPING_LABELS } from '@/lib/utils'

// ─── Status visual config ─────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  OrderStatus,
  { icon: typeof Clock; bg: string; text: string; dot: string }
> = {
  pending: {
    icon: Timer,
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  confirmed: {
    icon: CheckCircle2,
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  shipped: {
    icon: Truck,
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
  },
  delivered: {
    icon: PackageCheck,
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  cancelled: {
    icon: XCircle,
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
}

const STATUS_STEPS: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered']

function getStatusLabel(status: OrderStatus): string {
  const opt = ORDER_STATUS_OPTIONS.find((o) => o.id === status)
  return opt?.label ?? status
}

function formatPrice(amount: number, currency: 'SYP' | 'USD'): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(amount)
  }
  return new Intl.NumberFormat('ar-SY', { maximumFractionDigits: 0 }).format(amount) + ' ل.س'
}

// ─── Status progress bar ──────────────────────────────────────────────────────
function StatusProgress({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center justify-center gap-3 py-4 px-5 bg-red-50 rounded-xl border border-red-100">
        <XCircle size={20} className="text-red-500" />
        <span className="font-arabic font-semibold text-red-600 text-sm">تم إلغاء الطلب</span>
      </div>
    )
  }

  const currentIdx = STATUS_STEPS.indexOf(status)

  return (
    <div className="flex items-center gap-0 py-4 px-2 sm:px-4">
      {STATUS_STEPS.map((step, idx) => {
        const isCompleted = idx <= currentIdx
        const isCurrent = idx === currentIdx
        const config = STATUS_CONFIG[step]
        const Icon = config.icon

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            {/* Step circle */}
            <div className="flex flex-col items-center gap-1.5 relative">
              <div
                className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isCompleted
                    ? 'bg-gradient-to-l from-[#785600] to-[#986D00] shadow-md'
                    : 'bg-[#F5F3F0] border-2 border-[#E3DDD5]'
                } ${isCurrent ? 'ring-4 ring-[#B8860B]/15 ring-offset-2 scale-110' : ''}`}
              >
                <Icon
                  size={18}
                  className={isCompleted ? 'text-white' : 'text-[#9E9890]'}
                />
              </div>
              <span
                className={`text-[10px] sm:text-xs font-arabic font-medium text-center leading-tight ${
                  isCompleted ? 'text-[#785600]' : 'text-[#9E9890]'
                }`}
              >
                {getStatusLabel(step)}
              </span>
            </div>

            {/* Connector line */}
            {idx < STATUS_STEPS.length - 1 && (
              <div className="flex-1 h-[2px] mx-1 sm:mx-2 rounded-full overflow-hidden bg-[#F0EBE3] relative">
                <div
                  className="absolute inset-y-0 right-0 rounded-full transition-all duration-700 ease-out bg-gradient-to-l from-[#785600] to-[#B8860B]"
                  style={{
                    width: idx < currentIdx ? '100%' : '0%',
                  }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Single Order Card ────────────────────────────────────────────────────────
function OrderCard({ order }: { order: OrderFull }) {
  const [expanded, setExpanded] = useState(false)
  const config = STATUS_CONFIG[order.status]

  const total =
    order.currency_used === 'USD'
      ? formatPrice(order.total_usd, 'USD')
      : formatPrice(order.total_syp, 'SYP')

  const createdDate = new Date(order.created_at).toLocaleDateString('ar-SY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const createdTime = new Date(order.created_at).toLocaleTimeString('ar-SY', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(27,28,26,0.06)] border border-[#F0EBE3] overflow-hidden transition-all duration-300 hover:shadow-[0_4px_30px_rgba(27,28,26,0.10)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-[#F0EBE3]">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-[1rem] bg-[#F5F3F0] flex items-center justify-center">
            <Package size={20} className="text-[#785600]" />
          </div>
          <div>
            <h3 className="font-arabic font-bold text-[#1A1A1A] text-base">
              طلب {order.order_number}
            </h3>
            <p className="text-xs font-arabic text-[#9E9890] mt-0.5">
              {createdDate} — {createdTime}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-arabic font-semibold ${config.bg} ${config.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            {getStatusLabel(order.status)}
          </span>
          <span className="font-bold text-[#1A1A1A] text-sm" dir="ltr">
            {total}
          </span>
        </div>
      </div>

      {/* Status progress */}
      <StatusProgress status={order.status} />

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-center gap-2 py-3 border-t border-[#F0EBE3] text-sm font-arabic text-[#6B6560] hover:text-[#785600] hover:bg-[#FAF8F5] transition-colors"
      >
        {expanded ? (
          <>
            إخفاء التفاصيل
            <ChevronUp size={16} />
          </>
        ) : (
          <>
            عرض التفاصيل
            <ChevronDown size={16} />
          </>
        )}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[#F0EBE3] animate-fade-in">
          {/* Items */}
          <div className="px-5 pt-4 pb-2">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag size={15} className="text-[#9E9890]" />
              <h4 className="text-sm font-arabic font-semibold text-[#1A1A1A]">
                المنتجات ({order.items.length})
              </h4>
            </div>
            <div className="grid gap-2">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 bg-[#FAF8F5] rounded-xl px-3 py-2.5"
                >
                  <div className="h-12 w-12 rounded-lg overflow-hidden bg-[#F0EBE3] shrink-0">
                    {item.product_image ? (
                      <Image
                        src={item.product_image}
                        alt={item.product_name}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package size={16} className="text-[#C0B8B0]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-arabic font-medium text-[#1A1A1A] truncate">
                      {item.product_name}
                    </p>
                    <div className="flex items-center gap-2 text-xs font-arabic text-[#9E9890] mt-0.5">
                      {item.color && <span>اللون: {item.color}</span>}
                      {item.size && <span>المقاس: {item.size}</span>}
                      <span>الكمية: {item.quantity}</span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[#1A1A1A] shrink-0" dir="ltr">
                    {order.currency_used === 'USD'
                      ? formatPrice(item.unit_price_usd * item.quantity, 'USD')
                      : formatPrice(item.unit_price_syp * item.quantity, 'SYP')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Order info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-5 py-4">
            <div className="flex items-start gap-3 bg-[#FAF8F5] rounded-xl px-4 py-3">
              <Truck size={16} className="text-[#785600] mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-arabic text-[#9E9890] mb-0.5">
                  {(order as any).delivery_type === 'delivery' ? 'نوع التوصيل' : 'شركة الشحن'}
                </p>
                <p className="text-sm font-arabic font-medium text-[#1A1A1A]">
                  {(order as any).delivery_type === 'delivery' 
                    ? '🚀 توصيل عادي' 
                    : (SHIPPING_LABELS[order.shipping_company || ''] || order.shipping_company || 'شحن للمحافظات')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-[#FAF8F5] rounded-xl px-4 py-3">
              <MapPin size={16} className="text-[#785600] mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-arabic text-[#9E9890] mb-0.5">العنوان</p>
                <p className="text-sm font-arabic font-medium text-[#1A1A1A]">
                  {order.customer_governorate} — {order.customer_address}
                </p>
              </div>
            </div>
          </div>

          {/* Price summary */}
          <div className="px-5 pb-4">
            <div className="bg-[#FAF8F5] rounded-xl px-4 py-3 flex flex-col gap-1.5">
              <div className="flex justify-between text-sm font-arabic">
                <span className="text-[#9E9890]">المجموع الفرعي</span>
                <span className="text-[#1A1A1A]" dir="ltr">
                  {order.currency_used === 'USD'
                    ? formatPrice(order.subtotal_usd, 'USD')
                    : formatPrice(order.subtotal_syp, 'SYP')}
                </span>
              </div>
              {order.coupon_code && (
                <div className="flex justify-between text-sm font-arabic">
                  <span className="text-[#9E9890]">كوبون ({order.coupon_code})</span>
                  <span className="text-[#BA1A1A] font-medium" dir="ltr">
                    -{' '}
                    {order.currency_used === 'USD'
                      ? formatPrice(order.discount_amount_usd, 'USD')
                      : formatPrice(order.discount_amount_syp, 'SYP')}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-arabic pt-1.5 border-t border-[#E3DDD5]">
                <span className="font-bold text-[#1A1A1A]">الإجمالي</span>
                <span className="font-bold text-[#785600]" dir="ltr">{total}</span>
              </div>
            </div>
          </div>

          {/* Status history timeline */}
          {order.status_history && order.status_history.length > 0 && (
            <div className="px-5 pb-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={15} className="text-[#9E9890]" />
                <h4 className="text-sm font-arabic font-semibold text-[#1A1A1A]">
                  سجل حالة الطلب
                </h4>
              </div>
              <div className="flex flex-col gap-0 pr-2">
                {order.status_history.map((entry, idx) => {
                  const entryConfig = STATUS_CONFIG[entry.status]
                  const isLast = idx === order.status_history.length - 1

                  return (
                    <div key={entry.id} className="flex items-start gap-3">
                      <div className="flex flex-col items-center shrink-0">
                        <div
                          className={`h-3.5 w-3.5 rounded-full border-2 ${
                            isLast
                              ? 'bg-gradient-to-l from-[#785600] to-[#986D00] border-transparent shadow-sm'
                              : `bg-white border-[#D0CAC0]`
                          }`}
                        />
                        {!isLast && (
                          <div className="w-px flex-1 min-h-[24px] bg-[#E3DDD5] mt-0.5" />
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <span
                          className={`text-xs font-arabic font-semibold ${entryConfig.text}`}
                        >
                          {getStatusLabel(entry.status)}
                        </span>
                        <p className="text-[11px] font-arabic text-[#9E9890] mt-0.5">
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
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main TrackOrderClient ────────────────────────────────────────────────────
export default function TrackOrderClient() {
  const [phone, setPhone] = useState('')
  const [orders, setOrders] = useState<OrderFull[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const handleSearch = useCallback(async () => {
    const trimmed = phone.trim()
    if (!trimmed || trimmed.length < 6) {
      setError('يرجى إدخال رقم هاتف صحيح')
      return
    }

    setLoading(true)
    setError('')
    setOrders([])
    setSearched(true)

    try {
      const res = await fetch(`/api/orders/track?phone=${encodeURIComponent(trimmed)}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'حدث خطأ أثناء البحث')
        return
      }

      setOrders(data.orders || [])
    } catch {
      setError('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }, [phone])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Search card */}
      <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(27,28,26,0.06)] border border-[#F0EBE3] p-6 sm:p-8 mb-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-[1.2rem] bg-[#F5F3F0] flex items-center justify-center group-hover:bg-primary transition-all">
            <Phone size={20} className="text-[#785600]" />
          </div>
          <div>
            <h2 className="font-arabic font-bold text-[#1A1A1A] text-lg">
              البحث عن طلباتك
            </h2>
            <p className="text-xs font-arabic text-[#9E9890]">
              أدخل رقم هاتفك المستخدم عند الطلب
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value)
                if (error) setError('')
              }}
              onKeyDown={handleKeyDown}
              placeholder="09XXXXXXXX"
              className="w-full h-12 rounded-xl border border-[#E3DDD5] bg-[#FAF8F5] px-4 text-sm text-[#1A1A1A] placeholder:text-[#C0B8B0] focus:border-[#785600] focus:bg-white focus:ring-2 focus:ring-[#B8860B]/10 outline-none transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="h-12 px-6 rounded-xl bg-gradient-to-l from-[#785600] to-[#986D00] text-white font-arabic font-semibold text-sm shadow-sm hover:from-[#986D00] hover:to-[#B8860B] active:scale-[0.97] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Search size={18} />
            )}
            <span className="hidden sm:inline">بحث</span>
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 mt-3 px-1">
            <AlertCircle size={14} className="text-[#BA1A1A] shrink-0" />
            <span className="text-sm font-arabic text-[#BA1A1A]">{error}</span>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="w-14 h-14 rounded-full border-4 border-[#785600] border-t-transparent animate-spin" />
          <p className="font-arabic text-sm text-[#6B6560]">جاري البحث عن طلباتك...</p>
        </div>
      )}

      {/* No results */}
      {!loading && searched && orders.length === 0 && !error && (
        <div className="flex flex-col items-center gap-5 py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-[#F5F3F0] flex items-center justify-center">
            <Package size={36} className="text-[#C0B8B0]" />
          </div>
          <div>
            <p className="font-arabic font-bold text-[#1A1A1A] text-lg mb-1">
              لم يتم العثور على طلبات
            </p>
            <p className="font-arabic text-sm text-[#6B6560] max-w-xs mx-auto leading-relaxed">
              تأكد من إدخال رقم الهاتف الصحيح المستخدم عند إتمام الطلب
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && orders.length > 0 && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-2 px-1">
            <ShoppingBag size={16} className="text-[#785600]" />
            <span className="font-arabic font-bold text-[#1A1A1A] text-sm">
              طلباتك ({orders.length})
            </span>
          </div>
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
