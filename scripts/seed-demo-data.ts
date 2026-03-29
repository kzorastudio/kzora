/**
 * Seed script: adds demo categories and products.
 * Run: npx tsx scripts/seed-demo-data.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function seed() {
  console.log('\n🌱  Seeding demo data...\n')

  // ── Categories ─────────────────────────────────────────────
  const categories = [
    {
      name_ar: 'أحذية رجالية',
      slug: 'mens-shoes',
      image_url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/shoes/mens.jpg',
      image_public_id: 'samples/shoes/mens',
      description: 'تشكيلة فاخرة من الأحذية الرجالية',
      sort_order: 1,
    },
    {
      name_ar: 'أحذية نسائية',
      slug: 'womens-shoes',
      image_url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/shoes/womens.jpg',
      image_public_id: 'samples/shoes/womens',
      description: 'تشكيلة راقية من الأحذية النسائية',
      sort_order: 2,
    },
    {
      name_ar: 'رياضي',
      slug: 'sport',
      image_url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/shoes/sport.jpg',
      image_public_id: 'samples/shoes/sport',
      description: 'أحذية رياضية عصرية',
      sort_order: 3,
    },
    {
      name_ar: 'إكسسوارات',
      slug: 'accessories',
      image_url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/shoes/accessories.jpg',
      image_public_id: 'samples/shoes/accessories',
      description: 'حقائب وإكسسوارات فاخرة',
      sort_order: 4,
    },
  ]

  const { data: insertedCats, error: catError } = await supabase
    .from('categories')
    .upsert(categories, { onConflict: 'slug' })
    .select()

  if (catError) {
    console.error('❌  Categories error:', catError.message)
  } else {
    console.log(`✅  Inserted ${insertedCats?.length || 0} categories`)
  }

  // ── Hero Slide ─────────────────────────────────────────────
  const { error: slideError } = await supabase
    .from('hero_slides')
    .upsert([
      {
        desktop_image_url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/leather-bag-gray.jpg',
        desktop_image_public_id: 'samples/ecommerce/leather-bag-gray',
        heading: 'كزورا — أناقة تبدأ من خطوتك الأولى',
        sub_text: 'اكتشف مجموعتنا المختارة من الأحذية الفاخرة',
        cta_text: 'تسوق الآن',
        cta_link: '/products',
        sort_order: 1,
        is_active: true,
      },
    ])

  if (slideError) console.error('❌  Slides error:', slideError.message)
  else console.log('✅  Hero slide added')

  console.log('\n✅  Demo data seeded. Replace image URLs with real Cloudinary uploads.\n')
}

seed().catch(console.error)
