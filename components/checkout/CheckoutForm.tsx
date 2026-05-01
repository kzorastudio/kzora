'use client'

import { useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import { checkoutSchema, type CheckoutFormData } from '@/lib/validators'
import { ShippingCompanySelector } from '@/components/checkout/ShippingCompanySelector'
import { Truck, MapPin, CreditCard, CheckCircle2, AlertTriangle, ChevronDown, Package } from 'lucide-react'

import type { HomepageSettings } from '@/types'

interface Props {
  onSubmit: (data: CheckoutFormData) => Promise<void>
  isSubmitting: boolean
  settings: HomepageSettings | null
  shippingMethods?: any[]
  onDeliveryTypeChange?: (type: 'delivery' | 'shipping') => void
  onPhoneChange?: (phone: string) => void
  onGovernorateChange?: (gov: string) => void
  onShippingCompanyChange?: (slug: string) => void
}

const fieldBase =
  'w-full bg-[#F5F1EB] rounded-xl px-4 py-3 text-sm font-arabic text-[#1A1A1A] ' +
  'border border-[#E8E3DB] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 transition-all duration-150 ' +
  'placeholder:text-[#9E9890]'

const labelBase = 'block text-sm font-arabic font-medium text-[#1A1A1A] mb-1.5'
const errorBase = 'mt-1.5 text-xs font-arabic text-[#BA1A1A]'

// Syrian governorates (excluding Aleppo city - delivery only)
// Dynamic governorates will be fetched from API

function SectionHeading({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#785600]/10 to-[#B8860B]/5 flex items-center justify-center">
        <Icon size={18} className="text-[#785600]" />
      </div>
      <h2 className="font-arabic text-lg font-bold text-[#1A1A1A]">{title}</h2>
    </div>
  )
}

export default function CheckoutForm({ onSubmit, isSubmitting, settings, shippingMethods: propShippingMethods, onDeliveryTypeChange, onPhoneChange, onGovernorateChange, onShippingCompanyChange }: Props) {
  const [shippingMethods, setShippingMethods] = useState<any[]>(propShippingMethods || [])
  const [centers, setCenters] = useState<any[]>([])
  const [dynamicGovernorates, setDynamicGovernorates] = useState<string[]>([])
  const [loadingCenters, setLoadingCenters] = useState(false)
  const [loadingGovs, setLoadingGovs] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      delivery_type: '' as any,
      shipping_company: '',
      governorate: '',
      center: '',
      full_name: '',
      phone: '',
      address: '',
      notes: '',
      coupon_code: '',
      payment_method: 'cod',
      payment_transaction_id: '',
    },
  })

  const deliveryType   = watch('delivery_type')
  const governorate    = watch('governorate')
  const centerId       = watch('center')
  const shippingCompany = watch('shipping_company')
  const paymentMethod  = watch('payment_method')
  const phoneValue     = watch('phone')

  useEffect(() => {
    if (onPhoneChange && phoneValue !== undefined) {
      onPhoneChange(phoneValue)
    }
  }, [phoneValue, onPhoneChange])

  // Fetch dynamic governorates on mount
  useEffect(() => {
    if (deliveryType === 'shipping') {
      setLoadingGovs(true)
      fetch(`/api/shipping/centers?type=governorates&t=${Date.now()}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          setDynamicGovernorates(data.governorates || [])
        })
        .finally(() => setLoadingGovs(false))
    }
  }, [deliveryType])

  // Notify parent on delivery type change
  useEffect(() => {
    if (onDeliveryTypeChange) {
      onDeliveryTypeChange(deliveryType)
    }
    // Reset shipping fields when switching modes
    if (deliveryType === 'delivery') {
      setValue('governorate', '')
      setValue('center', '')
      setValue('shipping_company', '')
      setCenters([])
    } else if (deliveryType === 'shipping') {
      setValue('address', '')
    }
  }, [deliveryType, onDeliveryTypeChange, setValue])

  // Sync shipping methods from parent
  useEffect(() => {
    if (propShippingMethods && propShippingMethods.length > 0) {
      setShippingMethods(propShippingMethods)
    }
  }, [propShippingMethods])

  // Fetch centers when governorate changes (shipping mode only)
  useEffect(() => {
    if (deliveryType === 'shipping' && governorate) {
      setLoadingCenters(true)
      setValue('center', '')
      setValue('shipping_company', '')

      fetch(`/api/shipping/centers?governorate=${encodeURIComponent(governorate)}&t=${Date.now()}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          setCenters(data.centers || [])
        })
        .finally(() => setLoadingCenters(false))
      
      if (onGovernorateChange) onGovernorateChange(governorate)
    } else {
      setCenters([])
      setValue('center', '')
      if (onGovernorateChange) onGovernorateChange('')
    }
  }, [governorate, deliveryType, setValue, onGovernorateChange])

  // Reset shipping company when center changes
  useEffect(() => {
    setValue('shipping_company', '')
    if (onShippingCompanyChange) onShippingCompanyChange('')
  }, [centerId, setValue, onShippingCompanyChange])

  // Get available shipping companies for selected center
  const availableCompanies = useMemo(() => {
    if (!centerId || !governorate) return []
    const selectedCenter = centers.find(c => c.id === centerId)
    if (!selectedCenter?.supported_companies) return []
    const supportedSlugs: string[] = selectedCenter.supported_companies

    return shippingMethods.filter(m => supportedSlugs.includes(m.slug))
  }, [centerId, centers, governorate, shippingMethods])

  const handleFormSubmit = handleSubmit(async (data) => {
    const selectedCenter = centers.find(c => c.id === data.center)
    // For delivery: governorate = Aleppo, address = manual text
    // For shipping: governorate = selected, address = center name (for order records)
    const finalGov = data.delivery_type === 'delivery' ? 'حلب' : (data.governorate ?? '')
    const finalAddress = data.delivery_type === 'delivery'
      ? (data.address ?? '')
      : (selectedCenter?.name ?? data.governorate ?? '')
    await onSubmit({
      ...data,
      governorate: finalGov,
      address: finalAddress,
      center_name: selectedCenter?.name,
    })
  })

  return (
    <form
      id="checkout-form"
      dir="rtl"
      onSubmit={handleFormSubmit}
      noValidate
      className="space-y-0"
    >
      {/* ═══ Section 1: Delivery Type ══════════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl p-8 shadow-[0_4px_30px_rgba(120,86,0,0.08)] border-2 border-[#785600]/10 ring-4 ring-[#785600]/5">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#785600] to-[#B8860B] flex items-center justify-center mb-4 shadow-lg shadow-[#785600]/20">
            <Truck size={28} className="text-white" />
          </div>
          <h2 className="font-arabic text-2xl font-bold text-[#1A1A1A]">طريقة الاستلام</h2>
          <p className="font-arabic text-sm text-[#6B6560] mt-1">يجب اختيار طريقة الاستلام للمتابعة</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* توصيل */}
          <label className={cn(
            "flex flex-col items-center gap-4 border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 relative overflow-hidden group",
            deliveryType === 'delivery'
              ? "bg-[#FFF9F0] border-[#785600] shadow-md ring-2 ring-[#785600]/20"
              : "bg-[#FAF8F5] border-[#E8E3DB] hover:border-[#D3C4AF] hover:bg-white"
          )}>
            <input
              type="radio"
              value="delivery"
              className="sr-only"
              {...register('delivery_type')}
            />
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
              deliveryType === 'delivery' ? "bg-[#785600] rotate-3 scale-110" : "bg-[#F0EBE3] group-hover:scale-105"
            )}>
              <Truck size={32} className={deliveryType === 'delivery' ? "text-white" : "text-[#9E9890]"} />
            </div>
            <div className="text-center">
              <p className={cn("font-arabic font-bold text-xl mb-1", deliveryType === 'delivery' ? "text-[#785600]" : "text-[#1A1A1A]")}>
                توصيل
              </p>
              <p className="font-arabic text-sm text-[#6B6560] leading-relaxed">
                لباب المنزل<br/>مدينة حلب حصراً
              </p>
            </div>
            {deliveryType === 'delivery' && (
              <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-[#785600] flex items-center justify-center shadow-lg">
                <CheckCircle2 size={14} className="text-white" />
              </div>
            )}
          </label>

          {/* شحن */}
          <label className={cn(
            "flex flex-col items-center gap-4 border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 relative overflow-hidden group",
            deliveryType === 'shipping'
              ? "bg-[#F0F7ED] border-[#4B6339] shadow-md ring-2 ring-[#4B6339]/20"
              : "bg-[#FAF8F5] border-[#E8E3DB] hover:border-[#D3C4AF] hover:bg-white"
          )}>
            <input
              type="radio"
              value="shipping"
              className="sr-only"
              {...register('delivery_type')}
            />
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
              deliveryType === 'shipping' ? "bg-[#4B6339] -rotate-3 scale-110" : "bg-[#F0EBE3] group-hover:scale-105"
            )}>
              <Package size={32} className={deliveryType === 'shipping' ? "text-white" : "text-[#9E9890]"} />
            </div>
            <div className="text-center">
              <p className={cn("font-arabic font-bold text-xl mb-1", deliveryType === 'shipping' ? "text-[#4B6339]" : "text-[#1A1A1A]")}>
                شحن
              </p>
              <p className="font-arabic text-sm text-[#6B6560] leading-relaxed">
                شركات الشحن<br/>لكافة المحافظات
              </p>
            </div>
            {deliveryType === 'shipping' && (
              <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-[#4B6339] flex items-center justify-center shadow-lg">
                <CheckCircle2 size={14} className="text-white" />
              </div>
            )}
          </label>
        </div>
        {errors.delivery_type && (
          <div className="mt-4 flex items-center justify-center gap-2 text-[#BA1A1A] animate-bounce">
            <AlertTriangle size={16} />
            <p className="font-arabic text-sm font-bold">{errors.delivery_type.message}</p>
          </div>
        )}
      </div>

      {/* ═══ Section 2: Contact Info ════════════════════════════════════════════════ */}
      {deliveryType ? (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-0">
          <div className="bg-white rounded-2xl p-6 shadow-[0_2px_20px_rgba(27,28,26,0.06)] border border-[#F0EBE3] mt-5">
            <SectionHeading icon={MapPin} title="معلومات الاتصال" />

        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="full_name" className={cn(labelBase, 'mb-0')}>
                  الاسم الكامل <span className="text-[#BA1A1A]">*</span>
                </label>
                <span className="text-[10px] font-arabic px-2 py-0.5 bg-[#785600]/10 text-[#785600] rounded-full font-bold">
                  بالعربي أو الإنكليزي
                </span>
              </div>
              <input
                id="full_name"
                type="text"
                autoComplete="name"
                placeholder="أدخل اسمك الكامل..."
                className={cn(fieldBase, errors.full_name && 'border-[#BA1A1A] focus:border-[#BA1A1A]')}
                {...register('full_name')}
                onInput={(e) => {
                  const val = e.currentTarget.value;
                  // Allow Arabic characters, English letters, and spaces
                  const filtered = val.replace(/[^\u0600-\u06FFa-zA-Z\s]/g, '');
                  if (val !== filtered) {
                    e.currentTarget.value = filtered;
                  }
                }}
              />
              {errors.full_name && <p className={errorBase}>{errors.full_name.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className={labelBase}>
                رقم الهاتف <span className="text-[#BA1A1A]">*</span>
              </label>
              <div
                className={cn(
                  'flex flex-row-reverse items-stretch bg-[#F5F1EB] rounded-xl border transition-all duration-150',
                  errors.phone ? 'border-[#BA1A1A]' : 'border-[#E8E3DB] focus-within:border-[#785600] focus-within:ring-1 focus-within:ring-[#785600]/20'
                )}
              >
                <span
                  dir="ltr"
                  className="flex items-center gap-1.5 px-3 text-sm font-body font-medium text-[#6B6560] border-r border-[#E8E3DB] select-none shrink-0"
                >
                  <span className="text-base"></span>
                  +963
                </span>
                <input
                  id="phone"
                  type="tel"
                  dir="ltr"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="9xx xxx xxx"
                  className="flex-1 min-w-0 bg-transparent px-3 py-3 text-sm font-body text-[#1A1A1A] text-right focus:outline-none placeholder:text-[#9E9890]"
                  {...register('phone')}
                  onInput={(e) => {
                    const val = e.currentTarget.value;
                    // Allow both English and Arabic digits
                    const filtered = val.replace(/[^0-9٠-٩\s]/g, '');
                    if (val !== filtered) {
                      e.currentTarget.value = filtered;
                    }
                  }}
                  onBlur={() => trigger('phone')}
                />
              </div>
              <div className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-[#E8F5E9]/60 border border-[#4CAF50]/20 rounded-lg w-fit">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#2E7D32]" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .012 5.403.01 12.039c0 2.12.553 4.189 1.602 6.039L0 24l6.135-1.61a11.81 11.81 0 005.912 1.586h.005c6.635 0 12.036-5.402 12.039-12.037a11.85 11.85 0 00-3.539-8.514z"/>
                </svg>
                <p className="text-[11px] font-arabic font-bold text-[#2E7D32]">يجب أن يكون الرقم مفعّل على واتساب</p>
              </div>
              {errors.phone && <p className={errorBase}>{errors.phone.message}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Section 3: Delivery Details (conditional) ══════════════════════════════ */}
      {deliveryType === 'delivery' ? (
        /* ── توصيل: Aleppo only, manual address ── */
        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_20px_rgba(27,28,26,0.06)] border border-[#F0EBE3] mt-5">
          <SectionHeading icon={MapPin} title="عنوان التوصيل — حلب" />

          {/* Aleppo info banner */}
          <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-[#FFF9F0] border border-[#785600]/20 rounded-xl">
            <Truck size={18} className="text-[#785600] shrink-0" />
            <p className="font-arabic text-xs text-[#5D4037] leading-relaxed">
              خدمة التوصيل متاحة داخل مدينة <strong>حلب فقط</strong> عبر مندوب كزورا.
            </p>
          </div>

          <div>
            <label htmlFor="address" className={labelBase}>
              العنوان بالتفصيل <span className="text-[#BA1A1A]">*</span>
            </label>
            <textarea
              id="address"
              rows={3}
              placeholder="مثال: حي الميدان، شارع النيل، بناية رقم 12..."
              className={cn(fieldBase, 'resize-none', errors.address && 'border-[#BA1A1A] focus:border-[#BA1A1A]')}
              {...register('address')}
            />
            {errors.address && <p className={errorBase}>{errors.address.message}</p>}
          </div>
        </div>
      ) : (
        /* ── شحن: Governorate → Center → Company ── */
        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_20px_rgba(27,28,26,0.06)] border border-[#F0EBE3] mt-5">
          <SectionHeading icon={Package} title="تفاصيل الشحن" />

          <div className="space-y-5">
            {/* Governorate */}
            <div>
              <label htmlFor="governorate-select" className={labelBase}>
                المحافظة <span className="text-[#BA1A1A]">*</span>
              </label>
              <div className="relative">
                <select
                  id="governorate-select"
                  className={cn(
                    fieldBase, 'appearance-none pr-4 pl-10',
                    errors.governorate && 'border-[#BA1A1A] focus:border-[#BA1A1A]'
                  )}
                  {...register('governorate')}
                >
                  <option value="">{loadingGovs ? 'جارٍ التحميل...' : 'اختر المحافظة...'}</option>
                  {dynamicGovernorates.map(gov => (
                    <option key={gov} value={gov}>{gov}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#9E9890]" />
              </div>
              {errors.governorate && <p className={errorBase}>{errors.governorate.message}</p>}
            </div>

            {/* Center */}
            <div>
              <label htmlFor="center" className={labelBase}>
                المركز / المنطقة <span className="text-[#BA1A1A]">*</span>
              </label>
              <div className="relative">
                <select
                  id="center"
                  disabled={!governorate || loadingCenters}
                  className={cn(
                    fieldBase, 'appearance-none pr-4 pl-10',
                    errors.center && 'border-[#BA1A1A] focus:border-[#BA1A1A]',
                    (!governorate || loadingCenters) && 'opacity-50 cursor-not-allowed'
                  )}
                  {...register('center')}
                >
                  <option value="">
                    {!governorate
                      ? 'اختر المحافظة أولاً...'
                      : loadingCenters
                      ? 'جارٍ التحميل...'
                      : centers.length === 0
                      ? 'لا توجد مراكز متوفرة لهذه المحافظة'
                      : 'اختر المركز...'}
                  </option>
                  {centers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#9E9890]" />
              </div>
              {errors.center && <p className={errorBase}>{errors.center.message}</p>}
            </div>

            {/* Shipping Company */}
            {centerId && (
              <div>
                {availableCompanies.length === 0 ? (
                  <div className="p-4 bg-[#FAF8F5] border border-[#E8E3DB] rounded-xl text-sm font-arabic text-[#9E9890]">
                    لا توجد شركات شحن متاحة لهذا المركز حالياً.
                  </div>
                ) : (
                  <ShippingCompanySelector
                    companies={availableCompanies}
                    selected={shippingCompany ?? ''}
                    onChange={(slug) => {
                      setValue('shipping_company', slug, { shouldValidate: true })
                      if (onShippingCompanyChange) onShippingCompanyChange(slug)
                    }}
                    error={errors.shipping_company?.message}
                  />
                )}
              </div>
            )}

            {/* Waiting prompt if no center yet */}
            {(!centerId && governorate) && (
              <div className="p-6 text-center border-2 border-dashed border-[#E8E3DB] rounded-2xl bg-[#FAF8F5]">
                <Package size={28} className="mx-auto text-[#9E9890] mb-2 opacity-50" />
                <p className="font-arabic text-sm text-[#6B6560]">اختر المركز لعرض شركات الشحن المتاحة.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ Notes ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl p-6 shadow-[0_2px_20px_rgba(27,28,26,0.06)] border border-[#F0EBE3] mt-5">
        <div>
          <label htmlFor="notes" className={labelBase}>
            ملاحظات إضافية <span className="text-[#9E9890] text-xs font-normal">(اختياري)</span>
          </label>
          <textarea
            id="notes"
            rows={2}
            placeholder="أي تعليمات خاصة للتوصيل أو الطلب..."
            className={cn(fieldBase, 'resize-none')}
            {...register('notes')}
          />
        </div>
      </div>

      {/* ═══ Section 4: Payment Method ═══════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl p-6 shadow-[0_2px_20px_rgba(27,28,26,0.06)] border border-[#F0EBE3] mt-5">
        <SectionHeading icon={CreditCard} title="طريقة الدفع" />

        <div className="space-y-3">
          {/* Cash on Delivery */}
          <label className={cn(
            "flex items-center gap-4 border-2 rounded-xl p-4 cursor-pointer transition-all duration-200",
            paymentMethod === 'cod'
              ? "bg-[#F0F7ED] border-[#4B6339] shadow-sm"
              : "bg-white border-[#F0EBE3] hover:border-[#E8E3DB]"
          )}>
            <input
              type="radio"
              value="cod"
              className="sr-only"
              {...register('payment_method')}
            />
            <div className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
              paymentMethod === 'cod' ? "border-[#4B6339] bg-[#4B6339]" : "border-[#D1C9BE]"
            )}>
              {paymentMethod === 'cod' && <CheckCircle2 size={14} className="text-white" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">💵</span>
                <p className="font-arabic font-bold text-sm text-[#1A1A1A]">الدفع عند الاستلام</p>
              </div>
              <p className="font-arabic text-[11px] text-[#6B6560] mt-0.5">ادفع نقداً عند استلام طلبيتك من المندوب أو الفرع.</p>
            </div>
          </label>

          {/* Sham Cash */}
          {settings?.sham_cash_enabled && (
            <label className={cn(
              "flex items-center gap-4 border-2 rounded-xl p-4 cursor-pointer transition-all duration-200",
              paymentMethod === 'sham_cash'
                ? "bg-[#FFF9F0] border-[#785600] shadow-sm"
                : "bg-white border-[#F0EBE3] hover:border-[#E8E3DB]"
            )}>
              <input
                type="radio"
                value="sham_cash"
                className="sr-only"
                {...register('payment_method')}
              />
              <div className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                paymentMethod === 'sham_cash' ? "border-[#785600] bg-[#785600]" : "border-[#D1C9BE]"
              )}>
                {paymentMethod === 'sham_cash' && <CheckCircle2 size={14} className="text-white" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl"></span>
                  <p className="font-arabic font-bold text-sm text-[#1A1A1A]">شام كاش (تحويل مسبق)</p>
                </div>
                <p className="font-arabic text-[11px] text-[#6B6560] mt-0.5">قم بالتحويل إلى رقم المحفظة أدناه قبل إتمام الطلب.</p>
              </div>
            </label>
          )}
        </div>

        {/* Sham Cash Instructions */}
        {paymentMethod === 'sham_cash' && settings?.sham_cash_enabled && (
          <div className="mt-4 p-4 bg-[#785600]/5 border border-[#785600]/20 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="font-arabic text-xs font-bold text-[#785600]">رقم محفظة شام كاش:</span>
              <span className="font-body text-sm font-bold text-[#1A1A1A] bg-white px-2 py-0.5 rounded border border-[#E8E3DB]">{settings.sham_cash_number}</span>
            </div>
            {settings.sham_cash_instructions && (
              <p className="font-arabic text-[11px] text-[#4A4742] leading-relaxed whitespace-pre-line">
                {settings.sham_cash_instructions}
              </p>
            )}
            <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-[#E3F2FD] rounded-lg">
              <AlertTriangle size={14} className="text-[#1976D2] shrink-0 mt-0.5" />
              <p className="font-arabic text-[10px] text-[#1976D2]">يرجى إرفاق إشعار الدفع عبر الواتساب فور إرسال الطلب ليتم تأكيده.</p>
            </div>

            {settings.sham_cash_image_url && (
              <div className="mt-4 flex flex-col items-center gap-3">
                <p className="font-arabic text-[10px] text-[#785600] font-bold">امسح الكود أو استخدم صورة الحساب للتحويل:</p>
                <img
                  src={settings.sham_cash_image_url}
                  alt="Sham Cash QR/Account"
                  className="max-sm:w-full w-[220px] h-auto rounded-2xl border-4 border-white shadow-lg bg-white"
                />
              </div>
            )}

            {/* Transaction ID */}
            <div className="mt-4">
              <label htmlFor="payment_transaction_id" className={labelBase}>
                رقم/رمز عملية التحويل <span className="text-[#BA1A1A]">*</span>
              </label>
              <input
                id="payment_transaction_id"
                type="text"
                dir="ltr"
                placeholder="أدخل رقم أو رمز عملية التحويل من شام كاش..."
                className={cn(fieldBase, errors.payment_transaction_id && 'border-[#BA1A1A] focus:border-[#BA1A1A]')}
                {...register('payment_transaction_id')}
              />
              {errors.payment_transaction_id && <p className={errorBase}>{errors.payment_transaction_id.message}</p>}
              <p className="mt-1 text-[10px] font-arabic text-[#9E9890]">
                ستجد رقم العملية في إشعار التحويل على تطبيق شام كاش
              </p>
            </div>
          </div>
        )}
      </div>
        </div>
      ) : (
        <div className="mt-5 p-8 border-2 border-dashed border-[#E8E3DB] rounded-3xl bg-white/60 text-center animate-pulse flex flex-col items-center justify-center gap-3">
          <Truck size={32} className="text-[#D3C4AF]" />
          <p className="font-arabic text-sm text-[#9E9890] font-bold">يرجى اختيار طريقة الاستلام بالأعلى لمتابعة إدخال بياناتك...</p>
        </div>
      )}

    </form>
  )
}
