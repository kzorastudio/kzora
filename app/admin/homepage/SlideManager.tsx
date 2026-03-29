'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import {
  Plus, Trash2, Loader2, X, Pencil, ToggleLeft, ToggleRight, GripVertical, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import type { HeroSlide, Category, Product } from '@/types'
import { supabase } from '@/lib/supabase'
import ImageUploader, { type UploadedImage } from '@/components/admin/ImageUploader'

interface SlideFormState {
  desktop_image: UploadedImage | null
  mobile_image:  UploadedImage | null
  heading:    string
  sub_text:   string
  cta_text:   string
  cta_link:   string
  sort_order: number
  is_active:  boolean
  heading_color: string
  accent_color: string
  subtext_color: string
}

const INITIAL_FORM: SlideFormState = {
  desktop_image: null,
  mobile_image:  null,
  heading:    '',
  sub_text:   '',
  cta_text:   '',
  cta_link:   '/',
  sort_order: 0,
  is_active:  true,
  heading_color: '#1A1A1A',
  accent_color: '#785600',
  subtext_color: '#4A4742',
}

const FIELD_CLASS =
  'w-full rounded-xl border border-outline-variant/50 bg-surface-container px-3 py-2.5 text-sm font-arabic text-on-surface placeholder:text-secondary/60 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition'
const LABEL_CLASS = 'block text-sm font-arabic font-medium text-on-surface-variant mb-1'

export default function SlideManager() {
  const [slides, setSlides]       = useState<HeroSlide[]>([])
  const [loading, setLoading]     = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<HeroSlide | null>(null)
  const [form, setForm]           = useState<SlideFormState>(INITIAL_FORM)
  const [saving, setSaving]       = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Options for link selector
  const [categories, setCategories] = useState<Category[]>([])
  const [products,   setProducts]   = useState<Product[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [resSlides, resCats, resProds] = await Promise.all([
        fetch('/api/homepage/slides?admin=1'),
        supabase.from('categories').select('slug, name_ar').eq('is_active', true),
        supabase.from('products').select('slug, name').eq('is_active', true).limit(100)
      ])

      const slideData = await resSlides.json()
      setSlides(slideData.slides ?? [])
      if (resCats.data) setCategories(resCats.data as any)
      if (resProds.data) setProducts(resProds.data as any)
    } catch {
      toast.error('فشل تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function openAddModal() {
    setEditTarget(null)
    setForm(INITIAL_FORM)
    setModalOpen(true)
  }

  function openEditModal(slide: HeroSlide) {
    setEditTarget(slide)
    setForm({
      desktop_image: { id: 'desk', url: slide.desktop_image_url, public_id: slide.desktop_image_public_id, is_main: true },
      mobile_image:  slide.mobile_image_url && slide.mobile_image_public_id
        ? { id: 'mob', url: slide.mobile_image_url, public_id: slide.mobile_image_public_id, is_main: false }
        : null,
      heading:    slide.heading,
      sub_text:   slide.sub_text,
      cta_text:   slide.cta_text,
      cta_link:   slide.cta_link,
      sort_order: slide.sort_order,
      is_active:  slide.is_active,
      heading_color: slide.heading_color || '#1A1A1A',
      accent_color: slide.accent_color || '#785600',
      subtext_color: slide.subtext_color || '#4A4742',
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditTarget(null)
    setForm(INITIAL_FORM)
  }

  async function handleSave() {
    if (!form.desktop_image) {
      toast.error('يرجى رفع صورة سطح المكتب')
      return
    }

    setSaving(true)
    try {
      const payload = {
        desktop_image_url:       form.desktop_image.url,
        desktop_image_public_id: form.desktop_image.public_id,
        mobile_image_url:        form.mobile_image?.url        ?? null,
        mobile_image_public_id:  form.mobile_image?.public_id  ?? null,
        heading:    form.heading,
        sub_text:   form.sub_text,
        cta_text:   form.cta_text,
        cta_link:   form.cta_link,
        sort_order: form.sort_order,
        is_active:  form.is_active,
        heading_color: form.heading_color,
        accent_color:  form.accent_color,
        subtext_color: form.subtext_color,
      }

      let res: Response
      if (editTarget) {
        res = await fetch(`/api/homepage/slides/${editTarget.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/homepage/slides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) throw new Error()
      toast.success(editTarget ? 'تم تحديث الشريحة بنجاح' : 'تم إضافة الشريحة بنجاح')
      closeModal()
      fetchData()
    } catch {
      toast.error('حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(slide: HeroSlide) {
    if (!confirm(`هل أنت متأكد من حذف الشريحة "${slide.heading || 'بدون عنوان'}"؟`)) return

    setDeletingId(slide.id)
    try {
      const res = await fetch(`/api/homepage/slides/${slide.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('تم حذف الشريحة بنجاح')
      setSlides((prev) => prev.filter((s) => s.id !== slide.id))
    } catch {
      toast.error('فشل حذف الشريحة')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleToggleActive(slide: HeroSlide) {
    setTogglingId(slide.id)
    try {
      const res = await fetch(`/api/homepage/slides/${slide.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !slide.is_active }),
      })
      if (!res.ok) throw new Error()
      setSlides((prev) =>
        prev.map((s) => (s.id === slide.id ? { ...s, is_active: !s.is_active } : s))
      )
      toast.success(slide.is_active ? 'تم إخفاء الشريحة' : 'تم إظهار الشريحة')
    } catch {
      toast.error('فشل تحديث الحالة')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Add button */}
        <div className="flex justify-end">
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-arabic font-medium hover:bg-primary-container transition-colors"
          >
            <Plus size={15} />
            إضافة شريحة
          </button>
        </div>

        {/* Slides list */}
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : slides.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm font-arabic text-secondary">لا توجد شرائح. أضف شريحة جديدة.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {slides.map((slide) => (
              <div
                key={slide.id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border transition-colors',
                  slide.is_active
                    ? 'border-outline-variant/40 bg-surface-container-low'
                    : 'border-outline-variant/20 bg-surface-container/50 opacity-70'
                )}
              >
                {/* Thumbnail */}
                <div className="h-16 w-28 rounded-lg overflow-hidden bg-surface-container shrink-0">
                  <Image
                    src={slide.desktop_image_url}
                    alt={slide.heading || 'شريحة'}
                    width={112}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <p className="text-sm font-arabic font-medium text-on-surface truncate">
                    {slide.heading || '(بدون عنوان)'}
                  </p>
                  {slide.sub_text && (
                    <p className="text-xs font-arabic text-secondary truncate">{slide.sub_text}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-[10px] font-arabic text-secondary/70">
                    <span>ترتيب: {slide.sort_order}</span>
                    <div className="flex items-center gap-1.5 ml-2">
                      <div className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: slide.heading_color }} title="لون العنوان" />
                      <div className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: slide.accent_color }} title="لون التمييز" />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggleActive(slide)}
                    disabled={togglingId === slide.id}
                    title={slide.is_active ? 'إخفاء' : 'إظهار'}
                    className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50"
                  >
                    {togglingId === slide.id ? (
                      <Loader2 size={16} className="animate-spin text-secondary" />
                    ) : slide.is_active ? (
                      <ToggleRight size={20} className="text-primary" />
                    ) : (
                      <ToggleLeft size={20} className="text-secondary" />
                    )}
                  </button>

                  <button
                    onClick={() => openEditModal(slide)}
                    title="تعديل"
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-secondary hover:text-primary hover:bg-primary-fixed/30 transition-colors"
                  >
                    <Pencil size={15} />
                  </button>

                  <button
                    onClick={() => handleDelete(slide)}
                    disabled={deletingId === slide.id}
                    title="حذف"
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-secondary hover:text-error hover:bg-error-container/30 transition-colors disabled:opacity-50"
                  >
                    {deletingId === slide.id ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Trash2 size={15} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-inverse-surface/30 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl shadow-ambient-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/40 sticky top-0 bg-surface-container-lowest z-10">
              <h2 className="text-base font-arabic font-semibold text-on-surface">
                {editTarget ? 'تعديل الشريحة' : 'إضافة شريحة جديدة'}
              </h2>
              <button onClick={closeModal} className="h-8 w-8 flex items-center justify-center rounded-xl text-secondary hover:bg-surface-container transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* Image Upload */}
              <div>
                <label className={LABEL_CLASS}>صورة العرض الرئيسية *</label>
                <p className="text-[10px] text-secondary mb-2 font-arabic">ارفع صورة واحدة ستستخدم للجوال وسطح المكتب معاً لتسهيل الأمر.</p>
                <ImageUploader
                  images={form.desktop_image ? [{ 
                    id: 'desktop', 
                    url: form.desktop_image.url, 
                    public_id: form.desktop_image.public_id,
                    is_main: true 
                  } as UploadedImage] : []}
                  onAddFiles={async (files) => {
                    const file = files[0];
                    if (!file) return;
                    // Note: Here I am simulating a fast-upload for better UX since SlideManager used to have it
                    // But to keep it simple and consistent with the new uploader:
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('folder', 'slides');
                    try {
                      const res = await fetch('/api/upload', { method: 'POST', body: formData });
                      const data = await res.json();
                      if (data.url) {
                        setForm(f => ({ 
                          ...f, 
                          desktop_image: { id: 'd-' + Date.now(), url: data.url, public_id: data.public_id, is_main: true },
                          mobile_image: { id: 'm-' + Date.now(), url: data.url, public_id: data.public_id, is_main: false }
                        }));
                      }
                    } catch (err) {
                      toast.error('فشل رفع الصورة');
                    }
                  }}
                  onRemoveImage={() => setForm((f) => ({ ...f, desktop_image: null, mobile_image: null }))}
                  onSetMain={() => {}}
                  maxFiles={1}
                />
              </div>

              {/* Text Control */}
              <div className="bg-surface-container p-4 rounded-2xl border border-outline-variant/20 flex flex-col gap-4">
                <div>
                  <label className={LABEL_CLASS}>العنوان (استخدم — للتمييز)</label>
                  <input
                    type="text"
                    value={form.heading}
                    onChange={(e) => setForm((f) => ({ ...f, heading: e.target.value }))}
                    placeholder="مثال: خصومات كبرى — حتى 50%"
                    className={FIELD_CLASS}
                  />
                </div>

                {/* Color Explanation Section */}
                <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/10">
                   <p className="text-[11px] font-arabic font-bold text-primary mb-3 flex items-center gap-1">
                      <AlertCircle size={14} />
                      كيف تعمل الألوان؟
                   </p>
                   <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center justify-between gap-3 bg-white/50 p-2 rounded-lg">
                         <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-on-surface">لون الأساس</span>
                            <span className="text-[9px] text-secondary">اللون الذي يبدأ به العنوان</span>
                         </div>
                         <input type="color" value={form.heading_color} onChange={(e) => setForm({...form, heading_color: e.target.value})} className="w-12 h-6 rounded cursor-pointer border-none" />
                      </div>
                      <div className="flex items-center justify-between gap-3 bg-white/50 p-2 rounded-lg">
                         <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-on-surface">لون التمييز</span>
                            <span className="text-[9px] text-secondary">اللون الذي يأتي بعد الرمز — في العنوان</span>
                         </div>
                         <input type="color" value={form.accent_color} onChange={(e) => setForm({...form, accent_color: e.target.value})} className="w-12 h-6 rounded cursor-pointer border-none" />
                      </div>
                      <div className="flex items-center justify-between gap-3 bg-white/50 p-2 rounded-lg">
                         <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-on-surface">نص الوصف</span>
                            <span className="text-[9px] text-secondary">لون النص الفرعي الصغير في الأسفل</span>
                         </div>
                         <input type="color" value={form.subtext_color} onChange={(e) => setForm({...form, subtext_color: e.target.value})} className="w-12 h-6 rounded cursor-pointer border-none" />
                      </div>
                   </div>
                </div>

                <div>
                  <label className={LABEL_CLASS}>نص الوصف (اختياري)</label>
                  <textarea
                    value={form.sub_text}
                    onChange={(e) => setForm((f) => ({ ...f, sub_text: e.target.value }))}
                    placeholder="وصف مختصر أسفل العنوان"
                    className={cn(FIELD_CLASS, "min-h-[60px]")}
                  />
                </div>
              </div>

              {/* Button & Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLASS}>نص الزر</label>
                  <input
                    type="text"
                    value={form.cta_text}
                    onChange={(e) => setForm((f) => ({ ...f, cta_text: e.target.value }))}
                    placeholder="مثال: تسوق الآن"
                    className={FIELD_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>الرابط (اختر من القائمة)</label>
                  <select
                    value={form.cta_link}
                    onChange={(e) => setForm((f) => ({ ...f, cta_link: e.target.value }))}
                    className={FIELD_CLASS}
                  >
                    <option value="/">الصفحة الرئيسية</option>
                    <option value="/products">كل المنتجات</option>
                    <optgroup label="الأقسام">
                      {categories.map(c => (
                        <option key={c.slug} value={`/category/${c.slug}`}>{c.name_ar}</option>
                      ))}
                    </optgroup>
                    <optgroup label="المنتجات">
                      {products.map(p => (
                        <option key={p.slug} value={`/product/${p.slug}`}>{p.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Sort + Status */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className={LABEL_CLASS}>ترتيب العرض</label>
                  <select
                    value={form.sort_order}
                    onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) }))}
                    className={FIELD_CLASS}
                  >
                    {[0, ...Array.from({ length: slides.length + (editTarget ? 0 : 1) }, (_, i) => i + 1)].map(n => (
                      <option key={n} value={n}>{n === 0 ? 'افتراضي (آخر شيء)' : `المركز ${n}`}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col justify-end pb-1">
                   <label className={LABEL_CLASS}>الحالة</label>
                   <button
                     onClick={() => setForm({...form, is_active: !form.is_active})}
                     className={cn("h-10 px-4 rounded-xl font-arabic text-sm font-bold flex items-center gap-2 transition-colors", form.is_active ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary")}
                   >
                     {form.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                     {form.is_active ? "نشط" : "مخفي"}
                   </button>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !form.desktop_image}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-primary text-white text-base font-arabic font-bold hover:bg-primary-container transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {saving && <Loader2 size={18} className="animate-spin" />}
                {saving ? 'جاري الحفظ...' : editTarget ? 'حفظ التغييرات' : 'إضافة الشريحة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
