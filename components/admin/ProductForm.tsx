'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { productSchema, type ProductFormData } from '@/lib/validators'
import { cn } from '@/lib/utils'
import type { ProductFull, Category } from '@/types'
import ImageUploader, { type UploadedImage } from './ImageUploader'

interface ProductFormProps {
  initialData?: ProductFull
  categories: Category[]
  onSuccess: () => void
}

const FIELD_CLASS =
  'w-full rounded-xl border border-outline-variant/50 bg-surface-container px-3 py-2.5 text-sm font-arabic text-on-surface placeholder:text-secondary/60 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition'

const LABEL_CLASS = 'block text-sm font-arabic font-medium text-on-surface-variant mb-1'

const SECTION_CLASS = 'bg-surface-container-lowest rounded-2xl shadow-ambient p-5 flex flex-col gap-4'

const AVAILABLE_SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46]

export default function ProductForm({
  initialData,
  categories,
  onSuccess,
}: ProductFormProps) {
  const isEdit = !!initialData

  const [images, setImages] = useState<UploadedImage[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      category_id: initialData?.category_id ?? null,
      price_syp: initialData?.price_syp ?? 0,
      price_usd: initialData?.price_usd ?? 0,
      discount_price_syp: initialData?.discount_price_syp ?? null,
      discount_price_usd: initialData?.discount_price_usd ?? null,
      stock_status: initialData?.stock_status ?? 'in_stock',
      is_featured: initialData?.is_featured ?? false,
      is_published: initialData ? initialData.is_published : true,
      sort_order: initialData?.sort_order ?? 0,
      sizes: initialData?.sizes?.map(s => (typeof s === 'number' ? { size: s, is_available: true } : s)) ?? [],
      tags: initialData?.tags ?? [],
      colors: initialData?.colors?.map((c) => ({
        name_ar: c.name_ar,
        hex_code: c.hex_code,
        swatch_url: c.swatch_url ?? '',
        swatch_public_id: c.swatch_public_id ?? '',
        is_available: c.is_available ?? true,
      })) ?? [],
    },
  })

  useEffect(() => {
    if (initialData) {
      if (initialData.images) {
        setImages(initialData.images.map(img => ({
          id: img.id,
          url: img.url,
          public_id: img.public_id,
          color_variant: img.color_variant,
          is_main: img.is_main,
          isLocal: false
        })))
      }
      reset({
        name: initialData.name,
        description: initialData.description,
        category_id: initialData.category_id,
        price_syp: initialData.price_syp,
        price_usd: initialData.price_usd,
        discount_price_syp: initialData.discount_price_syp,
        discount_price_usd: initialData.discount_price_usd,
        stock_status: initialData.stock_status,
        is_featured: initialData.is_featured,
        is_published: initialData.is_published,
        sort_order: initialData.sort_order,
        sizes: initialData.sizes?.map(s => (typeof s === 'number' ? { size: s, is_available: true } : s)) ?? [],
        tags: initialData.tags,
        colors: initialData.colors?.map(c => ({
          name_ar: c.name_ar,
          hex_code: c.hex_code,
          swatch_url: c.swatch_url || '',
          swatch_public_id: c.swatch_public_id || '',
          is_available: c.is_available ?? true,
        })) || []
      })
    }
  }, [initialData, reset])

  const { fields: colorFields, append: appendColor, remove: removeColor } = useFieldArray({
    control,
    name: 'colors',
  })

  const watchedColors = watch('colors')
  const colorOptions = watchedColors
    .filter(c => c.name_ar.trim() !== '')
    .map(c => ({ label: c.name_ar, value: c.name_ar }))

  const handleImageSetMain = useCallback((id: string) => {
    setImages(prev => prev.map(img => ({
      ...img,
      is_main: img.id === id
    })))
  }, [])

  const handleImageColorChange = useCallback((id: string, color: string | null) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, color_variant: color } : img))
  }, [])

  const handleImageRemove = useCallback((id: string) => {
    setImages(prev => {
      const imgToRemove = prev.find(img => img.id === id)
      if (imgToRemove && !imgToRemove.isLocal && imgToRemove.public_id) {
        // Delete immediately from Cloudinary
        fetch('/api/images/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ public_id: imgToRemove.public_id })
        }).catch(err => console.error('Failed to delete image', err))
      }
      if (imgToRemove?.isLocal && imgToRemove.url) URL.revokeObjectURL(imgToRemove.url)
      
      const filtered = prev.filter(img => img.id !== id)
      if (imgToRemove?.is_main && filtered.length > 0) {
        filtered[0].is_main = true
      }
      return filtered
    })
  }, [])

  const handleImageAdd = useCallback((files: File[]) => {
    const autoColor = colorOptions.length === 1 ? colorOptions[0].value : undefined
    setImages(prev => {
      const newImgs: UploadedImage[] = files.map((file, i) => ({
        id: Math.random().toString(36).substring(7),
        file,
        url: URL.createObjectURL(file),
        public_id: '',
        is_main: prev.length === 0 && i === 0,
        isLocal: true,
        color_variant: autoColor ?? null,
      }))
      return [...prev, ...newImgs]
    })
  }, [colorOptions])

  async function onSubmit(data: ProductFormData) {
    try {
      const updatedImages = await Promise.all(
        images.map(async (img) => {
          if (!img.isLocal || !img.file) return img
          const formData = new FormData()
          formData.append('file', img.file)
          formData.append('folder', 'products')
          const uploadRes = await fetch('/api/images/upload', {
            method: 'POST',
            body: formData,
          })
          if (!uploadRes.ok) {
            const errorData = await uploadRes.json().catch(() => ({}))
            throw new Error(errorData.details || errorData.error || 'فشل رفع إحدى الصور')
          }
          const uploadData = await uploadRes.json()
          return { ...img, url: uploadData.url, public_id: uploadData.public_id, isLocal: false }
        })
      )



      const payload = {
        ...data,
        category_id: data.category_id === '' ? null : data.category_id,
        images: updatedImages.map((img: UploadedImage, idx: number) => ({
          url: img.url,
          public_id: img.public_id,
          display_order: idx,
          color_variant: img.color_variant || null,
          is_main: img.is_main
        })),
      }

      const url = isEdit ? `/api/products/${initialData!.id}` : '/api/products'
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('حدث خطأ أثناء الحفظ')
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} dir="rtl" className="flex flex-col gap-5">
      <section className={SECTION_CLASS}>
        <h2 className="text-base font-arabic font-semibold">المعلومات الأساسية</h2>
        <div>
          <label className={LABEL_CLASS}>اسم المنتج *</label>
          <input type="text" {...register('name')} className={FIELD_CLASS} />
          {errors.name && <p className="mt-1 text-xs text-error">{errors.name.message}</p>}
        </div>
        <div>
          <label className={LABEL_CLASS}>الوصف *</label>
          <textarea rows={4} {...register('description')} className={cn(FIELD_CLASS, 'resize-y')} />
        </div>
      </section>

      <section className={SECTION_CLASS}>
        <h2 className="text-base font-arabic font-semibold">القسم والأسعار</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>القسم</label>
            <select {...register('category_id')} className={FIELD_CLASS}>
              <option value="">— بدون قسم —</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name_ar}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>الحالة</label>
            <select {...register('stock_status')} className={FIELD_CLASS}>
              <option value="in_stock">متوفر</option>
              <option value="low_stock">كمية محدودة</option>
              <option value="out_of_stock">نفذت الكمية</option>
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>السعر (ليرة)</label>
            <input type="number" {...register('price_syp', { valueAsNumber: true })} className={FIELD_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>السعر ($)</label>
            <input type="number" step="0.01" {...register('price_usd', { valueAsNumber: true })} className={FIELD_CLASS} />
          </div>
        </div>
      </section>

      <section className={SECTION_CLASS}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-arabic font-semibold">الألوان المتاحة</h2>
          <button type="button" onClick={() => appendColor({ name_ar: '', hex_code: '#000000', swatch_url: '', swatch_public_id: '', is_available: true })} className="text-primary text-sm flex items-center gap-1">
            <Plus size={16} /> إضافة لون
          </button>
        </div>
        {colorFields.map((field, index) => (
          <div key={field.id} className="flex flex-col gap-2 p-3 rounded-xl bg-surface-container">
            <div className="flex gap-3 items-center">
              <input type="text" placeholder="اسم اللون" {...register(`colors.${index}.name_ar`)} className={FIELD_CLASS} />
              <Controller control={control} name={`colors.${index}.hex_code`} render={({ field: f }) => (
                <input type="color" {...f} className="h-10 w-12 rounded-lg cursor-pointer" />
              )} />
              <button type="button" onClick={() => removeColor(index)} className="text-error"><Trash2 size={18} /></button>
            </div>
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-arabic text-secondary">متوفر حالياً؟</span>
              <Controller
                control={control}
                name={`colors.${index}.is_available`}
                render={({ field: f }) => (
                  <button
                    type="button"
                    onClick={() => f.onChange(!f.value)}
                    className={cn(
                      'relative h-5 w-10 shrink-0 rounded-full transition-colors duration-200',
                      f.value ? 'bg-primary' : 'bg-surface-container-high'
                    )}
                  >
                    <span className={cn(
                      'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
                      f.value ? 'translate-x-5' : 'translate-x-0.5'
                    )} />
                  </button>
                )}
              />
            </div>
          </div>
        ))}
      </section>

      <section className={SECTION_CLASS}>
        <h2 className="text-base font-arabic font-semibold">المقاسات المتاحة *</h2>
        <Controller
          control={control}
          name="sizes"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SIZES.map(size => {
                const selected = field.value?.some((s: any) => s.size === size)
                return (
                  <div key={size} className="flex flex-col items-center gap-1.5">
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        const current = field.value || []
                        const exists = current.find((s: any) => s.size === size)
                        if (exists) {
                          field.onChange(current.filter((s: any) => s.size !== size))
                        } else {
                          field.onChange([...current, { size, is_available: true }])
                        }
                      }}
                      className={cn(
                        'min-w-[2.75rem] h-10 px-3 rounded-xl text-sm font-arabic font-medium transition-all border-2',
                        field.value?.some((s: any) => s.size === size)
                          ? 'bg-primary text-white border-primary'
                          : 'bg-surface-container text-secondary border-outline-variant/40 hover:border-primary/40 hover:text-on-surface'
                      )}
                    >
                      {size}
                    </button>
                    {field.value?.some((s: any) => s.size === size) && (
                      <button
                        type="button"
                        onClick={() => {
                          const current = field.value || []
                          field.onChange(current.map((s: any) => s.size === size ? { ...s, is_available: !s.is_available } : s))
                        }}
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-arabic border transition-colors',
                          field.value?.find((s: any) => s.size === size)?.is_available
                            ? 'bg-success/10 text-success border-success/20'
                            : 'bg-error/10 text-error border-error/20'
                        )}
                      >
                        {field.value?.find((s: any) => s.size === size)?.is_available ? 'متوفر' : 'غير متوفر'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        />
        {errors.sizes && (
          <p className="text-xs font-arabic text-error">{errors.sizes.message as string}</p>
        )}
      </section>

      <section className={SECTION_CLASS}>
        <h2 className="text-base font-arabic font-semibold">صور المنتج</h2>
        <ImageUploader
          images={images}
          onAddFiles={handleImageAdd}
          onRemoveImage={handleImageRemove}
          onColorChange={handleImageColorChange}
          onSetMain={handleImageSetMain}
          colorOptions={colorOptions}
        />
      </section>

      <section className={SECTION_CLASS}>
        <h2 className="text-base font-arabic font-semibold">إعدادات العرض</h2>

        {/* Tags — homepage sections */}
        <div>
          <p className={LABEL_CLASS}>الأقسام التي يظهر فيها في الصفحة الرئيسية</p>
          <Controller
            control={control}
            name="tags"
            render={({ field }) => (
              <div className="flex flex-wrap gap-3">
                {([
                  { value: 'new',         label: 'وصل حديثاً',    color: 'bg-blue-50 border-blue-300 text-blue-700 data-[on=true]:bg-blue-500 data-[on=true]:text-white data-[on=true]:border-blue-500' },
                  { value: 'best_seller', label: 'الأكثر مبيعاً', color: 'bg-amber-50 border-amber-300 text-amber-700 data-[on=true]:bg-amber-500 data-[on=true]:text-white data-[on=true]:border-amber-500' },
                  { value: 'on_sale',     label: 'عروض حصرية',    color: 'bg-red-50 border-red-300 text-red-700 data-[on=true]:bg-red-500 data-[on=true]:text-white data-[on=true]:border-red-500' },
                ] as const).map(tag => {
                  const active = field.value?.includes(tag.value)
                  return (
                    <button
                      key={tag.value}
                      type="button"
                      data-on={active}
                      onClick={() => {
                        if (active) {
                          field.onChange(field.value.filter((t: string) => t !== tag.value))
                        } else {
                          field.onChange([...(field.value ?? []), tag.value])
                        }
                      }}
                      className={cn('px-4 py-2 rounded-xl text-sm font-arabic font-medium border-2 transition-all', tag.color)}
                    >
                      {tag.label}
                    </button>
                  )
                })}
              </div>
            )}
          />
          <p className="text-xs font-arabic text-secondary mt-2">اختر قسماً أو أكثر لإظهار المنتج في الصفحة الرئيسية. يمكن تفعيل أكثر من قسم في نفس الوقت.</p>
        </div>

        {/* is_featured + is_published */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
          <Controller
            control={control}
            name="is_featured"
            render={({ field }) => (
              <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container cursor-pointer border border-transparent hover:border-outline-variant/30 transition-colors">
                <div>
                  <p className="text-sm font-arabic font-bold text-on-surface">منتج مميز</p>
                  <p className="text-xs font-arabic text-secondary mt-0.5">يظهر في أبرز مواقع العرض</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={field.value}
                  onClick={() => field.onChange(!field.value)}
                  className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200', field.value ? 'bg-primary' : 'bg-surface-container-high')}
                >
                  <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200', field.value ? 'translate-x-5' : 'translate-x-0.5')} />
                </button>
              </label>
            )}
          />
          <Controller
            control={control}
            name="is_published"
            render={({ field }) => (
              <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container cursor-pointer border border-transparent hover:border-outline-variant/30 transition-colors">
                <div>
                  <p className="text-sm font-arabic font-bold text-on-surface">منشور</p>
                  <p className="text-xs font-arabic text-secondary mt-0.5">مرئي للزبائن في المتجر</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={field.value}
                  onClick={() => field.onChange(!field.value)}
                  className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200', field.value ? 'bg-primary' : 'bg-surface-container-high')}
                >
                  <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200', field.value ? 'translate-x-5' : 'translate-x-0.5')} />
                </button>
              </label>
            )}
          />
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <button type="submit" disabled={isSubmitting} className="bg-primary text-white px-8 py-2.5 rounded-xl font-arabic flex items-center gap-2">
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {isEdit ? 'حفظ التعديلات' : 'إضافة المنتج'}
        </button>
      </div>
    </form>
  )
}
