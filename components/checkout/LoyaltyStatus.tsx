'use client'

import React from 'react'
import { Gift, CheckCircle2, CircleDashed } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { Currency } from '@/types'

interface LoyaltyStatusProps {
  confirmedCount: number;
  pendingCount: number;
  hasDiscount: boolean;
  currency: Currency;
  discountAmountSyp: number;
  discountAmountUsd: number;
  className?: string;
  showDeliveryNotice?: boolean;
}

export function LoyaltyStatus({ 
  confirmedCount, 
  pendingCount, 
  hasDiscount, 
  currency,
  discountAmountSyp,
  discountAmountUsd,
  className,
  showDeliveryNotice 
}: LoyaltyStatusProps) {
  // We only show progress up to 3 points in a cycle
  const currentProgress = hasDiscount ? 3 : (confirmedCount % 3);

  const displayDiscount = currency === 'SYP' ? discountAmountSyp : discountAmountUsd;

  return (
    <div className={cn('p-4 rounded-xl border border-[#986D00]/20 bg-gradient-to-br from-[#986D00]/5 to-transparent', className)} dir="rtl">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-[#bfa15f] flex items-center gap-2">
          <Gift size={16} />
          نقاط الولاء
        </h4>
        {hasDiscount && (
          <span className="text-xs font-bold bg-[#986D00]/10 text-[#bfa15f] px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 size={12} />
            خصم متاح!
          </span>
        )}
      </div>

      <div className="flex gap-2 w-full mb-3">
        {[0, 1, 2].map((idx) => {
          const isFilled = idx < currentProgress;
          return (
            <div 
              key={idx}
              className={cn(
                'h-1.5 rounded-full flex-1 transition-all duration-300',
                isFilled ? 'bg-[#bfa15f]' : 'bg-[#e2d5b6]'
              )}
            />
          )
        })}
      </div>

      <div className="flex justify-between items-center text-xs text-secondary/80">
        <span className="font-medium text-[#bfa15f]">
          {currentProgress} / 3 طلبات مؤكدة
        </span>
        {pendingCount > 0 && (
           <span className="flex items-center gap-1 text-on-surface-variant">
             <CircleDashed size={12} className="animate-spin-slow" />
             {pendingCount} قيد الانتظار
           </span>
        )}
      </div>

      {hasDiscount && (
        <p className="mt-3 text-xs bg-[#bfa15f]/10 text-on-surface p-2 rounded-lg font-medium border border-[#bfa15f]/20 leading-relaxed text-center">
          مبروك! لقد أتممت 3 طلبات مؤكدة، تم تطبيق خصم <strong className="text-[#bfa15f] font-bold">{formatPrice(displayDiscount, currency)}</strong> على طلبك الحالي تلقائياً.
        </p>
      )}

      {showDeliveryNotice && !hasDiscount && (
        <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-[11px] rounded-xl border border-blue-100 flex items-start gap-2 leading-relaxed font-arabic">
          <span className="text-sm mt-0.5"></span>
          <span>
            لقد تم حجز هذه النقطة لطلبك. سيتم تأكيد النقطة بشكل رسمي وإضافتها لرصيدك المؤكد فور استلامك وتسديدك لقيمة الطلب (تم التوصيل).
          </span>
        </div>
      )}
    </div>
  )
}
