import { NextRequest, NextResponse } from 'next/server'
import { authorizeApi } from '@/lib/adminGuard'
import { createVideoUploadSlots } from '@/lib/mediaStorage'

// ─── POST /api/videos/sign ────────────────────────────────────────────────────
// Admin only. Returns signed upload URLs so the browser can send a product video and
// its poster frame straight to Supabase Storage. Videos are too big to pass through our
// own API (Vercel rejects request bodies over ~4.5MB), so they never touch the server.
export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeApi(request, 'manage_products')
    if ('response' in auth) return auth.response
    return NextResponse.json(await createVideoUploadSlots())
  } catch (err) {
    console.error('Video sign unexpected error:', err)
    return NextResponse.json({ error: 'فشل تجهيز رفع الفيديو' }, { status: 500 })
  }
}
