'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Category } from '@/types'
import { useState, useEffect } from 'react'

const QUICK_LINKS = [
  { label: 'الرئيسية', href: '/' },
  { label: 'جميع المنتجات', href: '/products' },
  { label: 'الأقسام', href: '/categories' },
  { label: 'تتبع الطلب', href: '/track-order' },
  { label: 'من نحن', href: '/about' },
]



function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={18} height={18} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}


export function Footer() {
  const [footerCategories, setFooterCategories] = useState<Category[]>([])

  useEffect(() => {
    async function fetchFooterNav() {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('show_in_footer', true)
        .eq('is_active', true)
        .order('footer_order', { ascending: true })
      
      if (data) setFooterCategories(data)
    }
    fetchFooterNav()
  }, [])

  const categoryLinks = footerCategories.map(c => ({
    label: c.name_ar,
    href: `/category/${c.slug}`
  }))

  return (
    <footer dir="rtl" className="bg-[#F5F1EB]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">

          {/* Column 1: Brand */}
          <div className="flex flex-col gap-5">
            <Link href="/" className="hover:opacity-80 transition-opacity w-fit">
              <Image
                src="/newlogo.png"
                alt="كزورا Kzora"
                width={150}
                height={90}
                className="h-28 w-auto object-contain"
              />
            </Link>
            <p className="text-sm font-arabic text-[#6B6560] leading-7">
              وجهتك الأولى للأحذية الأنيقة والمريحة في سوريا. جودة تثق بها، وأسعار تناسبك.
            </p>
            <div className="flex items-center gap-3 mt-1">
              {[
                { icon: <WhatsAppIcon />, href: 'https://wa.me/963XXXXXXXXX', label: 'WhatsApp' },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center',
                    'text-[#6B6560] bg-[#EDE8E1]',
                    'hover:bg-[#785600] hover:text-white',
                    'transition-all duration-200'
                  )}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick links */}
          <div>
            <h3 className="font-arabic font-bold text-[#1A1A1A] mb-6 text-base">
              روابط سريعة
            </h3>
            <ul className="flex flex-col gap-4">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-arabic text-[#6B6560] hover:text-[#785600] transition-colors duration-150 flex items-center gap-2"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#D0CAC0]" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Categories */}
          <div>
            <h3 className="font-arabic font-bold text-[#1A1A1A] mb-6 text-base">
              الأقسام
            </h3>
            <ul className="flex flex-col gap-4">
              {categoryLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-arabic text-[#6B6560] hover:text-[#785600] transition-colors duration-150 flex items-center gap-2"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#D0CAC0]" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Policies */}
          <div>
            <h3 className="font-arabic font-bold text-[#1A1A1A] mb-6 text-base">
              سياسات المتجر
            </h3>
            <ul className="flex flex-col gap-4">
              {[
                { label: 'سياسة الإرجاع والاستبدال', href: '/returns-exchanges' },
                { label: 'سياسة الخصوصية', href: '/privacy-policy' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-arabic text-[#6B6560] hover:text-[#785600] transition-colors duration-150 flex items-center gap-2"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#D0CAC0]" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#E3DDD5]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs font-arabic text-[#9E9890]">
              © 2026 كزورا. جميع الحقوق محفوظة.
            </p>
            <p className="text-xs font-arabic text-[#9E9890]">
              صُنع بعناية في سوريا
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
