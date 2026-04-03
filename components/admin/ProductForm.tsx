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
    setValue,
    getValues,
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
      mold_type: initialData?.mold_type ?? 'normal',
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
        is_available: c.is_available ?? true,
      })) ?? [],
      variants: initialData?.variants ?? [],
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
        mold_type: initialData.mold_type,
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
          is_available: c.is_available ?? true,
        })) || [],
        variants: initialData.variants || [],
      })
    }
  }, [initialData, reset])

  const { fields: colorFields, append: appendColor, remove: removeColor } = useFieldArray({
    control,
    name: 'colors',
  })

  const watchedColors = watch('colors')
  const watchedSizes = watch('sizes')
  const watchedVariants = watch('variants') || []
  const colorOptions = watchedColors
    .filter(c => c.name_ar.trim() !== '')
    .map(c => ({ label: c.name_ar, value: c.name_ar }))

  // Sync variants with selected colors and sizes
  useEffect(() => {
    const validColors = colorOptions.map(c => c.value)
    const validSizes = (watchedSizes || []).map(s => s.size)
    const newCombinations: { color: string, size: number, quantity: number }[] = []

    const cList = validColors.length > 0 ? validColors : ['']
    const sList = validSizes.length > 0 ? validSizes : [0]

    const currentVariants = getValues('variants') || []

    cList.forEach(color => {
      sList.forEach(size => {
        // Find existing quantity
        const existing = currentVariants.find((v: any) => v.color === color && v.size === size)
        newCombinations.push({
          color,
          size,
          quantity: existing ? existing.quantity : 0
        })
      })
    })

    // Update only if different to prevent infinite loops
    const differs = newCombinations.length !== currentVariants.length || 
      newCombinations.some((nc, i) => nc.color !== currentVariants[i]?.color || nc.size !== currentVariants[i]?.size)

    if (differs) {
      setValue('variants', newCombinations)
    }
  }, [JSON.stringify(colorOptions), JSON.stringify(watchedSizes), setValue, getValues])

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



      // Automatically set status to out_of_stock if all variant quantities are 0
      const variants = data.variants || []
      let finalStockStatus = data.stock_status
      
      const hasVariants = variants.length > 0
      const allZero = hasVariants && variants.every(v => (v.quantity ?? 0) <= 0)
      
      if (allZero) {
        finalStockStatus = 'out_of_stock'
      } else if (hasVariants && variants.some(v => (v.quantity ?? 0) > 0) && data.stock_status === 'out_of_stock') {
        // Automatically set back to in_stock if it was out_of_stock but now has items
        finalStockStatus = 'in_stock'
      }

      const payload = {
        ...data,
        stock_status: finalStockStatus,
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
    <form onSubmit={handleSubmit(onSubmit)} dir="rtl" className="flex flex-col gap-5 pb-24 md:pb-5">
      <section className={cn(SECTION_CLASS, 'max-sm:p-4')}>
        <h2 className="text-base font-arabic font-semibold">المعلومات الأساسية</h2>
        <div className="space-y-4">
          <div>
            <label className={LABEL_CLASS}>اسم المنتج *</label>
            <input type="text" {...register('name')} className={FIELD_CLASS} />
            {errors.name && <p className="mt-1 text-xs text-error">{errors.name.message}</p>}
          </div>
          <div>
            <label className={LABEL_CLASS}>الوصف *</label>
            <textarea rows={4} {...register('description')} className={cn(FIELD_CLASS, 'resize-y')} />
          </div>
        </div>
      </section>

      <section className={cn(SECTION_CLASS, 'max-sm:p-4')}>
        <h2 className="text-base font-arabic font-semibold">القسم والأسعار</h2>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="xs:col-span-2 md:col-span-1">
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
            <label className={LABEL_CLASS}>القالب (المقاس)</label>
            <select {...register('mold_type')} className={FIELD_CLASS}>
              <option value="normal">طبيعي (نظامي)</option>
              <option value="chinese">صيني (أصغر)</option>
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>السعر (ليرة)</label>
            <input type="number" {...register('price_syp', { valueAsNumber: true })} className={cn(FIELD_CLASS, 'font-bold tabular-nums')} />
          </div>
          <div>
            <label className={LABEL_CLASS}>السعر ($)</label>
            <input type="number" step="0.01" {...register('price_usd', { valueAsNumber: true })} className={cn(FIELD_CLASS, 'font-bold tabular-nums')} />
          </div>
        </div>
      </section>

      <section className={cn(SECTION_CLASS, 'max-sm:p-4')}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-arabic font-semibold">الألوان المتاحة</h2>
          <button type="button" onClick={() => appendColor({ name_ar: '', hex_code: '#000000', swatch_url: '', swatch_public_id: '', is_available: true })} className="text-primary text-sm flex items-center gap-1 font-bold">
            <Plus size={16} /> إضافة لون
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {colorFields.map((field, index) => (
            <div key={field.id} className="flex flex-col gap-2 p-3 rounded-2xl bg-surface-container border border-outline-variant/30">
              <div className="flex gap-3 items-center">
                <input type="text" placeholder="اسم اللون" {...register(`colors.${index}.name_ar`)} className={FIELD_CLASS} />
                <Controller control={control} name={`colors.${index}.hex_code`} render={({ field: f }) => (
                  <div className="relative h-10 w-12 shrink-0 rounded-xl overflow-hidden border border-outline-variant/30">
                    <input type="color" {...f} className="absolute inset-0 h-[150%] w-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer" />
                  </div>
                )} />
                <button type="button" onClick={() => removeColor(index)} className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-error/10 text-error hover:bg-error/20 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-arabic text-secondary font-medium">متوفر حالياً؟</span>
                <Controller
                  control={control}
                  name={`colors.${index}.is_available`}
                  render={({ field: f }) => (
                    <button
                      type="button"
                      onClick={() => f.onChange(!f.value)}
                      className={cn(
                        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
                        f.value ? 'bg-primary' : 'bg-surface-container-high'
                      )}
                    >
                      <span className={cn(
                        'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
                        f.value ? 'translate-x-5' : 'translate-x-0.5'
                      )} />
                    </button>
                  )}
                />
              </div>
            </div>
          ))}
          {colorFields.length === 0 && (
            <div className="col-span-full py-6 text-center border-2 border-dashed border-outline-variant/30 rounded-2xl">
              <p className="text-sm font-arabic text-secondary">لا توجد ألوان مضافة حالياً</p>
            </div>
          )}
        </div>
      </section>

      <section className={cn(SECTION_CLASS, 'max-sm:p-4')}>
        <h2 className="text-base font-arabic font-semibold">المقاسات المتاحة *</h2>
        <Controller
          control={control}
          name="sizes"
          render={({ field }) => (
            <div className="grid grid-cols-4 xs:grid-cols-5 sm:grid-cols-6 lg:grid-cols-11 gap-2">
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
                        'w-full h-11 rounded-xl text-sm font-arabic font-bold transition-all border-2 tabular-nums',
                        selected
                          ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                          : 'bg-surface-container text-secondary border-outline-variant/30 hover:border-primary/30'
                      )}
                    >
                      {size}
                    </button>
                    {selected && (
                      <button
                        type="button"
                        onClick={() => {
                          const current = field.value || []
                          field.onChange(current.map((s: any) => s.size === size ? { ...s, is_available: !s.is_available } : s))
                        }}
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[9px] font-arabic font-bold border transition-colors truncate w-full text-center',
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
          <p className="text-xs font-arabic text-error mt-2">{errors.sizes.message as string}</p>
        )}
      </section>

      <section className={cn(SECTION_CLASS, 'max-sm:p-4')}>
        <h2 className="text-base font-arabic font-semibold">إدارة المخزون (الكميات)</h2>
        <p className="text-xs font-arabic text-secondary -mt-1 mb-2">أدخل الكمية المتاحة لكل مقاس ولون بدقة.</p>
        
        {(() => {
          const validColors = colorOptions.length > 0 ? colorOptions : [{ label: 'أساسي', value: '' }]
          const validSizes = (watchedSizes || []).map(s => s.size)

          if (validSizes.length === 0 && validColors[0].value === '') {
             return (
               <div className="py-8 text-center border-2 border-dashed border-outline-variant/30 rounded-2xl">
                 <p className="text-sm font-arabic text-secondary italic">يرجى إضافة مقاس أو لون أولاً لتتمكن من تحديد الكميات.</p>
               </div>
             )
          }

          return (
            <div className="flex flex-col gap-6">
              {validColors.map((color) => (
                <div key={color.value} className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-1.5 h-4 bg-primary rounded-full" />
                    <h3 className="text-sm font-arabic font-bold text-on-surface">
                      اللون: {color.label || <span className="text-secondary/40 italic">أساسي</span>}
                    </h3>
                  </div>
                  
                  {/* Sizes Grid */}
                  <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {validSizes.map(size => {
                      const variantIdx = (getValues('variants') || []).findIndex(
                        (v: any) => v.color === color.value && v.size === size
                      )
                      
                      if (variantIdx === -1) return null

                      return (
                        <div key={size} className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-arabic font-bold text-secondary/70 px-1">المقاس {size}</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              {...register(`variants.${variantIdx}.quantity`, { valueAsNumber: true })}
                              className={cn(
                                'w-full bg-white rounded-xl border border-outline-variant/40 px-3 py-3 text-sm font-bold tabular-nums shadow-sm',
                                'focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none',
                                (watch(`variants.${variantIdx}.quantity`) || 0) === 0 ? 'text-secondary/40 bg-surface-container-lowest' : 'text-on-surface'
                              )}
                            />
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-arabic font-medium text-secondary/30 pointer-events-none">قطعة</span>
                          </div>
                        </div>
                      )
                    })}
                    
                    {validSizes.length === 0 && (() => {
                       const variantIdx = (getValues('variants') || []).findIndex(
                         (v: any) => v.color === color.value && (v.size === 0 || v.size === null)
                       )
                       if (variantIdx === -1) return null
                       return (
                          <div className="col-span-full">
                            <label className="text-sm font-arabic font-bold text-secondary mb-1.5 block">الكمية الإجمالية لهذا اللون</label>
                            <input
                              type="number"
                              min="0"
                              {...register(`variants.${variantIdx}.quantity`, { valueAsNumber: true })}
                              className={cn(FIELD_CLASS, 'text-center font-bold text-lg h-14 bg-white')}
                            />
                          </div>
                       )
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )
        })()}
      </section>

      <section className={cn(SECTION_CLASS, 'max-sm:p-4')}>
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

      <section className={cn(SECTION_CLASS, 'max-sm:p-4')}>
        <h2 className="text-base font-arabic font-semibold">إعدادات العرض</h2>

        <div className="space-y-6">
          {/* Tags — homepage sections */}
          <div>
            <p className={cn(LABEL_CLASS, 'mb-3')}>الأقسام التي يظهر فيها في الصفحة الرئيسية</p>
            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([
                    { value: 'new',         label: 'وصل حديثاً',    color: 'bg-blue-50 border-blue-300 text-blue-700 data-[on=true]:bg-blue-600 data-[on=true]:text-white data-[on=true]:border-blue-600' },
                    { value: 'best_seller', label: 'الأكثر مبيعاً', color: 'bg-amber-50 border-amber-300 text-amber-700 data-[on=true]:bg-amber-600 data-[on=true]:text-white data-[on=true]:border-amber-600' },
                    { value: 'on_sale',     label: 'عروض حصرية',    color: 'bg-red-50 border-red-300 text-red-700 data-[on=true]:bg-red-600 data-[on=true]:text-white data-[on=true]:border-red-600' },
                  ] as const).map(tag => {
                    const active = field.value?.includes(tag.value)
                    return (
                      <button
                        key={tag.value}
                        type="button"
                        data-on={active}
                        onClick={() => {
                          const current = field.value ?? []
                          if (active) {
                            field.onChange(current.filter((t: string) => t !== tag.value))
                          } else {
                            field.onChange([...current, tag.value])
                          }
                        }}
                        className={cn('h-12 px-4 rounded-2xl text-sm font-arabic font-bold border-2 transition-all shadow-sm', tag.color)}
                      >
                        {tag.label}
                      </button>
                    )
                  })}
                </div>
              )}
            />
          </div>

          {/* is_featured + is_published */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              control={control}
              name="is_featured"
              render={({ field }) => (
                <label className="flex items-center justify-between p-4 rounded-2xl bg-surface-container cursor-pointer border border-outline-variant/30 hover:border-primary/30 transition-all shadow-sm">
                  <div>
                    <p className="text-sm font-arabic font-bold text-on-surface">منتج مميز</p>
                    <p className="text-[10px] font-arabic text-secondary mt-0.5">يظهر في أبرز مواقع العرض</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={field.value}
                    onClick={() => field.onChange(!field.value)}
                    className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200', field.value ? 'bg-primary' : 'bg-outline-variant')}
                  >
                    <span className={cn('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200', field.value ? 'translate-x-6' : 'translate-x-1')} />
                  </button>
                </label>
              )}
            />
            <Controller
              control={control}
              name="is_published"
              render={({ field }) => (
                <label className="flex items-center justify-between p-4 rounded-2xl bg-surface-container cursor-pointer border border-outline-variant/30 hover:border-primary/30 transition-all shadow-sm">
                  <div>
                    <p className="text-sm font-arabic font-bold text-on-surface">منشور</p>
                    <p className="text-[10px] font-arabic text-secondary mt-0.5">مرئي للزبائن في المتجر</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={field.value}
                    onClick={() => field.onChange(!field.value)}
                    className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200', field.value ? 'bg-primary' : 'bg-outline-variant')}
                  >
                    <span className={cn('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200', field.value ? 'translate-x-6' : 'translate-x-1')} />
                  </button>
                </label>
              )}
            />
          </div>
        </div>
      </section>

      {/* Action Bar - Sticky on mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-lg border-t border-outline-variant/30 md:static md:bg-transparent md:border-none md:p-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-end">
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className={cn(
              "bg-primary text-white px-10 py-4 rounded-2xl font-arabic font-bold flex items-center justify-center gap-3 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95",
              "max-md:w-full max-sm:h-14",
              isSubmitting && "opacity-80 cursor-not-allowed"
            )}
          >
            {isSubmitting && <Loader2 size={20} className="animate-spin" />}
            {isEdit ? 'حفظ التعديلات' : 'إضافة المنتج'}
          </button>
        </div>
      </div>
    </form>
  )
}
