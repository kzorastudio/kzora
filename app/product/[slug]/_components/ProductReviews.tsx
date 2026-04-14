'use client'

import React, { useState, useEffect } from 'react'
import { Star, MessageSquare, User, Send, StarHalf } from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

interface Review {
  id: string
  user_name: string
  rating: number
  comment: string | null
  created_at: string
}

interface Metadata {
  totalReviews: number
  averageRating: number
}

interface ProductReviewsProps {
  productId: string
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [metadata, setMetadata] = useState<Metadata>({ totalReviews: 0, averageRating: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [userName, setUserName] = useState('')
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const fetchReviews = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/products/${productId}/reviews`)
      const data = await response.json()
      
      if (data.reviews) {
        setReviews(data.reviews)
        setMetadata(data.metadata)
      }
    } catch (err) {
      console.error('Error fetching reviews:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (productId) {
      fetchReviews()
    }
  }, [productId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userName || !rating) return

    try {
      setIsSubmitting(true)
      setError(null)
      
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_name: userName, rating, comment })
      })

      if (!response.ok) {
        throw new Error('حدث خطأ أثناء إرسال التعليق')
      }

      setUserName('')
      setComment('')
      setRating(5)
      setShowSuccess(true)
      
      // Refresh reviews
      await fetchReviews()
      
      setTimeout(() => setShowSuccess(false), 5000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStars = (count: number, size = 16, interactive = false) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            type={interactive ? 'button' : undefined}
            disabled={!interactive}
            onClick={() => interactive && setRating(num)}
            onMouseEnter={() => interactive && setHoverRating(num)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={`${interactive ? 'cursor-pointer transform hover:scale-110 active:scale-95 transition-all' : ''}`}
          >
            <Star 
              size={size} 
              className={`${
                (hoverRating || rating) >= num 
                  ? 'fill-[#FFD700] text-[#FFD700]' 
                  : (count >= num) 
                    ? 'fill-[#FFD700] text-[#FFD700]' 
                    : 'text-[#D1C9BE]'
              }`} 
            />
          </button>
        ))}
      </div>
    )
  }

  // Helper for displaying average rating stars (including partial stars if needed)
  const renderAverageStars = (avg: number) => {
    const fullStars = Math.floor(avg)
    const hasHalf = avg - fullStars >= 0.5
    
    return (
      <div className="flex gap-1 items-center">
        {[1, 2, 3, 4, 5].map((num) => {
          if (num <= fullStars) {
            return <Star key={num} size={18} className="fill-[#FFD700] text-[#FFD700]" />
          } else if (num === fullStars + 1 && hasHalf) {
            return <StarHalf key={num} size={18} className="fill-[#FFD700] text-[#FFD700]" />
          } else {
            return <Star key={num} size={18} className="text-[#D1C9BE]" />
          }
        })}
      </div>
    )
  }

  return (
    <section className="mt-20 border-t border-[#E8E3DB] pt-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex flex-col gap-2">
          <h2 className="font-arabic text-3xl font-bold text-[#1A1A1A] flex items-center gap-3">
            <MessageSquare className="text-[#785600]" />
            آراء وتجارب العملاء
          </h2>
          <p className="text-[#6B655D] font-arabic leading-relaxed max-w-xl">
            نحن نقدر رأيك! شارك تجربتك مع عملائنا لنساعدهم في اتخاذ القرار الأمثل.
          </p>
        </div>

        {metadata.totalReviews > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E8E3DB] flex items-center gap-6">
            <div className="text-center bg-[#FAF8F5] py-2 px-4 rounded-xl border border-[#F1EFE9]">
              <div className="text-4xl font-bold text-[#1A1A1A]">{metadata.averageRating}</div>
              <div className="text-xs text-[#9E9890] mt-1">من 5</div>
            </div>
            <div>
              {renderAverageStars(metadata.averageRating)}
              <div className="text-sm text-[#6B655D] mt-1.5 font-bold">بناءً على {metadata.totalReviews} تقييم</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Review Form */}
        <div className="lg:col-span-5">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#E8E3DB] sticky top-24">
            <h3 className="font-arabic text-xl font-bold text-[#1A1A1A] mb-6 border-b border-[#FAF8F5] pb-4">
              أضف تقييمك الخاص
            </h3>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#4A4742] block">التقييم العام *</label>
                <div className="flex bg-[#FAF8F5] p-3 rounded-xl border border-[#F1EFE9] w-fit">
                  {renderStars(rating, 28, true)}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="userName" className="text-sm font-bold text-[#4A4742] block">الاسم الكامل *</label>
                <input
                  id="userName"
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="أدخل اسمك الكريم"
                  className="w-full px-4 py-3 rounded-xl border border-[#E8E3DB] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 focus:border-[#785600] transition-all bg-[#FAF8F5]/50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="comment" className="text-sm font-bold text-[#4A4742] block">تعليقك (اختياري)</label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="حدثنا عن تجربتك مع المنتج..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-[#E8E3DB] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 focus:border-[#785600] transition-all bg-[#FAF8F5]/50 resize-none font-arabic leading-relaxed"
                />
              </div>

              {error && <div className="text-[#BA1A1A] text-sm bg-[#BA1A1A]/5 p-3 rounded-lg border border-[#BA1A1A]/10">{error}</div>}
              {showSuccess && <div className="text-[#1A1A1A] text-sm bg-[#785600]/5 p-3 rounded-lg border border-[#785600]/10">تم إرسال تقييمك بنجاح! شكراً لك.</div>}

              <button
                type="submit"
                disabled={isSubmitting || !userName}
                className="bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white py-4 rounded-xl font-bold transition-all disabled:bg-[#D1C9BE] flex items-center justify-center gap-2 mt-4 active:scale-95 shadow-lg shadow-black/5"
              >
                {isSubmitting ? 'جاري الإرسال...' : (
                  <>
                    إرسال التقييم
                    <Send size={18} className="rtl:rotate-180" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-7">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
              <div className="w-10 h-10 border-4 border-[#785600] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-[#6B655D] font-arabic">جاري تحميل آراء العملاء...</p>
            </div>
          ) : reviews.length > 0 ? (
            <div className="flex flex-col gap-6">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white p-6 rounded-2xl border border-[#E8E3DB] hover:border-[#785600]/30 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#FAF8F5] rounded-full flex items-center justify-center text-[#785600] border border-[#F1EFE9]">
                        <User size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-[#1A1A1A] group-hover:text-[#785600] transition-colors">{review.user_name}</div>
                        <div className="text-xs text-[#9E9890]">{format(new Date(review.created_at), 'd MMMM yyyy', { locale: ar })}</div>
                      </div>
                    </div>
                    {renderStars(review.rating)}
                  </div>
                  {review.comment && (
                    <p className="text-[#4A4742] leading-relaxed font-arabic bg-[#FAF8F5] p-4 rounded-xl border border-[#F1EFE9]">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-[#E8E3DB] rounded-3xl py-16 px-8 flex flex-col items-center text-center gap-6">
              <div className="w-20 h-20 bg-[#FAF8F5] rounded-full flex items-center justify-center text-[#D1C9BE]">
                <MessageSquare size={40} />
              </div>
              <div className="space-y-2">
                <h4 className="font-arabic text-xl font-bold text-[#1A1A1A]">لم يتم تقييم المنتج بعد</h4>
                <p className="text-[#6B655D] max-w-sm font-arabic">
                  كن أول من يشارك تجربته مع هذا المنتج. رأيك يهمنا ويهم المتسوقين الآخرين!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
