import { NextRequest, NextResponse } from 'next/server'
import { authorizeApi } from '@/lib/adminGuard'
import { uploadImageToStorage } from '@/lib/mediaStorage'

// ─── POST /api/images/upload ──────────────────────────────────────────────────
// Admin only. Uploads a single image to Supabase Storage (bucket "media"), resized to
// fit 1200×1500 and saved as WebP — see lib/mediaStorage.ts. (Cloudinary until Nov 2026.)
// Accepts multipart/form-data with a 'file' field.
// Optional form fields: folder (string), transformation (stringified JSON)
export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeApi(request, 'manage_products')
    if ('response' in auth) return auth.response

    const formData = await request.formData()
    const file     = formData.get('file') as File | null
    const folder   = (formData.get('folder') as string | null) || 'kzora'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: jpeg, png, webp, gif, avif' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer      = Buffer.from(arrayBuffer)

    const result = await uploadImageToStorage(buffer, folder, file.type)

    return NextResponse.json(
      { url: result.url, public_id: result.public_id },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('Image upload unexpected error:', err)
    // Detailed error logging for debugging (since I can't see the console)
    const errorDetails = {
      message: err.message || 'No message',
      code: err.code || 'No code',
      stack: err.stack || 'No stack',
      all: err // The whole object
    }
    
    return NextResponse.json(
      { 
        error: 'فشل رفع الصورة', 
        details: err.message || 'Unknown error',
        raw: JSON.stringify(errorDetails) 
      }, 
      { status: 500 }
    )
  }
}
