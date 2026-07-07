'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

/**
 * Meta (Facebook) Pixel — بكسل فيس بوك للمتصفح.
 *
 * يحمّل كود fbq الأساسي ويطلق PageView عند كل تنقّل بين الصفحات.
 * يعمل جنباً إلى جنب مع Conversions API (السيرفر) لتتبّع دقيق للأحداث.
 *
 * يحتاج متغيّر البيئة: NEXT_PUBLIC_FB_PIXEL_ID
 */
export default function MetaPixel({ pixel_id }: { pixel_id: string }) {
  const pathname = usePathname()
  const initialized = useRef(false)

  // Fire PageView on client-side route changes (fbq is initialised by the inline
  // script below on first load; SPA navigations need a manual PageView).
  useEffect(() => {
    if (!initialized.current) {
      // Skip the very first render — the inline script already fired PageView.
      initialized.current = true
      return
    }
    if (typeof window !== 'undefined' && (window as any).fbq) {
      ;(window as any).fbq('track', 'PageView')
    }
  }, [pathname])

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixel_id}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          alt=""
          src={`https://www.facebook.com/tr?id=${pixel_id}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  )
}
