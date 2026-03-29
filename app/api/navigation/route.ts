import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

interface NavItem {
  id: string
}

// PUT /api/navigation — save header / footer / home links
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { headerLinks, footerLinks, homeLinks } = await request.json() as {
      headerLinks: NavItem[]
      footerLinks: NavItem[]
      homeLinks: NavItem[]
    }

    // 1. Reset all categories
    const { error: resetError } = await supabaseAdmin
      .from('categories')
      .update({
        show_in_header: false,
        show_in_footer: false,
        show_in_home: false,
        header_order: 0,
        footer_order: 0,
        home_order: 0,
      })
      .not('id', 'is', null)

    if (resetError) throw resetError

    // 2. Update header
    for (let i = 0; i < headerLinks.length; i++) {
      const { error } = await supabaseAdmin
        .from('categories')
        .update({ show_in_header: true, header_order: i })
        .eq('id', headerLinks[i].id)
      if (error) throw error
    }

    // 3. Update footer
    for (let i = 0; i < footerLinks.length; i++) {
      const { error } = await supabaseAdmin
        .from('categories')
        .update({ show_in_footer: true, footer_order: i })
        .eq('id', footerLinks[i].id)
      if (error) throw error
    }

    // 4. Update home
    for (let i = 0; i < homeLinks.length; i++) {
      const { error } = await supabaseAdmin
        .from('categories')
        .update({ show_in_home: true, home_order: i })
        .eq('id', homeLinks[i].id)
      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Navigation PUT error:', err)
    return NextResponse.json({ error: 'Failed to save navigation' }, { status: 500 })
  }
}
