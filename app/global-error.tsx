'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <html lang="ar" dir="rtl">
      <body style={{ background: '#FAF8F5', margin: 0, fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
        <div>
          <h1 style={{ color: '#1A1A1A', marginBottom: '0.5rem' }}>حدث خطأ في التطبيق</h1>
          <button onClick={reset} style={{ background: '#785600', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', cursor: 'pointer' }}>
            حاول مجدداً
          </button>
        </div>
      </body>
    </html>
  )
}
