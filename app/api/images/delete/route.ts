import { NextRequest, NextResponse } from 'next/server'
import { authorizeApi } from '@/lib/adminGuard'
import { deleteImage } from '@/lib/cloudinary'

// ─── DELETE /api/images/delete ────────────────────────────────────────────────
// Admin only. Deletes a single image from Cloudinary by public_id.
// Body: { public_id: string }
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authorizeApi(request, 'manage_products')
    if ('response' in auth) return auth.response

    const body = await request.json()
    const { public_id } = body as { public_id: string }

    if (!public_id || typeof public_id !== 'string' || !public_id.trim()) {
      return NextResponse.json({ error: 'public_id is required' }, { status: 400 })
    }

    await deleteImage(public_id.trim())

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Image delete unexpected error:', err)
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
  }
}
