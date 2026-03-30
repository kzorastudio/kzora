'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { categorySchema, type CategoryFormData } from '@/lib/validators'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'
import ImageUploader, { type UploadedImage } from './ImageUploader'

interface CategoryFormProps {
  initialData?: Category
  onSuccess: (item: Category) => void
}

const FIELD_CLASS =
  'w-full rounded-xl border border-outline-variant/50 bg-surface-container px-3 py-2.5 text-sm font-arabic text-on-surface placeholder:text-secondary/60 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition'

const LABEL_CLASS = 'block text-sm font-arabic font-medium text-on-surface-variant mb-1'

export default function CategoryForm({ initialData, onSuccess }: CategoryFormProps) {
  const isEdit = !!initialData

  const [image, setImage] = useState<UploadedImage | null>(
    initialData?.image_url && initialData.image_public_id
      ? { 
          id: 'initial',
          url: initialData.image_url, 
          public_id: initialData.image_public_id,
          is_main: true,
          isLocal: false
        }
      : null
  )

  const [imageToDelete, setImageToDelete] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name_ar: initialData?.name_ar ?? '',
      description: initialData?.description ?? '',
      sort_order: initialData?.sort_order ?? 0,
      is_active: initialData?.is_active ?? true,
      show_in_header: initialData?.show_in_header ?? false,
      show_in_footer: initialData?.show_in_footer ?? false,
      show_in_home: initialData?.show_in_home ?? false,
      header_order: initialData?.header_order ?? 0,
      footer_order: initialData?.footer_order ?? 0,
      home_order: initialData?.home_order ?? 0,
    },
  })

  async function onSubmit(data: CategoryFormData) {
    try {
      let finalImage = image

      // 1. Upload if local
      if (image?.isLocal && image.file) {
        const formData = new FormData()
        formData.append('file', image.file)
        formData.append('folder', 'categories')

        const uploadRes = await fetch('/api/images/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json().catch(() => ({}))
          throw new Error(errorData.details || errorData.error || 'فشل رفع صورة القسم')
        }
        const uploadData = await uploadRes.json()
        finalImage = {
          ...image,
          url: uploadData.url,
          public_id: uploadData.public_id,
          isLocal: false
        }
      }



      const payload = {
        ...data,
        image_url: finalImage?.url ?? null,
        image_public_id: finalImage?.public_id ?? null,
      }

      const url = isEdit ? `/api/categories/${initialData!.id}` : '/api/categories'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'حدث خطأ أثناء الحفظ')
      }

      const resData = await res.json()
      toast.success(isEdit ? 'تم تحديث القسم بنجاح' : 'تم إضافة القسم بنجاح')
      onSuccess(resData.category)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
    }
  }

  function handleImageAdd(files: File[]) {
    const file = files[0]
    if (!file) return
    
    // Revoke old local URL if exists
    if (image?.isLocal) {
      URL.revokeObjectURL(image.url)
    }

    setImage({
      id: Math.random().toString(36).substring(7),
      file,
      url: URL.createObjectURL(file),
      public_id: '',
      is_main: true,
      isLocal: true
    })
  }

  function handleImageRemove(_id: string) {
    if (image && !image.isLocal && image.public_id) {
      // Delete immediately from Cloudinary
      fetch('/api/images/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_id: image.public_id })
      }).catch(err => console.error('Failed to delete image', err))
    }
    if (image?.isLocal && image.url) {
      URL.revokeObjectURL(image.url)
    }
    setImage(null)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} dir="rtl" className="flex flex-col gap-5">
      {/* Basic info */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-ambient p-5 flex flex-col gap-4">
        <h2 className="text-base font-arabic font-semibold text-on-surface">معلومات القسم</h2>

        <div>
          <label className={LABEL_CLASS}>اسم القسم (بالعربية) *</label>
          <input
            type="text"
            placeholder="مثال: أحذية رياضية"
            {...register('name_ar')}
            className={cn(FIELD_CLASS, errors.name_ar && 'border-error')}
          />
          {errors.name_ar && (
            <p className="mt-1 text-xs font-arabic text-error">{errors.name_ar.message}</p>
          )}
        </div>

        <div>
          <label className={LABEL_CLASS}>الوصف</label>
          <textarea
            rows={3}
            placeholder="وصف مختصر للقسم (اختياري)"
            {...register('description')}
            className={cn(FIELD_CLASS, 'resize-y min-h-[80px]')}
          />
        </div>

        <div className="flex flex-col gap-4">
          {/* is_active toggle */}
          <Controller
            control={control}
            name="is_active"
            render={({ field }) => (
              <div className="flex flex-col">
                <label className={LABEL_CLASS}>حالة القسم</label>
                <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container cursor-pointer border border-transparent hover:border-outline-variant/30 transition-colors">
                  <span className="text-sm font-arabic font-bold text-on-surface">
                    {field.value ? 'مفعل ومرئي للزبائن' : 'معطل ومخفي'}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={field.value}
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
                      field.value ? 'bg-primary' : 'bg-surface-container-high'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
                        field.value ? 'translate-x-5' : 'translate-x-0.5'
                      )}
                    />
                  </button>
                </label>
                <p className="text-[11px] font-arabic text-secondary mt-2">
                  عند التعطيل، لن يظهر هذا القسم ولا المنتجات التابعة له في المتجر مطلقاً. ترتيب الأقسام سيتم برمجياً تصاعدياً حسب أقدمية الإضافة.
                </p>
              </div>
            )}
          />
        </div>
      </div>

      {/* Visibility Settings */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-ambient p-5 flex flex-col gap-4">
        <div>
           <h2 className="text-base font-arabic font-semibold text-on-surface mb-1">إعدادات الظهور السريع (التنقل)</h2>
           <p className="text-xs font-arabic text-secondary">
             اختر الأماكن التي تريد أن يظهر فيها هذا القسم للزبائن للوصول إليه بسرعة. سيقوم المتجر بترتيب الأقسام تلقائياً.
           </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Header */}
          <Controller
            control={control}
            name="show_in_header"
            render={({ field }) => (
              <label className="flex flex-col gap-3 p-4 rounded-xl bg-surface-container cursor-pointer border border-transparent hover:border-outline-variant/30 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-arabic font-bold text-on-surface">الشريط العلوي (Nav)</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={field.value}
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
                      field.value ? 'bg-primary' : 'bg-surface-container-high'
                    )}
                  >
                    <span className={cn(
                      'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
                      field.value ? 'translate-x-5' : 'translate-x-0.5'
                    )} />
                  </button>
                </div>
                <p className="text-[11px] font-arabic text-secondary leading-relaxed">
                  عرض القسم في شريط التنقل الرئيسي أعلى المتجر (بجانب زر الصفحة الرئيسية).
                </p>
              </label>
            )}
          />

          {/* Footer */}
          <Controller
            control={control}
            name="show_in_footer"
            render={({ field }) => (
              <label className="flex flex-col gap-3 p-4 rounded-xl bg-surface-container cursor-pointer border border-transparent hover:border-outline-variant/30 transition-colors">
                 <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-arabic font-bold text-on-surface">أسفل الموقع (Footer)</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={field.value}
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
                      field.value ? 'bg-primary' : 'bg-surface-container-high'
                    )}
                  >
                    <span className={cn(
                      'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
                      field.value ? 'translate-x-5' : 'translate-x-0.5'
                    )} />
                  </button>
                </div>
                <p className="text-[11px] font-arabic text-secondary leading-relaxed">
                  إضافة رابط سريع لهذا القسم في الروابط السفلية (تذييل الصفحة) في جميع الصفحات.
                </p>
              </label>
            )}
          />

          {/* Home */}
          <Controller
            control={control}
            name="show_in_home"
            render={({ field }) => (
              <label className="flex flex-col gap-3 p-4 rounded-xl bg-surface-container cursor-pointer border border-transparent hover:border-outline-variant/30 transition-colors">
                 <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-arabic font-bold text-on-surface">واجهة المتجر الرئيسية</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={field.value}
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
                      field.value ? 'bg-primary' : 'bg-surface-container-high'
                    )}
                  >
                    <span className={cn(
                      'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
                      field.value ? 'translate-x-5' : 'translate-x-0.5'
                    )} />
                  </button>
                </div>
                <p className="text-[11px] font-arabic text-secondary leading-relaxed">
                  إظهار القسم كمربع بارز بصورته في الصفحة الرئيسية ضمن قائمة الأقسام المهمة.
                </p>
              </label>
            )}
          />
        </div>
      </div>

      {/* Image */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-ambient p-5 flex flex-col gap-4">
        <h2 className="text-base font-arabic font-semibold text-on-surface">صورة القسم</h2>
        <ImageUploader
          images={image ? [image] : []}
          onAddFiles={handleImageAdd}
          onRemoveImage={handleImageRemove}
          onSetMain={() => {}}
          maxFiles={1}
        />
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-arabic font-medium hover:bg-primary-container transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          {isEdit ? 'حفظ التعديلات' : 'إضافة القسم'}
        </button>
      </div>
    </form>
  )
}
