'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import NextImage from 'next/image'
import toast from 'react-hot-toast'
import { Search, Plus, Trash2, ShoppingCart, ArrowRight, Loader2 } from 'lucide-react'
import AdminHeader from '@/components/admin/AdminHeader'
import { GOVERNORATES } from '@/lib/constants'
import { formatCurrency, cn, SHIPPING_LABELS, ORDER_STATUS_LABELS, formatDate } from '@/lib/utils'
import type { Currency, HomepageSettings } from '@/types'

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
  multi_discount_enabled?: boolean
  multi_discount_2_items_syp?: number
  multi_discount_2_items_usd?: number
  multi_discount_3_plus_syp?: number
  multi_discount_3_plus_usd?: number
}

interface CartLine {
  id: string            // unique per line (allows the same product more than once)
  product_id: string
  name: string
  image: string | null
  color: string | null
  size: number | null
  quantity: number
  unit_price_syp: number
  unit_price_usd: number
  // Original DB prices (for the "reset" button + showing the original)
  orig_price_syp: number
  orig_price_usd: number
  max_stock: number | null
  // Available options + variant stock, so each line can change its own color/size
  availColors: string[]
  availSizes: number[]
  variants: { color: string; size: number; quantity: number }[]
  multi_discount_enabled?: boolean
  multi_discount_2_items_syp?: number
  multi_discount_2_items_usd?: number
  multi_discount_3_plus_syp?: number
  multi_discount_3_plus_usd?: number
}

// Recompute available stock for a given color/size from a line's variants
function stockFor(variants: CartLine['variants'], color: string | null, size: number | null): number | null {
  if (variants.length === 0) return null
  const v = variants.find((x) => (x.color || '').trim() === (color || '').trim() && (x.size || 0) === (size || 0))
  return v ? v.quantity : 0
}

// Colors that are actually sellable (have a variant in stock) — mirrors the store.
// In reservation mode (allowAll) every configured color is offered, even out of stock.
function colorOptionsFor(line: Pick<CartLine, 'variants' | 'availColors'>, allowAll = false): string[] {
  if (allowAll) return line.availColors.length ? line.availColors : Array.from(new Set(line.variants.map((v) => v.color).filter(Boolean)))
  if (line.variants.length > 0) {
    const set = new Set<string>()
    line.variants.forEach((v) => {
      if (v.quantity > 0 && v.color && (line.availColors.length === 0 || line.availColors.includes(v.color))) set.add(v.color)
    })
    const arr = Array.from(set)
    return arr.length ? arr : line.availColors
  }
  return line.availColors
}

// Sizes sellable for the chosen color (have a variant in stock) — mirrors the store.
// In reservation mode (allowAll) every configured size is offered, even out of stock.
function sizeOptionsFor(line: Pick<CartLine, 'variants' | 'availSizes'>, color: string | null, allowAll = false): number[] {
  if (allowAll) return [...line.availSizes].sort((a, b) => a - b)
  if (line.variants.length > 0) {
    const sizes = line.variants
      .filter((v) => (v.color || '').trim() === (color || '').trim() && v.quantity > 0)
      .map((v) => v.size)
    const uniq = Array.from(new Set(sizes)).sort((a, b) => a - b)
    return uniq.length ? uniq : line.availSizes
  }
  return line.availSizes
}

const FIELD =
  'w-full rounded-xl border border-outline-variant/50 bg-white px-3 py-2.5 text-sm font-arabic text-on-surface focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition'

export default function NewStaffOrderPage() {
  const router = useRouter()

  // Product search
  const [searchInput, setSearchInput] = useState('')
  const [results, setResults] = useState<PickerProduct[]>([])
  const [searching, setSearching] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [importingRecentOrder, setImportingRecentOrder] = useState<string | null>(null)

  // Cart
  const [cart, setCart] = useState<CartLine[]>([])

  // Customer + order
  const [currency, setCurrency] = useState<Currency>('SYP')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [governorate, setGovernorate] = useState('')
  const [address, setAddress] = useState('')
  const [centerName, setCenterName] = useState('')
  // Default delivery method = shipping. The company is derived from the chosen center.
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'shipping'>('shipping')
  const [shippingCompany, setShippingCompany] = useState('')
  const [shippingFee, setShippingFee] = useState('')
  // Whether the admin manually edited the shipping fee. While false, the fee is
  // auto-filled from the store's pricing rules (same as the public checkout).
  const [shippingFeeTouched, setShippingFeeTouched] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // Ghost/reservation order: created without deducting stock; can include out-of-stock sizes.
  const [isReservation, setIsReservation] = useState(false)

  // Shipping data (from DB, like the store)
  const [shippingMethods, setShippingMethods] = useState<{ slug: string; name: string }[]>([])
  const [centers, setCenters] = useState<{ id: string; name: string; supported_companies: string[] }[]>([])
  const [loadingCenters, setLoadingCenters] = useState(false)
  // Store pricing settings (delivery/shipping fees) — drives the auto shipping fee.
  const [settings, setSettings] = useState<HomepageSettings | null>(null)

  // Load shipping companies once
  useEffect(() => {
    fetch('/api/shipping')
      .then((r) => r.json())
      .then((d) => setShippingMethods((d.methods || []).map((m: any) => ({ slug: m.slug, name: m.name }))))
      .catch(() => {})
  }, [])

  // Load pricing settings once (same source the public checkout uses)
  useEffect(() => {
    fetch('/api/homepage/settings')
      .then((r) => r.json())
      .then((d) => setSettings(d.settings))
      .catch(() => {})
  }, [])

  // Load last 3 orders once for suggestions
  useEffect(() => {
    fetch('/api/admin/staff-orders?limit=3')
      .then((r) => r.json())
      .then((d) => setRecentOrders(d.orders || []))
      .catch(() => {})
  }, [])

  const importCustomer = (o: any) => {
    setFullName(o.customer_full_name || '')
    setPhone(o.customer_phone || '')
    setGovernorate(o.customer_governorate || '')
    setAddress(o.customer_address || '')
    setCenterName(o.center_name || '')
    setDeliveryType(o.delivery_type || 'shipping')
    setShippingCompany(o.shipping_company || '')
    setPaymentMethod(o.payment_method || 'cod')
    setNotes(o.notes || '')
    // Reset pricing/currency to DB originals in the order's currency
    setShippingFeeTouched(false)
    setCurrency(o.currency_used || 'SYP')
    toast.success(`تم استيراد بيانات العميل للطلب ${o.order_number}`)
  }

  const importProducts = async (o: any) => {
    setImportingRecentOrder(o.id)
    const toastId = toast.loading(`جاري استيراد منتجات الطلب ${o.order_number}...`)
    try {
      const res = await fetch(`/api/orders/${o.id}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const items = data.order?.items || []

      const newCartLines: CartLine[] = []
      for (const item of items) {
        const pRes = await fetch(`/api/products/${item.product_id}`)
        if (!pRes.ok) continue
        const pData = await pRes.json()
        const p = pData.product
        if (!p) continue

        const availColors = p.colors.filter((c: any) => c.is_available).map((c: any) => c.name_ar)
        const availSizes = p.sizes.filter((s: any) => s.is_available).map((s: any) => s.size)
        const variants = p.variants.map((v: any) => ({ color: v.color, size: v.size, quantity: v.quantity }))

        newCartLines.push({
          id: `${p.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          product_id: p.id,
          name: p.name,
          image: p.images.find((i: any) => i.is_main)?.url || p.images[0]?.url || null,
          color: item.color,
          size: item.size,
          quantity: item.quantity,
          unit_price_syp: item.unit_price_syp,
          unit_price_usd: item.unit_price_usd,
          orig_price_syp: p.discount_price_syp ?? p.price_syp,
          orig_price_usd: p.discount_price_usd ?? p.price_usd,
          max_stock: stockFor(variants, item.color, item.size),
          availColors,
          availSizes,
          variants,
          multi_discount_enabled: p.multi_discount_enabled,
          multi_discount_2_items_syp: p.multi_discount_2_items_syp,
          multi_discount_2_items_usd: p.multi_discount_2_items_usd,
          multi_discount_3_plus_syp: p.multi_discount_3_plus_syp,
          multi_discount_3_plus_usd: p.multi_discount_3_plus_usd,
        })
      }

      if (newCartLines.length > 0) {
        setCart((prev) => [...prev, ...newCartLines])
        toast.success(`تم استيراد ${newCartLines.length} منتج بنجاح`, { id: toastId })
      } else {
        toast.error('لم يتم العثور على منتجات صالحة للاستيراد', { id: toastId })
      }
    } catch {
      toast.error('فشل استيراد المنتجات', { id: toastId })
    } finally {
      setImportingRecentOrder(null)
    }
  }

  const importEntireOrder = async (o: any) => {
    importCustomer(o)
    await importProducts(o)
  }

  // Load centers whenever the governorate changes (shipping only)
  useEffect(() => {
    if (deliveryType !== 'shipping' || !governorate) { setCenters([]); return }
    setLoadingCenters(true)
    fetch(`/api/shipping/centers?governorate=${encodeURIComponent(governorate)}`)
      .then((r) => r.json())
      .then((d) => setCenters((d.centers || d || []).map((c: any) => ({ id: c.id, name: c.name, supported_companies: c.supported_companies || [] }))))
      .catch(() => setCenters([]))
      .finally(() => setLoadingCenters(false))
  }, [governorate, deliveryType])

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

  // ── Add product to cart ───────────────────────────────────────────────────
  // The same product can be added multiple times; each line picks its own
  // color/size via dropdowns. We auto-advance to the first variant not yet in
  // the cart so adding "another pair" lands on a different size automatically.
  function addProduct(p: PickerProduct) {
    const availColors = p.colors.filter((c) => c.is_available).map((c) => c.name_ar)
    const availSizes = p.sizes.filter((s) => s.is_available).map((s) => s.size)
    const variants = p.variants.map((v) => ({ color: v.color, size: v.size, quantity: v.quantity }))
    const meta = { availColors, availSizes, variants }

    // Default selection: first sellable color/size
    const colorOpts = colorOptionsFor(meta, isReservation)
    let color: string | null = colorOpts[0] ?? null
    let size: number | null = sizeOptionsFor(meta, color, isReservation)[0] ?? null

    // Try to land on a color/size combo not already used by this product in the cart,
    // so "add another pair" auto-advances to a free size.
    const usedKeys = new Set(
      cart.filter((l) => l.product_id === p.id).map((l) => `${l.color ?? ''}|${l.size ?? ''}`)
    )
    const colorList = colorOpts.length ? colorOpts : [null]
    outer: for (const c of colorList) {
      const sizeList = sizeOptionsFor(meta, c, isReservation).length ? sizeOptionsFor(meta, c, isReservation) : [null]
      for (const s of sizeList) {
        if (!usedKeys.has(`${c ?? ''}|${s ?? ''}`)) { color = c; size = s; break outer }
      }
    }

    setCart((prev) => [
      ...prev,
      {
        id: `${p.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        product_id: p.id,
        name: p.name,
        image: p.images.find((i) => i.is_main)?.url || p.images[0]?.url || null,
        color,
        size,
        quantity: 1,
        unit_price_syp: p.discount_price_syp ?? p.price_syp,
        unit_price_usd: p.discount_price_usd ?? p.price_usd,
        orig_price_syp: p.discount_price_syp ?? p.price_syp,
        orig_price_usd: p.discount_price_usd ?? p.price_usd,
        max_stock: stockFor(variants, color, size),
        availColors,
        availSizes,
        variants,
        multi_discount_enabled: p.multi_discount_enabled,
        multi_discount_2_items_syp: p.multi_discount_2_items_syp,
        multi_discount_2_items_usd: p.multi_discount_2_items_usd,
        multi_discount_3_plus_syp: p.multi_discount_3_plus_syp,
        multi_discount_3_plus_usd: p.multi_discount_3_plus_usd,
      },
    ])
    toast.success('تمت الإضافة')
  }

  function updateQty(id: string, qty: number) {
    setCart((prev) => prev.map((l) => (l.id === id ? { ...l, quantity: Math.max(1, qty) } : l)))
  }
  function removeLine(id: string) {
    setCart((prev) => prev.filter((l) => l.id !== id))
  }
  function updateColor(id: string, color: string) {
    setCart((prev) => prev.map((l) => {
      if (l.id !== id) return l
      // When the color changes, keep the size if it's still valid, else pick the first valid one
      const sizes = sizeOptionsFor(l, color, isReservation)
      const newSize = l.size != null && sizes.includes(l.size) ? l.size : (sizes[0] ?? null)
      return { ...l, color, size: newSize, max_stock: stockFor(l.variants, color, newSize) }
    }))
  }
  function updateSize(id: string, size: number) {
    setCart((prev) => prev.map((l) => (l.id === id ? { ...l, size, max_stock: stockFor(l.variants, l.color, size) } : l)))
  }
  // Manual price override (in the currently selected currency)
  function updatePrice(id: string, value: number) {
    const v = Math.max(0, value || 0)
    setCart((prev) => prev.map((l) => (l.id === id ? { ...l, ...(currency === 'USD' ? { unit_price_usd: v } : { unit_price_syp: v }) } : l)))
  }
  // Restore the original DB price for the selected currency
  function resetPrice(id: string) {
    setCart((prev) => prev.map((l) => (l.id === id ? { ...l, ...(currency === 'USD' ? { unit_price_usd: l.orig_price_usd } : { unit_price_syp: l.orig_price_syp }) } : l)))
  }

  // ── Shipping center → company (like the store) ──────────────────────────────
  const selectedCenter = centers.find((c) => c.name === address)
  // Companies are limited to what the chosen center actually supports.
  const companyOptions = selectedCenter && selectedCenter.supported_companies.length
    ? shippingMethods.filter((m) => selectedCenter.supported_companies.includes(m.slug))
    : shippingMethods

  function handleSelectCenter(name: string) {
    setAddress(name)
    setCenterName(name)
    const center = centers.find((c) => c.name === name)
    const supported = center?.supported_companies || []
    const allowed = shippingMethods.filter((m) => supported.includes(m.slug))
    // Auto-select: if the current company isn't supported, pick the first allowed one
    if (allowed.length && !allowed.some((m) => m.slug === shippingCompany)) {
      setShippingCompany(allowed[0].slug)
    } else if (!allowed.length) {
      setShippingCompany('')
    }
  }

  // ── Totals ────────────────────────────────────────────────────────────────
  const isUSD = currency === 'USD'
  const subtotal = cart.reduce(
    (s, l) => s + (isUSD ? l.unit_price_usd : l.unit_price_syp) * l.quantity, 0
  )
  const totalItemsCount = cart.reduce((s, l) => s + l.quantity, 0)

  // ── Multi-item discount calculations ──────────────────────────────────────
  let multiItemDiscountSyp = 0
  let multiItemDiscountUsd = 0
  {
    const productQuantities: Record<string, number> = {}
    cart.forEach((l) => {
      productQuantities[l.product_id] = (productQuantities[l.product_id] || 0) + l.quantity
    })

    const processedProducts = new Set<string>()
    cart.forEach((l) => {
      if (processedProducts.has(l.product_id)) return
      processedProducts.add(l.product_id)

      if (!l.multi_discount_enabled) return

      const qty = productQuantities[l.product_id] || 0
      if (qty === 2) {
        multiItemDiscountSyp += l.multi_discount_2_items_syp || 0
        multiItemDiscountUsd += l.multi_discount_2_items_usd || 0
      } else if (qty >= 3) {
        multiItemDiscountSyp += l.multi_discount_3_plus_syp || 0
        multiItemDiscountUsd += l.multi_discount_3_plus_usd || 0
      }
    })
  }

  const multiItemDiscount = isUSD ? multiItemDiscountUsd : multiItemDiscountSyp

  // Auto shipping fee — mirrors the public checkout pricing rules exactly:
  //  • Aleppo (delivery): flat delivery fee
  //  • Governorates (shipping): piece-based (1 / 2 / 3 pieces)
  //  • 4+ pieces (or 3 pieces with no fee set): "determined with the seller"
  const autoShipping: { fee: number; determined: boolean } = (() => {
    if (!settings) return { fee: 0, determined: false }
    if (deliveryType === 'delivery') {
      return { fee: (isUSD ? settings.delivery_fee_usd : settings.delivery_fee_syp) || 0, determined: false }
    }
    if (deliveryType === 'shipping') {
      if (totalItemsCount >= 4) return { fee: 0, determined: true }
      if (totalItemsCount === 1) return { fee: (isUSD ? settings.shipping_fee_1_piece_usd : settings.shipping_fee_1_piece_syp) || 0, determined: false }
      if (totalItemsCount === 2) return { fee: (isUSD ? settings.shipping_fee_2_pieces_usd : settings.shipping_fee_2_pieces_syp) || 0, determined: false }
      if (totalItemsCount === 3) {
        const f = (isUSD ? settings.shipping_fee_3_plus_pieces_usd : settings.shipping_fee_3_plus_pieces_syp) || 0
        return { fee: f, determined: f === 0 }
      }
    }
    return { fee: 0, determined: false }
  })()

  // Keep the fee field synced with the auto value until the admin edits it.
  useEffect(() => {
    if (shippingFeeTouched) return
    setShippingFee(autoShipping.determined ? '' : (autoShipping.fee ? String(autoShipping.fee) : ''))
  }, [autoShipping.fee, autoShipping.determined, shippingFeeTouched])

  // Effective fee + "determined" flag used for submit and the WhatsApp message.
  const feeDetermined = !shippingFeeTouched && autoShipping.determined
  const feeNum = feeDetermined ? 0 : Math.max(0, Number(shippingFee) || 0)
  const total = Math.max(0, isUSD 
    ? parseFloat((subtotal - multiItemDiscount + feeNum).toFixed(2))
    : subtotal - multiItemDiscount + feeNum
  )

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (cart.length === 0) { toast.error('أضف منتجاً واحداً على الأقل'); return }
    if (!fullName.trim() || !phone.trim()) { toast.error('الاسم والهاتف مطلوبان'); return }
    if (!governorate) { toast.error('اختر المحافظة'); return }
    if (deliveryType === 'delivery' && !address.trim()) { toast.error('العنوان مطلوب للتوصيل'); return }
    if (deliveryType === 'shipping' && !shippingCompany) { toast.error('اختر شركة الشحن'); return }
    if (deliveryType === 'shipping' && !address.trim()) { toast.error('اختر المركز / العنوان'); return }

    // Merge lines that have the exact same product + color + size (sum quantities),
    // so two identical lines don't bypass the stock check. Keeps the first line's price.
    const merged = new Map<string, { product_id: string; color: string | null; size: number | null; quantity: number; max_stock: number | null; name: string; unit_price_syp: number; unit_price_usd: number }>()
    for (const l of cart) {
      const k = `${l.product_id}|${l.color ?? ''}|${l.size ?? ''}`
      const existing = merged.get(k)
      if (existing) existing.quantity += l.quantity
      else merged.set(k, { product_id: l.product_id, color: l.color, size: l.size, quantity: l.quantity, max_stock: l.max_stock, name: l.name, unit_price_syp: l.unit_price_syp, unit_price_usd: l.unit_price_usd })
    }
    // Stock check (client-side, friendlier than a server error).
    // Skipped for reservations — they intentionally allow out-of-stock sizes.
    if (!isReservation) {
      for (const m of Array.from(merged.values())) {
        if (m.max_stock !== null && m.quantity > m.max_stock) {
          toast.error(`الكمية المطلوبة من "${m.name}" (${m.quantity}) تتجاوز المتاح (${m.max_stock})`)
          return
        }
      }
    }

    setSubmitting(true)
    try {
      const payload = {
        items: Array.from(merged.values()).map((l) => ({
          product_id: l.product_id,
          color: l.color,
          size: l.size,
          quantity: l.quantity,
          unit_price_syp: l.unit_price_syp,
          unit_price_usd: l.unit_price_usd,
        })),
        customer: {
          full_name: fullName.trim(),
          phone: phone.trim(),
          governorate,
          address: address.trim() || '',
          center_name: centerName.trim() || null,
        },
        delivery_type: deliveryType,
        shipping_company: deliveryType === 'shipping' ? shippingCompany : null,
        shipping_fee_syp: isUSD ? 0 : feeNum,
        shipping_fee_usd: isUSD ? feeNum : 0,
        shipping_fee_determined: feeDetermined,
        payment_method: paymentMethod,
        currency_used: currency,
        notes: notes.trim() || undefined,
        is_reservation: isReservation,
      }

      const res = await fetch('/api/admin/staff-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل إنشاء الطلب')

      toast.success(`تم إنشاء ${isReservation ? 'الحجز' : 'الطلب'} ${data.orderNumber}`)

      // Determine shipping company name (clean, readable label)
      const shippingSlug = deliveryType === 'shipping' ? shippingCompany : ''
      const shippingMethod = shippingMethods.find((m: any) => m.slug === shippingSlug)
      let shippingCompanyName =
        deliveryType === 'delivery'
          ? 'توصيل عادي (حلب)'
          : shippingMethod?.name || SHIPPING_LABELS[shippingSlug || ''] || shippingSlug || ''

      // Strip emojis and parenthesized English text from the shipping name
      shippingCompanyName = shippingCompanyName.replace(/[\uD800-\uDFFF☀-➿]/g, '').trim()
      if (shippingCompanyName.includes('(')) {
        shippingCompanyName = shippingCompanyName.split('(')[0].trim()
      }

      const pMethod = paymentMethod === 'sham_cash' ? 'شام كاش' : 'الدفع عند الاستلام'
      const isAleppoOrder = deliveryType === 'delivery'

      // Build the order-details message (same NEW format as the "نسخ الطلب" button).
      const msgLines: (string | null)[] = [
        `رقم الطلب: ${data.orderNumber}`,
        `الاسم: ${fullName.trim()}`,
        `الهاتف: ${phone.trim()}`,
        `المحافظة: ${governorate}`,
        centerName.trim() ? `المنطقة/المركز: ${centerName.trim()}` : null,
        // Only Aleppo carries a real street address; other governorates use the center.
        isAleppoOrder && address.trim() ? `العنوان: ${address.trim()}` : null,
        `الشحن: ${shippingCompanyName || 'غير محدد'}`,
        `طريقة الدفع: ${pMethod}`,
      ]

      if (isAleppoOrder) {
        const formattedTotal = isUSD
          ? formatCurrency(total, 'USD')
          : 'السعر : ' + formatCurrency(total, 'SYP')
        msgLines.push(`الإجمالي: ${formattedTotal}`)
      } else {
        if (cart.length) {
          msgLines.push('المنتجات:')
          cart.forEach((l, i) => {
            msgLines.push(`${i + 1}. ${l.name}`)
            const details: string[] = []
            if (l.color) details.push(`اللون: ${l.color}`)
            if (l.size != null) details.push(`النمرة: ${l.size}`)
            if (details.length) msgLines.push(`   ${details.join(' - ')}`)
            const unit = isUSD ? l.unit_price_usd : l.unit_price_syp
            msgLines.push(
              l.quantity > 1
                ? `   الكمية: ${l.quantity} × ${formatCurrency(unit, currency)} = ${formatCurrency(unit * l.quantity, currency)}`
                : `   الكمية: ${l.quantity} × ${formatCurrency(unit, currency)}`
            )
          })
        }
        const totalWithoutShipping = total - feeNum
        msgLines.push(`الإجمالي بدون الشحن: ${formatCurrency(totalWithoutShipping, currency)}`)
      }

      msgLines.push(`الحالة: ${ORDER_STATUS_LABELS['pending']}`)
      msgLines.push(`التاريخ: ${formatDate(new Date().toISOString())}`)

      const textMessage = msgLines.filter(Boolean).join('\n')

      // Auto-copy — best-effort, with a legacy fallback. A copy failure must never
      // turn the successful order into an error, so it's isolated from the main flow.
      const autoCopy = async (text: string): Promise<boolean> => {
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text)
            return true
          }
        } catch { /* fall through to the legacy method */ }
        try {
          const ta = document.createElement('textarea')
          ta.value = text
          ta.style.position = 'fixed'
          ta.style.opacity = '0'
          document.body.appendChild(ta)
          ta.focus()
          ta.select()
          const ok = document.execCommand('copy')
          document.body.removeChild(ta)
          return ok
        } catch { return false }
      }

      const copied = await autoCopy(textMessage)
      if (copied) toast.success('تم نسخ تفاصيل الطلب تلقائياً')
      else toast('تم إنشاء الطلب — استخدم زر «نسخ الطلب» لنسخ التفاصيل', { icon: 'ℹ️' })

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
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                placeholder="ابحث باسم المنتج..."
                className={`${FIELD} pr-9`}
              />
            </div>

            {isSearchFocused && searchInput.trim() === '' && recentOrders.length > 0 && (
              <div className="border border-outline-variant/30 rounded-xl p-3 bg-surface-container-lowest shadow-md mb-3 animate-fade-in flex flex-col gap-2">
                <span className="text-xs font-arabic font-bold text-[#bfa15f]">اقتراحات من آخر 3 طلبيات تمت:</span>
                <div className="flex flex-col gap-2 divide-y divide-outline-variant/20">
                  {recentOrders.map((o) => (
                    <div key={o.id} className="pt-2 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-arabic">
                      <div className="min-w-0">
                        <span className="font-bold text-on-surface">طلب {o.order_number}</span>
                        <span className="text-secondary mx-1.5">•</span>
                        <span className="text-on-surface-variant font-medium">{o.customer_full_name}</span>
                        <span className="text-secondary mx-1.5">•</span>
                        <span className="text-secondary/70 text-[10px]">{new Date(o.created_at).toLocaleDateString('ar-SY')}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 self-end">
                        <button
                          onClick={() => importCustomer(o)}
                          disabled={importingRecentOrder !== null}
                          className="px-2 py-1 rounded bg-secondary/10 text-secondary hover:bg-secondary/20 transition-all font-bold text-[10px]"
                        >
                          استيراد العميل
                        </button>
                        <button
                          onClick={() => importProducts(o)}
                          disabled={importingRecentOrder !== null}
                          className="px-2 py-1 rounded bg-[#bfa15f]/15 text-[#785600] hover:bg-[#bfa15f]/25 transition-all font-bold text-[10px] flex items-center gap-1"
                        >
                          {importingRecentOrder === o.id ? <Loader2 size={10} className="animate-spin" /> : null}
                          استيراد المنتجات
                        </button>
                        <button
                          onClick={() => importEntireOrder(o)}
                          disabled={importingRecentOrder !== null}
                          className="px-2 py-1 rounded bg-primary text-white hover:bg-primary/95 transition-all font-bold text-[10px]"
                        >
                          استيراد بالكامل
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                    <p className="text-xs font-label text-secondary">
                      {formatCurrency(currency === 'USD' ? (p.discount_price_usd ?? p.price_usd) : (p.discount_price_syp ?? p.price_syp), currency)}
                    </p>
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
                  <div key={l.id} className="flex flex-col gap-2 p-2.5 rounded-xl bg-surface-container-low/40">
                    {/* Row 1: name + price + delete */}
                    <div className="flex items-center gap-2">
                      <p className="flex-1 min-w-0 text-sm font-arabic font-semibold text-on-surface truncate">{l.name}</p>
                      <span className="text-xs font-label text-on-surface shrink-0">
                        {formatCurrency((isUSD ? l.unit_price_usd : l.unit_price_syp) * l.quantity, currency)}
                      </span>
                      <button onClick={() => removeLine(l.id)} className="text-error hover:bg-error-container/30 rounded-lg p-1.5 transition shrink-0">
                        <Trash2 size={15} />
                      </button>
                    </div>
                    {/* Row 2: color / size / quantity selectors */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {l.availColors.length > 0 && (
                        <select
                          value={l.color ?? ''}
                          onChange={(e) => updateColor(l.id, e.target.value)}
                          className="rounded-lg border border-outline-variant/50 bg-white px-2 py-1.5 text-xs font-arabic text-on-surface"
                        >
                          {colorOptionsFor(l, isReservation).map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      )}
                      {l.availSizes.length > 0 && (
                        <select
                          value={l.size ?? ''}
                          onChange={(e) => updateSize(l.id, parseInt(e.target.value))}
                          className="rounded-lg border border-outline-variant/50 bg-white px-2 py-1.5 text-xs font-arabic text-on-surface"
                        >
                          {sizeOptionsFor(l, l.color, isReservation).map((s) => <option key={s} value={s}>مقاس {s}</option>)}
                        </select>
                      )}
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-arabic text-secondary">الكمية:</span>
                        <input
                          type="number" min={1}
                          value={l.quantity}
                          onChange={(e) => updateQty(l.id, parseInt(e.target.value) || 1)}
                          className="w-14 rounded-lg border border-outline-variant/50 px-2 py-1.5 text-sm text-center"
                        />
                      </div>
                      {isReservation ? (
                        <span className="text-[11px] font-arabic px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-700">
                          حجز — متاح: {l.max_stock ?? 0}
                        </span>
                      ) : l.max_stock !== null && (
                        <span className={cn('text-[11px] font-arabic px-1.5 py-0.5 rounded-md', l.max_stock <= 0 ? 'bg-red-50 text-red-600' : l.quantity > l.max_stock ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700')}>
                          متاح: {l.max_stock}
                        </span>
                      )}
                    </div>
                    {/* Row 3: editable unit price (with original reference + reset) */}
                    {(() => {
                      const cur = isUSD ? '$' : 'ل.س'
                      const price = isUSD ? l.unit_price_usd : l.unit_price_syp
                      const orig = isUSD ? l.orig_price_usd : l.orig_price_syp
                      const changed = price !== orig
                      return (
                        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-outline-variant/20">
                          <span className="text-xs font-arabic text-secondary">سعر القطعة ({cur}):</span>
                          <input
                            type="number" min={0}
                            value={price}
                            onChange={(e) => updatePrice(l.id, parseFloat(e.target.value))}
                            className={cn('w-24 rounded-lg border px-2 py-1.5 text-sm text-center font-label transition',
                              changed ? 'border-primary/60 bg-primary/5 text-primary font-bold' : 'border-outline-variant/50')}
                          />
                          {changed && (
                            <>
                              <span className="text-[11px] font-label text-secondary/60 line-through">{orig.toLocaleString()}</span>
                              <button onClick={() => resetPrice(l.id)} className="text-[11px] font-arabic text-primary hover:underline">↺ الأصلي</button>
                            </>
                          )}
                          <span className="mr-auto text-xs font-label font-bold text-on-surface">= {(price * l.quantity).toLocaleString()} {cur}</span>
                        </div>
                      )
                    })()}
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
            <select
              value={governorate}
              onChange={(e) => { setGovernorate(e.target.value); setAddress(''); setCenterName(''); setShippingCompany(''); setShippingFeeTouched(false) }}
              className={FIELD}
            >
              <option value="">المحافظة *</option>
              {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-ambient border border-outline-variant/20 flex flex-col gap-3">
            <span className="text-sm font-arabic font-bold text-on-surface">تفاصيل الطلب</span>

            {/* Ghost / reservation order toggle */}
            <label className={cn('flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition', isReservation ? 'border-violet-400 bg-violet-50' : 'border-outline-variant/50 bg-white hover:bg-surface-container-low/40')}>
              <input
                type="checkbox"
                checked={isReservation}
                onChange={(e) => setIsReservation(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-violet-600"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-arabic font-bold text-on-surface">🔖 طلب وهمي (حجز مبدئي)</span>
                <span className="text-[11px] font-arabic text-secondary leading-relaxed">
                  لا يُخصم من المخزون، ويسمح بإضافة مقاسات غير متوفرة. يمكن حذفه لاحقاً أو تثبيته فيتحوّل لطلب عادي ويُخصم من الجرد.
                </span>
              </span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <select
                value={currency}
                onChange={(e) => {
                  const newCurrency = e.target.value as Currency
                  // Reset item prices to original DB prices of the new currency
                  setCart((prev) => prev.map((l) => ({
                    ...l,
                    unit_price_syp: l.orig_price_syp,
                    unit_price_usd: l.orig_price_usd
                  })))
                  // Reset shipping fee touched flag so it recalculates automatically in new currency
                  setShippingFeeTouched(false)
                  setCurrency(newCurrency)
                }}
                className={FIELD}
              >
                <option value="SYP">ليرة سورية</option>
                <option value="USD">دولار</option>
              </select>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={FIELD}>
                <option value="cod">الدفع عند الاستلام</option>
                <option value="sham_cash">شام كاش</option>
              </select>
            </div>

            {/* Delivery type */}
            <select
              value={deliveryType}
              onChange={(e) => { setDeliveryType(e.target.value as any); setAddress(''); setCenterName(''); setShippingCompany(''); setShippingFeeTouched(false) }}
              className={FIELD}
            >
              <option value="shipping">شحن للمحافظات</option>
              <option value="delivery">توصيل عادي (حلب)</option>
            </select>

            {deliveryType === 'delivery' ? (
              /* Aleppo delivery → free-text address */
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="العنوان التفصيلي *"
                className={FIELD}
              />
            ) : (
              <>
                {/* Step 1: center/branch (becomes the address) */}
                {!governorate ? (
                  <div className="rounded-xl border border-dashed border-outline-variant/50 px-3 py-2.5 text-sm font-arabic text-secondary text-center">
                    اختر المحافظة أولاً لعرض المراكز
                  </div>
                ) : loadingCenters ? (
                  <div className="flex items-center justify-center py-2"><Loader2 className="animate-spin text-primary" size={16} /></div>
                ) : centers.length > 0 ? (
                  <select value={address} onChange={(e) => handleSelectCenter(e.target.value)} className={FIELD}>
                    <option value="">اختر المركز *</option>
                    {centers.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                ) : (
                  <input
                    value={address}
                    onChange={(e) => { setAddress(e.target.value); setCenterName(e.target.value) }}
                    placeholder="اكتب اسم المركز / العنوان *"
                    className={FIELD}
                  />
                )}

                {/* Step 2: company — only the ones the chosen center supports */}
                {address ? (
                  <select value={shippingCompany} onChange={(e) => setShippingCompany(e.target.value)} className={FIELD}>
                    <option value="">شركة الشحن *</option>
                    {companyOptions.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </select>
                ) : (
                  <div className="rounded-xl border border-dashed border-outline-variant/50 px-3 py-2.5 text-xs font-arabic text-secondary text-center">
                    اختر المركز لعرض شركات الشحن المتاحة له
                  </div>
                )}
              </>
            )}

            <div className="flex flex-col gap-1">
              <input
                type="number" min={0}
                value={shippingFee}
                onChange={(e) => { setShippingFee(e.target.value); setShippingFeeTouched(true) }}
                placeholder={`رسوم الشحن (${currency === 'USD' ? 'دولار' : 'ل.س'})`}
                className={FIELD}
              />
              <div className="flex items-center gap-2 px-1">
                {feeDetermined ? (
                  <span className="text-[11px] font-arabic text-amber-700">تُحدّد أجرة الشحن مع البائع (4 قطع فأكثر)</span>
                ) : (
                  <span className="text-[11px] font-arabic text-secondary/70">
                    {shippingFeeTouched ? 'رسوم مُعدّلة يدوياً' : 'محسوبة تلقائياً حسب المحافظة وعدد القطع'}
                  </span>
                )}
                {shippingFeeTouched && (
                  <button
                    type="button"
                    onClick={() => setShippingFeeTouched(false)}
                    className="text-[11px] font-arabic text-primary hover:underline"
                  >
                    ↺ تلقائي
                  </button>
                )}
              </div>
            </div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات (اختياري)" rows={2} className={FIELD} />
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl p-4 shadow-ambient border border-outline-variant/20 flex flex-col gap-2">
            <div className="flex justify-between text-sm font-arabic text-secondary">
              <span>المجموع الفرعي</span><span className="font-label text-on-surface">{money(subtotal)}</span>
            </div>
            {multiItemDiscount > 0 && (
              <div className="flex justify-between text-sm font-arabic text-primary font-bold">
                <span>خصم تعدد القطع</span><span className="font-label text-primary">-{money(multiItemDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-arabic text-secondary">
              <span>رسوم الشحن</span><span className="font-label text-on-surface">{money(feeNum)}</span>
            </div>
            <div className="flex justify-between text-base font-arabic font-black text-on-surface border-t border-outline-variant/30 pt-2 mt-1">
              <span>الإجمالي</span><span className="font-label text-primary">{money(total)}</span>
            </div>
            <p className="text-[11px] font-arabic text-secondary/70 mt-1">* الأسعار من قاعدة البيانات، بالإضافة لخصم تعدد القطع (إن وجد) وبدون أي خصومات أخرى أو نقاط ولاء.</p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={cn('w-full py-3 rounded-2xl text-white font-arabic font-bold transition disabled:opacity-60 flex items-center justify-center gap-2',
              isReservation ? 'bg-violet-600 hover:bg-violet-600/90' : 'bg-primary hover:bg-primary/90')}
          >
            {submitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
            {isReservation ? 'إنشاء حجز مبدئي' : 'تأكيد إنشاء الطلبية'}
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}
