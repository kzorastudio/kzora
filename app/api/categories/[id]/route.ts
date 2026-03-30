import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { deleteImages, deleteImage } from '@/lib/cloudinary'

// ─── GET /api/categories/[id] ─────────────────────────────────────────────────
// Public.
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json({ category })
  } catch (err) {
    console.error('Category GET [id] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PUT /api/categories/[id] ─────────────────────────────────────────────────
// Admin only.
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    // 1. Get old image public_id to delete it if changed
    const { data: oldCategory } = await supabaseAdmin
      .from('categories')
      .select('image_public_id')
      .eq('id', id)
      .single()

    const oldPublicId = oldCategory?.image_public_id

    // 2. Perform DB update
    const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() }
    const allowed = [
      'name_ar',
      'slug',
      'image_url',
      'image_public_id',
      'description',
      'sort_order',
      'is_active',
      'show_in_header',
      'show_in_footer',
      'show_in_home',
      'header_order',
      'footer_order',
      'home_order',
    ]

    for (const key of allowed) {
      if (body[key] !== undefined) updateFields[key] = body[key]
    }

    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single()

    if (error || !category) {
      console.error('Category update error:', error)
      return NextResponse.json({ error: 'Category not found or update failed' }, { status: 404 })
    }

    // 3. Delete old image from Cloudinary if changed or removed
    if (oldPublicId && oldPublicId !== (body.image_public_id ?? null)) {
       try {
         await deleteImage(oldPublicId)
       } catch (err) {
         console.error('Cloudinary old image delete error (continuing):', err)
       }
    }

    return NextResponse.json({ category })
  } catch (err) {
    console.error('Category PUT [id] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE /api/categories/[id] ─────────────────────────────────────────────
// Admin only. Cascade: delete all products + their cloudinary assets, then category.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // 1. Find category to get its image public_id
    const { data: category, error: catError } = await supabaseAdmin
      .from('categories')
      .select('image_public_id')
      .eq('id', id)
      .single()

    if (catError || !category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // 2. Find all products in this category
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('category_id', id)

    const productIds = (products || []).map((p: { id: string }) => p.id)

    if (productIds.length > 0) {
      // 3. Collect all cloudinary public_ids from those products
      const [{ data: productImages }, { data: productColors }] = await Promise.all([
        supabaseAdmin
          .from('product_images')
          .select('public_id')
          .in('product_id', productIds),
        supabaseAdmin
          .from('product_colors')
          .select('swatch_public_id')
          .in('product_id', productIds),
      ])

      const allPublicIds: string[] = [
        ...(productImages || [])
          .map((img: { public_id: string }) => img.public_id)
          .filter(Boolean),
        ...(productColors || [])
          .map((c: { swatch_public_id: string | null }) => c.swatch_public_id)
          .filter((pid): pid is string => !!pid),
      ]

      // 4. Bulk delete all product images from Cloudinary
      if (allPublicIds.length > 0) {
        try {
          await deleteImages(allPublicIds)
        } catch (cloudErr) {
          console.error('Cloudinary bulk delete error (continuing):', cloudErr)
        }
      }

      // 5. Delete all products (DB cascade handles product relations)
      await supabaseAdmin.from('products').delete().in('id', productIds)
    }

    // 6. Delete category image from Cloudinary
    if (category.image_public_id) {
      try {
        await deleteImage(category.image_public_id)
      } catch (cloudErr) {
        console.error('Cloudinary category image delete error (continuing):', cloudErr)
      }
    }

    // 7. Delete the category
    const { error: deleteError } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Category delete DB error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Category DELETE [id] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
