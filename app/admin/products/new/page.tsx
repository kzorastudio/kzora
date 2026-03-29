'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import ProductForm from '@/components/admin/ProductForm'
import AdminHeader from '@/components/admin/AdminHeader'
import type { Category } from '@/types'

export default function NewProductPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setCategories(data.categories ?? []))
      .catch(() => toast.error('فشل تحميل الأقسام'))
      .finally(() => setLoading(false))
  }, [])

  function handleSuccess() {
    router.push('/admin/products')
  }

  return (
    <div className="flex flex-col min-h-screen" dir="rtl">
      <AdminHeader />

      <div className="flex-1 p-6 flex flex-col gap-5 max-w-4xl w-full mx-auto">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors"
            title="رجوع"
          >
            <ArrowRight size={18} />
          </Link>
          <div>
            <p className="text-sm font-arabic text-secondary mt-0.5 font-medium">
              أدخل تفاصيل المنتج ثم اضغط إضافة
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : (
          <ProductForm categories={categories} onSuccess={handleSuccess} />
        )}
      </div>
    </div>
  )
}
