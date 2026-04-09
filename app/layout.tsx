import type { Metadata, Viewport } from 'next'
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

export const viewport: Viewport = {
  themeColor: '#785600',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  metadataBase: new URL('https://kzora.co'),
  title: {
    default: 'كزورا Kzora — أفضل متجر أحذية أونلاين في سوريا',
    template: '%s — كزورا Kzora',
  },
  description: 'تسوق أفضل الأحذية في سوريا من كزورا Kzora. أحذية رسمية ورياضية وكاجوال رجالية ونسائية بجودة عالية وتوصيل سريع في حلب وجميع المحافظات السورية. كزورا، أناقة تبدأ من خطوتك.',
  keywords: [
    'كزورا', 'Kzora', 'أحذية سوريا', 'متجر أحذية سوريا', 'شراء أحذية أونلاين سوريا',
    'أحذية حلب', 'أحذية رياضية سوريا', 'أحذية نسائية سوريا', 'أحذية رجالية سوريا',
    'أحذية جلد طبيعي سوريا', 'أسعار الأحذية في سوريا', 'أحذية سبور سوريا',
    'أحذية دمشق', 'أحذية كاجوال سوريا', 'متجر كزورا', 'kzora shoes syria',
  ],
  alternates: {
    canonical: '/',
  },
  manifest: '/manifest.json',
  category: 'ecommerce',
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
        alt: 'متجر كزورا للأحذية - سوريا Kzora Shoes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'كزورا Kzora — أناقة تبدأ من خطوتك',
    description: 'أفضل متجر أحذية أونلاين في سوريا - كزورا Kzora',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'QIzKZwVc9QgD9CyJy0S5u9dsuiRnX43X1_lysapN5Ak',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${notoSansArabic.variable} ${inter.variable}`}>
      <head>
        {/* Preconnect to Cloudinary for faster image loads (Core Web Vitals) */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body className={`${tajawal.variable} ${notoSansArabic.variable} ${inter.variable}`}>
        {/* Noscript fallback for search engine bots that don't run JS */}
        <noscript>
          <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#785600', color: 'white', fontFamily: 'Tajawal, sans-serif' }}>
            <h1>متجر كزورا Kzora — أفضل أحذية في سوريا</h1>
            <p>تسوق أفضل الأحذية الرجالية والنسائية والرياضية في سوريا. جودة عالية وتوصيل سريع لجميع المحافظات السورية من كزورا Kzora.</p>
            <p>أحذية حلب، دمشق، حمص، حماة، اللاذقية، طرطوس، السويداء، درعا وجميع المحافظات.</p>
          </div>
        </noscript>

        {/* JSON-LD: WebSite with SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'كزورا Kzora',
              alternateName: 'Kzora',
              url: 'https://kzora.co',
              inLanguage: 'ar',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://kzora.co/products?search={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />

        {/* JSON-LD: ShoeStore with full business info */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ShoeStore',
              name: 'كزورا Kzora',
              alternateName: 'Kzora',
              description: 'متجر كزورا للأحذية الفاخرة في سوريا. أحذية رجالية ونسائية ورياضية بجودة عالية وتوصيل لجميع المحافظات.',
              image: 'https://kzora.co/logo.png',
              logo: 'https://kzora.co/logo.png',
              '@id': 'https://kzora.co',
              url: 'https://kzora.co',
              telephone: '+963964514765',
              priceRange: '$$',
              currenciesAccepted: 'SYP, USD',
              paymentAccepted: 'Cash, Sham Cash',
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
              areaServed: {
                '@type': 'Country',
                name: 'سوريا',
              },
              openingHoursSpecification: {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: [
                  'Monday', 'Tuesday', 'Wednesday', 'Thursday',
                  'Saturday', 'Sunday',
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
