export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getAuthSession } from '@/lib/getSession'
import { supabaseAdmin } from '@/lib/supabase'
import { deleteImage } from '@/lib/cloudinary'

// â”€â”€â”€ GET /api/homepage/settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Public. Returns the single homepage settings row.
export async function GET(_request: NextRequest) {
  try {
    const { data: rows, error } = await supabaseAdmin
      .from('homepage_settings')
      .select('*')
      .limit(1)

    const settings = rows?.[0]

    if (error && error.code !== 'PGRST116') {
      console.error('Homepage settings GET error:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    if (!settings) {
      // If no row exists yet, return sensible defaults
      return NextResponse.json({
        settings: {
          id: null,
          promo_banner_url:       null,
          promo_banner_public_id: null,
          promo_banner_link:      null,
          promo_banner_active:    false,
          section_categories:     true,
          section_new_arrivals:   true,
          section_best_sellers:   true,
          section_promo_banner:   false,
          section_offers:         true,
          section_stats:          true,
          stat_customers_count:   '+١٠٠٠ زبون',
          stat_satisfaction_rate: '٩٩٪ رضا العملاء',
          stat_returns_count:     '٥٠ عملية إرجاع',
          stat_exchanges_count:   '١٠٠ عملية تبديل',
          shipping_policy:        'نوفر خدمة التوصيل إلى جميع المحافظات السورية.',
          return_policy:          'إرجاع خلال 7 أيام من الاستلام.',
          hero_badge_text:        'تشكيلة كزورا الفاخرة ٢٠٢٦',
          hero_badge_color:       '#785600',
          sham_cash_enabled:      false,
          sham_cash_number:       '',
          sham_cash_image_url:    null,
          sham_cash_public_id:    null,
          sham_cash_instructions: '',
          discount_multi_items_enabled: false,
          discount_2_items_syp: 2000,
          discount_2_items_usd: 0,
          discount_3_items_plus_syp: 3000,
          discount_3_items_plus_usd: 0,
          shipping_fee_1_piece_syp: 0,
          shipping_fee_1_piece_usd: 0,
          shipping_fee_2_pieces_syp: 0,
          shipping_fee_2_pieces_usd: 0,
          shipping_fee_3_plus_pieces_syp: 0,
          shipping_fee_3_plus_pieces_usd: 0,
          delivery_fee_syp: 0,
          delivery_fee_usd: 0,
        },
      })
    }

    return NextResponse.json({ settings })
  } catch (err) {
    console.error('Homepage settings GET unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// â”€â”€â”€ PUT /api/homepage/settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Admin only. Upserts the homepage settings row.
export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const allowed = [
      'promo_banner_url',
      'promo_banner_public_id',
      'promo_banner_link',
      'promo_banner_active',
      'section_categories',
      'section_new_arrivals',
      'section_best_sellers',
      'section_promo_banner',
      'section_offers',
      'promo_banner_heading',
      'promo_banner_subtext',
      'promo_banner_button_text',
      'section_stats',
      'stat_customers_count',
      'stat_satisfaction_rate',
      'stat_returns_count',
      'stat_exchanges_count',
      'shipping_policy',
      'return_policy',
      'hero_badge_text',
      'hero_badge_color',
      'sham_cash_enabled',
      'sham_cash_number',
      'sham_cash_image_url',
      'sham_cash_public_id',
      'sham_cash_instructions',
      'discount_multi_items_enabled',
      'discount_2_items_syp',
      'discount_2_items_usd',
      'discount_3_items_plus_syp',
      'discount_3_items_plus_usd',
      'shipping_fee_1_piece_syp',
      'shipping_fee_1_piece_usd',
      'shipping_fee_2_pieces_syp',
      'shipping_fee_2_pieces_usd',
      'shipping_fee_3_plus_pieces_syp',
      'shipping_fee_3_plus_pieces_usd',
      'delivery_fee_syp',
      'delivery_fee_usd',
      'delivery_fee_1_piece_syp',
      'delivery_fee_1_piece_usd',
      'delivery_fee_2_pieces_syp',
      'delivery_fee_2_pieces_usd',
      'delivery_fee_3_plus_pieces_syp',
      'delivery_fee_3_plus_pieces_usd',
    ]

    const updateFields: Record<string, unknown> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) updateFields[key] = body[key]
    }

    // Check if a settings row already exists (Use select('*') and no .single() to avoid errors if multiple rows exist)
    const { data: rows } = await supabaseAdmin
      .from('homepage_settings')
      .select('*')
      .limit(1)

    const existing = rows?.[0]
    const oldPublicId = existing?.promo_banner_public_id

    let settings: any
    let dbError: any

    if (existing?.id) {
      // Update the ONLY or FIRST existing row
      const { data, error } = await supabaseAdmin
        .from('homepage_settings')
        .update(updateFields)
        .eq('id', existing.id)
        .select()
        .single()

      settings = data
      dbError  = error
    } else {
      // Insert first row if none exist
      const { data, error } = await supabaseAdmin
        .from('homepage_settings')
        .insert(updateFields)
        .select()
        .single()

      settings = data
      dbError  = error
    }

    if (dbError) {
      console.error('Homepage settings update error:', dbError)
      return NextResponse.json({ error: dbError.message || 'Failed to update settings' }, { status: 500 })
    }

    if (!settings) {
      return NextResponse.json({ error: 'No settings returned' }, { status: 500 })
    }

    // Cleanup Cloudinary if promo banner changed
    if (oldPublicId && oldPublicId !== body.promo_banner_public_id) {
       try {
         await deleteImage(oldPublicId)
       } catch (err) {
         console.error('Cloudinary promo banner delete error:', err)
       }
    }

    // Cleanup Cloudinary if sham cash image changed
    const oldShamPublicId = existing?.sham_cash_public_id
    if (oldShamPublicId && oldShamPublicId !== body.sham_cash_public_id) {
       try {
         await deleteImage(oldShamPublicId)
       } catch (err) {
         console.error('Cloudinary sham cash image delete error:', err)
       }
    }

    revalidatePath('/', 'layout')

    return NextResponse.json({ settings })
  } catch (err) {
    console.error('Homepage settings PUT unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

