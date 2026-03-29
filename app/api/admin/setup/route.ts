import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword } from '@/lib/auth'

// ─── POST /api/admin/setup ────────────────────────────────────────────────────
// One-time only. Creates the first admin account.
// Automatically locks itself once any admin exists.
export async function POST(request: NextRequest) {
  try {
    // Check if any admin already exists — if so, lock this endpoint
    const { count } = await supabaseAdmin
      .from('admins')
      .select('id', { count: 'exact', head: true })

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Setup already completed. An admin account already exists.' },
        { status: 403 }
      )
    }

    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, name' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const password_hash = await hashPassword(password)

    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .insert({
        email:         email.toLowerCase().trim(),
        name:          name.trim(),
        password_hash,
      })
      .select('id, email, name')
      .single()

    if (error) {
      console.error('Admin setup error:', error)
      return NextResponse.json({ error: 'Failed to create admin account' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully. You can now log in.',
      admin:   { id: admin.id, email: admin.email, name: admin.name },
    })
  } catch (err) {
    console.error('Admin setup unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
