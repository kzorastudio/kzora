'use client'

import { useEffect, useState } from 'react'
import { Truck, Plus, Trash2, Save, ChevronDown, ChevronUp, Star, ToggleLeft, ToggleRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import AdminHeader from '@/components/admin/AdminHeader'

const ALL_GOVERNORATES = [
  'دمشق', 'ريف دمشق', 'حلب', 'ريف حلب', 'حمص', 'حماة', 'اللاذقية', 'طرطوس',
  'إدلب', 'الحسكة', 'دير الزور', 'الرقة', 'السويداء', 'درعا', 'القنيطرة',
]

interface ShippingMethod {
  id: string
  slug: string
  name: string
  description: string
  badge: string | null
  is_active: boolean
  sort_order: number
  shipping_governorates: { governorate_name: string; is_active: boolean; branch_addresses?: string | null }[]
}

export default function AdminShippingPage() {
  const [methods, setMethods] = useState<ShippingMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  // Centers state
  const [centers, setCenters] = useState<any[]>([])
  const [loadingCenters, setLoadingCenters] = useState(false)
  const [expandedCenterId, setExpandedCenterId] = useState<string | null>(null)
  const [savingCenter, setSavingCenter] = useState<string | null>(null)

  // New center form
  const [showNewCenter, setShowNewCenter] = useState(false)
  const [newCenterName, setNewCenterName] = useState('')
  const [newCenterGov, setNewCenterGov] = useState('حلب')
  const [newCenterCompanies, setNewCenterCompanies] = useState<string[]>([])

  // New company form
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newBadge, setNewBadge] = useState('')
  const [newGovs, setNewGovs] = useState<{ name: string; branches: string }[]>([])

  // Auto-generate slug from name
  function generateSlug(name: string): string {
    // 1. Extract English text in parentheses if present, e.g. "كرم (Karam)" → "karam"
    const engMatch = name.match(/\(([^)]+)\)/)
    if (engMatch) {
      return engMatch[1].trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    }
    // 2. Extract any English words from the name
    const engWords = name.match(/[a-zA-Z]+/g)
    if (engWords && engWords.length > 0) {
      return engWords.join('-').toLowerCase()
    }
    // 3. Pure Arabic — generate a clean unique slug
    return `shipping-${Date.now().toString(36)}`
  }

  async function loadCenters() {
    setLoadingCenters(true)
    try {
      const res = await fetch('/api/admin/shipping/centers')
      const data = await res.json()
      setCenters(data.centers || [])
    } catch { /* ignore */ }
    setLoadingCenters(false)
  }

  async function loadMethods() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/shipping')
      const data = await res.json()
      setMethods(data.methods || [])
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { 
    loadMethods()
    loadCenters()
  }, [])

  async function handleSave(method: ShippingMethod) {
    setSaving(method.id)
    try {
      const govs = method.shipping_governorates
        .filter(g => g.is_active)
        .map(g => ({
          name: g.governorate_name,
          branch_addresses: g.branch_addresses
        }))

      const res = await fetch('/api/admin/shipping', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: method.id,
          slug: method.slug,
          name: method.name,
          description: method.description,
          badge: method.badge,
          is_active: method.is_active,
          governorates: govs,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('تم حفظ التعديلات')
      loadMethods()
    } catch {
      toast.error('حدث خطأ')
    }
    setSaving(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف شركة الشحن هذه؟')) return
    try {
      const res = await fetch('/api/admin/shipping', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error()
      toast.success('تم الحذف')
      loadMethods()
    } catch {
      toast.error('حدث خطأ')
    }
  }

  async function handleCreate() {
    if (!newName.trim()) {
      toast.error('أدخل اسم شركة الشحن')
      return
    }
    try {
      const slug = generateSlug(newName)
      const res = await fetch('/api/admin/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          name: newName.trim(),
          description: newDesc.trim(),
          badge: newBadge.trim() || null,
          governorates: newGovs.map(g => ({ name: g.name, branch_addresses: g.branches })),
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('تمت إضافة شركة الشحن')
      setShowNew(false)
      setNewName(''); setNewDesc(''); setNewBadge(''); setNewGovs([])
      loadMethods()
    } catch {
      toast.error('حدث خطأ')
    }
  }

  async function handleCreateCenter() {
    if (!newCenterName.trim()) {
      toast.error('أدخل اسم المنطقة أو المركز')
      return
    }
    try {
      const res = await fetch('/api/admin/shipping/centers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          governorate: newCenterGov,
          name: newCenterName.trim(),
          supported_companies: newCenterCompanies,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('تمت إضافة المنطقة/المركز')
      setShowNewCenter(false)
      setNewCenterName(''); setNewCenterCompanies([])
      loadCenters()
    } catch {
      toast.error('حدث خطأ')
    }
  }

  async function handleSaveCenter(center: any) {
    setSavingCenter(center.id)
    try {
      const res = await fetch('/api/admin/shipping/centers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: center.id,
          governorate: center.governorate,
          name: center.name,
          supported_companies: center.supported_companies,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('تم حفظ التعديلات')
      loadCenters()
    } catch {
      toast.error('حدث خطأ')
    }
    setSavingCenter(null)
  }

  async function handleDeleteCenter(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذه المنطقة؟')) return
    try {
      const res = await fetch('/api/admin/shipping/centers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error()
      toast.success('تم الحذف')
      loadCenters()
    } catch {
      toast.error('حدث خطأ')
    }
  }

  function updateCenter(id: string, partial: any) {
    setCenters(prev => prev.map(c => c.id === id ? { ...c, ...partial } : c))
  }

  function updateMethod(id: string, partial: Partial<ShippingMethod>) {
    setMethods(prev => prev.map(m => m.id === id ? { ...m, ...partial } : m))
  }

  function toggleGov(methodId: string, gov: string) {
    setMethods(prev => prev.map(m => {
      if (m.id !== methodId) return m
      const exists = m.shipping_governorates.find(g => g.governorate_name === gov)
      if (exists) {
        return {
          ...m,
          shipping_governorates: m.shipping_governorates.filter(g => g.governorate_name !== gov),
        }
      }
      return {
        ...m,
        shipping_governorates: [...m.shipping_governorates, { governorate_name: gov, is_active: true, branch_addresses: null }],
      }
    }))
  }

  function updateGovBranches(methodId: string, govName: string, branches: string) {
    setMethods(prev => prev.map(m => {
      if (m.id !== methodId) return m
      return {
        ...m,
        shipping_governorates: m.shipping_governorates.map(g => 
          g.governorate_name === govName ? { ...g, branch_addresses: branches } : g
        )
      }
    }))
  }

  const inputCls = 'w-full h-10 px-3 rounded-lg border border-outline-variant/50 text-sm font-arabic bg-surface focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition'

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen" dir="rtl">
        <AdminHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen" dir="rtl">
      <AdminHeader />
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Truck size={22} className="text-primary" />
          <h1 className="font-arabic text-xl font-bold text-on-surface">شركات الشحن والمناطق</h1>
        </div>
        <button
          onClick={() => setShowNew(!showNew)}
          className={cn(
            'h-9 px-4 rounded-lg flex items-center gap-2 text-sm font-arabic font-semibold transition-all',
            'bg-primary text-on-primary hover:bg-primary/90'
          )}
        >
          <Plus size={16} />
          إضافة شركة
        </button>
      </div>

      {/* New company form */}
      {showNew && (
        <div className="bg-surface rounded-xl border border-outline-variant/30 p-5 space-y-4">
          <h3 className="font-arabic font-bold text-on-surface">شركة شحن جديدة</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-arabic text-secondary mb-1 block">اسم الشركة <span className="text-red-400">*</span></label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="مثال: كرم (Karam)" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-arabic text-secondary mb-1 block">وصف الخدمة</label>
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="توصيل سريع خلال 24-48 ساعة..." className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-arabic text-secondary mb-1 block">شارة مميزة (اختياري)</label>
              <input value={newBadge} onChange={e => setNewBadge(e.target.value)} placeholder="الأفضل" className={inputCls} />
              <p className="text-[10px] font-arabic text-secondary/60 mt-1">تظهر كعلامة صغيرة بجانب اسم الشركة في صفحة الدفع</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-arabic text-secondary mb-2 block">المحافظات المتاحة وتفاصيل العناوين</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ALL_GOVERNORATES.map(gov => {
                const active = newGovs.find(g => g.name === gov)
                return (
                  <div key={gov} className="p-3 rounded-xl border border-outline-variant/30 bg-surface/50 space-y-2">
                    <button
                      type="button"
                      onClick={() => setNewGovs(prev => active ? prev.filter(g => g.name !== gov) : [...prev, { name: gov, branches: '' }])}
                      className={cn(
                        'w-full px-3 py-1.5 rounded-lg text-xs font-arabic border transition-all text-right flex justify-between items-center',
                        active
                          ? 'bg-primary/10 border-primary/40 text-primary font-bold'
                          : 'bg-surface border-outline-variant/30 text-secondary hover:border-primary/30'
                      )}
                    >
                      {gov}
                      {active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    </button>
                    {active && (
                      <textarea
                        placeholder="عناوين الفروع (اختياري - كل عنوان في سطر)"
                        value={active.branches}
                        onChange={e => setNewGovs(prev => prev.map(g => g.name === gov ? { ...g, branches: e.target.value } : g))}
                        className="w-full min-h-[60px] p-2 text-[11px] font-arabic bg-white border border-outline-variant/30 rounded-lg focus:outline-none focus:border-primary/40"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowNew(false)} className="h-9 px-4 rounded-lg text-sm font-arabic text-secondary hover:text-on-surface transition">إلغاء</button>
            <button onClick={handleCreate} className="h-9 px-5 rounded-lg text-sm font-arabic font-bold bg-primary text-on-primary hover:bg-primary/90 transition">إضافة</button>
          </div>
        </div>
      )}

      {/* Methods list */}
      <div className="space-y-4">
        {methods.map(method => {
          const isExpanded = expandedId === method.id
          const govNames = method.shipping_governorates.map(g => g.governorate_name)

          return (
            <div key={method.id} className={cn(
              'bg-surface rounded-xl border transition-all',
              method.is_active ? 'border-outline-variant/30' : 'border-outline-variant/20 opacity-60'
            )}>
              {/* Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer select-none"
                onClick={() => setExpandedId(isExpanded ? null : method.id)}
              >
                <div className="flex items-center gap-3">
                  <Truck size={18} className="text-primary" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-arabic font-bold text-on-surface">{method.name}</span>
                      {method.badge && (
                        <span className="text-[10px] font-arabic font-bold px-1.5 py-0.5 rounded-full bg-primary text-on-primary flex items-center gap-1">
                          <Star size={8} />
                          {method.badge}
                        </span>
                      )}
                      {!method.is_active && (
                        <span className="text-[10px] font-arabic px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">معطّل</span>
                      )}
                    </div>
                    <p className="text-xs font-arabic text-secondary mt-0.5">
                      {govNames.length} محافظة • <span dir="ltr" className="font-body">{method.slug}</span>
                    </p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={18} className="text-secondary" /> : <ChevronDown size={18} className="text-secondary" />}
              </div>

              {/* Expanded editing */}
              {isExpanded && (
                <div className="border-t border-outline-variant/20 p-5 space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-arabic text-secondary mb-1 block">اسم الشركة</label>
                      <input value={method.name} onChange={e => updateMethod(method.id, { name: e.target.value })} className={inputCls} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-arabic text-secondary mb-1 block">وصف الخدمة</label>
                        <input value={method.description || ''} onChange={e => updateMethod(method.id, { description: e.target.value })} className={inputCls} />
                      </div>
                      <div>
                        <label className="text-xs font-arabic text-secondary mb-1 block">شارة مميزة</label>
                        <input value={method.badge || ''} onChange={e => updateMethod(method.id, { badge: e.target.value || null })} placeholder="الأفضل" className={inputCls} />
                      </div>
                    </div>
                  </div>

                  {/* Active toggle */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateMethod(method.id, { is_active: !method.is_active })}
                      className="flex items-center gap-2 text-sm font-arabic"
                    >
                      {method.is_active
                        ? <ToggleRight size={24} className="text-primary" />
                        : <ToggleLeft size={24} className="text-secondary" />
                      }
                      <span className={method.is_active ? 'text-primary font-bold' : 'text-secondary'}>
                        {method.is_active ? 'مفعّل' : 'معطّل'}
                      </span>
                    </button>
                  </div>

                  {/* Governorates */}
                  <div>
                    <label className="text-xs font-arabic text-secondary mb-2 block">المحافظات المتاحة وتفاصيل العناوين</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ALL_GOVERNORATES.map(gov => {
                        const active = method.shipping_governorates.find(g => g.governorate_name === gov)
                        return (
                          <div key={gov} className="p-3 rounded-xl border border-outline-variant/30 bg-surface/50 space-y-2">
                            <button
                              type="button"
                              onClick={() => toggleGov(method.id, gov)}
                              className={cn(
                                'w-full px-3 py-1.5 rounded-lg text-xs font-arabic border transition-all text-right flex justify-between items-center',
                                active
                                  ? 'bg-primary/10 border-primary/40 text-primary font-bold'
                                  : 'bg-surface border-outline-variant/30 text-secondary hover:border-primary/30'
                              )}
                            >
                              {gov}
                              {active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                            </button>
                            {active && (
                              <textarea
                                placeholder="عناوين الفروع (اختياري - كل عنوان في سطر)"
                                value={active.branch_addresses || ''}
                                onChange={e => updateGovBranches(method.id, gov, e.target.value)}
                                className="w-full min-h-[60px] p-2 text-[11px] font-arabic bg-white border border-outline-variant/30 rounded-lg focus:outline-none focus:border-primary/40"
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => handleDelete(method.id)}
                      className="flex items-center gap-1.5 text-xs font-arabic text-red-500 hover:text-red-700 transition"
                    >
                      <Trash2 size={14} />
                      حذف الشركة
                    </button>
                    <button
                      onClick={() => handleSave(method)}
                      disabled={saving === method.id}
                      className={cn(
                        'h-9 px-5 rounded-lg flex items-center gap-2 text-sm font-arabic font-bold transition-all',
                        'bg-primary text-on-primary hover:bg-primary/90',
                        'disabled:opacity-60 disabled:cursor-not-allowed'
                      )}
                    >
                      <Save size={14} />
                      {saving === method.id ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* SECTION 2: Shipping Centers */}
      <div className="pt-10 space-y-6">
        <div className="flex items-center justify-between border-t border-outline-variant/30 pt-8">
          <div className="flex items-center gap-3">
            <Plus size={22} className="text-secondary" />
            <h2 className="font-arabic text-xl font-bold text-on-surface">إدارة المناطق والمراكز</h2>
          </div>
          <button
            onClick={() => setShowNewCenter(!showNewCenter)}
            className="h-9 px-4 rounded-lg flex items-center gap-2 text-sm font-arabic font-semibold bg-secondary text-on-secondary hover:bg-secondary/90 transition-all text-white bg-slate-600"
          >
            <Plus size={16} />
            إضافة منطقة
          </button>
        </div>

        {/* New Center Form */}
        {showNewCenter && (
          <div className="bg-surface rounded-xl border border-outline-variant/30 p-5 space-y-4">
            <h3 className="font-arabic font-bold text-on-surface">إضافة منطقة أو مركز جديد</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-arabic text-secondary mb-1 block">المحافظة</label>
                <select value={newCenterGov} onChange={e => setNewCenterGov(e.target.value)} className={inputCls}>
                  {ALL_GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-arabic text-secondary mb-1 block">اسم المنطقة / المركز</label>
                <input value={newCenterName} onChange={e => setNewCenterName(e.target.value)} placeholder="مثال: عفرين (ريف)" className={inputCls} />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-arabic text-secondary mb-2 block">شركات الشحن المدعومة لهذه المنطقة</label>
              <div className="flex flex-wrap gap-2">
                {methods.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setNewCenterCompanies(prev => prev.includes(m.slug) ? prev.filter(s => s !== m.slug) : [...prev, m.slug])}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-arabic transition-all border',
                      newCenterCompanies.includes(m.slug) 
                        ? 'bg-primary/20 border-primary text-primary' 
                        : 'bg-surface border-outline-variant/30 text-secondary'
                    )}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-arabic text-secondary/60 mt-1">إذا لم يتم اختيار أي شركة في حلب، سيتم اعتبارها منطقة توصيل منزلي فقط.</p>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowNewCenter(false)} className="h-9 px-4 rounded-lg text-sm font-arabic">إلغاء</button>
              <button onClick={handleCreateCenter} className="h-9 px-5 rounded-lg text-sm font-arabic font-bold bg-primary text-white bg-slate-900">حفظ</button>
            </div>
          </div>
        )}

        {/* Centers List */}
        <div className="grid grid-cols-1 gap-3">
          {centers.map(center => {
            const isExp = expandedCenterId === center.id
            return (
              <div key={center.id} className="bg-surface rounded-xl border border-outline-variant/20 overflow-hidden">
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-surface-variant/10 transition"
                  onClick={() => setExpandedCenterId(isExp ? null : center.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-outline-variant/20 text-[10px] font-arabic font-bold text-secondary">{center.governorate}</span>
                    <span className="font-arabic font-semibold text-on-surface">{center.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-arabic text-secondary/70">
                      {center.supported_companies?.length || 0} شركات مدعومة
                    </span>
                    {isExp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {isExp && (
                  <div className="p-4 border-t border-outline-variant/10 bg-surface/50 space-y-4">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-arabic text-secondary mb-1 block">المحافظة</label>
                          <select value={center.governorate} onChange={e => updateCenter(center.id, { governorate: e.target.value })} className={inputCls}>
                            {ALL_GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-arabic text-secondary mb-1 block">الاسم</label>
                          <input value={center.name} onChange={e => updateCenter(center.id, { name: e.target.value })} className={inputCls} />
                        </div>
                     </div>

                     <div>
                        <label className="text-xs font-arabic text-secondary mb-2 block">الشركات المدعومة</label>
                        <div className="flex flex-wrap gap-2">
                          {methods.map(m => (
                            <button
                              key={m.id}
                              onClick={() => {
                                const exist = center.supported_companies?.includes(m.slug)
                                const next = exist 
                                  ? center.supported_companies.filter((s: string) => s !== m.slug)
                                  : [...(center.supported_companies || []), m.slug]
                                updateCenter(center.id, { supported_companies: next })
                              }}
                              className={cn(
                                'px-3 py-1.5 rounded-full text-[11px] font-arabic transition-all border',
                                center.supported_companies?.includes(m.slug) 
                                  ? 'bg-primary/20 border-primary text-primary font-bold' 
                                  : 'bg-white border-outline-variant/30 text-secondary'
                              )}
                            >
                              {m.name}
                            </button>
                          ))}
                        </div>
                     </div>

                     <div className="flex items-center justify-between pt-2">
                        <button onClick={() => handleDeleteCenter(center.id)} className="text-xs font-arabic text-red-500 flex items-center gap-1">
                          <Trash2 size={12} /> حذف
                        </button>
                        <button 
                          onClick={() => handleSaveCenter(center)} 
                          disabled={savingCenter === center.id}
                          className="h-8 px-4 rounded-lg bg-primary text-white text-xs font-arabic font-bold bg-slate-900 disabled:opacity-50"
                        >
                          {savingCenter === center.id ? 'جارٍ الحفظ...' : 'حفظ'}
                        </button>
                     </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
        </div>
      </div>
    </div>
  )
}
