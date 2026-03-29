'use client'

import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import ProductForm from '@/components/admin/ProductForm'
import type { ProductFull, Category } from '@/types'

interface EditProductClientProps {
  product: ProductFull
  categories: Category[]
}

export default function EditProductClient({ product, categories }: EditProductClientProps) {
  const router = useRouter()

  function handleSuccess() {
    toast.success('تم تحديث المنتج بنجاح')
    router.push('/admin/products')
  }

  return (
    <ProductForm
      initialData={product}
      categories={categories}
      onSuccess={handleSuccess}
    />
  )
}
