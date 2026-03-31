'use client'

import { useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import { checkoutSchema, type CheckoutFormData } from '@/lib/validators'
import { ShippingCompanySelector } from '@/components/checkout/ShippingCompanySelector'
import { GovernorateDropdown } from '@/components/checkout/GovernorateDropdown'
import { Truck, MapPin, CreditCard, CheckCircle2, AlertTriangle, ChevronDown } from 'lucide-react'

import type { HomepageSettings } from '@/types'

interface Props {
  onSubmit: (data: CheckoutFormData) => Promise<void>
  isSubmitting: boolean
  settings: HomepageSettings | null
}

const fieldBase =
  'w-full bg-[#F5F1EB] rounded-xl px-4 py-3 text-sm font-arabic text-[#1A1A1A] ' +
  'border border-[#E8E3DB] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 transition-all duration-150 ' +
  'placeholder:text-[#9E9890]'

const labelBase = 'block text-sm font-arabic font-medium text-[#1A1A1A] mb-1.5'
const errorBase = 'mt-1.5 text-xs font-arabic text-[#BA1A1A]'

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

export default function CheckoutForm({ onSubmit, isSubmitting, settings }: Props) {
  const [shippingMethods, setShippingMethods] = useState<any[]>([])

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
      shipping_company: undefined,
      governorate: '',
      full_name: '',
      phone: '',
      address: '',
      notes: '',
      coupon_code: '',
      payment_method: 'cod',
    },
  })

  const shippingCompany = watch('shipping_company')
  const governorate = watch('governorate')
  const paymentMethod = watch('payment_method')

  // Fetch shipping methods from DB
  useEffect(() => {
    fetch('/api/shipping')
      .then(r => r.json())
      .then(d => setShippingMethods(d.methods || []))
      .catch(() => {})
  }, [])

  // Watchers for compatibility checks
  useEffect(() => {
    // When governorate changes, clear address to ensure it's re-entered/selected
    setValue('address', '')
  }, [governorate, setValue])

  useEffect(() => {
    // When company changes, check if current governorate is still supported
    if (shippingCompany && governorate) {
       const company = shippingMethods.find(m => m.slug === shippingCompany)
       const supported = company?.governorates?.some((g: any) => g.name === governorate)
       if (!supported) {
          setValue('governorate', '')
          setValue('address', '')
       } else {
         // Even if governorate is supported, address might not be
         setValue('address', '')
       }
    }
  }, [shippingCompany, setValue, shippingMethods])

  // Get governorates (all if none selected, or specific to company)
  const selectedCompanyGovernorates = useMemo(() => {
    if (!shippingCompany) {
      // Return ALL governorates that are active in at least one shipping method
      const all = new Set<string>()
      shippingMethods.forEach(m => m.governorates?.forEach((g: any) => all.add(g.name)))
      return Array.from(all).sort()
    }
    const company = shippingMethods.find(m => m.slug === shippingCompany)
    return company?.governorates?.map((g: any) => g.name) || []
  }, [shippingCompany, shippingMethods])

  // Get branch addresses (aggregated if none selected, or specific to company + gov)
  const selectedCompanyGovernorateBranches = useMemo(() => {
    if (!governorate) return []
    
    if (!shippingCompany) {
      // Aggregated branches from all companies for this governorate
      const all = new Set<string>()
      shippingMethods.forEach(m => {
        const gov = m.governorates?.find((g: any) => g.name === governorate)
        if (gov?.branch_addresses) {
          gov.branch_addresses.split('\n').forEach((s: string) => all.add(s.trim()))
        }
      })
      return Array.from(all).filter(Boolean).sort()
    }

    const company = shippingMethods.find(m => m.slug === shippingCompany)
    const gov = company?.governorates?.find((g: any) => g.name === governorate)
    if (!gov?.branch_addresses) return []
    return gov.branch_addresses.split('\n').map((s: string) => s.trim()).filter(Boolean)
  }, [shippingCompany, governorate, shippingMethods])

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data)
  })

  return (
    <form
      id="checkout-form"
      dir="rtl"
      onSubmit={handleFormSubmit}
      noValidate
      className="space-y-0"
    >
      {/* ═══ Section 1: Shipping Company ═══════════════════════════════════ */}
      <div className="bg-white rounded-2xl p-6 shadow-[0_2px_20px_rgba(27,28,26,0.06)] border border-[#F0EBE3]">
        <SectionHeading icon={Truck} title="شركة الشحن" />
        <ShippingCompanySelector
          companies={shippingMethods}
          selected={shippingCompany ?? ''}
          onChange={(id) => {
            setValue('shipping_company', id, { shouldValidate: true })
          }}
          error={errors.shipping_company?.message}
        />
      </div>

      {/* ═══ Section 2: Shipping Info ══════════════════════════════════════ */}
      <div className="bg-white rounded-2xl p-6 shadow-[0_2px_20px_rgba(27,28,26,0.06)] border border-[#F0EBE3] mt-5">
        <SectionHeading icon={MapPin} title="معلومات الشحن" />

        <div className="space-y-5">
          {/* Governorate + Full Name — side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Governorate */}
            <div>
              <GovernorateDropdown
                governorates={selectedCompanyGovernorates}
                shippingCompanySelected={!!shippingCompany}
                value={governorate ?? ''}
                onChange={(gov) => {
                  setValue('governorate', gov, { shouldValidate: true })
                }}
                error={errors.governorate?.message}
              />
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className={labelBase}>
                الاسم الكامل <span className="text-[#BA1A1A]">*</span>
              </label>
              <input
                id="full_name"
                type="text"
                autoComplete="name"
                placeholder="أدخل اسمك الثلاثي..."
                className={cn(fieldBase, errors.full_name && 'border-[#BA1A1A] focus:border-[#BA1A1A]')}
                {...register('full_name')}
              />
              {errors.full_name && <p className={errorBase}>{errors.full_name.message}</p>}
            </div>
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
              {/* Flag + code — left side */}
              <span
                dir="ltr"
                className="flex items-center gap-1.5 px-3 text-sm font-body font-medium text-[#6B6560] border-r border-[#E8E3DB] select-none shrink-0"
              >
                <span className="text-base">🇸🇾</span>
                +963
              </span>
              {/* Input — right side, RTL */}
              <input
                id="phone"
                type="tel"
                dir="ltr"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="9xx xxx xxx"
                className="flex-1 min-w-0 bg-transparent px-3 py-3 text-sm font-body text-[#1A1A1A] text-right focus:outline-none placeholder:text-[#9E9890]"
                {...register('phone')}
                onBlur={() => trigger('phone')}
              />
            </div>
            <div className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-[#E8F5E9]/60 border border-[#4CAF50]/20 rounded-lg w-fit">
              <svg 
                viewBox="0 0 24 24" 
                className="w-3.5 h-3.5 fill-[#2E7D32]"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .012 5.403.01 12.039c0 2.12.553 4.189 1.602 6.039L0 24l6.135-1.61a11.81 11.81 0 005.912 1.586h.005c6.635 0 12.036-5.402 12.039-12.037a11.85 11.85 0 00-3.539-8.514z"/>
              </svg>
              <p className="text-[11px] font-arabic font-bold text-[#2E7D32]">يجب أن يكون الرقم مفعّل على واتساب</p>
            </div>
            {errors.phone && <p className={errorBase}>{errors.phone.message}</p>}
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className={labelBase}>
              مركز الاستلام <span className="text-[#BA1A1A]">*</span>
            </label>
            
            <div className="relative">
              <select
                id="address"
                className={cn(fieldBase, 'appearance-none pr-4 pl-10', errors.address && 'border-[#BA1A1A] focus:border-[#BA1A1A]')}
                {...register('address')}
              >
                {!governorate ? (
                  <option value="">يرجى اختيار المحافظة أولاً...</option>
                ) : selectedCompanyGovernorateBranches && selectedCompanyGovernorateBranches.length > 0 ? (
                  <>
                    <option value="">اختر مركز الاستلام / الفرع...</option>
                    {selectedCompanyGovernorateBranches.map((branch: string, idx: number) => (
                      <option key={idx} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </>
                ) : (
                  <option value="">لا تتوفر مراكز شحن حالياً في هذه المحافظة</option>
                )}
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#9E9890]">
                <ChevronDown size={16} />
              </div>
            </div>
            {errors.address && <p className={errorBase}>{errors.address.message}</p>}
          </div>
        </div>
      </div>

      {/* ═══ Section 3: Payment Method ═════════════════════════════════════ */}
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
                  <span className="text-xl">📱</span>
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
          </div>
        )}
      </div>

      {/* ═══ Warning Banner ════════════════════════════════════════════════ */}
      <div className="flex items-start gap-3 bg-[#FFF3E0] border border-[#FFB74D]/40 rounded-xl p-4 mt-5">
        <AlertTriangle size={18} className="text-[#E65100] shrink-0 mt-0.5" />
        <p className="font-arabic text-xs text-[#5D4037] leading-relaxed">
          <strong>تنبيه:</strong> لا يمكن للعميل فحص المنتج قبل الدفع. نضمن لكم حق الاسترجاع والتبديل في حال وجود أي عيب مصنعي خلال 3 أيام من الاستلام.
        </p>
      </div>
    </form>
  )
}
