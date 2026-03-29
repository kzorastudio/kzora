'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, Pencil, Trash2, Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import CategoryForm from '@/components/admin/CategoryForm'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'

type CategoryWithCount = Category & { products_count: number }

interface CategoriesClientProps {
  categories: CategoryWithCount[]
}

export default function CategoriesClient({ categories: initialCategories }: CategoriesClientProps) {
  const router = useRouter()
  const [categories, setCategories]       = useState(initialCategories)
  const [modalOpen, setModalOpen]         = useState(false)
  const [editTarget, setEditTarget]       = useState<Category | null>(null)
  const [deletingId, setDeletingId]       = useState<string | null>(null)

  function openAddModal() {
    setEditTarget(null)
    setModalOpen(true)
  }

  function openEditModal(cat: Category) {
    setEditTarget(cat)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditTarget(null)
  }

  function handleSuccess(newItem: Category) {
    if (editTarget) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === newItem.id ? ({ ...newItem, products_count: c.products_count } as CategoryWithCount) : c
        )
      )
    } else {
      setCategories((prev) => [({ ...newItem, products_count: 0 } as CategoryWithCount), ...prev])
    }
    closeModal()
    router.refresh()
  }

  async function handleDelete(cat: CategoryWithCount) {
    const confirmMsg =
      cat.products_count > 0
        ? `تحذير: سيتم حذف "${cat.name_ar}" و ${cat.products_count} منتج مرتبط به. هل أنت متأكد؟`
        : `هل أنت متأكد من حذف "${cat.name_ar}"؟`

    if (!confirm(confirmMsg)) return

    setDeletingId(cat.id)
    try {
      const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'فشل الحذف')
      }
      toast.success('تم حذف القسم بنجاح')
      setCategories((prev) => prev.filter((c) => c.id !== cat.id))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <p className="text-sm font-arabic font-medium text-secondary">
          إجمالي الأقسام: <span className="font-bold text-on-surface">{categories.length}</span>
        </p>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-arabic font-medium hover:bg-primary-container transition-colors shadow-ambient"
        >
          <Plus size={16} />
          إضافة قسم
        </button>
      </div>

      {/* Categories grid */}
      {categories.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient p-16 text-center">
          <p className="text-sm font-arabic text-secondary">لا توجد أقسام. أضف قسماً جديداً.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-surface-container-lowest rounded-2xl shadow-ambient overflow-hidden flex flex-col"
            >
              {/* Image */}
              <div className="relative h-36 bg-surface-container">
                {cat.image_url ? (
                  <Image
                    src={cat.image_url}
                    alt={cat.name_ar}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-secondary/40 text-sm font-arabic">
                    لا توجد صورة
                  </div>
                )}
                {/* Active badge overlay */}
                <div className="absolute top-2 right-2">
                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-arabic font-medium',
                      cat.is_active
                        ? 'bg-green-50/90 text-green-700'
                        : 'bg-surface-container/90 text-secondary'
                    )}
                  >
                    {cat.is_active ? 'مفعّل' : 'معطّل'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col gap-2 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <h3 className="text-base font-arabic font-semibold text-on-surface leading-tight truncate">
                      {cat.name_ar}
                    </h3>
                    <div className="flex items-center gap-3 text-xs font-arabic text-secondary">
                      <span>{cat.products_count} منتج</span>
                      <span>ترتيب: {cat.sort_order}</span>
                    </div>
                  </div>
                </div>

                {cat.description && (
                  <p className="text-xs font-arabic text-secondary line-clamp-2">
                    {cat.description}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-outline-variant/30">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-arabic text-secondary hover:text-primary hover:bg-primary-fixed/30 transition-colors"
                  >
                    <Pencil size={14} />
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    disabled={deletingId === cat.id}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-arabic text-secondary hover:text-error hover:bg-error-container/30 transition-colors disabled:opacity-50"
                  >
                    {deletingId === cat.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-inverse-surface/30 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Dialog */}
          <div
            className="relative bg-surface-container-lowest rounded-2xl shadow-ambient-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/40 sticky top-0 bg-surface-container-lowest z-10">
              <h2 className="text-base font-arabic font-semibold text-on-surface">
                {editTarget ? 'تعديل القسم' : 'إضافة قسم جديد'}
              </h2>
              <button
                onClick={closeModal}
                className="h-8 w-8 flex items-center justify-center rounded-xl text-secondary hover:bg-surface-container transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <div className="p-5">
              <CategoryForm
                initialData={editTarget ?? undefined}
                onSuccess={handleSuccess}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
