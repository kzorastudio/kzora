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
        tags:product_tags(tag),
        variants:product_variants(id, color, size, quantity)
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

    // Size + Color combined filter — ensures the specific combination has stock
    if (size && color) {
      const sizes = size.split(',').map(s => parseInt(s.trim(), 10)).filter(s => !isNaN(s))

      // Step 1: products where this size is marked is_available = true
      const { data: availSizes } = await supabaseAdmin
        .from('product_sizes')
        .select('product_id')
        .in('size', sizes)
        .eq('is_available', true)

      const sizeCandidates = Array.from(new Set((availSizes || []).map((r: { product_id: string }) => r.product_id)))

      // Step 2: products that have this color
      const { data: colorMatches } = await supabaseAdmin
        .from('product_colors')
        .select('product_id, name_ar')
        .or(`hex_code.ilike.%${color}%,name_ar.ilike.%${color}%`)

      const colorCandidates = (colorMatches || []).map((r: { product_id: string }) => r.product_id)
      // Get color names for matching variants
      const colorNameMap = new Map<string, string>()
      for (const c of (colorMatches || [])) {
        colorNameMap.set(c.product_id, c.name_ar)
      }

      // Intersect: products that have BOTH the size and the color
      const combinedCandidates = sizeCandidates.filter(id => colorCandidates.includes(id))

      if (combinedCandidates.length === 0) {
        query = query.in('id', ['00000000-0000-0000-0000-000000000000'])
      } else {
        // Step 3: check that the specific color+size variant has stock > 0
        const { data: allVariants } = await supabaseAdmin
          .from('product_variants')
          .select('product_id, color, size, quantity')
          .in('size', sizes)
          .in('product_id', combinedCandidates)

        const finalIds = combinedCandidates.filter(id => {
          const colorName = colorNameMap.get(id) || ''
          const matchingVariants = (allVariants || []).filter(
            (v: any) => v.product_id === id && v.color === colorName
          )
          // No variants = size-only product, treat as available
          if (matchingVariants.length === 0) return true
          // Has variants: at least one must have stock > 0
          return matchingVariants.some((v: any) => (v.quantity ?? 0) > 0)
        })

        query = query.in('id', finalIds.length > 0 ? finalIds : ['00000000-0000-0000-0000-000000000000'])
      }
    } else if (size) {
      // Size filter only — size must be marked available AND have stock in variants
      const sizes = size.split(',').map(s => parseInt(s.trim(), 10)).filter(s => !isNaN(s))

      // Step 1: products where this size is marked is_available = true
      const { data: availSizes } = await supabaseAdmin
        .from('product_sizes')
        .select('product_id')
        .in('size', sizes)
        .eq('is_available', true)

      const candidateIds = Array.from(new Set((availSizes || []).map((r: { product_id: string }) => r.product_id)))

      if (candidateIds.length === 0) {
        query = query.in('id', ['00000000-0000-0000-0000-000000000000'])
      } else {
        // Step 2: among candidates, check variant stock for these sizes
        const { data: allVariants } = await supabaseAdmin
          .from('product_variants')
          .select('product_id, quantity')
          .in('size', sizes)
          .in('product_id', candidateIds)

        // Map: product_id → max quantity across matching variants
        const variantStock = new Map<string, number>()
        for (const v of (allVariants || [])) {
          variantStock.set(v.product_id, Math.max(variantStock.get(v.product_id) ?? 0, v.quantity ?? 0))
        }

        // Keep products that: have no variants for this size (size-only products)
        // OR have at least one variant with quantity > 0
        const finalIds = candidateIds.filter(id => {
          const qty = variantStock.get(id)
          return qty === undefined || qty > 0
        })

        query = query.in('id', finalIds.length > 0 ? finalIds : ['00000000-0000-0000-0000-000000000000'])
      }
    } else if (color) {
      // Color filter only (by hex_code or name_ar)
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
    query = query.order('created_at', { ascending: false })
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
        // Already handled above
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
    if (category_id) {
      const { data: catData } = await supabaseAdmin.from('categories').select('slug').eq('id', category_id).single()
      if (catData?.slug) revalidatePath(`/category/${catData.slug}`)
    }

    revalidatePath('/')
    revalidatePath('/products')
    revalidatePath('/admin/products')

    return NextResponse.json({ product }, { status: 201 })
  } catch (err) {
    console.error('Products POST unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

