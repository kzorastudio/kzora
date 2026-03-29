'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center px-4 text-center" dir="rtl">
      <h1 className="text-2xl font-arabic font-bold text-[#1A1A1A] mb-2">حدث خطأ غير متوقع</h1>
      <p className="text-[#6B6560] font-arabic mb-8 max-w-sm">يمكنك المحاولة مجدداً أو العودة للرئيسية.</p>
      <div className="flex gap-3">
        <button onClick={reset} className="px-6 py-2.5 rounded-xl bg-[#785600] text-white font-arabic font-semibold hover:bg-[#986D00] transition-colors">
          حاول مجدداً
        </button>
        <Link href="/" className="px-6 py-2.5 rounded-xl border border-[#E8E3DB] text-[#1A1A1A] font-arabic font-semibold hover:bg-[#F5F1EB] transition-colors">
          الرئيسية
        </Link>
      </div>
    </div>
  )
}
