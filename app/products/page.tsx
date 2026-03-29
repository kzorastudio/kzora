import { Suspense } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppFAB } from '@/components/layout/WhatsAppFAB'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { supabase } from '@/lib/supabase'
import type { Category } from '@/types'
import ProductsClientPage from './_components/ProductsClientPage'

interface PageProps {
  searchParams: Promise<{
    category?: string
    tag?:      string
    sort?:     string
    search?:   string
    page?:     string
    size?:     string
    min_price?: string
    max_price?: string
    on_sale?:  string
  }>
}

export const metadata = {
  title:       'المنتجات — كزورا',
  description: 'تصفح كامل تشكيلة الأحذية لدى كزورا',
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams

  // Fetch categories server-side for the filter sidebar
  const categories = (await supabase.from('categories').select('*').eq('is_active', true).order('created_at')).data ?? []

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FAF8F5] pt-24">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
          }
        >
          <ProductsClientPage
            initialCategories={(categories ?? []) as Category[]}
            initialParams={params}
          />
        </Suspense>
      </main>
      <Footer />
      <WhatsAppFAB />
      <CartDrawer />
    </>
  )
}
