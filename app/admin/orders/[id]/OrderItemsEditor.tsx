'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NextImage from 'next/image'
import toast from 'react-hot-toast'
import { Edit2, X, Check, Loader2, Search, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrderFull } from '@/types'

interface EditLine {
  uid: string
  product_id: string
  name: string
  image: string | null
  color: string | null
  size: number | null
  quantity: number
  unit_price_syp: number
  unit_price_usd: number
  availColors: string[]
  availSizes: number[]
  variants: { color: string; size: number; quantity: number }[]
  max_stock: number | null
}

interface SearchProduct {
  id: string
  name: string
  price_syp: number
  price_usd: number
  discount_price_syp: number | null
  discount_price_usd: number | null
  images: { url: string; is_main: boolean }[]
  colors: { name_ar: string; is_available: boolean }[]
  sizes: { size: number; is_available: boolean }[]
  variants: { id?: string; color: string; size: number; quantity: number }[]
}

const norm = (s: string | null) => (s || '').trim()

function stockFor(variants: EditLine['variants'], color: string | null, size: number | null): number | null {
  if (variants.length === 0) return null
  const v = variants.find((x) => norm(x.color) === norm(color) && (x.size || 0) === (size || 0))
  return v ? v.quantity : 0
}
function colorOptionsFor(line: Pick<EditLine, 'variants' | 'availColors'>): string[] {
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
function sizeOptionsFor(line: Pick<EditLine, 'variants' | 'availSizes'>, color: string | null): number[] {
  if (line.variants.length > 0) {
    const sizes = line.variants.filter((v) => norm(v.color) === norm(color) && v.quantity > 0).map((v) => v.size)
    const uniq = Array.from(new Set(sizes)).sort((a, b) => a - b)
    return uniq.length ? uniq : line.availSizes
  }
  return line.availSizes
}

export default function OrderItemsEditor({ order }: { order: OrderFull }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lines, setLines] = useState<EditLine[]>([])

  const [searchInput, setSearchInput] = useState('')
  const [results, setResults] = useState<SearchProduct[]>([])
  const [searching, setSearching] = useState(false)

  const isUSD = order.currency_used === 'USD'

  // ── Open: load each product's variant data, pooling in this order's held qty ──
  async function openEditor() {
    setOpen(true)
    setLoading(true)
    try {
      const pids = Array.from(new Set(order.items.map((i) => i.product_id).filter(Boolean) as string[]))
      const products = await Promise.all(
        pids.map((pid) => fetch(`/api/products/${pid}`).then((r) => (r.ok ? r.json() : null)).then((d) => d?.product))
      )
      const meta = new Map<string, SearchProduct>()
      products.forEach((p) => { if (p) meta.set(p.id, p) })

      // Quantities currently held by THIS order (returned to the pool when editing)
      const held = new Map<string, number>()
      for (const it of order.items) {
        const k = `${it.product_id}|${norm(it.color)}|${it.size || 0}`
        held.set(k, (held.get(k) || 0) + it.quantity)
      }

      const initial: EditLine[] = order.items.map((it, idx) => {
        const p = meta.get(it.product_id as string)
        const availColors = (p?.colors || []).filter((c) => c.is_available).map((c) => c.name_ar)
        const availSizes = (p?.sizes || []).filter((s) => s.is_available).map((s) => s.size)
        // Pool: add this order's held qty back into the matching variant
        const variants = (p?.variants || []).map((v) => {
          const k = `${it.product_id}|${norm(v.color)}|${v.size || 0}`
          const extra = norm(v.color) === norm(it.color) && (v.size || 0) === (it.size || 0) ? (held.get(k) || 0) : 0
          return { color: v.color, size: v.size, quantity: (v.quantity ?? 0) + extra }
        })
        const image = (p?.images || []).find((im) => im.is_main)?.url || (p?.images || [])[0]?.url || it.product_image || null
        return {
          uid: `${it.id}-${idx}`,
          product_id: it.product_id as string,
          name: it.product_name,
          image,
          color: it.color,
          size: it.size,
          quantity: it.quantity,
          unit_price_syp: it.unit_price_syp,
          unit_price_usd: it.unit_price_usd,
          availColors,
          availSizes,
          variants,
          max_stock: stockFor(variants, it.color, it.size),
        }
      })
      setLines(initial)
    } catch {
      toast.error('تعذر تحميل بيانات المنتجات')
    } finally {
      setLoading(false)
    }
  }

  async function doSearch(q: string) {
    if (q.trim().length < 2) { setResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=10`)
      const data = await res.json()
      setResults(data.products ?? [])
    } catch { /* ignore */ } finally { setSearching(false) }
  }

  function addProduct(p: SearchProduct) {
    const availColors = p.colors.filter((c) => c.is_available).map((c) => c.name_ar)
    const availSizes = p.sizes.filter((s) => s.is_available).map((s) => s.size)
    const variants = p.variants.map((v) => ({ color: v.color, size: v.size, quantity: v.quantity }))
    const meta = { availColors, availSizes, variants }
    const color = colorOptionsFor(meta)[0] ?? null
    const size = sizeOptionsFor(meta, color)[0] ?? null
    setLines((prev) => [
      ...prev,
      {
        uid: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        product_id: p.id,
        name: p.name,
        image: p.images.find((i) => i.is_main)?.url || p.images[0]?.url || null,
        color, size, quantity: 1,
        unit_price_syp: p.discount_price_syp ?? p.price_syp,
        unit_price_usd: p.discount_price_usd ?? p.price_usd,
        availColors, availSizes, variants,
        max_stock: stockFor(variants, color, size),
      },
    ])
    toast.success('تمت الإضافة')
  }

  const updateQty = (uid: string, qty: number) => setLines((p) => p.map((l) => (l.uid === uid ? { ...l, quantity: Math.max(1, qty) } : l)))
  const removeLine = (uid: string) => setLines((p) => p.filter((l) => l.uid !== uid))
  const updateColor = (uid: string, color: string) => setLines((p) => p.map((l) => {
    if (l.uid !== uid) return l
    const sizes = sizeOptionsFor(l, color)
    const newSize = l.size != null && sizes.includes(l.size) ? l.size : (sizes[0] ?? null)
    return { ...l, color, size: newSize, max_stock: stockFor(l.variants, color, newSize) }
  }))
  const updateSize = (uid: string, size: number) => setLines((p) => p.map((l) => (l.uid === uid ? { ...l, size, max_stock: stockFor(l.variants, l.color, size) } : l)))

  const subtotal = lines.reduce((s, l) => s + (isUSD ? l.unit_price_usd : l.unit_price_syp) * l.quantity, 0)

  async function handleSave() {
    if (lines.length === 0) { toast.error('يجب إبقاء منتج واحد على الأقل'); return }
    // Client-side stock check (merge identical variants)
    const merged = new Map<string, { quantity: number; max_stock: number | null; name: string }>()
    for (const l of lines) {
      const k = `${l.product_id}|${norm(l.color)}|${l.size || 0}`
      const e = merged.get(k)
      if (e) e.quantity += l.quantity
      else merged.set(k, { quantity: l.quantity, max_stock: l.max_stock, name: l.name })
    }
    for (const m of Array.from(merged.values())) {
      if (m.max_stock !== null && m.quantity > m.max_stock) {
        toast.error(`الكمية المطلوبة من "${m.name}" (${m.quantity}) تتجاوز المتاح (${m.max_stock})`)
        return
      }
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: lines.map((l) => ({ product_id: l.product_id, color: l.color, size: l.size, quantity: l.quantity })) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل الحفظ')
      toast.success('تم تحديث منتجات الطلب وتصحيح المخزون')
      setOpen(false)
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || 'حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={openEditor}
        className="flex items-center gap-2 text-xs font-arabic font-medium text-primary hover:text-primary-container transition-colors"
      >
        <Edit2 size={14} /> تعديل المنتجات
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" dir="rtl">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/40 shrink-0">
          <h2 className="text-base font-arabic font-bold text-on-surface">تعديل منتجات الطلب</h2>
          <button onClick={() => setOpen(false)} className="text-secondary hover:text-on-surface"><X size={20} /></button>
        </div>

        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={24} /></div>
          ) : (
            <>
              {/* Search to add */}
              <div>
                <div className="relative flex items-center mb-2">
                  <Search size={15} className="absolute right-3 text-secondary pointer-events-none" />
                  <input
                    value={searchInput}
                    onChange={(e) => { setSearchInput(e.target.value); doSearch(e.target.value) }}
                    placeholder="ابحث لإضافة منتج..."
                    className="w-full rounded-xl border border-outline-variant/50 bg-white pr-9 pl-3 py-2.5 text-sm font-arabic focus:outline-none focus:border-primary/60"
                  />
                </div>
                {searching && <div className="flex justify-center py-2"><Loader2 className="animate-spin text-primary" size={16} /></div>}
                {results.length > 0 && (
                  <div className="flex flex-col gap-1 max-h-40 overflow-y-auto border border-outline-variant/30 rounded-xl p-1">
                    {results.map((p) => (
                      <button key={p.id} onClick={() => addProduct(p)} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-container-low/50 text-right transition">
                        <div className="h-9 w-9 rounded-lg bg-surface-container overflow-hidden shrink-0 relative">
                          {(p.images.find((i) => i.is_main)?.url || p.images[0]?.url) && (
                            <NextImage src={p.images.find((i) => i.is_main)?.url || p.images[0].url} alt={p.name} fill className="object-cover" sizes="36px" />
                          )}
                        </div>
                        <span className="flex-1 text-xs font-arabic text-on-surface truncate">{p.name}</span>
                        <Plus size={14} className="text-primary shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Editable lines */}
              <div className="flex flex-col gap-2">
                {lines.map((l) => (
                  <div key={l.uid} className="flex flex-col gap-2 p-2.5 rounded-xl bg-surface-container-low/40">
                    <div className="flex items-center gap-2">
                      <p className="flex-1 min-w-0 text-sm font-arabic font-semibold text-on-surface truncate">{l.name}</p>
                      <button onClick={() => removeLine(l.uid)} className="text-error hover:bg-error-container/30 rounded-lg p-1.5 transition shrink-0"><Trash2 size={15} /></button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {l.availColors.length > 0 && (
                        <select value={l.color ?? ''} onChange={(e) => updateColor(l.uid, e.target.value)} className="rounded-lg border border-outline-variant/50 bg-white px-2 py-1.5 text-xs font-arabic">
                          {colorOptionsFor(l).map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      )}
                      {l.availSizes.length > 0 && (
                        <select value={l.size ?? ''} onChange={(e) => updateSize(l.uid, parseInt(e.target.value))} className="rounded-lg border border-outline-variant/50 bg-white px-2 py-1.5 text-xs font-arabic">
                          {sizeOptionsFor(l, l.color).map((s) => <option key={s} value={s}>مقاس {s}</option>)}
                        </select>
                      )}
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-arabic text-secondary">الكمية:</span>
                        <input type="number" min={1} value={l.quantity} onChange={(e) => updateQty(l.uid, parseInt(e.target.value) || 1)} className="w-14 rounded-lg border border-outline-variant/50 px-2 py-1.5 text-sm text-center" />
                      </div>
                      {l.max_stock !== null && (
                        <span className={cn('text-[11px] font-arabic px-1.5 py-0.5 rounded-md', l.quantity > l.max_stock ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700')}>
                          متاح: {l.max_stock}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {lines.length === 0 && <p className="text-center text-sm font-arabic text-secondary py-4">لا منتجات — أضف منتجاً واحداً على الأقل</p>}
              </div>
            </>
          )}
        </div>

        <div className="px-5 py-3 border-t border-outline-variant/30 shrink-0 flex flex-col gap-3 bg-surface-container-lowest">
          <div className="flex justify-between text-sm font-arabic">
            <span className="text-secondary">المجموع الفرعي الجديد</span>
            <span className="font-label font-bold text-on-surface">{subtotal.toLocaleString()} {isUSD ? '$' : 'ل.س'}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSave} disabled={saving || loading} className="flex-1 h-11 rounded-xl bg-primary text-white font-arabic font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition disabled:opacity-60">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} حفظ وتصحيح المخزون
            </button>
            <button onClick={() => setOpen(false)} disabled={saving} className="flex-1 h-11 rounded-xl bg-surface-container-highest text-on-surface font-arabic font-bold hover:bg-outline-variant/20 transition disabled:opacity-50">إلغاء</button>
          </div>
        </div>
      </div>
    </div>
  )
}
