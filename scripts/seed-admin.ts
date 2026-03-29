/**
 * Seed script: creates the first admin user in Supabase.
 * Run with: npx ts-node --project tsconfig.json scripts/seed-admin.ts
 * Or:       npx tsx scripts/seed-admin.ts
 *
 * Requires .env.local to be present with SUPABASE_SERVICE_ROLE_KEY, etc.
 */

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl      = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseAdminKey) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAdminKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function seedAdmin() {
  const email    = process.env.ADMIN_EMAIL    || 'admin@kzora.com'
  const password = process.env.ADMIN_PASSWORD || 'kzora_admin_2025'
  const name     = 'مدير كزورا'

  console.log(`\n🌱  Seeding admin user: ${email}`)

  // Check if already exists
  const { data: existing } = await supabase
    .from('admins')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    console.log('ℹ️   Admin already exists — skipping.')
    process.exit(0)
  }

  const password_hash = await bcrypt.hash(password, 12)

  const { error } = await supabase.from('admins').insert({
    email,
    password_hash,
    name,
  })

  if (error) {
    console.error('❌  Failed to create admin:', error.message)
    process.exit(1)
  }

  console.log('✅  Admin created successfully!')
  console.log(`   Email:    ${email}`)
  console.log(`   Password: ${password}`)
  console.log('\n⚠️   Change your password after first login!\n')
}

seedAdmin()
