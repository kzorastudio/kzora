import type { Metadata } from 'next'
import { Tajawal, Noto_Sans_Arabic, Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Providers from '@/components/Providers'
import ScrollToTop from '@/components/layout/ScrollToTop'
import VisitTracker from '@/components/analytics/VisitTracker'
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics'

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
  metadataBase: new URL('https://kzora.co'),
  title: {
    default: 'كزورا Kzora — أفضل متجر أحذية أونلاين في سوريا',
    template: '%s — كزورا Kzora',
  },
  description: 'تسوق أفضل الأحذية في سوريا من كزورا Kzora. أحذية رسمية ورياضية وكاجوال رجالية ونسائية بجودة عالية وتوصيل سريع في حلب وجميع المحافظات السورية. كزورا، أناقة تبدأ من خطوتك.',
  keywords: 'أحذية سوريا, كزورا, Kzora, متجر أحذية سوريا, شراء أحذية أونلاين سوريا, أحذية حلب, أحذية رياضية سوريا, أحذية نسائية سوريا, أحذية رجالية سوريا, أحذية جلد طبيعي سوريا, أسعار الأحذية في سوريا, أحذية سبور سوريا',
  alternates: {
    canonical: '/',
  },
  manifest: '/manifest.json',
  themeColor: '#785600',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'كزورا Kzora',
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'كزورا Kzora — متجر الأحذية الفاخرة في سوريا',
    description: 'تشكيلة واسعة من الأحذية الرجالية والنسائية والرياضية. جودة عالية وتوصيل لجميع المحافظات السورية من كزورا Kzora.',
    url: 'https://kzora.co',
    siteName: 'كزورا Kzora',
    locale: 'ar_SY',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'متجر كزورا للاأحذية - سوريا Kzora Shoes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'كزورا Kzora — أناقة تبدأ من خطوتك',
    description: 'أفضل متجر أحذية أونلاين في سوريا - كزورا Kzora',
    images: ['/logo.png'],
  },
  verification: {
    google: 'QIzKZwVc9QgD9CyJy0S5u9dsuiRnX43X1_lysapN5Ak',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${notoSansArabic.variable} ${inter.variable}`}>
      <body className={`${tajawal.variable} ${notoSansArabic.variable} ${inter.variable}`}>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'كزورا Kzora',
              url: 'https://kzora.co',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://kzora.co/products?search={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ShoeStore',
              name: 'كزورا Kzora',
              image: 'https://kzora.co/logo.png',
              '@id': 'https://kzora.co',
              url: 'https://kzora.co',
              telephone: '963964514765',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Aleppo',
                addressRegion: 'Aleppo Governorate',
                addressCountry: 'SY',
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: 36.2021,
                longitude: 37.1343,
              },
              openingHoursSpecification: {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: [
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Saturday',
                  'Sunday',
                ],
                opens: '09:00',
                closes: '22:00',
              },
              sameAs: [
                'https://kzora.co',
                'https://www.facebook.com/kzora.studio',
                'https://www.instagram.com/kzora.studio',
              ],
            }),
          }}
        />
        <Providers>
          {process.env.NEXT_PUBLIC_GA_ID && (
            <GoogleAnalytics ga_id={process.env.NEXT_PUBLIC_GA_ID} />
          )}
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
