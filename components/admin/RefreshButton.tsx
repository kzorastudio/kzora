'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function RefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    router.refresh()
    // Give a UI feedback delay
    setTimeout(() => {
        setIsRefreshing(false)
    }, 1000)
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-2xl border border-divider bg-white shadow-sm transition-all active:scale-95 disabled:opacity-50",
        isRefreshing ? "text-[#785600]" : "text-secondary hover:text-[#785600] hover:border-[#785600]/30"
      )}
      title="تحديث البيانات فوراً"
    >
      <RefreshCw size={16} className={cn("transition-transform duration-700", isRefreshing && "animate-spin")} />
      <span className="text-[10px] font-arabic font-bold">تحديث البيانات</span>
    </button>
  )
}
