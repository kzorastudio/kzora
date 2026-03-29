'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Plus, Trash2, ChevronUp, ChevronDown, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import ImageUploader, { type ImageFile } from '@/components/admin/ImageUploader'
import type { HeroSlide } from '@/types'

// ----- Schema -----
const slideSchema = z.object({
  heading: z.string().min(2, 'العنوان مطلوب').max(120),
  sub_text: z.string().max(250).optional(),
  cta_text: z.string().max(60).optional(),
  cta_link: z.string().max(200).optional(),
})
type SlideFormData = z.infer<typeof slideSchema>

// ----- Input styles -----
const inputBase =
  'w-full bg-[#F2EDE6] rounded-t-lg px-3 pt-3 pb-2 text-sm font-arabic text-[#1A1A1A] ' +
  'border-b-2 border-[#D3C4AF] focus:border-[#B8860B] focus:outline-none transition-colors duration-150 ' +
  'placeholder:text-[#6B6560]/60'
const labelBase = 'block text-sm font-arabic font-medium text-[#1A1A1A] mb-1.5'
const errorBase = 'mt-1.5 text-xs font-arabic text-[#BA1A1A]'

// ----- Slide Form Modal -----
interface SlideFormProps {
  initialData?: HeroSlide
  onSaved: () => void
  onClose: () => void
}

function SlideFormModal({ initialData, onSaved, onClose }: SlideFormProps) {
  const isEdit = !!initialData

  const [desktopImages, setDesktopImages] = useState<ImageFile[]>(
    initialData?.desktop_image_url
      ? [{ 
          id: 'desktop',
          url: initialData.desktop_image_url, 
          public_id: initialData.desktop_image_public_id,
          isLocal: false 
        }]
      : []
  )
  const [mobileImages, setMobileImages] = useState<ImageFile[]>(
    initialData?.mobile_image_url && initialData?.mobile_image_public_id
      ? [{ 
          id: 'mobile',
          url: initialData.mobile_image_url, 
          public_id: initialData.mobile_image_public_id,
          isLocal: false 
        }]
      : []
  )
  
  const [toDelete, setToDelete] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SlideFormData>({
    resolver: zodResolver(slideSchema),
    defaultValues: {
      heading: initialData?.heading ?? '',
      sub_text: initialData?.sub_text ?? '',
      cta_text: initialData?.cta_text ?? '',
      cta_link: initialData?.cta_link ?? '',
    },
  })

  useEffect(() => {
    if (initialData) {
      reset({
        heading: initialData.heading,
        sub_text: initialData.sub_text,
        cta_text: initialData.cta_text,
        cta_link: initialData.cta_link,
      })
    }
  }, [initialData, reset])

  const onSubmit = handleSubmit(async (data) => {
    if (desktopImages.length === 0) {
      setSaveError('يرجى رفع صورة سطح المكتب')
      return
    }

    setSaveError(null)
    setSaving(true)

    const body = {
      ...data,
      desktop_image_url: desktopImages[0].url,
      desktop_image_public_id: desktopImages[0].public_id,
      mobile_image_url: mobileImages[0]?.url ?? null,
      mobile_image_public_id: mobileImages[0]?.public_id ?? null,
    }

    try {
      // 1. Upload Desktop Image
      let desktop = desktopImages[0]
      if (desktop.isLocal && desktop.file) {
        const fd = new FormData()
        fd.append('file', desktop.file)
        fd.append('folder', 'hero-slides')
        const res = await fetch('/api/images/upload', { method: 'POST', body: fd })
        const data = await res.json()
        desktop = { ...desktop, url: data.url, public_id: data.public_id, isLocal: false }
      }

      // 2. Upload Mobile Image
      let mobile = mobileImages[0] || null
      if (mobile && mobile.isLocal && mobile.file) {
        const fd = new FormData()
        fd.append('file', mobile.file)
        fd.append('folder', 'hero-slides/mobile')
        const res = await fetch('/api/images/upload', { method: 'POST', body: fd })
        const data = await res.json()
        mobile = { ...mobile, url: data.url, public_id: data.public_id, isLocal: false }
      }

      // 3. Delete queued images
      if (toDelete.length > 0) {
        await Promise.all(toDelete.map(pid => 
          fetch('/api/images/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ public_id: pid })
          })
        ))
      }

      const body = {
        ...data,
        desktop_image_url: desktop.url,
        desktop_image_public_id: desktop.public_id,
        mobile_image_url: mobile?.url ?? null,
        mobile_image_public_id: mobile?.public_id ?? null,
      }

      const url = isEdit
        ? `/api/homepage/slides/${initialData!.id}`
        : '/api/homepage/slides'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setSaveError(err.error ?? 'حدث خطأ أثناء الحفظ')
        return
      }

      onSaved()
    } finally {
      setSaving(false)
    }
  })

  return (
    <form dir="rtl" onSubmit={onSubmit} noValidate className="space-y-5">
      {/* Heading */}
      <div>
        <label className={labelBase}>
          العنوان الرئيسي
          <span className="text-[#BA1A1A] mr-0.5">*</span>
        </label>
        <input
          type="text"
          placeholder="أدخل عنوان الشريحة..."
          className={cn(inputBase, errors.heading && 'border-[#BA1A1A]')}
          {...register('heading')}
        />
        {errors.heading && <p className={errorBase}>{errors.heading.message}</p>}
      </div>

      {/* Sub text */}
      <div>
        <label className={labelBase}>
          النص الفرعي
          <span className="text-[#6B6560] text-xs font-normal mr-1">(اختياري)</span>
        </label>
        <input
          type="text"
          placeholder="وصف مختصر للشريحة..."
          className={cn(inputBase, errors.sub_text && 'border-[#BA1A1A]')}
          {...register('sub_text')}
        />
        {errors.sub_text && <p className={errorBase}>{errors.sub_text.message}</p>}
      </div>

      {/* CTA Text */}
      <div>
        <label className={labelBase}>
          نص زر الإجراء (CTA)
          <span className="text-[#6B6560] text-xs font-normal mr-1">(اختياري)</span>
        </label>
        <input
          type="text"
          placeholder="مثال: تسوق الآن"
          className={cn(inputBase, errors.cta_text && 'border-[#BA1A1A]')}
          {...register('cta_text')}
        />
        {errors.cta_text && <p className={errorBase}>{errors.cta_text.message}</p>}
      </div>

      {/* CTA Link */}
      <div>
        <label className={labelBase}>
          رابط الزر
          <span className="text-[#6B6560] text-xs font-normal mr-1">(اختياري)</span>
        </label>
        <input
          type="text"
          placeholder="مثال: /category/men"
          className={cn(inputBase, errors.cta_link && 'border-[#BA1A1A]')}
          {...register('cta_link')}
        />
        {errors.cta_link && <p className={errorBase}>{errors.cta_link.message}</p>}
      </div>

      {/* Desktop Image */}
      <div>
        <label className={labelBase}>
          صورة سطح المكتب
          <span className="text-[#BA1A1A] mr-0.5">*</span>
        </label>
        <ImageUploader
          images={desktopImages}
          maxFiles={1}
          onAddFiles={(files) => {
            const file = files[0]
            if (!file) return
            if (desktopImages[0]?.isLocal) URL.revokeObjectURL(desktopImages[0].url)
            setDesktopImages([{
              id: 'new-desktop',
              file,
              url: URL.createObjectURL(file),
              public_id: '',
              isLocal: true
            }])
          }}
          onRemoveImage={() => {
            if (desktopImages[0] && !desktopImages[0].isLocal) {
              setToDelete(prev => [...prev, desktopImages[0].public_id])
            }
            if (desktopImages[0]?.isLocal) URL.revokeObjectURL(desktopImages[0].url)
            setDesktopImages([])
          }}
        />
        {desktopImages.length === 0 && saveError?.includes('سطح المكتب') && (
          <p className={errorBase}>{saveError}</p>
        )}
      </div>

      {/* Mobile Image */}
      <div>
        <label className={labelBase}>
          صورة الهاتف المحمول
          <span className="text-[#6B6560] text-xs font-normal mr-1">(اختياري)</span>
        </label>
        <ImageUploader
          images={mobileImages}
          maxFiles={1}
          onAddFiles={(files) => {
            const file = files[0]
            if (!file) return
            if (mobileImages[0]?.isLocal) URL.revokeObjectURL(mobileImages[0].url)
            setMobileImages([{
              id: 'new-mobile',
              file,
              url: URL.createObjectURL(file),
              public_id: '',
              isLocal: true
            }])
          }}
          onRemoveImage={() => {
            if (mobileImages[0] && !mobileImages[0].isLocal) {
              setToDelete(prev => [...prev, mobileImages[0].public_id])
            }
            if (mobileImages[0]?.isLocal) URL.revokeObjectURL(mobileImages[0].url)
            setMobileImages([])
          }}
        />
      </div>

      {/* Save error */}
      {saveError && !saveError.includes('سطح المكتب') && (
        <p className={errorBase}>{saveError}</p>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 h-11 rounded-xl border-2 border-[#D3C4AF] font-arabic font-semibold text-sm text-[#6B6560] hover:bg-[#EDE5D8] transition-colors duration-150"
        >
          إلغاء
        </button>
        <button
          type="submit"
          disabled={saving}
          className={cn(
            'flex-1 h-11 rounded-xl font-arabic font-semibold text-white text-sm',
            'bg-gradient-to-l from-[#785600] to-[#986D00]',
            'hover:from-[#986D00] hover:to-[#B8860B]',
            'transition-all duration-200',
            'disabled:opacity-60 disabled:cursor-not-allowed'
          )}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              جارٍ الحفظ...
            </span>
          ) : isEdit ? (
            'تحديث الشريحة'
          ) : (
            'إضافة الشريحة'
          )}
        </button>
      </div>
    </form>
  )
}

// ----- Main Component -----
interface SlideManagerProps {
  initialSlides?: HeroSlide[]
}

export default function SlideManager({ initialSlides = [] }: SlideManagerProps) {
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides)
  const [loading, setLoading] = useState(!initialSlides.length)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | undefined>(undefined)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [reorderingId, setReorderingId] = useState<string | null>(null)

  // Fetch slides on mount if none provided
  useEffect(() => {
    if (initialSlides.length > 0) return
    fetchSlides()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchSlides() {
    setLoading(true)
    try {
      const res = await fetch('/api/homepage/slides')
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      setSlides(data.slides ?? [])
    } catch {
      // fail silently
    } finally {
      setLoading(false)
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
      if (!res.ok) throw new Error('toggle failed')
      setSlides((prev) =>
        prev.map((s) => (s.id === slide.id ? { ...s, is_active: !s.is_active } : s))
      )
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('هل أنت متأكد من حذف هذه الشريحة؟')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/homepage/slides/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete failed')
      setSlides((prev) => prev.filter((s) => s.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  async function handleReorder(id: string, direction: 'up' | 'down') {
    const idx = slides.findIndex((s) => s.id === id)
    if (idx === -1) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === slides.length - 1) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const newSlides = [...slides]
    ;[newSlides[idx], newSlides[swapIdx]] = [newSlides[swapIdx], newSlides[idx]]

    // Optimistic update
    setSlides(newSlides)
    setReorderingId(id)

    try {
      await Promise.all([
        fetch(`/api/homepage/slides/${newSlides[idx].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: idx }),
        }),
        fetch(`/api/homepage/slides/${newSlides[swapIdx].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: swapIdx }),
        }),
      ])
    } finally {
      setReorderingId(null)
    }
  }

  function openAdd() {
    setEditingSlide(undefined)
    setModalOpen(true)
  }

  function openEdit(slide: HeroSlide) {
    setEditingSlide(slide)
    setModalOpen(true)
  }

  function handleSaved() {
    setModalOpen(false)
    fetchSlides()
  }

  return (
    <div dir="rtl" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-arabic font-semibold text-[#1A1A1A]">
          شرائح الصفحة الرئيسية
        </h3>
        <button
          type="button"
          onClick={openAdd}
          className={cn(
            'flex items-center gap-2 h-9 px-4 rounded-lg font-arabic text-sm font-semibold text-white',
            'bg-gradient-to-l from-[#785600] to-[#986D00] hover:from-[#986D00] hover:to-[#B8860B]',
            'transition-all duration-150 shadow-sm hover:shadow-md'
          )}
        >
          <Plus size={16} />
          إضافة شريحة
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-[#EDE5D8] animate-pulse" />
          ))}
        </div>
      )}

      {/* Slides list */}
      {!loading && slides.length === 0 && (
        <div className="text-center py-12 font-arabic text-[#6B6560]">
          لا توجد شرائح حتى الآن. أضف أول شريحة!
        </div>
      )}

      {!loading && slides.length > 0 && (
        <ul className="space-y-3">
          {slides.map((slide, idx) => {
            const isDeleting = deletingId === slide.id
            const isToggling = togglingId === slide.id
            const isReordering = reorderingId === slide.id

            return (
              <li
                key={slide.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl bg-[#F2EDE6]',
                  'transition-opacity duration-150',
                  (isDeleting || isReordering) && 'opacity-50'
                )}
              >
                {/* Thumbnail */}
                <div className="relative w-20 h-[60px] rounded-lg overflow-hidden bg-[#EDE5D8] shrink-0">
                  {slide.desktop_image_url ? (
                    <Image
                      src={slide.desktop_image_url}
                      alt={slide.heading}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#D3C4AF]" />
                  )}
                </div>

                {/* Heading */}
                <button
                  type="button"
                  onClick={() => openEdit(slide)}
                  className="flex-1 min-w-0 text-right"
                >
                  <p className="text-sm font-arabic font-medium text-[#1A1A1A] truncate hover:text-[#B8860B] transition-colors">
                    {slide.heading}
                  </p>
                  {slide.sub_text && (
                    <p className="text-xs font-arabic text-[#6B6560] truncate mt-0.5">
                      {slide.sub_text}
                    </p>
                  )}
                </button>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Sort up/down */}
                  <button
                    type="button"
                    disabled={idx === 0 || isReordering}
                    onClick={() => handleReorder(slide.id, 'up')}
                    className="p-1.5 rounded-lg text-[#6B6560] hover:bg-[#EDE5D8] hover:text-[#1A1A1A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="رفع الشريحة"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === slides.length - 1 || isReordering}
                    onClick={() => handleReorder(slide.id, 'down')}
                    className="p-1.5 rounded-lg text-[#6B6560] hover:bg-[#EDE5D8] hover:text-[#1A1A1A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="خفض الشريحة"
                  >
                    <ChevronDown size={16} />
                  </button>

                  {/* Active toggle */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={slide.is_active}
                    disabled={isToggling}
                    onClick={() => handleToggleActive(slide)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8860B]',
                      slide.is_active ? 'bg-[#B8860B]' : 'bg-[#D3C4AF]',
                      isToggling && 'opacity-60 cursor-not-allowed'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
                        slide.is_active ? 'translate-x-1.5' : '-translate-x-4'
                      )}
                    />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => handleDelete(slide.id)}
                    className="p-1.5 rounded-lg text-[#BA1A1A]/70 hover:bg-[#BA1A1A]/10 hover:text-[#BA1A1A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="حذف الشريحة"
                  >
                    {isDeleting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSlide ? 'تعديل الشريحة' : 'إضافة شريحة جديدة'}
        maxWidth="max-w-xl"
      >
        <SlideFormModal
          initialData={editingSlide}
          onSaved={handleSaved}
          onClose={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  )
}
