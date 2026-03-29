import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppFAB } from '@/components/layout/WhatsAppFAB'
import { CartDrawer } from '@/components/cart/CartDrawer'

export default function NotFound() {
  return (
    <>
      <Header />

      <main
        dir="rtl"
        className="min-h-[calc(100vh-4rem)] bg-surface flex flex-col items-center justify-center px-4 py-16 text-center"
      >
        {/* Large 404 */}
        <p
          className="font-brand font-black leading-none select-none"
          style={{
            fontSize: 'clamp(6rem, 20vw, 14rem)',
            background: 'linear-gradient(135deg, #785600 0%, #986D00 50%, #B8860B 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
          aria-hidden="true"
        >
          ٤٠٤
        </p>

        {/* Heading */}
        <h1 className="font-arabic text-2xl sm:text-3xl font-bold text-on-surface mt-4 mb-3">
          الصفحة غير موجودة
        </h1>

        {/* Description */}
        <p className="font-arabic text-secondary text-sm sm:text-base max-w-sm leading-relaxed mb-8">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>

        {/* Decorative shoes icon */}
        <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-8">
          <svg
            viewBox="0 0 64 64"
            fill="none"
            className="w-9 h-9"
            aria-hidden="true"
          >
            <path
              d="M4 44 C4 44 12 36 24 36 C32 36 36 40 44 40 C52 40 60 36 60 36 L60 48 C60 50.2 58.2 52 56 52 L8 52 C5.8 52 4 50.2 4 48 Z"
              fill="#FFDEA6"
              stroke="#985600"
              strokeWidth="2"
            />
            <path
              d="M24 36 C20 28 16 20 24 16 C30 13 36 18 36 26 L44 26 C50 26 56 30 56 36"
              stroke="#985600"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="18" cy="46" r="3" fill="#985600" opacity="0.3" />
            <circle cx="30" cy="46" r="3" fill="#985600" opacity="0.3" />
            <circle cx="42" cy="46" r="3" fill="#985600" opacity="0.3" />
          </svg>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/"
            className={[
              'h-11 px-8 rounded-xl flex items-center gap-2',
              'bg-gradient-to-l from-[#785600] to-[#986D00] text-white',
              'font-arabic font-semibold text-sm',
              'hover:from-[#986D00] hover:to-[#B8860B]',
              'shadow-sm hover:shadow-md active:scale-[0.99]',
              'transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            ].join(' ')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75 12 3l9 6.75V20.25A.75.75 0 0 1 20.25 21H3.75A.75.75 0 0 1 3 20.25V9.75Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9" />
            </svg>
            العودة للرئيسية
          </Link>

          <Link
            href="/products"
            className={[
              'h-11 px-8 rounded-xl flex items-center gap-2',
              'bg-surface-container-low text-on-surface',
              'font-arabic font-semibold text-sm',
              'hover:bg-surface-container',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            ].join(' ')}
          >
            تصفح المنتجات
          </Link>
        </div>
      </main>

      <Footer />
      <WhatsAppFAB />
      <CartDrawer />
    </>
  )
}
