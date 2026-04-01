export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/getSession'
import { supabaseAdmin } from '@/lib/supabase'
import type { CreateProductPayload, ProductTag } from '@/types'

import { revalidatePath } from 'next/cache'
import { generateSlug } from '@/lib/utils'

// ─── GET /api/products ────────────────────────────────────────────────────────
// Public. Supports filtering, sorting, pagination.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const category  = searchParams.get('category')    // category slug
    const tag       = searchParams.get('tag') as ProductTag | null
    const search    = searchParams.get('search')
    const sort      = searchParams.get('sort') || 'newest'
    const size      = searchParams.get('size')
    const color     = searchParams.get('color')
    const minPrice  = searchParams.get('min_price')
    const maxPrice  = searchParams.get('max_price')
    const onSale    = searchParams.get('on_sale')
    const page      = parseInt(searchParams.get('page') || '1', 10)
    const limit     = Math.min(parseInt(searchParams.get('limit') || '24', 10), 100)
    const offset    = (page - 1) * limit

    // Base query — only published products
    let query = supabaseAdmin
      .from('products')
      .select(
        `
        *,
        category:categories(id, name_ar, slug),
        images:product_images(id, url, public_id, color_variant, display_order, is_main),
        colors:product_colors(id, name_ar, hex_code, swatch_url, swatch_public_id, is_available),
        sizes:product_sizes(size, is_available),
        tags:product_tags(tag)
        `,
        { count: 'exact' }
      )
      .eq('is_published', true)

    // Category filter via slug
    if (category) {
      const { data: cat } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('slug', category)
        .single()

      if (cat) {
        query = query.eq('category_id', cat.id)
      }
    }

    // Tag filter — join on product_tags
    if (tag) {
      const { data: taggedIds } = await supabaseAdmin
        .from('product_tags')
        .select('product_id')
        .eq('tag', tag)

      const ids = (taggedIds || []).map((r: { product_id: string }) => r.product_id)
      query = query.in('id', ids.length > 0 ? ids : ['00000000-0000-0000-0000-000000000000'])
    }

    // Size filter
    if (size) {
      const { data: sizeIds } = await supabaseAdmin
        .from('product_sizes')
        .select('product_id')
        .eq('size', parseInt(size, 10))

      const ids = (sizeIds || []).map((r: { product_id: string }) => r.product_id)
      query = query.in('id', ids.length > 0 ? ids : ['00000000-0000-0000-0000-000000000000'])
    }

    // Color filter (by hex_code or name_ar)
    if (color) {
      const { data: colorIds } = await supabaseAdmin
        .from('product_colors')
        .select('product_id')
        .or(`hex_code.ilike.%${color}%,name_ar.ilike.%${color}%`)

      const ids = (colorIds || []).map((r: { product_id: string }) => r.product_id)
      query = query.in('id', ids.length > 0 ? ids : ['00000000-0000-0000-0000-000000000000'])
    }

    // On-sale filter
    if (onSale === 'true') {
      query = query.not('discount_price_syp', 'is', null)
    }

    // Price range filters
    if (minPrice) query = query.gte('price_syp', parseInt(minPrice, 10))
    if (maxPrice) query = query.lte('price_syp', parseInt(maxPrice, 10))

    // Search
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    // Sort
    // We strictly order by stock_status first ('in_stock' < 'low_stock' < 'out_of_stock')
    query = query.order('stock_status', { ascending: true })
    switch (sort) {
      case 'price_asc':
        query = query.order('price_syp', { ascending: true })
        break
      case 'price_desc':
        query = query.order('price_syp', { ascending: false })
        break
      case 'most_viewed':
        query = query.order('view_count', { ascending: false })
        break
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Products GET error:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    // Normalize sizes and tags
    const products = (data || []).map((p: any) => ({
      ...p,
      sizes: (p.sizes || []).map((s: { size: number; is_available: boolean }) => ({ size: s.size, is_available: s.is_available })),
      tags:  (p.tags  || []).map((t: { tag: ProductTag }) => t.tag),
    }))

    return NextResponse.json({
      products,
      pagination: {
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    })
  } catch (err) {
    console.error('Products GET unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/products ────────────────────────────────────────────────────────
// Admin only. Creates product with all relations.
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateProductPayload = await request.json()

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
    } = body

    if (!name || !price_syp || !price_usd) {
      return NextResponse.json({ error: 'Missing required fields: name, price_syp, price_usd' }, { status: 400 })
    }

    // Generate clean slug
    const baseSlug = generateSlug(name)

    // Check if slug exists to avoid collisions
    const { data: existing } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('slug', baseSlug)
      .maybeSingle()

    const slug = existing ? `${baseSlug}-${Math.random().toString(36).slice(2, 5)}` : baseSlug

    // Insert product
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .insert({
        name,
        slug,
        description: description || '',
        category_id: category_id || null,
        price_syp,
        price_usd,
        discount_price_syp: discount_price_syp || null,
        discount_price_usd: discount_price_usd || null,
        mold_type: mold_type || 'normal',
        stock_status: stock_status || 'in_stock',
        is_featured: is_featured ?? false,
        is_published: is_published ?? false,
        sort_order: sort_order ?? 0,
      })
      .select()
      .single()

    if (productError || !product) {
      console.error('Product insert error:', productError)
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }

    const productId = product.id

    // Insert images
    if (images && images.length > 0) {
      const { error: imgError } = await supabaseAdmin
        .from('product_images')
        .insert(
          images.map((img) => ({
            product_id:    productId,
            url:           img.url,
            public_id:     img.public_id,
            color_variant: img.color_variant || null,
            display_order: img.display_order,
            is_main:       img.is_main || false,
          }))
        )

      if (imgError) {
        console.error('Product images insert error:', imgError)
      }
    }

    // Insert colors
    if (colors && colors.length > 0) {
      const { error: colorError } = await supabaseAdmin
        .from('product_colors')
        .insert(
          colors.map((c) => ({
            product_id:       productId,
            name_ar:          c.name_ar,
            hex_code:         c.hex_code,
            swatch_url:       c.swatch_url || null,
            swatch_public_id: c.swatch_public_id || null,
            is_available:     c.is_available ?? true,
          }))
        )

      if (colorError) {
        console.error('Product colors insert error:', colorError)
      }
    }

    // Insert sizes
    if (sizes && sizes.length > 0) {
      const { error: sizeError } = await supabaseAdmin
        .from('product_sizes')
        .insert(sizes.map((s) => ({ product_id: productId, size: s.size, is_available: s.is_available ?? true })))

      if (sizeError) {
        console.error('Product sizes insert error:', sizeError)
      }
    }

    // Insert tags
    if (tags && tags.length > 0) {
      const { error: tagError } = await supabaseAdmin
        .from('product_tags')
        .insert(tags.map((t) => ({ product_id: productId, tag: t })))

      if (tagError) {
        console.error('Product tags insert error:', tagError)
      }
    }

    // Insert variants
    if (variants && variants.length > 0) {
      const { error: variantError } = await supabaseAdmin
        .from('product_variants')
        .insert(variants.map(v => ({
          product_id: productId,
          color: v.color || '',
          size: v.size || 0,
          quantity: v.quantity || 0,
        })))

      if (variantError) {
        console.error('Product variants insert error:', variantError)
      }
    }

    // Get category slug for revalidation
    const { data: catData } = await supabaseAdmin.from('categories').select('slug').eq('id', productId).single()
    const categorySlug = catData?.slug

    revalidatePath('/')
    revalidatePath('/products')
    if (categorySlug) revalidatePath(`/category/${categorySlug}`)

    return NextResponse.json({ product }, { status: 201 })
  } catch (err) {
    console.error('Products POST unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

