import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://nchzkmhpxprhbcylisfm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jaHprbWhweHByaGJjeWxpc2ZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk5MzQxMCwiZXhwIjoyMDkxNTY5NDEwfQ.AMsldHEBjQ1Bh5EQ14FWHmIlTRmXbwqcW9m6KdcE-5g'
)

// كل المحافظات ما عدا حلب (توصيل فقط)
const ALL_GOVS = [
  'ريف حلب',
  'دمشق', 'ريف دمشق',
  'حمص', 'حماة',
  'اللاذقية', 'طرطوس',
  'إدلب',
  'دير الزور', 'الرقة', 'الحسكة',
  'السويداء', 'درعا', 'القنيطرة',
]

// الشركات الحقيقية وما تغطيه
const COMPANY_COVERAGE: Record<string, string[]> = {
  'kadmous':           ALL_GOVS,                   // القدموس — تغطي كل المحافظات
  'karam':             ['ريف حلب','دمشق','ريف دمشق','حمص','حماة','اللاذقية','طرطوس','إدلب','دير الزور','الرقة','الحسكة','السويداء','درعا','القنيطرة'],
  'shipping-mnxqaud0': ['ريف حلب','دمشق','ريف دمشق','حمص','حماة','اللاذقية','طرطوس','إدلب','دير الزور','الرقة','الحسكة'],
}

const FEE: Record<string, { syp: number; usd: number }> = {
  'kadmous':           { syp: 6000, usd: 3.00 },
  'karam':             { syp: 5000, usd: 2.50 },
  'shipping-mnxqaud0': { syp: 5500, usd: 2.75 },
}

// 58 مركز للمحافظات كلها (بدون حلب)
const CENTERS: { governorate: string; name: string; supported_companies: string[] }[] = [
  // ريف حلب
  { governorate: 'ريف حلب', name: 'مركز اعزاز',              supported_companies: ['kadmous', 'karam'] },
  { governorate: 'ريف حلب', name: 'مركز الباب',               supported_companies: ['shipping-mnxqaud0', 'kadmous'] },
  { governorate: 'ريف حلب', name: 'مركز جرابلس',             supported_companies: ['kadmous'] },
  { governorate: 'ريف حلب', name: 'مركز عفرين',              supported_companies: ['karam', 'shipping-mnxqaud0'] },
  { governorate: 'ريف حلب', name: 'مركز منبج',               supported_companies: ['kadmous', 'shipping-mnxqaud0'] },
  { governorate: 'ريف حلب', name: 'مركز الأتارب',            supported_companies: ['karam', 'kadmous'] },
  { governorate: 'ريف حلب', name: 'مركز تل رفعت',            supported_companies: ['kadmous'] },
  { governorate: 'ريف حلب', name: 'مركز سفيرة',              supported_companies: ['shipping-mnxqaud0', 'karam'] },
  { governorate: 'ريف حلب', name: 'مركز خان العسل',          supported_companies: ['kadmous'] },
  { governorate: 'ريف حلب', name: 'مركز مارع',               supported_companies: ['karam', 'shipping-mnxqaud0'] },
  // دمشق
  { governorate: 'دمشق', name: 'مركز الميدان',                supported_companies: ['kadmous', 'karam', 'shipping-mnxqaud0'] },
  { governorate: 'دمشق', name: 'مركز المزة',                  supported_companies: ['karam', 'kadmous'] },
  { governorate: 'دمشق', name: 'مركز برزة',                   supported_companies: ['shipping-mnxqaud0', 'kadmous'] },
  { governorate: 'دمشق', name: 'مركز جرمانا',                 supported_companies: ['karam'] },
  { governorate: 'دمشق', name: 'مركز دمر',                    supported_companies: ['kadmous', 'shipping-mnxqaud0'] },
  { governorate: 'دمشق', name: 'مركز القابون',                supported_companies: ['karam', 'kadmous'] },
  // ريف دمشق
  { governorate: 'ريف دمشق', name: 'مركز دوما',              supported_companies: ['kadmous', 'karam'] },
  { governorate: 'ريف دمشق', name: 'مركز عربين',             supported_companies: ['shipping-mnxqaud0'] },
  { governorate: 'ريف دمشق', name: 'مركز داريا',             supported_companies: ['kadmous', 'shipping-mnxqaud0'] },
  { governorate: 'ريف دمشق', name: 'مركز الزبداني',          supported_companies: ['karam', 'kadmous'] },
  { governorate: 'ريف دمشق', name: 'مركز يبرود',             supported_companies: ['kadmous'] },
  // حمص
  { governorate: 'حمص', name: 'مركز الخالدية',                supported_companies: ['kadmous', 'karam'] },
  { governorate: 'حمص', name: 'مركز الوعر',                   supported_companies: ['shipping-mnxqaud0', 'kadmous'] },
  { governorate: 'حمص', name: 'مركز تلبيسة',                 supported_companies: ['karam'] },
  { governorate: 'حمص', name: 'مركز القصير',                 supported_companies: ['kadmous', 'shipping-mnxqaud0'] },
  { governorate: 'حمص', name: 'مركز الرستن',                 supported_companies: ['kadmous'] },
  // حماة
  { governorate: 'حماة', name: 'مركز حماة المركزي',          supported_companies: ['kadmous', 'karam', 'shipping-mnxqaud0'] },
  { governorate: 'حماة', name: 'مركز السلمية',                supported_companies: ['kadmous', 'karam'] },
  { governorate: 'حماة', name: 'مركز مصياف',                 supported_companies: ['shipping-mnxqaud0'] },
  { governorate: 'حماة', name: 'مركز سوران',                 supported_companies: ['kadmous'] },
  // اللاذقية
  { governorate: 'اللاذقية', name: 'مركز اللاذقية المركزي',  supported_companies: ['kadmous', 'karam', 'shipping-mnxqaud0'] },
  { governorate: 'اللاذقية', name: 'مركز جبلة',               supported_companies: ['kadmous', 'karam'] },
  { governorate: 'اللاذقية', name: 'مركز القرداحة',            supported_companies: ['shipping-mnxqaud0'] },
  { governorate: 'اللاذقية', name: 'مركز الحفة',               supported_companies: ['kadmous'] },
  // طرطوس
  { governorate: 'طرطوس', name: 'مركز طرطوس المركزي',        supported_companies: ['kadmous', 'karam'] },
  { governorate: 'طرطوس', name: 'مركز بانياس',                supported_companies: ['shipping-mnxqaud0', 'kadmous'] },
  { governorate: 'طرطوس', name: 'مركز صافيتا',                supported_companies: ['karam'] },
  { governorate: 'طرطوس', name: 'مركز دريكيش',                supported_companies: ['kadmous'] },
  // إدلب
  { governorate: 'إدلب', name: 'مركز إدلب المركزي',          supported_companies: ['kadmous', 'shipping-mnxqaud0'] },
  { governorate: 'إدلب', name: 'مركز معرة النعمان',          supported_companies: ['karam', 'kadmous'] },
  { governorate: 'إدلب', name: 'مركز سرمين',                 supported_companies: ['kadmous'] },
  { governorate: 'إدلب', name: 'مركز جسر الشغور',            supported_companies: ['shipping-mnxqaud0'] },
  // دير الزور
  { governorate: 'دير الزور', name: 'مركز دير الزور المركزي', supported_companies: ['kadmous', 'karam'] },
  { governorate: 'دير الزور', name: 'مركز الميادين',          supported_companies: ['kadmous'] },
  { governorate: 'دير الزور', name: 'مركز البوكمال',          supported_companies: ['shipping-mnxqaud0'] },
  // الرقة
  { governorate: 'الرقة', name: 'مركز الرقة المركزي',        supported_companies: ['kadmous', 'karam'] },
  { governorate: 'الرقة', name: 'مركز تل أبيض',              supported_companies: ['kadmous'] },
  // الحسكة
  { governorate: 'الحسكة', name: 'مركز الحسكة المركزي',      supported_companies: ['kadmous', 'shipping-mnxqaud0'] },
  { governorate: 'الحسكة', name: 'مركز القامشلي',             supported_companies: ['kadmous', 'karam'] },
  { governorate: 'الحسكة', name: 'مركز المالكية',             supported_companies: ['kadmous'] },
  // السويداء
  { governorate: 'السويداء', name: 'مركز السويداء المركزي',  supported_companies: ['kadmous', 'karam'] },
  { governorate: 'السويداء', name: 'مركز شهبا',               supported_companies: ['shipping-mnxqaud0'] },
  { governorate: 'السويداء', name: 'مركز صلخد',               supported_companies: ['kadmous'] },
  // درعا
  { governorate: 'درعا', name: 'مركز درعا المركزي',           supported_companies: ['kadmous', 'karam'] },
  { governorate: 'درعا', name: 'مركز إزرع',                   supported_companies: ['kadmous'] },
  { governorate: 'درعا', name: 'مركز الصنمين',                supported_companies: ['shipping-mnxqaud0', 'kadmous'] },
  // القنيطرة
  { governorate: 'القنيطرة', name: 'مركز القنيطرة',            supported_companies: ['kadmous', 'karam'] },
  { governorate: 'القنيطرة', name: 'مركز خان أرنبة',           supported_companies: ['kadmous'] },
]

async function run() {
  // 1. جلب IDs الشركات الحقيقية
  console.log('📦 Fetching real company IDs...')
  const { data: methods, error: mErr } = await supabase
    .from('shipping_methods')
    .select('id, slug')
    .in('slug', Object.keys(COMPANY_COVERAGE))

  if (mErr || !methods?.length) {
    console.error('❌ Could not fetch companies:', mErr)
    return
  }

  const methodMap: Record<string, string> = {}
  methods.forEach(m => { methodMap[m.slug] = m.id })
  console.log('  ✅ Found:', methods.map(m => m.slug).join(', '))

  // 2. حذف تغطية المحافظات القديمة وإعادة إدراجها
  console.log('🗺️  Resetting governorate coverage...')
  await supabase.from('shipping_governorates').delete().in('method_id', Object.values(methodMap))

  const govRows: any[] = []
  for (const [slug, govList] of Object.entries(COMPANY_COVERAGE)) {
    const id = methodMap[slug]
    if (!id) continue
    for (const gov of govList) {
      govRows.push({
        method_id:        id,
        governorate_name: gov,
        fee_syp:          FEE[slug].syp,
        fee_usd:          FEE[slug].usd,
        is_active:        true,
        branch_addresses: '',
      })
    }
  }

  const { error: gErr } = await supabase.from('shipping_governorates').insert(govRows)
  if (gErr) console.error('  ⚠️', gErr.message)
  else console.log(`  ✅ ${govRows.length} governorate rows inserted`)

  // 3. حذف المراكز القديمة وإدراج الجديدة
  console.log('📍 Resetting shipping centers...')
  await supabase.from('shipping_centers').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const { error: cErr } = await supabase.from('shipping_centers').insert(CENTERS)
  if (cErr) console.error('  ⚠️', cErr.message)
  else console.log(`  ✅ ${CENTERS.length} centers inserted`)

  console.log('\n✅ All done! حلب = توصيل فقط | باقي المحافظات = شحن عبر المراكز')
}

run().catch(console.error)
