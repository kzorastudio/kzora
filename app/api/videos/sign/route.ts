import { NextRequest, NextResponse } from 'next/server'
import { authorizeApi } from '@/lib/adminGuard'
import { cloudinary } from '@/lib/cloudinary'
import { PRODUCT_VIDEO_EAGER } from '@/lib/cloudinaryUrl'

// ─── POST /api/videos/sign ────────────────────────────────────────────────────
// Admin only. Returns a signature so the browser can upload a product video
// straight to Cloudinary. Videos are too big to pass through our own API
// (Vercel rejects request bodies over ~4.5MB), so they never touch the server.
export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeApi(request, 'manage_products')
    if ('response' in auth) return auth.response

    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      return NextResponse.json({ error: 'إعدادات Cloudinary غير موجودة في السيرفر' }, { status: 500 })
    }

    // Every param here must be sent with the upload exactly as signed
    const params = {
      timestamp:   Math.round(Date.now() / 1000),
      folder:      'products/videos',
      eager:       PRODUCT_VIDEO_EAGER,
      eager_async: 'true',
    }
    const signature = cloudinary.utils.api_sign_request(params, CLOUDINARY_API_SECRET)

    return NextResponse.json({
      ...params,
      signature,
      api_key:    CLOUDINARY_API_KEY,
      upload_url: `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
    })
  } catch (err) {
    console.error('Video sign unexpected error:', err)
    return NextResponse.json({ error: 'فشل تجهيز رفع الفيديو' }, { status: 500 })
  }
}
