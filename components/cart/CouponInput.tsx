'use client'

import { useState, useRef } from 'react'
import { CheckCircle2, XCircle, Loader2, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Currency } from '@/types'

interface CouponInputProps {
  onApply: (code: string, discountSyp: number, discountUsd: number) => void
  onRemove?: () => void
  currency: Currency
  appliedCode?: string
  className?: string
}

type Status = 'idle' | 'loading' | 'success' | 'error'

export function CouponInput({
  onApply,
  onRemove,
  currency,
  appliedCode,
  className,
}: CouponInputProps) {
  const [code, setCode] = useState(appliedCode ?? '')
  const [status, setStatus] = useState<Status>(appliedCode ? 'success' : 'idle')
  const [message, setMessage] = useState<string>(appliedCode ? 'تم تطبيق كود الخصم بنجاح' : '')
  const inputRef = useRef<HTMLInputElement>(null)

  const isApplied = status === 'success'

  const handleApply = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return

    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: trimmed,
          order_total_syp: 1000,   // placeholder — parent can pass actual totals if needed
          order_total_usd: 1,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.valid) {
        setStatus('error')
        setMessage(data.message ?? 'كود الخصم غير صحيح أو منتهي الصلاحية')
      } else {
        setStatus('success')
        setMessage('تم تطبيق كود الخصم بنجاح!')
        onApply(trimmed, data.discount_syp ?? 0, data.discount_usd ?? 0)
      }
    } catch {
      setStatus('error')
      setMessage('حدث خطأ، يرجى المحاولة مجدداً')
    }
  }

  const handleRemove = () => {
    setCode('')
    setStatus('idle')
    setMessage('')
    onRemove?.()
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleApply()
  }

  return (
    <div dir="rtl" className={cn('space-y-2', className)}>
      <div className="flex items-center gap-1.5">
        <Tag size={14} className="text-secondary shrink-0" />
        <span className="text-xs font-brand text-secondary">كود الخصم</span>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              if (status !== 'idle') { setStatus('idle'); setMessage('') }
            }}
            onKeyDown={handleKeyDown}
            disabled={isApplied || status === 'loading'}
            placeholder="أدخل كود الخصم"
            className={cn(
              'w-full h-10 px-3 rounded-lg text-sm font-body',
              'bg-surface-container-low text-on-surface placeholder:text-secondary',
              'border-b-2 transition-all duration-150',
              'focus:outline-none focus:bg-surface-container',
              isApplied
                ? 'border-[#4B6339] bg-[#4B6339]/5 text-[#4B6339] cursor-default'
                : status === 'error'
                ? 'border-[#BA1A1A] focus:border-[#BA1A1A]'
                : 'border-transparent focus:border-primary',
              'disabled:opacity-70'
            )}
          />
          {isApplied && (
            <CheckCircle2 size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-[#4B6339]" />
          )}
        </div>

        {isApplied ? (
          <button
            type="button"
            onClick={handleRemove}
            className={cn(
              'h-10 px-3 rounded-lg text-xs font-brand',
              'bg-surface-container text-secondary',
              'hover:bg-surface-container-high hover:text-[#BA1A1A]',
              'transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BA1A1A]'
            )}
          >
            إزالة
          </button>
        ) : (
          <button
            type="button"
            onClick={handleApply}
            disabled={!code.trim() || status === 'loading'}
            className={cn(
              'h-10 px-4 rounded-lg text-sm font-brand font-semibold',
              'bg-gradient-to-l from-[#785600] to-[#986D00] text-white',
              'hover:from-[#986D00] hover:to-[#B8860B]',
              'disabled:from-[#C4B49A] disabled:to-[#C4B49A] disabled:cursor-not-allowed',
              'transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
              'flex items-center gap-1.5 whitespace-nowrap'
            )}
          >
            {status === 'loading' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : null}
            تطبيق
          </button>
        )}
      </div>

      {/* Status message */}
      {message && (
        <div
          className={cn(
            'flex items-center gap-1.5 text-xs font-brand',
            status === 'success' ? 'text-[#4B6339]' : 'text-[#BA1A1A]'
          )}
        >
          {status === 'success' ? (
            <CheckCircle2 size={12} />
          ) : (
            <XCircle size={12} />
          )}
          {message}
        </div>
      )}
    </div>
  )
}
