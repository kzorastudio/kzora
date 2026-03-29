export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// ─── GET /api/pages/[slug] ────────────────────────────────────────────────────
// Public. Returns a static page by its slug.
export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    const { data: page, error } = await supabaseAdmin
      .from('static_pages')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    return NextResponse.json({ page })
  } catch (err) {
    console.error('Page GET [slug] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PUT /api/pages/[slug] ────────────────────────────────────────────────────
// Admin only. Updates a static page. Creates it if it doesn't exist (upsert).
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = params
    const body = await request.json()
    const { title, content, hero_image_url, hero_image_public_id, meta } = body

    // Check if page already exists
    const { data: existing } = await supabaseAdmin
      .from('static_pages')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    const now = new Date().toISOString()

    let page: unknown
    let dbError: unknown

    if (existing?.id) {
      // Update
      const updateFields: Record<string, unknown> = { updated_at: now }
      if (title                !== undefined) updateFields.title                = title
      if (content              !== undefined) updateFields.content              = content
      if (hero_image_url       !== undefined) updateFields.hero_image_url       = hero_image_url
      if (hero_image_public_id !== undefined) updateFields.hero_image_public_id = hero_image_public_id
      if (meta                 !== undefined) updateFields.meta                 = meta

      const { data, error } = await supabaseAdmin
        .from('static_pages')
        .update(updateFields)
        .eq('id', existing.id)
        .select()
        .single()

      page     = data
      dbError  = error
    } else {
      // Insert (create page for first time)
      if (!title || content === undefined) {
        return NextResponse.json(
          { error: 'Missing required fields: title, content' },
          { status: 400 }
        )
      }

      const { data, error } = await supabaseAdmin
        .from('static_pages')
        .insert({
          slug,
          title,
          content,
          hero_image_url:       hero_image_url       || null,
          hero_image_public_id: hero_image_public_id || null,
          meta:                 meta                 || null,
          created_at:           now,
          updated_at:           now,
        })
        .select()
        .single()

      page    = data
      dbError = error
    }

    if (dbError || !page) {
      console.error('Static page PUT error:', dbError)
      return NextResponse.json({ error: 'Failed to update page' }, { status: 500 })
    }

    return NextResponse.json({ page })
  } catch (err) {
    console.error('Page PUT [slug] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
