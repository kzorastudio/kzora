'use client'

import { useState, useEffect } from 'react'
import { FileText, Save, Loader2, CheckCircle, ExternalLink } from 'lucide-react'
import AdminHeader from '@/components/admin/AdminHeader'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

const PAGE_LIST = [
  {
    slug: 'about',
    label: 'من نحن',
    titleHint: 'يظهر كعنوان كبير في منتصف الصفحة أعلى الهيرو',
    contentHint: 'يظهر في قسم "قصتنا الحقيقية" كفقرات نصية — افصل بين الفقرات بسطر فارغ',
    contentPlaceholder: 'اكتب قصة المتجر هنا...\n\nكل فقرة مفصولة بسطر فارغ ستظهر كفقرة مستقلة.',
    previewUrl: '/about',
  },
  {
    slug: 'returns-exchanges',
    label: 'سياسة الإرجاع والاستبدال',
    titleHint: 'يظهر كعنوان رئيسي في أعلى الصفحة',
    contentHint: 'كل سطر فارغ يقوم بإنشاء فقرة وشروط جديدة في قسم "التفاصيل والشروط"',
    contentPlaceholder: 'يحق لك إرجاع أو استبدال المنتج خلال 7 أيام من تاريخ الاستلام.\n\nيُشترط أن يكون المنتج بحالته الأصلية تماماً وغير مستخدم أو ملبوس، وأن يكون بغلافه وعبوته الأصلية.\n\nفي حال الاستبدال بمنتج آخر ذي تكلفة مختلفة، سيتم تسوية فارق السعر بشكل آمن ومريح لك.\n\nللبدء بطلب الإرجاع أو الاستبدال، يُرجى التواصل معنا عبر واتساب وتزويدنا برقم الطلب.',
    previewUrl: '/returns-exchanges',
  },
  {
    slug: 'privacy-policy',
    label: 'سياسة الخصوصية',
    titleHint: 'يظهر كعنوان رئيسي أعلى الصفحة',
    contentHint: 'كل فقرة مفصولة بسطر فارغ ستظهر كبطاقة مستقلة في قسم "البنود والسياسات" — اكتب كل بند في فقرة مستقلة',
    contentPlaceholder: 'نحن في كزورا نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية.\n\nالبيانات التي نجمعها تُستخدم فقط لمعالجة طلباتك وتحسين تجربة التسوق.\n\nلا نشارك بياناتك مع أي طرف ثالث دون إذنك الصريح.',
    previewUrl: '/privacy-policy',
  },
]

interface PageData {
  slug: string
  title: string
  content: string
  meta?: any
}

export default function AdminPagesPage() {
  const [activeSlug, setActiveSlug] = useState(PAGE_LIST[0].slug)
  const [pages, setPages] = useState<Record<string, PageData>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedSlug, setSavedSlug] = useState<string | null>(null)

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      const results: Record<string, PageData> = {}
      await Promise.all(
        PAGE_LIST.map(async ({ slug, label }) => {
          try {
            const res = await fetch(`/api/pages/${slug}`)
            if (res.ok) {
              const data = await res.json()
              const pageMeta = data.page?.meta || {}
              if (slug === 'returns-exchanges' && !pageMeta.features) {
                // Default features fallback strictly for the editor locally
                pageMeta.features = [
                  { count: '٧ أيام', label: 'فترة الإرجاع', desc: 'يحق لك الإرجاع أو الاستبدال خلال 7 أيام من استلام الطلب' },
                  { count: 'غير مستخدم', label: 'شرط للاسترجاع', desc: 'يجب أن يكون المنتج بحالته الأصلية تماماً وبعلبته الأساسية' },
                  { count: '٤٨ ساعة', label: 'سرعة الإنجاز', desc: 'تتم معالجة الطلب واسترداد المبلغ فور فحص المنتج المسترجع' },
                ]
              }
              results[slug] = { slug, title: data.page?.title ?? label, content: data.page?.content ?? '', meta: pageMeta }
            } else {
              results[slug] = { slug, title: label, content: '' }
            }
          } catch {
            results[slug] = { slug, title: label, content: '' }
          }
        })
      )
      setPages(results)
      setLoading(false)
    }
    loadAll()
  }, [])

  const current = pages[activeSlug]
  const activePage = PAGE_LIST.find(p => p.slug === activeSlug)!

  function handleChange(field: 'title' | 'content' | 'meta', val: any) {
    setPages(prev => ({ ...prev, [activeSlug]: { ...prev[activeSlug], [field]: val } }))
  }

  async function handleSave() {
    if (!current) return
    setSaving(true)
    try {
      const res = await fetch(`/api/pages/${activeSlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: current.title, content: current.content, meta: current.meta }),
      })
      if (!res.ok) throw new Error()
      toast.success('تم حفظ الصفحة بنجاح')
      setSavedSlug(activeSlug)
      setTimeout(() => setSavedSlug(null), 2000)
    } catch {
      toast.error('فشل حفظ الصفحة')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen" dir="rtl">
      <AdminHeader />

      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">

        {/* ── MOBILE: page selector grid ── */}
        <div className="sm:hidden px-4 pt-4 pb-3 border-b border-outline-variant/20 bg-surface-container-lowest">
          <p className="text-xs font-arabic font-bold text-secondary uppercase tracking-widest mb-3">
            اختر الصفحة
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PAGE_LIST.map(({ slug, label }) => (
              <button
                key={slug}
                type="button"
                onClick={() => setActiveSlug(slug)}
                className={cn(
                  'flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-arabic font-bold text-right transition-all duration-150',
                  activeSlug === slug
                    ? 'bg-gradient-to-l from-[#785600] to-[#986D00] text-white shadow-md'
                    : 'bg-surface border border-outline-variant/40 text-on-surface-variant'
                )}
              >
                <FileText size={14} className="shrink-0" />
                <span className="truncate">{label}</span>
                {savedSlug === slug && <CheckCircle size={12} className="mr-auto shrink-0 text-emerald-300" />}
              </button>
            ))}
          </div>
        </div>

        {/* ── DESKTOP: sidebar ── */}
        <aside className="hidden sm:flex w-52 shrink-0 border-l border-outline-variant/30 bg-surface-container-lowest flex-col pt-4">
          <p className="px-4 mb-2 text-xs font-arabic font-bold text-secondary uppercase tracking-widest">
            الصفحات
          </p>
          <nav className="flex flex-col px-2 gap-1">
            {PAGE_LIST.map(({ slug, label }) => (
              <button
                key={slug}
                type="button"
                onClick={() => setActiveSlug(slug)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-arabic font-medium transition-all duration-150 text-right',
                  activeSlug === slug
                    ? 'bg-gradient-to-l from-[#785600] to-[#986D00] text-white shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                )}
              >
                <FileText size={15} className="shrink-0" />
                {label}
                {savedSlug === slug && (
                  <CheckCircle size={13} className="mr-auto text-emerald-400 shrink-0" />
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Editor */}
        <main className="flex-1 flex flex-col p-4 sm:p-6 gap-4 sm:gap-5 overflow-y-auto">
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-primary" />
            </div>
          ) : !current ? null : (
            <>
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-base sm:text-lg font-arabic font-bold text-on-surface">
                    {activePage.label}
                  </h1>
                  <a
                    href={activePage.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-arabic text-primary hover:underline mt-0.5"
                  >
                    <ExternalLink size={11} />
                    معاينة الصفحة
                  </a>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className={cn(
                    'shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-arabic font-semibold transition-all duration-150',
                    'bg-gradient-to-l from-[#785600] to-[#986D00] text-white',
                    'hover:from-[#986D00] hover:to-[#B8860B] disabled:opacity-60'
                  )}
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  <span className="hidden sm:inline">حفظ التغييرات</span>
                  <span className="sm:hidden">حفظ</span>
                </button>
              </div>

              {/* Form */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-ambient p-4 sm:p-6 flex flex-col gap-5">

                {/* Title field */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-arabic font-semibold text-on-surface">
                    عنوان الصفحة
                  </label>
                  <p className="text-xs font-arabic text-secondary bg-primary-fixed/30 rounded-lg px-3 py-2">
                    📍 {activePage.titleHint}
                  </p>
                  <input
                    type="text"
                    value={current.title}
                    onChange={e => handleChange('title', e.target.value)}
                    className="h-11 px-3 rounded-xl border border-outline-variant/50 bg-surface text-sm font-arabic text-on-surface focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition"
                  />
                </div>

                {/* Content field */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-arabic font-semibold text-on-surface">
                    محتوى الصفحة
                  </label>
                  <p className="text-xs font-arabic text-secondary bg-primary-fixed/30 rounded-lg px-3 py-2 whitespace-pre-line">
                    📍 {activePage.contentHint}
                  </p>
                  <textarea
                    value={current.content}
                    onChange={e => handleChange('content', e.target.value)}
                    rows={10}
                    className={cn(
                      'w-full px-4 py-3 rounded-xl resize-y',
                      'border border-outline-variant/50 bg-surface',
                      'text-sm font-arabic text-on-surface leading-relaxed',
                      'focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition',
                    )}
                    dir="rtl"
                    placeholder={activePage.contentPlaceholder}
                  />
                </div>

                {/* Custom Features for Returns & Exchanges */}
                {activeSlug === 'returns-exchanges' && current.meta?.features && (
                  <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-outline-variant/30">
                    <label className="text-sm font-arabic font-semibold text-on-surface">
                      بطاقات السرعة والضمان (تظهر تحت العنوان مباشرة)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {current.meta.features.map((feature: any, idx: number) => (
                        <div key={idx} className="bg-surface border border-outline-variant/50 rounded-xl p-4 flex flex-col gap-3">
                          <input
                            type="text"
                            value={feature.count}
                            onChange={e => {
                              const newFeatures = [...current.meta.features]
                              newFeatures[idx].count = e.target.value
                              handleChange('meta', { ...current.meta, features: newFeatures })
                            }}
                            placeholder="الرقم/القيمة (مثال: ٧ أيام)"
                            className="h-10 px-3 rounded-lg border border-outline-variant/50 text-sm font-arabic focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition w-full"
                          />
                          <input
                            type="text"
                            value={feature.label}
                            onChange={e => {
                              const newFeatures = [...current.meta.features]
                              newFeatures[idx].label = e.target.value
                              handleChange('meta', { ...current.meta, features: newFeatures })
                            }}
                            placeholder="العنوان الصغير (مثال: فترة الإرجاع)"
                            className="h-10 px-3 rounded-lg border border-outline-variant/50 text-sm font-arabic focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition w-full"
                          />
                          <textarea
                            value={feature.desc}
                            onChange={e => {
                              const newFeatures = [...current.meta.features]
                              newFeatures[idx].desc = e.target.value
                              handleChange('meta', { ...current.meta, features: newFeatures })
                            }}
                            placeholder="النص والشرح"
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 text-sm font-arabic leading-relaxed resize-none focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
