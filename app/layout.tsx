import type { Metadata, Viewport } from 'next'
import { Tajawal, Noto_Sans_Arabic, Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Providers from '@/components/Providers'
import ScrollToTop from '@/components/layout/ScrollToTop'
import VisitTracker from '@/components/analytics/VisitTracker'
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics'
import MetaPixel from '@/components/analytics/MetaPixel'

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
  metadataBase: new URL('https://www.kzora.co'),
  title: {
    default: 'متجر كزورا Kzora — أفضل متجر أحذية أونلاين في سوريا',
    template: '%s — متجر كزورا Kzora',
  },
  description: 'متجر كزورا Kzora لبيع الأحذية أونلاين في سوريا: أحذية رجالية ونسائية، كوتشيات رياضية (سبور)، وأحذية رسمية وكاجوال بجودة عالية. الدفع عند الاستلام وتوصيل سريع لحلب ودمشق وكل المحافظات السورية. كزورا، أناقة تبدأ من خطوتك.',
  keywords: [
    // Brand
    'كزورا', 'متجر كزورا', 'كزورا سوريا', 'Kzora', 'Kzora store', 'kzora.co', 'kzora shoes syria',
    // Core category + intent
    'أحذية سوريا', 'متجر أحذية سوريا', 'متجر احذية اونلاين سوريا', 'شراء أحذية أونلاين سوريا',
    'تسوق احذية اونلاين سوريا', 'أسعار الأحذية في سوريا', 'أحذية جلد طبيعي سوريا',
    // Colloquial Syrian/Levantine terms people actually type
    'كوتشي', 'كوتشيات', 'كوتشي رياضي', 'سنيكرز سوريا', 'صباط', 'صبابيط', 'جزمة', 'جزم',
    'بوط', 'بوتات', 'صنادل', 'سبور سوريا', 'أحذية سبور',
    // By audience
    'أحذية رجالية سوريا', 'أحذية نسائية سوريا', 'أحذية رياضية سوريا', 'أحذية كاجوال سوريا',
    'أحذية رسمية سوريا', 'أحذية طبية سوريا',
    // Purchase intent (huge in Syria)
    'الدفع عند الاستلام', 'دفع عند الاستلام احذية', 'توصيل احذية سوريا', 'شحن لكل المحافظات',
    'شام كاش', 'أحذية توصيل حلب',
    // Cities
    'أحذية حلب', 'أحذية دمشق', 'أحذية حمص', 'أحذية حماة', 'أحذية اللاذقية', 'أحذية طرطوس',
    'أحذية إدلب', 'أحذية دير الزور', 'أحذية الحسكة', 'أحذية القامشلي', 'أحذية درعا', 'أحذية السويداء',
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
    url: 'https://www.kzora.co',
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
            <h1>متجر كزورا Kzora — أفضل متجر أحذية أونلاين في سوريا</h1>
            <p>تسوق أونلاين أحذية رجالية ونسائية، كوتشيات رياضية (سبور وسنيكرز)، أحذية رسمية وكاجوال، جزم وصنادل بجودة عالية من متجر كزورا Kzora.</p>
            <p>الدفع عند الاستلام وتوصيل سريع لكل المحافظات: أحذية حلب، دمشق، حمص، حماة، اللاذقية، طرطوس، إدلب، دير الزور، الحسكة، القامشلي، السويداء، درعا.</p>
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
              url: 'https://www.kzora.co',
              inLanguage: 'ar',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://www.kzora.co/products?search={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />

        {/* JSON-LD: Organization — يربط كل أسماء العلامة (متجر كزورا / كزورا / Kzora) بكيان واحد لبحث الاسم التجاري */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'متجر كزورا',
              alternateName: ['كزورا', 'Kzora', 'Kzora Store', 'Kzora Shoes', 'كزورا سوريا', 'متجر كزورا للأحذية', 'كزورا للأحذية'],
              slogan: 'أناقة تبدأ من خطوتك',
              url: 'https://www.kzora.co',
              logo: 'https://www.kzora.co/logo.png',
              image: 'https://www.kzora.co/logo.png',
              description: 'متجر كزورا Kzora لبيع الأحذية الرجالية والنسائية والرياضية أونلاين في سوريا، مع الدفع عند الاستلام والتوصيل لكل المحافظات.',
              knowsAbout: ['أحذية رجالية', 'أحذية نسائية', 'أحذية رياضية', 'كوتشيات', 'أحذية جلد طبيعي', 'أحذية سوريا'],
              paymentAccepted: 'الدفع عند الاستلام، شام كاش، نقداً',
              areaServed: { '@type': 'Country', name: 'سوريا' },
              sameAs: [
                'https://www.facebook.com/kzora.studio',
                'https://www.instagram.com/kzora.studio',
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+963964514765',
                contactType: 'customer service',
                areaServed: 'SY',
                availableLanguage: ['Arabic'],
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
              image: 'https://www.kzora.co/logo.png',
              logo: 'https://www.kzora.co/logo.png',
              '@id': 'https://www.kzora.co',
              url: 'https://www.kzora.co',
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
                'https://www.kzora.co',
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
          {process.env.NEXT_PUBLIC_FB_PIXEL_ID && (
            <MetaPixel pixel_id={process.env.NEXT_PUBLIC_FB_PIXEL_ID} />
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
