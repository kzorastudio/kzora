import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/getSession'
import { supabaseAdmin } from '@/lib/supabase'
import { deleteImages } from '@/lib/cloudinary'
import type { ProductTag } from '@/types'

import { revalidatePath } from 'next/cache'
import { generateSlug } from '@/lib/utils'

// ─── GET /api/products/[id] ───────────────────────────────────────────────────
// Public. Returns single product with all relations.
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select(
        `
        *,
        category:categories(id, name_ar, slug, image_url),
        images:product_images(id, url, public_id, color_variant, display_order, is_main),
        colors:product_colors(id, name_ar, hex_code, swatch_url, swatch_public_id, is_available),
        sizes:product_sizes(size, is_available),
        tags:product_tags(tag),
        variants:product_variants(*)
        `
      )
      .eq('id', id)
      .single()

    if (error || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Increment view count (fire-and-forget)
    supabaseAdmin
      .from('products')
      .update({ view_count: (product.view_count || 0) + 1 })
      .eq('id', id)
      .then(() => {})

    const normalized = {
      ...product,
      sizes: (product.sizes || []).map((s: { size: number; is_available: boolean }) => ({ size: s.size, is_available: s.is_available })),
      tags:  (product.tags  || []).map((t: { tag: ProductTag }) => t.tag),
    }

    return NextResponse.json({ product: normalized })
  } catch (err) {
    console.error('Product GET [id] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PUT /api/products/[id] ───────────────────────────────────────────────────
// Admin only. Full update of product and its relations.
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    const {
      name,
      description,
      category_id,
      price_syp,
      price_usd,
      discount_price_syp,
      discount_price_usd,
      mold_type,
      stock_status,
      is_featured,
      is_published,
      sort_order,
      images,
      colors,
      sizes,
      tags,
      variants,
      multi_discount_enabled,
      multi_discount_2_items_syp,
      multi_discount_2_items_usd,
      multi_discount_3_plus_syp,
      multi_discount_3_plus_usd,
    } = body

    // 1. Fetch existing product with category slug to handle revalidation
    const { data: existing } = await supabaseAdmin
      .from('products')
      .select('name, slug, category_id, categories(slug)')
      .eq('id', id)
      .single()

    const oldCategorySlug = (existing?.categories as any)?.slug

    // Build the fields to update (only provided fields)
    const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (name              !== undefined) {
      updateFields.name = name
      // If name changed, update slug
      if (existing && existing.name !== name) {
        updateFields.slug = generateSlug(name)
      }
    }
    if (description       !== undefined) updateFields.description        = description
    if (category_id       !== undefined) updateFields.category_id        = category_id
    if (price_syp         !== undefined) updateFields.price_syp          = price_syp
    if (price_usd         !== undefined) updateFields.price_usd          = price_usd
    if (discount_price_syp !== undefined) updateFields.discount_price_syp = discount_price_syp
    if (discount_price_usd !== undefined) updateFields.discount_price_usd = discount_price_usd
    if (mold_type         !== undefined) updateFields.mold_type          = mold_type
    if (stock_status      !== undefined) updateFields.stock_status       = stock_status
    if (is_featured       !== undefined) updateFields.is_featured        = is_featured
    if (is_published      !== undefined) updateFields.is_published       = is_published
    if (sort_order        !== undefined) updateFields.sort_order         = sort_order
    if (multi_discount_enabled      !== undefined) updateFields.multi_discount_enabled      = multi_discount_enabled
    if (multi_discount_2_items_syp  !== undefined) updateFields.multi_discount_2_items_syp  = multi_discount_2_items_syp
    if (multi_discount_2_items_usd  !== undefined) updateFields.multi_discount_2_items_usd  = multi_discount_2_items_usd
    if (multi_discount_3_plus_syp   !== undefined) updateFields.multi_discount_3_plus_syp   = multi_discount_3_plus_syp
    if (multi_discount_3_plus_usd   !== undefined) updateFields.multi_discount_3_plus_usd   = multi_discount_3_plus_usd

    // Update product core fields
    const { data: product, error: updateError } = await supabaseAdmin
      .from('products')
      .update(updateFields)
      .eq('id', id)
      .select('*, categories(slug)')
      .single()

    if (updateError || !product) {
      console.error('Product update error:', updateError)
      return NextResponse.json({ error: 'Product not found or update failed' }, { status: 404 })
    }

    const newCategorySlug = (product?.categories as any)?.slug



    // Replace relations if provided
    if (images !== undefined) {
      // 1. Fetch current images from DB first
      const { data: currentImages } = await supabaseAdmin
        .from('product_images')
        .select('public_id')
        .eq('product_id', id)

      // 2. Identify images to delete (those in DB but not in new request)
      const newPublicIds = new Set(images.map((img: any) => img.public_id))
      const idsToDelete = (currentImages || [])
        .map((img: any) => img.public_id)
        .filter(pid => pid && !newPublicIds.has(pid))

      // 3. Delete relations from DB
      await supabaseAdmin.from('product_images').delete().eq('product_id', id)
      if (images.length > 0) {
        await supabaseAdmin.from('product_images').insert(
          images.map((img: any) => ({
            product_id:    id,
            url:           img.url,
            public_id:     img.public_id,
            color_variant: img.color_variant || null,
            display_order: img.display_order,
            is_main:       img.is_main || false,
          }))
        )
      }

      // 4. Cleanup Cloudinary
      if (idsToDelete.length > 0) {
        try {
          await deleteImages(idsToDelete)
        } catch (err) {
          console.error('Cloudinary images cleanup error:', err)
        }
      }
    }

    if (colors !== undefined) {
      // 1. Fetch current colors from DB first
      const { data: currentColors } = await supabaseAdmin
        .from('product_colors')
        .select('swatch_public_id')
        .eq('product_id', id)

      // 2. Identify swatches to delete
      const newSwatchIds = new Set(colors.map((c: any) => c.swatch_public_id).filter(Boolean))
      const swatchesToDelete = (currentColors || [])
        .map((c: any) => c.swatch_public_id)
        .filter(pid => pid && !newSwatchIds.has(pid))

      // 3. Delete relations from DB
      await supabaseAdmin.from('product_colors').delete().eq('product_id', id)
      if (colors.length > 0) {
        await supabaseAdmin.from('product_colors').insert(
          colors.map((c: any) => ({
            product_id:       id,
            name_ar:          c.name_ar,
            hex_code:         c.hex_code,
            swatch_url:       c.swatch_url || null,
            swatch_public_id: c.swatch_public_id || null,
            is_available:     c.is_available ?? true,
          }))
        )
      }

      // 4. Cleanup Cloudinary swatches
      if (swatchesToDelete.length > 0) {
        try {
          await deleteImages(swatchesToDelete)
        } catch (err) {
          console.error('Cloudinary swatches cleanup error:', err)
        }
      }
    }

    if (sizes !== undefined) {
      await supabaseAdmin.from('product_sizes').delete().eq('product_id', id)
      if (sizes.length > 0) {
        await supabaseAdmin
          .from('product_sizes')
          .insert(sizes.map((s: any) => ({ product_id: id, size: s.size, is_available: s.is_available ?? true })))
      }
    }

    if (tags !== undefined) {
      await supabaseAdmin.from('product_tags').delete().eq('product_id', id)
      if (tags.length > 0) {
        await supabaseAdmin
          .from('product_tags')
          .insert(tags.map((t: ProductTag) => ({ product_id: id, tag: t })))
      }
    }

    if (variants !== undefined) {
      await supabaseAdmin.from('product_variants').delete().eq('product_id', id)
      if (variants.length > 0) {
        const { error: variantError } = await supabaseAdmin
          .from('product_variants')
          .insert(variants.map((v: any) => ({
             product_id: id,
             color: v.color || '',
             size: v.size || 0,
             quantity: v.quantity || 0,
          })))
        if (variantError) {
          console.error('Variant insert error:', variantError)
          throw new Error('Failed to insert variants: ' + variantError.message)
        }
      }
    }

    // ───── Clear caches ─────
    revalidatePath('/')
    revalidatePath('/products')
    revalidatePath('/admin/products')
    revalidatePath(`/admin/products/${id}/edit`)
    if (oldCategorySlug) revalidatePath(`/category/${oldCategorySlug}`)
    if (newCategorySlug && (newCategorySlug !== oldCategorySlug)) revalidatePath(`/category/${newCategorySlug}`)
    if (existing?.slug) revalidatePath(`/product/${existing.slug}`)
    revalidatePath(`/product/${product.slug}`)

    return NextResponse.json({ product })
  } catch (err) {
    console.error('Product PUT [id] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE /api/products/[id] ────────────────────────────────────────────────
// Admin only. Deletes cloudinary images, then product (cascades relations).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession(_request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Collect all cloudinary public_ids before deletion
    const [{ data: images }, { data: colors }] = await Promise.all([
      supabaseAdmin
        .from('product_images')
        .select('public_id')
        .eq('product_id', id),
      supabaseAdmin
        .from('product_colors')
        .select('swatch_public_id')
        .eq('product_id', id),
    ])

    const publicIds: string[] = [
      ...(images || []).map((img: { public_id: string }) => img.public_id).filter(Boolean),
      ...(colors || [])
        .map((c: { swatch_public_id: string | null }) => c.swatch_public_id)
        .filter((pid): pid is string => !!pid),
    ]

    // Delete from Cloudinary first
    if (publicIds.length > 0) {
      try {
        await deleteImages(publicIds)
      } catch (cloudErr) {
        console.error('Cloudinary delete error (continuing):', cloudErr)
      }
    }

    // Delete product (DB cascade handles relations)
    const { error: deleteError } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Product delete DB error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }

    revalidatePath('/')
    revalidatePath('/products')
    revalidatePath('/admin/products')

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Product DELETE [id] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
