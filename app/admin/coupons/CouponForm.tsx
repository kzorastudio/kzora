'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { couponSchema, type CouponFormData } from '@/lib/validators'
import { cn } from '@/lib/utils'

interface CouponFormProps {
  onSuccess: () => void
}

const FIELD_CLASS =
  'w-full rounded-xl border border-outline-variant/50 bg-surface-container px-3 py-2.5 text-sm font-arabic text-on-surface placeholder:text-secondary/60 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition'

const LABEL_CLASS = 'block text-sm font-arabic font-medium text-on-surface-variant mb-1'

export default function CouponForm({ onSuccess }: CouponFormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code:          '',
      type:          'percentage',
      value:         10,
      min_order_syp: 0,
      max_uses:      null,
      expires_at:    null,
      is_active:     true,
    },
  })

  const watchedType = watch('type')

  async function onSubmit(data: CouponFormData) {
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'فشل إضافة الكوبون')
      }

      toast.success('تم إضافة الكوبون بنجاح')
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} dir="rtl" className="flex flex-col gap-4">
      {/* Code */}
      <div>
        <label className={LABEL_CLASS}>كود الخصم *</label>
        <input
          type="text"
          placeholder="مثال: KZORA20"
          {...register('code')}
          className={cn(FIELD_CLASS, 'uppercase', errors.code && 'border-error')}
        />
        {errors.code && (
          <p className="mt-1 text-xs font-arabic text-error">{errors.code.message}</p>
        )}
      </div>

      {/* Type */}
      <div>
        <label className={LABEL_CLASS}>نوع الخصم *</label>
        <select
          {...register('type')}
          className={cn(FIELD_CLASS, errors.type && 'border-error')}
        >
          <option value="percentage">نسبة مئوية (%)</option>
          <option value="fixed_amount">مبلغ ثابت (ل.س.ج)</option>
        </select>
      </div>

      {/* Value */}
      <div>
        <label className={LABEL_CLASS}>
          {watchedType === 'percentage' ? 'نسبة الخصم (%)' : 'مبلغ الخصم (ل.س.ج)'} *
        </label>
        <input
          type="number"
          min={1}
          max={watchedType === 'percentage' ? 100 : undefined}
          step={watchedType === 'percentage' ? 1 : 100}
          placeholder={watchedType === 'percentage' ? '10' : '5000'}
          {...register('value', { valueAsNumber: true })}
          className={cn(FIELD_CLASS, errors.value && 'border-error')}
        />
        {errors.value && (
          <p className="mt-1 text-xs font-arabic text-error">{errors.value.message}</p>
        )}
      </div>

      {/* Min order */}
      <div>
        <label className={LABEL_CLASS}>الحد الأدنى للطلب (ل.س.ج)</label>
        <input
          type="number"
          min={0}
          step={1000}
          placeholder="0"
          {...register('min_order_syp', { valueAsNumber: true })}
          className={FIELD_CLASS}
        />
      </div>

      {/* Max uses */}
      <div>
        <label className={LABEL_CLASS}>الحد الأقصى للاستخدام</label>
        <input
          type="number"
          min={1}
          placeholder="اتركه فارغاً للاستخدام غير المحدود"
          {...register('max_uses', {
            valueAsNumber: true,
            setValueAs: (v) => (v === '' || isNaN(v) ? null : Number(v)),
          })}
          className={FIELD_CLASS}
        />
      </div>

      {/* Expires at */}
      <div>
        <label className={LABEL_CLASS}>تاريخ الانتهاء</label>
        <input
          type="date"
          {...register('expires_at', {
            setValueAs: (v) => v || null,
          })}
          className={FIELD_CLASS}
        />
      </div>

      {/* is_active toggle */}
      <Controller
        control={control}
        name="is_active"
        render={({ field }) => (
          <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container cursor-pointer">
            <span className="text-sm font-arabic text-on-surface">
              {field.value ? 'نشط' : 'معطّل'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={field.value}
              onClick={() => field.onChange(!field.value)}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors duration-200',
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
        )}
      />

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-arabic font-medium hover:bg-primary-container transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting && <Loader2 size={15} className="animate-spin" />}
        {isSubmitting ? 'جاري الإضافة...' : 'إضافة الكوبون'}
      </button>
    </form>
  )
}
