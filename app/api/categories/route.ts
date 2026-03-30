export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { supabaseAdmin } from '@/lib/supabase'

// â”€â”€â”€ GET /api/categories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function GET(_request: NextRequest) {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Categories GET error:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    return NextResponse.json({ categories })
  } catch (err) {
    console.error('Categories GET unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// â”€â”€â”€ POST /api/categories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function POST(request: NextRequest) {
  try {
    const session = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      name_ar,
      image_url,
      image_public_id,
      description,
      sort_order,
      is_active,
      show_in_header,
      show_in_footer,
      show_in_home,
      header_order,
      footer_order,
      home_order,
    } = body
    let { slug } = body

    if (!name_ar) {
      return NextResponse.json({ error: 'Missing required fields: name_ar' }, { status: 400 })
    }

    // Auto-generate slug if missing
    if (!slug) {
      const baseSlug = name_ar
        .toLowerCase()
        .trim()
        .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')

      // Check if slug exists
      const { data: existing } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('slug', baseSlug)
        .maybeSingle()

      slug = existing ? `${baseSlug}-${Math.random().toString(36).slice(2, 5)}` : baseSlug
    }

    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .insert({
        name_ar,
        slug,
        image_url: image_url || null,
        image_public_id: image_public_id || null,
        description: description || '',
        sort_order: sort_order ?? 0,
        is_active: is_active ?? true,
        show_in_header: show_in_header ?? false,
        show_in_footer: show_in_footer ?? false,
        show_in_home: show_in_home ?? false,
        header_order: header_order ?? 0,
        footer_order: footer_order ?? 0,
        home_order: home_order ?? 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Category insert error:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'عذراً، هذا الرابط مستخدم بالفعل لهذا القسم' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }

    return NextResponse.json({ category }, { status: 201 })
  } catch (err) {
    console.error('Categories POST unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

