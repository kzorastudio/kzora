'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import { couponSchema, type CouponFormData } from '@/lib/validators'
import type { Coupon } from '@/types'

interface Props {
  initialData?: Coupon
  onSuccess: () => void
}

const inputBase =
  'w-full bg-[#F2EDE6] rounded-t-lg px-3 pt-3 pb-2 text-sm font-arabic text-[#1A1A1A] ' +
  'border-b-2 border-[#D3C4AF] focus:border-[#B8860B] focus:outline-none transition-colors duration-150 ' +
  'placeholder:text-[#6B6560]/60'

const labelBase = 'block text-sm font-arabic font-medium text-[#1A1A1A] mb-1.5'
const errorBase = 'mt-1.5 text-xs font-arabic text-[#BA1A1A]'

export default function CouponForm({ initialData, onSuccess }: Props) {
  const isEdit = !!initialData

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: initialData?.code ?? '',
      type: initialData?.type ?? 'percentage',
      value: initialData?.value ?? undefined,
      min_order_syp: initialData?.min_order_syp ?? 0,
      max_uses: initialData?.max_uses ?? null,
      expires_at: initialData?.expires_at
        ? initialData.expires_at.split('T')[0]
        : null,
      is_active: initialData?.is_active ?? true,
    },
  })

  const couponType = watch('type')
  const isActive = watch('is_active')

  // Sync reset when initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        code: initialData.code,
        type: initialData.type,
        value: initialData.value,
        min_order_syp: initialData.min_order_syp,
        max_uses: initialData.max_uses,
        expires_at: initialData.expires_at ? initialData.expires_at.split('T')[0] : null,
        is_active: initialData.is_active,
      })
    }
  }, [initialData, reset])

  const onSubmit = handleSubmit(async (data) => {
    const url = isEdit ? `/api/coupons/${initialData!.id}` : '/api/coupons'
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        code: data.code.toUpperCase(),
        max_uses: data.max_uses ?? null,
        expires_at: data.expires_at || null,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('Coupon save error:', err)
      return
    }

    onSuccess()
  })

  return (
    <form dir="rtl" onSubmit={onSubmit} noValidate className="space-y-5">
      {/* Code */}
      <div>
        <label htmlFor="coupon-code" className={labelBase}>
          كود الخصم
          <span className="text-[#BA1A1A] mr-0.5">*</span>
        </label>
        <input
          id="coupon-code"
          type="text"
          placeholder="مثال: SUMMER20"
          className={cn(inputBase, 'uppercase tracking-wider', errors.code && 'border-[#BA1A1A]')}
          {...register('code', {
            onChange: (e) => {
              e.target.value = e.target.value.toUpperCase()
            },
          })}
        />
        {errors.code && <p className={errorBase}>{errors.code.message}</p>}
      </div>

      {/* Type */}
      <div>
        <span className={labelBase}>
          نوع الخصم
          <span className="text-[#BA1A1A] mr-0.5">*</span>
        </span>
        <div className="flex gap-3 mt-1">
          {(
            [
              { value: 'percentage', label: 'نسبة مئوية (%)' },
              { value: 'fixed_amount', label: 'مبلغ ثابت (ل.س)' },
            ] as const
          ).map((opt) => (
            <label
              key={opt.value}
              className={cn(
                'flex items-center gap-2 cursor-pointer flex-1 p-3 rounded-lg transition-all duration-150',
                couponType === opt.value
                  ? 'bg-[#B8860B]/10 ring-2 ring-[#B8860B]'
                  : 'bg-[#F2EDE6] hover:bg-[#EDE5D8]'
              )}
            >
              <input
                type="radio"
                value={opt.value}
                className="accent-[#B8860B]"
                {...register('type')}
              />
              <span className="text-sm font-arabic text-[#1A1A1A]">{opt.label}</span>
            </label>
          ))}
        </div>
        {errors.type && <p className={errorBase}>{errors.type.message}</p>}
      </div>

      {/* Value */}
      <div>
        <label htmlFor="coupon-value" className={labelBase}>
          {couponType === 'percentage' ? 'نسبة الخصم (%)' : 'مبلغ الخصم (ل.س)'}
          <span className="text-[#BA1A1A] mr-0.5">*</span>
        </label>
        <input
          id="coupon-value"
          type="number"
          min={0}
          max={couponType === 'percentage' ? 100 : undefined}
          placeholder={couponType === 'percentage' ? '20' : '50000'}
          className={cn(inputBase, errors.value && 'border-[#BA1A1A]')}
          {...register('value', { valueAsNumber: true })}
        />
        {errors.value && <p className={errorBase}>{errors.value.message}</p>}
      </div>

      {/* Min order */}
      <div>
        <label htmlFor="min-order" className={labelBase}>
          الحد الأدنى للطلب (ل.س)
        </label>
        <input
          id="min-order"
          type="number"
          min={0}
          placeholder="0"
          className={cn(inputBase, errors.min_order_syp && 'border-[#BA1A1A]')}
          {...register('min_order_syp', { valueAsNumber: true })}
        />
        {errors.min_order_syp && (
          <p className={errorBase}>{errors.min_order_syp.message}</p>
        )}
      </div>

      {/* Max uses */}
      <div>
        <label htmlFor="max-uses" className={labelBase}>
          الحد الأقصى للاستخدام
          <span className="text-[#6B6560] text-xs font-normal mr-1">(اتركه فارغاً = غير محدود)</span>
        </label>
        <input
          id="max-uses"
          type="number"
          min={1}
          placeholder="غير محدود"
          className={cn(inputBase, errors.max_uses && 'border-[#BA1A1A]')}
          {...register('max_uses', {
            setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
          })}
        />
        {errors.max_uses && <p className={errorBase}>{errors.max_uses.message}</p>}
      </div>

      {/* Expires at */}
      <div>
        <label htmlFor="expires-at" className={labelBase}>
          تاريخ الانتهاء
          <span className="text-[#6B6560] text-xs font-normal mr-1">(اختياري)</span>
        </label>
        <input
          id="expires-at"
          type="date"
          className={cn(inputBase, errors.expires_at && 'border-[#BA1A1A]')}
          {...register('expires_at', {
            setValueAs: (v) => (v === '' ? null : v),
          })}
        />
        {errors.expires_at && (
          <p className={errorBase}>{errors.expires_at.message}</p>
        )}
      </div>

      {/* is_active toggle */}
      <div className="flex items-center justify-between p-3 bg-[#F2EDE6] rounded-lg">
        <span className="text-sm font-arabic font-medium text-[#1A1A1A]">
          تفعيل الكوبون
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          onClick={() => setValue('is_active', !isActive, { shouldValidate: true })}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8860B] focus-visible:ring-offset-2',
            isActive ? 'bg-[#B8860B]' : 'bg-[#D3C4AF]'
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
              isActive ? 'translate-x-1.5' : '-translate-x-4'
            )}
          />
        </button>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          'w-full h-11 rounded-xl font-arabic font-semibold text-white text-sm',
          'bg-gradient-to-l from-[#785600] to-[#986D00]',
          'hover:from-[#986D00] hover:to-[#B8860B]',
          'transition-all duration-200 shadow-sm hover:shadow-md',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8860B] focus-visible:ring-offset-2',
          'disabled:opacity-60 disabled:cursor-not-allowed'
        )}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            جارٍ الحفظ...
          </span>
        ) : isEdit ? (
          'تحديث الكوبون'
        ) : (
          'إنشاء الكوبون'
        )}
      </button>
    </form>
  )
}
