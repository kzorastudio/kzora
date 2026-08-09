'use client'

import { useState, useLayoutEffect, useRef, useCallback } from 'react'
import { formatDate } from '@/lib/utils'
import type { OrderFull } from '@/types'
import BarcodeSVG from '@/components/admin/BarcodeSVG'
import QRCodeSVG from '@/components/admin/QRCodeSVG'

const SHIPPING_DISPLAY: Record<string, string> = {
  karam: 'كرم للشحن',
  qadmous: 'قدموس للشحن',
  masarat: 'مسارات للشحن',
  delivery: 'توصيل عادي (داخل المدينة)',
  shipping: 'شحن شركات',
}

/** Physical die-cut label: 100mm × 150mm, with a 3mm safe area on each side. */
export const LABEL_W_MM = 100
export const LABEL_H_MM = 150
export const LABEL_PAD_MM = 3

/** Auto-fit bounds. Short orders grow to fill the label, long orders shrink to fit one label. */
const MAX_SCALE = 1.35
const MIN_SCALE = 0.4

/* ------------------------------------------------------------------ */
/* Money / totals                                                      */
/* ------------------------------------------------------------------ */

export function computeTotals(o: OrderFull) {
  const cur = o.currency_used === 'USD' ? '$' : 'ل.س'
  const sub = o.currency_used === 'USD' ? o.subtotal_usd : o.subtotal_syp
  const ship = o.currency_used === 'USD' ? o.shipping_fee_usd : o.shipping_fee_syp
  const discount = o.currency_used === 'USD' ? o.discount_amount_usd || 0 : o.discount_amount_syp || 0
  const isAleppo = o.customer_governorate === 'حلب' || o.delivery_type === 'delivery'

  // Aleppo orders include the delivery fee. Everywhere else the invoice total is
  // products minus discount only (shipping is paid to the shipping company).
  const orderTotal = isAleppo ? Math.max(0, sub - discount + ship) : Math.max(0, sub - discount)

  const isPrepaid = o.payment_method === 'sham_cash' || (o as any).payment_status === 'paid'

  return {
    cur,
    sub,
    ship,
    discount,
    isAleppo,
    orderTotal,
    isPrepaid,
    amountToCollect: isPrepaid ? 0 : orderTotal,
  }
}

/* ------------------------------------------------------------------ */
/* Receipt body — shared by the label and A4 modes                     */
/* ------------------------------------------------------------------ */

export function ReceiptBody({ o, compact }: { o: OrderFull; compact: boolean }) {
  const { cur, sub, ship, discount, isAleppo, orderTotal, isPrepaid, amountToCollect } = computeTotals(o)

  // Base sizes for the thermal label. The auto-fit scaler adjusts from here.
  const s = compact
    ? {
        title: 'text-[15px]',
        sub: 'text-[7.5px]',
        badge: 'text-[10px]',
        rowLabel: 'text-[8px]',
        rowValue: 'text-[10px]',
        rowValueBig: 'text-[12px]',
        table: 'text-[9px]',
        totalLabel: 'text-[8.5px]',
        totalValue: 'text-[19px]',
        foot: 'text-[7.5px]',
        gap: 'space-y-[3px]',
        pad: 'p-[4px]',
        barcodeH: 34,
        // Big enough that each QR module still spans several printer dots at 203 dpi
        // once the auto-fit zoom shrinks a long receipt.
        qr: 66,
      }
    : {
        title: 'text-2xl',
        sub: 'text-[11px]',
        badge: 'text-sm',
        rowLabel: 'text-[11px]',
        rowValue: 'text-[13px]',
        rowValueBig: 'text-base',
        table: 'text-xs',
        totalLabel: 'text-xs',
        totalValue: 'text-2xl',
        foot: 'text-[10px]',
        gap: 'space-y-1.5',
        pad: 'p-2',
        barcodeH: 48,
        qr: 68,
      }

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex justify-between items-baseline gap-2 border-b border-gray-400 pb-[2px]">
      <span className={`font-bold text-gray-700 shrink-0 ${s.rowLabel}`}>{label}</span>
      <span className={`font-black text-black text-left ${s.rowValue}`}>{children}</span>
    </div>
  )

  return (
    <div className="font-arabic text-black">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-black pb-[3px] mb-[3px]">
        <div className="min-w-0">
          <h1 className={`font-black tracking-tight text-black leading-none ${s.title}`}>كزورا — KZORA</h1>
          <p className={`font-bold text-black leading-none mt-[2px] ${s.sub}`}>إيصال طلبية ومستند تسليم</p>
        </div>
        <div className="text-left shrink-0">
          <span className={`inline-block bg-black text-white px-[5px] py-[1px] font-black rounded ${s.badge}`}>
            {o.order_number}
          </span>
          <p className={`font-bold mt-[2px] text-black leading-none ${s.sub}`}>{formatDate(o.created_at)}</p>
        </div>
      </div>

      {/* Barcode */}
      <div className="flex justify-center py-[2px] border-b border-dashed border-black">
        <BarcodeSVG value={o.order_number} height={s.barcodeH} showText={true} />
      </div>

      {/* Recipient */}
      <div className={`border-2 border-black my-[4px] ${s.pad} ${s.gap}`}>
        <div className="flex justify-between items-baseline gap-2 border-b border-gray-400 pb-[2px]">
          <span className={`font-bold text-gray-700 shrink-0 ${s.rowLabel}`}>المستلم:</span>
          <span className={`font-black text-black text-left ${s.rowValueBig}`}>{o.customer_full_name}</span>
        </div>
        <div className="flex justify-between items-baseline gap-2 border-b border-gray-400 pb-[2px]">
          <span className={`font-bold text-gray-700 shrink-0 ${s.rowLabel}`}>الهاتف:</span>
          <span className={`font-black text-black text-left ${s.rowValueBig}`} dir="ltr">
            {o.customer_phone}
          </span>
        </div>
        <Row label="المحافظة / المدينة:">{o.customer_governorate}</Row>
        {o.center_name && <Row label="المركز / الفرع:">{o.center_name}</Row>}
        {isAleppo && o.customer_address && (
          <div className="pt-[2px]">
            <span className={`font-bold text-gray-700 block ${s.rowLabel}`}>العنوان التفصيلي:</span>
            <span className={`font-black text-black block leading-snug ${s.rowValue}`}>{o.customer_address}</span>
          </div>
        )}
        <Row label="طريقة الشحن:">
          {SHIPPING_DISPLAY[o.shipping_company || ''] || o.shipping_company || 'توصيل'}
        </Row>
        <Row label="طريقة الدفع:">{isPrepaid ? 'مدفوع مسبقاً (شام كاش)' : 'عند الاستلام (COD)'}</Row>
      </div>

      {/* Items */}
      <div className="my-[4px]">
        <p className={`font-black border-b border-black pb-[1px] mb-[2px] text-black ${s.rowLabel}`}>
          محتويات الطلبية:
        </p>
        <table className={`w-full text-right border-collapse ${s.table}`}>
          <thead>
            <tr className="border-b border-black font-black text-black">
              <th className="py-[2px] text-center">الكمية</th>
              <th className="py-[2px] text-center">اللون/المقاس</th>
              <th className="py-[2px] text-right">المنتج</th>
              <th className="py-[2px] text-left">السعر</th>
            </tr>
          </thead>
          <tbody>
            {(o.items || []).map((it) => {
              const unit = o.currency_used === 'USD' ? it.unit_price_usd : it.unit_price_syp
              return (
                <tr key={it.id} className="border-b border-gray-300 font-bold text-black align-top">
                  <td className="py-[2px] text-center font-black text-black">{it.quantity}</td>
                  <td className="py-[2px] text-center text-gray-800 leading-snug">
                    {[it.color, it.size].filter(Boolean).join(' / ') || '—'}
                  </td>
                  <td className="py-[2px] font-bold text-black leading-snug">{it.product_name}</td>
                  <td className="py-[2px] text-left font-black text-black whitespace-nowrap">
                    {(unit * it.quantity).toLocaleString()} {cur}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="mt-[4px] space-y-[2px]">
        <div className={`flex justify-between font-bold text-black ${s.rowLabel}`}>
          <span>مجموع المنتجات:</span>
          <span>
            {sub.toLocaleString()} {cur}
          </span>
        </div>
        {o.notes && (
          <div className={`my-[3px] p-[3px] border border-black text-black ${s.foot}`}>
            <span className="font-black block">ملاحظات:</span>
            <span className="font-bold leading-snug">{o.notes}</span>
          </div>
        )}
        {discount > 0 && (
          <div className={`flex justify-between font-bold text-black ${s.rowLabel}`}>
            <span>الخصم:</span>
            <span>
              - {discount.toLocaleString()} {cur}
            </span>
          </div>
        )}
        {isAleppo && ship > 0 && (
          <div className={`flex justify-between font-bold text-black ${s.rowLabel}`}>
            <span>أجور التوصيل (حلب فقط):</span>
            <span>
              {ship.toLocaleString()} {cur}
            </span>
          </div>
        )}

        {/* Amount to collect — outlined, not filled. Thermal printers and Chrome's
            "background graphics" setting can drop filled backgrounds, which would
            make white-on-black text vanish. Black-on-white always prints. */}
        <div className="mt-[4px] border-[3px] border-black p-[4px] text-center">
          <p className={`font-black uppercase tracking-wide text-black ${s.totalLabel}`}>
            {isPrepaid
              ? 'المبلغ المطلوب قبضه من العميل — مدفوع مسبقاً'
              : orderTotal === 0
              ? 'المبلغ المطلوب قبضه من العميل — طلب تبديل / مجاني'
              : 'المبلغ المطلوب قبضه من العميل'}
          </p>
          <p className={`font-black tracking-tight text-black leading-none mt-[2px] ${s.totalValue}`}>
            {amountToCollect.toLocaleString()} {cur}
          </p>
          {isPrepaid && o.payment_transaction_id && (
            <p className={`font-mono font-bold text-black mt-[2px] ${s.foot}`}>
              رقم العملية: {o.payment_transaction_id}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-[5px] pt-[3px] border-t-2 border-black flex items-center justify-between gap-2 text-black">
        <div className="flex-1 min-w-0">
          <p className={`font-black text-black ${s.rowLabel}`}>متجر كزورا — Kzora Store</p>
          <p className={`font-bold text-black leading-snug mt-[2px] ${s.foot}`}>
            بإمكانك تسوق المزيد عبر الرابط:{' '}
            <span dir="ltr" className="font-mono font-black underline">
              https://www.kzora.co/
            </span>
          </p>
          <p className={`font-bold text-black leading-snug mt-[1px] ${s.foot}`}>
            شكراً لتسوقكم معنا! لأي استفسار:{' '}
            <span dir="ltr" className="font-mono font-black">
              0964514765
            </span>
          </p>
        </div>
        <div className="flex flex-col items-center shrink-0">
          <QRCodeSVG value="https://www.kzora.co/" size={s.qr} />
          <span dir="ltr" className={`font-mono font-bold mt-[1px] text-black ${s.foot}`}>
            kzora.co
          </span>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* One 100×150mm label with auto-fit                                   */
/* ------------------------------------------------------------------ */

export function LabelPage({ o }: { o: OrderFull }) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  const fit = useCallback(() => {
    const viewport = viewportRef.current
    const inner = innerRef.current
    if (!viewport || !inner) return

    // Measure the natural, unscaled height at full label width.
    inner.style.zoom = '1'
    const natural = inner.getBoundingClientRect().height
    const available = viewport.clientHeight
    if (!natural || !available) return

    // 0.995 absorbs sub-pixel rounding so nothing is ever clipped at the bottom edge.
    const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, (available / natural) * 0.995))

    // `zoom`, NOT `transform: scale()`. A transform is a paint-time effect: Chrome
    // paginates and rasterizes the print output from the *layout* box, which stays
    // full size, so long receipts got clipped at the label edge in the actual print
    // (verified — the screen render looked fine while the printed page was cut).
    // `zoom` scales real layout, so print output matches what is on screen.
    inner.style.zoom = String(next)
    inner.dataset.scale = String(next)
    setScale(next)
  }, [])

  useLayoutEffect(() => {
    fit()
    // Arabic webfonts change metrics after load — re-fit once they are ready.
    let cancelled = false
    const fonts = (document as any).fonts
    if (fonts?.ready) fonts.ready.then(() => !cancelled && fit())

    const onResize = () => fit()
    window.addEventListener('resize', onResize)
    // Chrome recomputes layout at paper width when the print dialog opens.
    const mq = window.matchMedia('print')
    const onMq = () => requestAnimationFrame(fit)
    mq.addEventListener?.('change', onMq)
    window.addEventListener('beforeprint', onMq)
    window.addEventListener('afterprint', onMq)

    return () => {
      cancelled = true
      window.removeEventListener('resize', onResize)
      mq.removeEventListener?.('change', onMq)
      window.removeEventListener('beforeprint', onMq)
      window.removeEventListener('afterprint', onMq)
    }
  }, [fit])

  return (
    <div className="label-page bg-white text-black relative" data-order={o.order_number}>
      <div ref={viewportRef} className="label-viewport relative h-full w-full overflow-hidden">
        {/* flow-root contains child margins so the measured height is the real height.
            Width stays 100%: under `zoom` a percentage width resolves in the element's
            own scaled units, so it still renders across the full label width. */}
        <div ref={innerRef} className="label-inner flow-root w-full">
          <ReceiptBody o={o} compact />
        </div>
      </div>
      {/* Screen-only indicator so you can see how much the label was scaled */}
      <span className="no-print absolute bottom-1 left-1 text-[9px] font-mono text-gray-400">
        {Math.round(scale * 100)}%
      </span>
    </div>
  )
}
