import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { supabaseAdmin } from '@/lib/supabase'
import { deleteImage } from '@/lib/cloudinary'

// ─── PUT /api/homepage/slides/[id] ───────────────────────────────────────────
// Admin only. Updates a hero slide.
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    // 1. Fetch old slide to get public_ids
    const { data: oldSlide } = await supabaseAdmin
      .from('hero_slides')
      .select('desktop_image_public_id, mobile_image_public_id')
      .eq('id', id)
      .single()

    const oldDesktopPublicId = oldSlide?.desktop_image_public_id
    const oldMobilePublicId = oldSlide?.mobile_image_public_id

    // 2. Perform DB update
    const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() }
    const allowed = [
      'desktop_image_url',
      'desktop_image_public_id',
      'mobile_image_url',
      'mobile_image_public_id',
      'heading',
      'sub_text',
      'cta_text',
      'cta_link',
      'sort_order',
      'is_active',
      'heading_color',
      'accent_color',
      'subtext_color',
    ]

    for (const key of allowed) {
      if (body[key] !== undefined) updateFields[key] = body[key]
    }

    const { data: slide, error } = await supabaseAdmin
      .from('hero_slides')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single()

    if (error || !slide) {
      console.error('Slide update error:', error)
      return NextResponse.json({ error: 'Slide not found or update failed' }, { status: 404 })
    }

    // 3. Delete old images from Cloudinary if changed
    const deletePromises: Promise<void>[] = []

    if (oldDesktopPublicId && oldDesktopPublicId !== (body.desktop_image_public_id ?? null)) {
       deletePromises.push(deleteImage(oldDesktopPublicId).catch(e => console.error('Desktop image delete error:', e)))
    }

    if (oldMobilePublicId && oldMobilePublicId !== (body.mobile_image_public_id ?? null)) {
       deletePromises.push(deleteImage(oldMobilePublicId).catch(e => console.error('Mobile image delete error:', e)))
    }

    if (deletePromises.length > 0) await Promise.all(deletePromises)

    return NextResponse.json({ slide })
  } catch (err) {
    console.error('Slide PUT [id] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE /api/homepage/slides/[id] ────────────────────────────────────────
// Admin only. Deletes slide and its Cloudinary images.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getToken({ req: _request, secret: process.env.NEXTAUTH_SECRET })
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Fetch slide to get image public_ids
    const { data: slide, error: fetchError } = await supabaseAdmin
      .from('hero_slides')
      .select('desktop_image_public_id, mobile_image_public_id')
      .eq('id', id)
      .single()

    if (fetchError || !slide) {
      return NextResponse.json({ error: 'Slide not found' }, { status: 404 })
    }

    // Delete Cloudinary images
    const deletePromises: Promise<void>[] = []

    if (slide.desktop_image_public_id) {
      deletePromises.push(
        deleteImage(slide.desktop_image_public_id).catch((e) =>
          console.error('Desktop image delete error (continuing):', e)
        )
      )
    }

    if (slide.mobile_image_public_id) {
      deletePromises.push(
        deleteImage(slide.mobile_image_public_id).catch((e) =>
          console.error('Mobile image delete error (continuing):', e)
        )
      )
    }

    await Promise.all(deletePromises)

    // Delete slide from DB
    const { error: deleteError } = await supabaseAdmin
      .from('hero_slides')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Slide delete DB error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete slide' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Slide DELETE [id] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
