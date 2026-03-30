import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { cloudinary } from '@/lib/cloudinary'

// ─── POST /api/images/upload ──────────────────────────────────────────────────
// Admin only. Uploads a single file to Cloudinary under 'kzora' folder.
// Accepts multipart/form-data with a 'file' field.
// Optional form fields: folder (string), transformation (stringified JSON)
export async function POST(request: NextRequest) {
  try {
    const session = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Debug: Check env vars
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Missing Cloudinary env vars')
      return NextResponse.json({ 
        error: 'إعدادات Cloudinary غير موجودة في السيرفر',
        details: 'Missing Environment Variables'
      }, { status: 500 })
    }

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

    // Upload to Cloudinary via upload_stream
    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            transformation: [
              {
                width:        1200,
                height:       1500,
                crop:         'limit',
                quality:      'auto',
                fetch_format: 'auto',
              },
            ],
          },
          (error, result) => {
            if (error || !result) {
              console.error('Cloudinary upload error:', error)
              reject(error || new Error('Upload failed'))
            } else {
              resolve(result)
            }
          }
        )

        uploadStream.end(buffer)
      }
    )

    return NextResponse.json(
      { url: result.secure_url, public_id: result.public_id },
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
