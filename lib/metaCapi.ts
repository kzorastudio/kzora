/**
 * Meta Conversions API (CAPI) — إرسال الأحداث من السيرفر مباشرة إلى فيس بوك.
 *
 * السبب: البكسل في المتصفح يفقد 20–40% من الأحداث بسبب iOS ومانعات الإعلانات
 * وحظر الكوكيز. أما هذا فيُرسل من سيرفر Kzora مباشرة فلا يتأثر بالمتصفح، وهو
 * الطريقة الوحيدة الموثوقة لتتبّع طلبيات الواتساب (لأن العميل يغادر الموقع قبل
 * أن يطلق البكسل حدث Purchase).
 *
 * متغيرات البيئة المطلوبة:
 *   NEXT_PUBLIC_FB_PIXEL_ID      → رقم البكسل (Dataset ID)
 *   FB_CONVERSIONS_API_TOKEN     → توكن الـ Conversions API (سرّي — لا يُكشف للمتصفح)
 *   FB_TEST_EVENT_CODE           → (اختياري) كود اختبار الأحداث أثناء التجربة
 */

import crypto from 'crypto'

const GRAPH_VERSION = 'v21.0'

/** SHA-256 hashing مطلوب من فيس بوك لكل بيانات العميل (Advanced Matching). */
function hash(value?: string | null): string | undefined {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  if (!normalized) return undefined
  return crypto.createHash('sha256').update(normalized).digest('hex')
}

/** تطبيع رقم الهاتف: أرقام فقط، ويُفضّل بصيغة دولية (بدون +). */
function hashPhone(phone?: string | null): string | undefined {
  if (!phone) return undefined
  let digits = phone.replace(/\D/g, '')
  // أرقام سوريا المحلية تبدأ بـ 0 → حوّلها إلى صيغة دولية 963
  if (digits.startsWith('0')) digits = '963' + digits.slice(1)
  if (!digits) return undefined
  return crypto.createHash('sha256').update(digits).digest('hex')
}

export interface PurchaseEventInput {
  /** معرّف الطلب — يُستخدم كـ event_id لمنع تكرار الحدث مع البكسل. */
  orderId: string
  value: number
  currency: string
  /** بيانات العميل للمطابقة المتقدّمة (تُشفّر قبل الإرسال). */
  customer: {
    phone?: string | null
    fullName?: string | null
    city?: string | null
  }
  contents: Array<{ id: string; quantity: number; item_price?: number }>
  /** بيانات المتصفح لتحسين المطابقة — تُقرأ من الـ request في route الطلبات. */
  clientUserAgent?: string | null
  clientIpAddress?: string | null
  fbp?: string | null
  fbc?: string | null
  /** رابط الصفحة التي تمّ فيها الحدث (عادة صفحة إتمام الطلب). */
  eventSourceUrl?: string | null
}

/**
 * يرسل حدث Purchase إلى فيس بوك. لا يرمي استثناءً أبداً — فشل التتبّع يُسجَّل
 * فقط ولا يجب أن يكسر إنشاء الطلب.
 */
export async function sendPurchaseEvent(input: PurchaseEventInput): Promise<void> {
  const pixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID
  const token = process.env.FB_CONVERSIONS_API_TOKEN

  // إن لم تُضبط المفاتيح، نتجاهل بصمت (المتجر يعمل بدون تتبّع).
  if (!pixelId || !token) return

  try {
    const userData: Record<string, unknown> = {}
    const ph = hashPhone(input.customer.phone)
    const nameParts = input.customer.fullName?.trim().split(/\s+/) ?? []
    const fn = hash(nameParts[0])
    const ln = nameParts.length > 1 ? hash(nameParts.slice(1).join(' ')) : undefined
    const ct = hash(input.customer.city?.replace(/\s+/g, ''))
    if (ph) {
      userData.ph = [ph]
      // رقم الهاتف المهشّر كمعرّف خارجي ثابت — يحسّن مطابقة نفس العميل عبر الطلبات
      userData.external_id = [ph]
    }
    if (fn) userData.fn = [fn]
    if (ln) userData.ln = [ln]
    if (ct) userData.ct = [ct]
    userData.country = [hash('sy')]
    if (input.clientUserAgent) userData.client_user_agent = input.clientUserAgent
    if (input.clientIpAddress) userData.client_ip_address = input.clientIpAddress
    if (input.fbp) userData.fbp = input.fbp
    if (input.fbc) userData.fbc = input.fbc

    const payload: Record<string, unknown> = {
      data: [
        {
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          event_id: input.orderId, // dedup مع بكسل المتصفح
          action_source: 'website',
          event_source_url: input.eventSourceUrl || undefined,
          user_data: userData,
          custom_data: {
            currency: input.currency,
            value: input.value,
            content_type: 'product',
            contents: input.contents.map((c) => ({
              id: c.id,
              quantity: c.quantity,
              item_price: c.item_price,
            })),
            content_ids: input.contents.map((c) => c.id),
            num_items: input.contents.reduce((s, c) => s + c.quantity, 0),
          },
        },
      ],
    }

    if (process.env.FB_TEST_EVENT_CODE) {
      payload.test_event_code = process.env.FB_TEST_EVENT_CODE
    }

    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${token}`

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error('Meta CAPI Purchase failed:', res.status, text)
    }
  } catch (err) {
    console.error('Meta CAPI Purchase error:', err)
  }
}
