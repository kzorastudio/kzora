'use client'

import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface DeleteProductButtonProps {
  id: string
  name: string
}

export default function DeleteProductButton({ id, name }: DeleteProductButtonProps) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟ لا يمكن التراجع عن هذا الإجراء.`)) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('فشل الحذف')
      toast.success('تم حذف المنتج بنجاح')
      router.refresh()
    } catch {
      toast.error('حدث خطأ أثناء الحذف')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      title="حذف"
      className="h-8 w-8 flex items-center justify-center rounded-lg text-secondary hover:text-error hover:bg-error-container/30 transition-colors disabled:opacity-50"
    >
      {deleting ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <Trash2 size={15} />
      )}
    </button>
  )
}
