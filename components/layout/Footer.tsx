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

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={18} height={18} aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={18} height={18} aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

const SOCIAL_LINKS = [
  {
    icon: <WhatsAppIcon />,
    href: 'https://wa.me/963964514765',
    label: 'واتساب كزورا',
    hoverColor: 'hover:bg-[#25D366]',
  },
  {
    icon: <FacebookIcon />,
    href: 'https://www.facebook.com/kzora.studio',
    label: 'فيسبوك كزورا',
    hoverColor: 'hover:bg-[#1877F2]',
  },
  {
    icon: <InstagramIcon />,
    href: 'https://www.instagram.com/kzora.studio',
    label: 'انستغرام كزورا',
    hoverColor: 'hover:bg-gradient-to-br hover:from-[#833AB4] hover:via-[#FD1D1D] hover:to-[#F77737]',
  },
]

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
                src="/logo.png"
                alt="متجر كزورا Kzora للأحذية في سوريا"
                width={150}
                height={90}
                className="h-28 w-auto object-contain"
              />
            </Link>
            <p className="text-sm font-arabic text-[#6B6560] leading-7">
              وجهتك الأولى للأحذية الأنيقة والمريحة في <span className="font-bold text-[#1A1A1A]">سوريا</span>. جودة تثق بها، وأسعار تناسبك. نوفر <span className="underline decoration-[#785600]/30 underline-offset-4">توصيل سريع</span> لجميع المحافظات السورية.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3 mt-1">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  title={s.label}
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center',
                    'text-[#6B6560] bg-[#EDE8E1]',
                    s.hoverColor, 'hover:text-white',
                    'transition-all duration-200'
                  )}
                >
                  {s.icon}
                </a>
              ))}
            </div>

            <div className="mt-1">
              <p className="text-[10px] font-arabic text-[#9E9890] leading-relaxed">
                نشحن إلى: حلب، دمشق، ريف دمشق، حمص، حماة، اللاذقية، طرطوس، السويداء، درعا، طرطوس وكافة المناطق السورية.
              </p>
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

          {/* Column 4: Policies + Contact */}
          <div className="flex flex-col gap-8">
            {/* Store policies */}
            <div>
              <h3 className="font-arabic font-bold text-[#1A1A1A] mb-6 text-base">
                سياسات المتجر
              </h3>
              <ul className="flex flex-col gap-4">
                {[
                  { label: 'سياسة الإرجاع والاستبدال', href: '/returns-exchanges' },
                  { label: 'سياسة الخصوصية', href: '/privacy-policy' },
                  { label: 'سياسة الشحن والتوصيل', href: '/shipping' },
                  { label: 'شروط الاستخدام', href: '/terms' },
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

            {/* Contact Us */}
            <div>
              <h3 className="font-arabic font-bold text-[#1A1A1A] mb-4 text-base">
                تواصل معنا
              </h3>
              <ul className="flex flex-col gap-3">
                <li>
                  <a
                    href="https://wa.me/963964514765"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-sm font-arabic text-[#6B6560] hover:text-[#25D366] transition-colors duration-150 group"
                  >
                    <span className="w-7 h-7 rounded-full bg-[#EDE8E1] group-hover:bg-[#25D366] flex items-center justify-center text-[#6B6560] group-hover:text-white transition-all duration-200 shrink-0">
                      <WhatsAppIcon />
                    </span>
                    واتساب
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.facebook.com/kzora.studio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-sm font-arabic text-[#6B6560] hover:text-[#1877F2] transition-colors duration-150 group"
                  >
                    <span className="w-7 h-7 rounded-full bg-[#EDE8E1] group-hover:bg-[#1877F2] flex items-center justify-center text-[#6B6560] group-hover:text-white transition-all duration-200 shrink-0">
                      <FacebookIcon />
                    </span>
                    فيسبوك — kzora.studio
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.instagram.com/kzora.studio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-sm font-arabic text-[#6B6560] hover:text-[#C13584] transition-colors duration-150 group"
                  >
                    <span className="w-7 h-7 rounded-full bg-[#EDE8E1] group-hover:bg-[#C13584] flex items-center justify-center text-[#6B6560] group-hover:text-white transition-all duration-200 shrink-0">
                      <InstagramIcon />
                    </span>
                    انستغرام — kzora.studio
                  </a>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#E3DDD5]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs font-arabic text-[#9E9890]">
              © 2026 كزورا. جميع الحقوق محفوظة.
            </p>
            {/* Social links in bottom bar */}
            <div className="flex items-center gap-4">
              <a
                href="https://www.facebook.com/kzora.studio"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="فيسبوك كزورا"
                className="text-[#9E9890] hover:text-[#1877F2] transition-colors duration-150"
              >
                <FacebookIcon />
              </a>
              <a
                href="https://www.instagram.com/kzora.studio"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="انستغرام كزورا"
                className="text-[#9E9890] hover:text-[#C13584] transition-colors duration-150"
              >
                <InstagramIcon />
              </a>
            </div>
            <p className="text-xs font-arabic text-[#9E9890]">
              صُنع بعناية في سوريا
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
