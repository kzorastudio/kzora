export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_ORDERS, MOCK_HERO_SLIDES } from '@/lib/mockData'

export async function GET() {
  try {
    // 1. Insert Categories
    // We only insert columns that exist in the original MOCK schema to avoid crashing
    // if the user hasn't run the ALTER TABLE sql yet for new navigation fields.
    const categoriesToInsert = MOCK_CATEGORIES.map(c => ({
        id: c.id,
        name_ar: c.name_ar,
        slug: c.slug,
        image_url: c.image_url,
        image_public_id: c.image_public_id,
        description: c.description,
        sort_order: c.sort_order,
        is_active: c.is_active,
    }))

    const { error: catError } = await supabaseAdmin
      .from('categories')
      .upsert(categoriesToInsert, { onConflict: 'slug' })
    if (catError) console.error('Categories seed error:', catError)

    // 2. Insert Products & their relations
    for (const p of MOCK_PRODUCTS) {
      // Product
      const { error: pError } = await supabaseAdmin
        .from('products')
        .upsert({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          category_id: p.category_id,
          price_syp: p.price_syp,
          price_usd: p.price_usd,
          discount_price_syp: p.discount_price_syp,
          discount_price_usd: p.discount_price_usd,
          stock_status: p.stock_status,
          is_featured: p.is_featured,
          is_published: p.is_published,
          sort_order: p.sort_order,
          view_count: p.view_count,
        }, { onConflict: 'slug' })
      if (pError) console.error('Product seed error:', pError)

      // Images
      if (p.images && p.images.length > 0) {
        await supabaseAdmin.from('product_images').upsert(
            p.images.map(img => ({
                id: img.id,
                product_id: img.product_id,
                url: img.url,
                public_id: img.public_id,
                color_variant: img.color_variant,
                display_order: img.display_order,
            }))
        )
      }

      // Colors
      if (p.colors && p.colors.length > 0) {
        await supabaseAdmin.from('product_colors').upsert(
            p.colors.map(col => ({
                id: col.id,
                product_id: col.product_id,
                name_ar: col.name_ar,
                hex_code: col.hex_code,
            }))
        )
      }

      // Sizes
      if (p.sizes && p.sizes.length > 0) {
        const existingSizes = await supabaseAdmin.from('product_sizes').select('size').eq('product_id', p.id)
        if (!existingSizes.data?.length) {
            await supabaseAdmin.from('product_sizes').insert(
                p.sizes.map(s => ({
                    product_id: p.id,
                    size: s,
                }))
            )
        }
      }

      // Tags
      if (p.tags && p.tags.length > 0) {
        const existingTags = await supabaseAdmin.from('product_tags').select('tag').eq('product_id', p.id)
        if (!existingTags.data?.length) {
            await supabaseAdmin.from('product_tags').insert(
                p.tags.map(t => ({
                    product_id: p.id,
                    tag: t,
                }))
            )
        }
      }
    }

    // 3. Insert Hero Slides
    const { error: heroError } = await supabaseAdmin
      .from('hero_slides')
      .upsert(MOCK_HERO_SLIDES.map(s => ({
          id: s.id,
          desktop_image_url: s.desktop_image_url,
          desktop_image_public_id: s.desktop_image_public_id,
          mobile_image_url: s.mobile_image_url,
          mobile_image_public_id: s.mobile_image_public_id,
          heading: s.heading,
          sub_text: s.sub_text,
          cta_text: s.cta_text,
          cta_link: s.cta_link,
          sort_order: s.sort_order,
      })))
    if (heroError) console.error('Hero seed error:', heroError)

    // 4. Insert Orders
    for (const o of MOCK_ORDERS) {
      const { error: oError } = await supabaseAdmin
        .from('orders')
        .upsert({
          id: o.id,
          order_number: o.order_number,
          customer_full_name: o.customer_full_name,
          customer_phone: o.customer_phone,
          customer_governorate: o.customer_governorate,
          customer_address: o.customer_address,
          shipping_company: 'karam', // default valid one
          status: o.status,
          currency_used: o.currency_used,
          subtotal_syp: o.subtotal_syp,
          subtotal_usd: o.subtotal_usd,
          total_syp: o.total_syp,
          total_usd: o.total_usd,
          created_at: o.created_at,
        })
      if (oError) {
          console.error('Order seed error:', oError)
      } else if (o.items && o.items.length > 0) {
          await supabaseAdmin.from('order_items').upsert(
              o.items.map((item: any) => ({
                  id: item.id,
                  order_id: o.id,
                  product_name: item.product_name,
                  quantity: item.quantity,
                  unit_price_syp: item.unit_price_syp,
                  unit_price_usd: item.unit_price_usd,
                  color: item.color,
                  size: item.size ? parseInt(item.size) : null
              }))
          )
      }
    }

    return NextResponse.json({ success: true, message: 'Database seeded successfully with mock data!' })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

