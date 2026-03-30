export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { supabaseAdmin } from '@/lib/supabase'

// â”€â”€â”€ GET /api/homepage/slides â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Public. Returns all active hero slides ordered by sort_order.
export async function GET(_request: NextRequest) {
  try {
    const { data: slides, error } = await supabaseAdmin
      .from('hero_slides')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Slides GET error:', error)
      return NextResponse.json({ error: 'Failed to fetch slides' }, { status: 500 })
    }

    return NextResponse.json({ slides })
  } catch (err) {
    console.error('Slides GET unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// â”€â”€â”€ POST /api/homepage/slides â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Admin only. Creates a hero slide. Images uploaded separately via /api/images/upload.
export async function POST(request: NextRequest) {
  try {
    const session = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      desktop_image_url,
      desktop_image_public_id,
      mobile_image_url,
      mobile_image_public_id,
      heading,
      sub_text,
      cta_text,
      cta_link,
      sort_order,
      is_active,
    } = body

    if (!desktop_image_url || !desktop_image_public_id) {
      return NextResponse.json(
        { error: 'Missing required fields: desktop_image_url, desktop_image_public_id' },
        { status: 400 }
      )
    }

    const { data: slide, error } = await supabaseAdmin
      .from('hero_slides')
      .insert({
        desktop_image_url,
        desktop_image_public_id,
        mobile_image_url:       mobile_image_url        || null,
        mobile_image_public_id: mobile_image_public_id  || null,
        heading:                heading                  || '',
        sub_text:               sub_text                 || '',
        cta_text:               cta_text                 || '',
        cta_link:               cta_link                 || '/',
        sort_order:             sort_order               ?? 0,
        is_active:              is_active                ?? true,
        heading_color:          body.heading_color       || '#1A1A1A',
        accent_color:           body.accent_color        || '#785600',
        subtext_color:          body.subtext_color       || '#4A4742',
      })
      .select()
      .single()

    if (error) {
      console.error('Slide insert error:', error)
      return NextResponse.json({ error: 'Failed to create slide' }, { status: 500 })
    }

    return NextResponse.json({ slide }, { status: 201 })
  } catch (err) {
    console.error('Slides POST unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

