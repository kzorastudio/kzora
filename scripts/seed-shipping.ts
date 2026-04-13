/**
 * Run: npx tsx scripts/seed-shipping.ts
 * Seeds shipping companies, governorates, and centers into Supabase.
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://nchzkmhpxprhbcylisfm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jaHprbWhweHByaGJjeWxpc2ZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk5MzQxMCwiZXhwIjoyMDkxNTY5NDEwfQ.AMsldHEBjQ1Bh5EQ14FWHmIlTRmXbwqcW9m6KdcE-5g'
)

// ─── Shipping Companies ────────────────────────────────────────────────────────
const COMPANIES = [
  { slug: 'madar',  name: 'مدار للشحن',     description: 'شبكة شحن واسعة تغطي معظم المحافظات',  badge: 'الأوسع',   sort_order: 1, is_active: true },
  { slug: 'yalla',  name: 'يلا إكسبريس',    description: 'شحن سريع وموثوق مع تتبع الشحنة',       badge: 'الأسرع',   sort_order: 2, is_active: true },
  { slug: 'flash',  name: 'فلاش للتوصيل',   description: 'خدمة شحن اقتصادية لجميع المناطق',     badge: 'اقتصادي',  sort_order: 3, is_active: true },
  { slug: 'swift',  name: 'سويفت للشحن',    description: 'شحن مضمون مع التأمين على البضاعة',     badge: 'مضمون',    sort_order: 4, is_active: true },
  { slug: 'bareed', name: 'بريد سوريا',      description: 'خدمة الشحن الحكومية الموثوقة',         badge: '',         sort_order: 5, is_active: true },
]

// Governorates each company covers
const COMPANY_GOVS: Record<string, string[]> = {
  madar:  ['ريف حلب','دمشق','ريف دمشق','حمص','حماة','اللاذقية','طرطوس','إدلب','دير الزور','الرقة','الحسكة','السويداء','درعا','القنيطرة'],
  yalla:  ['ريف حلب','دمشق','ريف دمشق','حمص','حماة','اللاذقية','طرطوس','إدلب','دير الزور','الرقة','الحسكة'],
  flash:  ['ريف حلب','دمشق','ريف دمشق','حمص','حماة','اللاذقية','طرطوس','إدلب'],
  swift:  ['ريف حلب','دمشق','ريف دمشق','حمص','اللاذقية','طرطوس'],
  bareed: ['دمشق','ريف دمشق','حمص','حماة','اللاذقية','طرطوس','السويداء','درعا','القنيطرة'],
}

const GOV_FEE: Record<string, { syp: number; usd: number }> = {
  madar:  { syp: 5000, usd: 2.50 },
  yalla:  { syp: 6000, usd: 3.00 },
  flash:  { syp: 4000, usd: 2.00 },
  swift:  { syp: 7000, usd: 3.50 },
  bareed: { syp: 3500, usd: 1.75 },
}

// ─── Centers per governorate ───────────────────────────────────────────────────
const CENTERS: { governorate: string; name: string; supported_companies: string[] }[] = [
  // ريف حلب
  { governorate: 'ريف حلب', name: 'مركز اعزاز',          supported_companies: ['yalla','flash'] },
  { governorate: 'ريف حلب', name: 'مركز الباب',           supported_companies: ['madar','yalla'] },
  { governorate: 'ريف حلب', name: 'مركز جرابلس',         supported_companies: ['madar'] },
  { governorate: 'ريف حلب', name: 'مركز عفرين',          supported_companies: ['flash','swift'] },
  { governorate: 'ريف حلب', name: 'مركز منبج',           supported_companies: ['yalla','madar'] },
  { governorate: 'ريف حلب', name: 'مركز الأتارب',        supported_companies: ['madar','flash'] },
  { governorate: 'ريف حلب', name: 'مركز تل رفعت',        supported_companies: ['madar'] },
  { governorate: 'ريف حلب', name: 'مركز سفيرة',          supported_companies: ['yalla','madar'] },
  { governorate: 'ريف حلب', name: 'مركز خان العسل',      supported_companies: ['flash'] },
  { governorate: 'ريف حلب', name: 'مركز إعزاز الشمالي', supported_companies: ['yalla'] },
  // دمشق
  { governorate: 'دمشق', name: 'مركز الميدان',           supported_companies: ['madar','yalla','bareed'] },
  { governorate: 'دمشق', name: 'مركز المزة',             supported_companies: ['flash','swift','madar'] },
  { governorate: 'دمشق', name: 'مركز الشعلان',           supported_companies: ['madar','bareed'] },
  { governorate: 'دمشق', name: 'مركز برزة',              supported_companies: ['yalla','madar'] },
  { governorate: 'دمشق', name: 'مركز جرمانا',            supported_companies: ['flash','bareed'] },
  { governorate: 'دمشق', name: 'مركز دمر',               supported_companies: ['swift','madar'] },
  // ريف دمشق
  { governorate: 'ريف دمشق', name: 'مركز دوما',          supported_companies: ['madar','yalla'] },
  { governorate: 'ريف دمشق', name: 'مركز عربين',         supported_companies: ['flash','bareed'] },
  { governorate: 'ريف دمشق', name: 'مركز داريا',         supported_companies: ['madar','swift'] },
  { governorate: 'ريف دمشق', name: 'مركز الزبداني',      supported_companies: ['bareed','madar'] },
  { governorate: 'ريف دمشق', name: 'مركز يبرود',         supported_companies: ['madar'] },
  // حمص
  { governorate: 'حمص', name: 'مركز الخالدية',           supported_companies: ['yalla','flash','madar'] },
  { governorate: 'حمص', name: 'مركز الوعر',              supported_companies: ['madar','swift'] },
  { governorate: 'حمص', name: 'مركز تلبيسة',             supported_companies: ['yalla','madar'] },
  { governorate: 'حمص', name: 'مركز القصير',             supported_companies: ['bareed','madar'] },
  { governorate: 'حمص', name: 'مركز الرستن',             supported_companies: ['flash','madar'] },
  // حماة
  { governorate: 'حماة', name: 'مركز حماة المركزي',      supported_companies: ['madar','yalla','bareed'] },
  { governorate: 'حماة', name: 'مركز السلمية',           supported_companies: ['madar','flash'] },
  { governorate: 'حماة', name: 'مركز مصياف',             supported_companies: ['bareed','madar'] },
  { governorate: 'حماة', name: 'مركز سوران',             supported_companies: ['yalla'] },
  // اللاذقية
  { governorate: 'اللاذقية', name: 'مركز اللاذقية المركزي', supported_companies: ['madar','yalla','swift','bareed'] },
  { governorate: 'اللاذقية', name: 'مركز جبلة',           supported_companies: ['madar','flash'] },
  { governorate: 'اللاذقية', name: 'مركز القرداحة',        supported_companies: ['bareed','madar'] },
  { governorate: 'اللاذقية', name: 'مركز الحفة',           supported_companies: ['madar'] },
  // طرطوس
  { governorate: 'طرطوس', name: 'مركز طرطوس المركزي',    supported_companies: ['madar','yalla','bareed'] },
  { governorate: 'طرطوس', name: 'مركز بانياس',            supported_companies: ['flash','madar'] },
  { governorate: 'طرطوس', name: 'مركز صافيتا',            supported_companies: ['bareed','swift'] },
  { governorate: 'طرطوس', name: 'مركز دريكيش',            supported_companies: ['madar'] },
  // إدلب
  { governorate: 'إدلب', name: 'مركز إدلب المركزي',      supported_companies: ['madar','yalla'] },
  { governorate: 'إدلب', name: 'مركز معرة النعمان',      supported_companies: ['flash','madar'] },
  { governorate: 'إدلب', name: 'مركز سرمين',             supported_companies: ['yalla'] },
  { governorate: 'إدلب', name: 'مركز جسر الشغور',        supported_companies: ['madar'] },
  // دير الزور
  { governorate: 'دير الزور', name: 'مركز دير الزور المركزي', supported_companies: ['madar','yalla'] },
  { governorate: 'دير الزور', name: 'مركز الميادين',      supported_companies: ['madar'] },
  { governorate: 'دير الزور', name: 'مركز البوكمال',      supported_companies: ['yalla'] },
  // الرقة
  { governorate: 'الرقة', name: 'مركز الرقة المركزي',    supported_companies: ['madar','yalla'] },
  { governorate: 'الرقة', name: 'مركز تل أبيض',          supported_companies: ['madar'] },
  // الحسكة
  { governorate: 'الحسكة', name: 'مركز الحسكة المركزي',  supported_companies: ['madar','yalla'] },
  { governorate: 'الحسكة', name: 'مركز القامشلي',         supported_companies: ['madar','yalla'] },
  { governorate: 'الحسكة', name: 'مركز المالكية',         supported_companies: ['madar'] },
  // السويداء
  { governorate: 'السويداء', name: 'مركز السويداء المركزي', supported_companies: ['madar','bareed'] },
  { governorate: 'السويداء', name: 'مركز شهبا',            supported_companies: ['bareed'] },
  { governorate: 'السويداء', name: 'مركز صلخد',            supported_companies: ['madar'] },
  // درعا
  { governorate: 'درعا', name: 'مركز درعا المركزي',       supported_companies: ['madar','bareed'] },
  { governorate: 'درعا', name: 'مركز إزرع',               supported_companies: ['madar'] },
  { governorate: 'درعا', name: 'مركز الصنمين',            supported_companies: ['bareed','madar'] },
  // القنيطرة
  { governorate: 'القنيطرة', name: 'مركز القنيطرة',        supported_companies: ['bareed','madar'] },
  { governorate: 'القنيطرة', name: 'مركز خان أرنبة',       supported_companies: ['madar'] },
]

async function seed() {
  console.log('🚀 Starting shipping data seed...\n')

  // 1. Upsert companies
  console.log('📦 Upserting shipping companies...')
  const { error: companyErr } = await supabase
    .from('shipping_methods')
    .upsert(COMPANIES, { onConflict: 'slug', ignoreDuplicates: false })

  if (companyErr) {
    console.error('❌ Company upsert error:', companyErr)
  } else {
    console.log(`   ✅ ${COMPANIES.length} companies seeded`)
  }

  // 2. Fetch inserted companies to get their IDs
  const { data: methods, error: fetchErr } = await supabase
    .from('shipping_methods')
    .select('id, slug')

  if (fetchErr || !methods) {
    console.error('❌ Failed to fetch methods:', fetchErr)
    return
  }

  const methodMap: Record<string, string> = {}
  methods.forEach(m => { methodMap[m.slug] = m.id })

  // 3. Upsert governorate coverage
  console.log('🗺️  Upserting governorate coverage...')
  const govRows: any[] = []
  for (const [slug, govList] of Object.entries(COMPANY_GOVS)) {
    const methodId = methodMap[slug]
    if (!methodId) continue
    for (const gov of govList) {
      govRows.push({
        method_id: methodId,
        governorate_name: gov,
        fee_syp: GOV_FEE[slug].syp,
        fee_usd: GOV_FEE[slug].usd,
        is_active: true,
        branch_addresses: '',
      })
    }
  }

  // Clear existing governorate coverage and re-insert
  const methodIds = Object.values(methodMap)
  await supabase.from('shipping_governorates').delete().in('method_id', methodIds)

  // Insert in batches
  for (let i = 0; i < govRows.length; i += 50) {
    const batch = govRows.slice(i, i + 50)
    const { error } = await supabase
      .from('shipping_governorates')
      .insert(batch)
    if (error) console.error('   ⚠️  Gov batch error:', error.message)
  }
  console.log(`   ✅ ${govRows.length} governorate entries seeded`)

  // 4. Upsert shipping centers
  console.log('📍 Upserting shipping centers...')

  // Clear existing centers first to avoid duplicates
  const { error: delErr } = await supabase
    .from('shipping_centers')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // delete all

  if (delErr) console.error('   ⚠️  Clear centers error:', delErr.message)

  const { error: centersErr } = await supabase
    .from('shipping_centers')
    .insert(CENTERS)

  if (centersErr) {
    console.error('❌ Centers insert error:', centersErr)
  } else {
    console.log(`   ✅ ${CENTERS.length} centers seeded`)
  }

  console.log('\n✅ Shipping data seed complete!')
}

seed().catch(console.error)
