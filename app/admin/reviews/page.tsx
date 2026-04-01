'use client'

import { useState, useEffect } from 'react'
import AdminHeader from '@/components/admin/AdminHeader'
import { Trash2, Star, Loader2, MessageSquare, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Review {
  id: string
  user_name: string
  rating: number
  comment: string
  created_at: string
  product_id: string
  products: { name: string }
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/admin/reviews')
      const data = await res.json()
      if (res.ok) {
        setReviews(data.reviews)
      }
    } catch (err) {
      toast.error('فشل تحميل التقييمات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التقييم؟')) return
    
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('تم حذف التقييم بنجاح')
        setReviews(prev => prev.filter(r => r.id !== id))
      } else {
        throw new Error()
      }
    } catch (err) {
      toast.error('فشل حذف التقييم')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface" dir="rtl">
      <AdminHeader />

      <div className="flex-1 p-4 md:p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-arabic font-black text-on-surface">إدارة التقييمات</h1>
            <p className="text-xs font-arabic text-secondary mt-1">تصفح واحذف تعليقات الزبائن على المنتجات</p>
          </div>
          <div className="bg-white px-3 py-1.5 rounded-xl border border-outline-variant/30 text-xs font-arabic font-bold text-secondary">
            إجمالي التعليقات: {reviews.length}
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 bg-white rounded-3xl border border-dashed border-outline-variant/50">
            <MessageSquare size={40} className="text-secondary/20" />
            <p className="text-sm font-arabic text-secondary text-center">لا توجد تقييمات حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((review) => (
              <div 
                key={review.id} 
                className="bg-white rounded-2xl p-4 shadow-sm border border-outline-variant/10 flex flex-col gap-3 hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                      {review.user_name.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-arabic font-bold text-on-surface leading-none">{review.user_name}</p>
                      <p className="text-[10px] font-arabic text-secondary mt-1">{new Date(review.created_at).toLocaleDateString('ar-SY')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-1 rounded-lg">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-amber-700">{review.rating}</span>
                  </div>
                </div>

                <div className="flex-1 bg-surface-container/30 p-2.5 rounded-xl border border-outline-variant/10">
                  <p className="text-xs font-arabic text-on-surface-variant leading-relaxed">
                    {review.comment || <span className="opacity-40 italic">بدون تعليق...</span>}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-outline-variant/10">
                  <div className="flex items-center gap-1.5 text-secondary truncate max-w-[150px]">
                    <Package size={14} className="shrink-0 opacity-40" />
                    <span className="text-[10px] font-arabic truncate">{review.products?.name || 'منتج محذوف'}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(review.id)}
                    disabled={deletingId === review.id}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-error hover:bg-error/5 transition-colors"
                  >
                    {deletingId === review.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    <span className="text-[10px] font-arabic font-bold uppercase">حذف</span>
                  </button>
                </div>
                
                {/* Visual hover indicator */}
                <div className="absolute top-0 right-0 w-1 h-full bg-primary/0 group-hover:bg-primary transition-all duration-300" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
