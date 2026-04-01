import type { Metadata } from 'next'
import { Tajawal, Noto_Sans_Arabic, Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Providers from '@/components/Providers'
import ScrollToTop from '@/components/layout/ScrollToTop'
import VisitTracker from '@/components/analytics/VisitTracker'

const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-tajawal',
  display: 'swap',
})

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '700', '800'],
  variable: '--font-noto-arabic',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'كزورا — أناقة تبدأ من خطوتك',
  description: 'متجر الأحذية الفاخرة في سوريا. تشكيلة واسعة من الأحذية الكلاسيكية والعصرية.',
  keywords: 'أحذية, كزورا, سوريا, حلب, أحذية فاخرة',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${notoSansArabic.variable} ${inter.variable}`}>
      <body>
        <Providers>
          <VisitTracker />
          <ScrollToTop />
          {children}
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                fontFamily: 'var(--font-noto-arabic)',
                background: '#1A1A1A',
                color: '#FAF8F5',
                borderRadius: '8px',
                direction: 'rtl',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
