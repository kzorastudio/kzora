import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppFAB } from '@/components/layout/WhatsAppFAB'
import { CartDrawer } from '@/components/cart/CartDrawer'
import type { Category } from '@/types'

export const metadata: Metadata = {
  title: 'أقسام الأحذية — تصفح حسب الفئة | كزورا Kzora سوريا',
  description: 'استكشف تصنيفات الأحذية المتنوعة في كزورا Kzora. أحذية رجالية، نسائية، رياضية، وصيفية. كل ما تحتاجه في مكان واحد مع شحن لجميع المحافظات السورية.',
  keywords: 'أقسام كزورا، أحذية رجالية سوريا، أحذية نسائية سوريا، تصنيفات الأحذية',
  alternates: { 
    canonical: '/categories',
  },
}

async function getCategories(): Promise<Category[]> {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  return data ?? []
}

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <>
      <Header />
      <main dir="rtl" className="min-h-screen bg-[#FAF8F5] pt-36">
        {/* Premium Categories Hero - Compact Version */}
        <div className="relative bg-[#0A0A0A] py-16 md:py-24 px-4 overflow-hidden text-center flex flex-col items-center justify-center min-h-[35vh]">
            {/* Background Image with Overlay */}
            <Image 
                src="https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=2012&auto=format&fit=crop" 
                alt="خلفية عالم كزورا"
                fill
                priority
                className="object-cover opacity-30 mix-blend-luminosity scale-105"
            />
            {/* Multi-layered Gradients */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-[#FAF8F5]" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />

            <div className="relative z-10 w-full max-w-screen-lg mx-auto space-y-4">
                <h1 className="font-arabic text-4xl md:text-7xl font-black text-white mb-2 drop-shadow-2xl tracking-tighter leading-tight">
                    عالم <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#FFDEA6] via-[#B8860B] to-[#785600] drop-shadow-sm">كزورا</span>
                </h1>
                
                <div className="max-w-2xl mx-auto relative">
                     <p className="font-arabic text-white/80 text-base md:text-xl font-medium leading-relaxed px-4">
                        استكشف تشكيلتنا الواسعة التي صُممت بعناية لتناسب كل خطوة تخطوها، من الأناقة الكلاسيكية إلى الراحة اليومية.
                     </p>
                </div>
            </div>
        </div>

        {/* Categories Grid */}
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12 py-24">
          {categories.length === 0 ? (
            <div className="text-center bg-white rounded-3xl p-16 shadow-sm border border-[#F0EBE3]">
                <p className="font-arabic text-[#9E9890] text-xl">لا توجد أقسام حالياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {categories.map((cat, idx) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="group relative overflow-hidden rounded-[2.5rem] bg-[#EDE8E1] block aspect-[3/4] shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-white/40"
                >
                  {cat.image_url && (
                    <Image
                      src={cat.image_url}
                      alt={cat.name_ar}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                  )}
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                  
                  {/* Detail Panel */}
                  <div className="absolute inset-x-0 bottom-0 p-8 text-right transform transition-transform duration-500 flex flex-col justify-end">
                    <span className="font-brand font-bold text-[#FFDEA6] text-sm tracking-widest mb-2 opacity-0 -translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100 uppercase">
                        KZORA {cat.slug.split('-')[0]}
                    </span>
                    <h2 className="text-3xl md:text-4xl font-arabic font-black text-white mb-3">
                      {cat.name_ar}
                    </h2>
                    {cat.description && (
                      <p className="text-white/80 text-base font-arabic leading-relaxed mb-6 line-clamp-2">
                        {cat.description}
                      </p>
                    )}
                    <div className="inline-flex items-center gap-3 w-fit">
                        <span className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:bg-[#785600] group-hover:text-white transition-colors duration-300">
                             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-white transform -rotate-45 group-hover:rotate-0 transition-transform duration-300">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </span>
                        <span className="text-white font-arabic font-bold text-sm tracking-wide">تسوق الآن</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <WhatsAppFAB />
      <CartDrawer />
    </>
  )
}
