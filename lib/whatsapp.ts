import type { CartItem, Currency } from '@/types'
import { formatPrice, SHIPPING_LABELS } from './utils'

const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || '963964514765'

interface OrderForWhatsApp {
  orderNumber: string
  customerName: string
  customerPhone: string
  governorate: string
  address: string
  deliveryType: 'delivery' | 'shipping'
  shippingCompany: string
  shippingCompanyName?: string
  items: CartItem[]
  couponCode?: string
  discountSyp?: number
  discountUsd?: number
  loyaltyDiscountSyp?: number
  loyaltyDiscountUsd?: number
  shippingFeeSyp?: number
  shippingFeeUsd?: number
  shippingFeeDetermined?: boolean
  subtotalSyp: number
  subtotalUsd: number
  totalSyp: number
  totalUsd: number
  currency: Currency
  paymentMethod?: string
  paymentTransactionId?: string
  shamCashNumber?: string
  loyaltyPointsCount?: number
}

export function buildWhatsAppUrl(order: OrderForWhatsApp): string {
  const currency = order.currency
  const lines: string[] = [
    `* طلب جديد من متجر كزورا *`,
    ``,
    `* رقم الطلب: * ${order.orderNumber}`,
    `* التاريخ: * ${new Date().toLocaleDateString('ar-SY')}`,
    `------------------------------------------`,
    ``,
    `* معلومات الزبون: *`,
    `- *الاسم:* ${order.customerName}`,
    `- *الهاتف:* ${order.customerPhone}`,
    `- *المحافظة:* ${order.governorate}`,
    `- *العنوان:* ${order.address}`,
    ``,
    `* تفاصيل الشحن: *`,
    `- *طريقة التوصيل:* ${order.deliveryType === 'delivery' ? 'توصيل عادي (حلب)' : 'شحن ضمن المحافظات'}`,
    order.deliveryType === 'shipping' ? `- *الشركة:* ${order.shippingCompanyName || SHIPPING_LABELS[order.shippingCompany || ''] || order.shippingCompany}` : ``,
    ``,
    `* المنتجات المطلوبة: *`,
  ]

  order.items.forEach((item, i) => {
    const price = currency === 'SYP'
      ? formatPrice(item.discount_price_syp ?? item.price_syp, 'SYP')
      : formatPrice(item.discount_price_usd ?? item.price_usd, 'USD')

    lines.push(`------------------------------------------`)
    lines.push(`${i + 1}. *${item.name}*`)
    if (item.color) lines.push(`   *اللون:* ${item.color_name || item.color}`)
    if (item.size) {
      const moldNotice = item.mold_type === 'chinese' ? ' (قالب صيني)' : ' (قالب نظامي)'
      lines.push(`   *المقاس:* ${item.size}${moldNotice}`)
    }
    lines.push(`   *الكمية:* ${item.quantity} x ${price}`)
  })

  lines.push(`------------------------------------------`)

  const subtotal = currency === 'SYP'
    ? formatPrice(order.subtotalSyp, 'SYP')
    : formatPrice(order.subtotalUsd, 'USD')

  lines.push(`*المجموع الفرعي:* ${subtotal}`)

  if (order.couponCode && (order.discountSyp || order.discountUsd)) {
    const discount = currency === 'SYP'
      ? formatPrice(order.discountSyp!, 'SYP')
      : formatPrice(order.discountUsd!, 'USD')
    lines.push(`*خصم (${order.couponCode}):* -${discount}`)
  }

  if (order.loyaltyDiscountSyp || order.loyaltyDiscountUsd) {
    const loyaltyDisc = currency === 'SYP'
      ? formatPrice(order.loyaltyDiscountSyp!, 'SYP')
      : formatPrice(order.loyaltyDiscountUsd!, 'USD')
    lines.push(`*خصم الولاء 🎁:* -${loyaltyDisc}`)
  }

  const multiDiscountSyp = order.items.reduce((acc, item) => acc + (item.multi_discount_syp || 0), 0);

  if (order.shippingFeeDetermined) {
    const feeLabel = order.deliveryType === 'delivery' ? 'اجرة التوصيل' : 'اجرة الشحن'
    lines.push(`*${feeLabel}:* (يتم تحديد السعر مع البائع في الواتس اب)`)
  } else {
    const shippingFee = currency === 'SYP' ? (order.shippingFeeSyp ?? 0) : (order.shippingFeeUsd ?? 0)
    if (shippingFee > 0) {
      const feeLabel = order.deliveryType === 'delivery' ? 'اجرة التوصيل' : 'اجرة الشحن'
      lines.push(`*${feeLabel}:* +${formatPrice(shippingFee, currency)}`)
    }
  }

  const total = currency === 'SYP'
    ? formatPrice(order.totalSyp, 'SYP')
    : formatPrice(order.totalUsd, 'USD')

  lines.push(``)
  lines.push(`*الاجمالي النهائي: ${total}*`)
  
  lines.push(``)
  lines.push(`🎁 *مبروك! لقد كسبت نقطة ولاء من هذا الطلب.*`)
  lines.push(`(سيتم تفعيل وبدء حساب النقطة في رصيدك فور استلام الطلب والتأكد منه)`)
  
  if (typeof order.loyaltyPointsCount === 'number') {
    const currentPoints = order.loyaltyPointsCount
    const remaining = Math.max(0, 3 - currentPoints)
    
    lines.push(``)
    lines.push(`* نظام الولاء المكافآت 🎁: *`)
    lines.push(`- النقاط المكتسبة من هذا الطلب: 1 نقطة ✨`)
    lines.push(`- رصيد نقاطك المؤكدة حالياً: ${currentPoints} نقطة`)
    
    if (remaining > 0) {
      lines.push(`- بقي لك ${remaining} طلبات مؤكدة لتصل للطلب الرابع وتحصل على خصم 1000 ليرة سورية!`)
    } else {
      lines.push(`- مبروك! هذا هو طلبك الرابع وقد حصلت على التخفيض (1000 ل.س) 🥳`)
    }
  }

  const pMethod = order.paymentMethod === 'sham_cash' ? 'شام كاش (تم التحويل)' : 'الدفع عند الاستلام'
  lines.push(`*طريقة الدفع:* ${pMethod}`)

  if (order.paymentMethod === 'sham_cash' && order.shamCashNumber) {
    lines.push(`*رقم محفظة شام كاش:* ${order.shamCashNumber}`)
  }

  if (order.paymentMethod === 'sham_cash' && order.paymentTransactionId) {
    lines.push(`*رمز/رقم عملية التحويل:* ${order.paymentTransactionId}`)
  }

  lines.push(``)
  lines.push(`شكرا لتسوقكم من كزورا!`)
  lines.push(`سيتم تاكيد طلبكم قريبا...`)

  const message = lines.join('\n')
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`
}

