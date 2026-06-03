'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import NextImage from 'next/image'
import toast from 'react-hot-toast'
import { Search, Plus, Trash2, ShoppingCart, ArrowRight, Loader2 } from 'lucide-react'
import AdminHeader from '@/components/admin/AdminHeader'
import { GOVERNORATES, SHIPPING_COMPANIES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import type { Currency } from '@/types'

interface PickerProduct {
  id: string
  name: string
  price_syp: number
  price_usd: number
  discount_price_syp: number | null
  discount_price_usd: number | null
  stock_status: string
  images: { url: string; is_main: boolean }[]
  colors: { name_ar: string; is_available: boolean }[]
  sizes: { size: number; is_available: boolean }[]
  variants: { id: string; color: string; size: number; quantity: number }[]
}

interface CartLine {
  key: string
  product_id: string
  name: string
  image: string | null
  color: string | null
  size: number | null
  quantity: number
  unit_price_syp: number
  unit_price_usd: number
  max_stock: number | null
}

const FIELD =
  'w-full rounded-xl border border-outline-variant/50 bg-white px-3 py-2.5 text-sm font-arabic text-on-surface focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition'

export default function NewStaffOrderPage() {
  const router = useRouter()

  // Product search
  const [searchInput, setSearchInput] = useState('')
  const [results, setResults] = useState<PickerProduct[]>([])
  const [searching, setSearching] = useState(false)

  // Cart
  const [cart, setCart] = useState<CartLine[]>([])

  // Customer + order
  const [currency, setCurrency] = useState<Currency>('SYP')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [governorate, setGovernorate] = useState('')
  const [address, setAddress] = useState('')
  const [centerName, setCenterName] = useState('')
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'shipping'>('delivery')
  const [shippingCompany, setShippingCompany] = useState('')
  const [shippingFee, setShippingFee] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // ── Product search (debounced) ────────────────────────────────────────────
  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=12`)
      const data = await res.json()
      setResults(data.products ?? [])
    } catch {
      toast.error('تعذر البحث عن المنتجات')
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => doSearch(searchInput), 500)
    return () => clearTimeout(t)
  }, [searchInput, doSearch])

  // ── Add product to cart (resolves variant interactively) ──────────────────
  function addProduct(p: PickerProduct) {
    const hasColors = p.colors.length > 0
    const hasSizes = p.sizes.length > 0
    const hasVariants = p.variants.length > 0

    let color: string | null = null
    let size: number | null = null

    // For variant-tracked products, prompt minimal selection via window prompt fallback.
    // Simpler approach: pick first available color/size; the user can adjust below.
    if (hasColors) {
      const avail = p.colors.find((c) => c.is_available)
      color = avail ? avail.name_ar : p.colors[0].name_ar
    }
    if (hasSizes) {
      const avail = p.sizes.find((s) => s.is_available)
      size = avail ? avail.size : p.sizes[0].size
    }

    let maxStock: number | null = null
    if (hasVariants) {
      const v = p.variants.find(
        (v) => (v.color || '').trim() === (color || '').trim() && (v.size || 0) === (size || 0)
      )
      maxStock = v ? v.quantity : 0
    }

    const key = `${p.id}|${color ?? ''}|${size ?? ''}`
    if (cart.some((l) => l.key === key)) {
      toast('هذا الصنف مضاف مسبقاً', { icon: 'ℹ️' })
      return
    }

    setCart((prev) => [
      ...prev,
      {
        key,
        product_id: p.id,
        name: p.name,
        image: p.images.find((i) => i.is_main)?.url || p.images[0]?.url || null,
        color,
        size,
        quantity: 1,
        unit_price_syp: p.discount_price_syp ?? p.price_syp,
        unit_price_usd: p.discount_price_usd ?? p.price_usd,
        max_stock: maxStock,
      },
    ])
    toast.success('تمت الإضافة')
  }

  function updateQty(key: string, qty: number) {
    setCart((prev) => prev.map((l) => (l.key === key ? { ...l, quantity: Math.max(1, qty) } : l)))
  }
  function removeLine(key: string) {
    setCart((prev) => prev.filter((l) => l.key !== key))
  }

  // ── Totals ────────────────────────────────────────────────────────────────
  const isUSD = currency === 'USD'
  const subtotal = cart.reduce(
    (s, l) => s + (isUSD ? l.unit_price_usd : l.unit_price_syp) * l.quantity, 0
  )
  const feeNum = Math.max(0, Number(shippingFee) || 0)
  const total = subtotal + feeNum

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (cart.length === 0) { toast.error('أضف منتجاً واحداً على الأقل'); return }
    if (!fullName.trim() || !phone.trim()) { toast.error('الاسم والهاتف مطلوبان'); return }
    if (!governorate) { toast.error('اختر المحافظة'); return }
    if (deliveryType === 'delivery' && !address.trim()) { toast.error('العنوان مطلوب للتوصيل'); return }
    if (deliveryType === 'shipping' && !shippingCompany) { toast.error('اختر شركة الشحن'); return }

    setSubmitting(true)
    try {
      const payload = {
        items: cart.map((l) => ({
          product_id: l.product_id,
          color: l.color,
          size: l.size,
          quantity: l.quantity,
        })),
        customer: {
          full_name: fullName.trim(),
          phone: phone.trim(),
          governorate,
          address: address.trim() || null,
          center_name: centerName.trim() || null,
        },
        delivery_type: deliveryType,
        shipping_company: deliveryType === 'shipping' ? shippingCompany : null,
        shipping_fee_syp: isUSD ? 0 : feeNum,
        shipping_fee_usd: isUSD ? feeNum : 0,
        payment_method: paymentMethod,
        currency_used: currency,
        notes: notes.trim() || undefined,
      }

      const res = await fetch('/api/admin/staff-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل إنشاء الطلب')

      toast.success(`تم إنشاء الطلب ${data.orderNumber}`)
      router.push('/admin/staff-orders')
    } catch (e: any) {
      toast.error(e.message || 'حدث خطأ')
    } finally {
      setSubmitting(false)
    }
  }

  const money = (n: number) => formatCurrency(n, currency)

  return (
    <div className="flex flex-col min-h-screen" dir="rtl">
      <AdminHeader />
      <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-arabic font-black text-on-surface">إنشاء طلبية جديدة</h1>
        <button
          onClick={() => router.push('/admin/staff-orders')}
          className="flex items-center gap-1.5 text-sm font-arabic text-secondary hover:text-on-surface transition"
        >
          رجوع <ArrowRight size={16} />
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* ── Right: product picker + cart ── */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-ambient border border-outline-variant/20">
            <label className="text-sm font-arabic font-bold text-on-surface mb-2 block">إضافة منتجات</label>
            <div className="relative flex items-center mb-3">
              <Search size={16} className="absolute right-3 text-secondary pointer-events-none" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="ابحث باسم المنتج..."
                className={`${FIELD} pr-9`}
              />
            </div>

            {searching && (
              <div className="flex justify-center py-4"><Loader2 className="animate-spin text-primary" size={20} /></div>
            )}

            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
              {results.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-container-low/40 transition">
                  <div className="h-12 w-12 rounded-lg bg-surface-container overflow-hidden shrink-0 relative">
                    {(p.images.find((i) => i.is_main)?.url || p.images[0]?.url) && (
                      <NextImage src={p.images.find((i) => i.is_main)?.url || p.images[0].url} alt={p.name} fill className="object-cover" sizes="48px" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-arabic font-semibold text-on-surface truncate">{p.name}</p>
                    <p className="text-xs font-label text-secondary">{formatCurrency(p.discount_price_syp ?? p.price_syp, 'SYP')}</p>
                  </div>
                  <button
                    onClick={() => addProduct(p)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition shrink-0"
                    title="إضافة"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ))}
              {!searching && searchInput.length >= 2 && results.length === 0 && (
                <p className="text-center text-sm font-arabic text-secondary py-4">لا نتائج</p>
              )}
            </div>
          </div>

          {/* Cart */}
          <div className="bg-white rounded-2xl p-4 shadow-ambient border border-outline-variant/20">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart size={16} className="text-primary" />
              <span className="text-sm font-arabic font-bold text-on-surface">الأصناف ({cart.length})</span>
            </div>
            {cart.length === 0 ? (
              <p className="text-center text-sm font-arabic text-secondary py-6">لم تتم إضافة أصناف بعد</p>
            ) : (
              <div className="flex flex-col gap-2">
                {cart.map((l) => (
                  <div key={l.key} className="flex items-center gap-2 p-2 rounded-xl bg-surface-container-low/40">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-arabic font-semibold text-on-surface truncate">{l.name}</p>
                      <p className="text-xs font-arabic text-secondary">
                        {l.color && `اللون: ${l.color}`} {l.size ? `• مقاس: ${l.size}` : ''}
                        {l.max_stock !== null && <span className="text-amber-600"> • متاح: {l.max_stock}</span>}
                      </p>
                    </div>
                    <input
                      type="number" min={1}
                      value={l.quantity}
                      onChange={(e) => updateQty(l.key, parseInt(e.target.value) || 1)}
                      className="w-16 rounded-lg border border-outline-variant/50 px-2 py-1.5 text-sm text-center"
                    />
                    <span className="text-xs font-label text-on-surface w-20 text-left">
                      {formatCurrency((isUSD ? l.unit_price_usd : l.unit_price_syp) * l.quantity, currency)}
                    </span>
                    <button onClick={() => removeLine(l.key)} className="text-error hover:bg-error-container/30 rounded-lg p-1.5 transition">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Left: customer + order details ── */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-ambient border border-outline-variant/20 flex flex-col gap-3">
            <span className="text-sm font-arabic font-bold text-on-surface">بيانات العميل</span>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="الاسم الكامل *" className={FIELD} />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="رقم الهاتف *" dir="ltr" className={FIELD} />
            <select value={governorate} onChange={(e) => setGovernorate(e.target.value)} className={FIELD}>
              <option value="">المحافظة *</option>
              {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="العنوان التفصيلي" className={FIELD} />
            <input value={centerName} onChange={(e) => setCenterName(e.target.value)} placeholder="اسم المركز/المنطقة (اختياري)" className={FIELD} />
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-ambient border border-outline-variant/20 flex flex-col gap-3">
            <span className="text-sm font-arabic font-bold text-on-surface">تفاصيل الطلب</span>

            <div className="grid grid-cols-2 gap-3">
              <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className={FIELD}>
                <option value="SYP">ليرة سورية</option>
                <option value="USD">دولار</option>
              </select>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={FIELD}>
                <option value="cod">الدفع عند الاستلام</option>
                <option value="sham_cash">شام كاش</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select value={deliveryType} onChange={(e) => setDeliveryType(e.target.value as any)} className={FIELD}>
                <option value="delivery">توصيل عادي (حلب)</option>
                <option value="shipping">شحن للمحافظات</option>
              </select>
              {deliveryType === 'shipping' ? (
                <select value={shippingCompany} onChange={(e) => setShippingCompany(e.target.value)} className={FIELD}>
                  <option value="">شركة الشحن *</option>
                  {SHIPPING_COMPANIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              ) : (
                <div />
              )}
            </div>

            <input
              type="number" min={0}
              value={shippingFee}
              onChange={(e) => setShippingFee(e.target.value)}
              placeholder={`رسوم الشحن (${currency === 'USD' ? 'دولار' : 'ل.س'}) — اختياري`}
              className={FIELD}
            />
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات (اختياري)" rows={2} className={FIELD} />
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl p-4 shadow-ambient border border-outline-variant/20 flex flex-col gap-2">
            <div className="flex justify-between text-sm font-arabic text-secondary">
              <span>المجموع الفرعي</span><span className="font-label text-on-surface">{money(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-arabic text-secondary">
              <span>رسوم الشحن</span><span className="font-label text-on-surface">{money(feeNum)}</span>
            </div>
            <div className="flex justify-between text-base font-arabic font-black text-on-surface border-t border-outline-variant/30 pt-2 mt-1">
              <span>الإجمالي</span><span className="font-label text-primary">{money(total)}</span>
            </div>
            <p className="text-[11px] font-arabic text-secondary/70 mt-1">* الأسعار من قاعدة البيانات، وبدون أي خصومات أو نقاط ولاء.</p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 rounded-2xl bg-primary text-white font-arabic font-bold hover:bg-primary/90 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
            تأكيد إنشاء الطلبية
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}
