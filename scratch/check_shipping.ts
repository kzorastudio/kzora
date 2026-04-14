import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function checkDamascus() {
  const { data, error } = await supabase
    .from('shipping_centers')
    .select('*')
  
  console.log('--- ALL CENTERS ---')
  console.log(JSON.stringify(data, null, 2))
  
  const govs = Array.from(new Set((data || []).map(d => d.governorate))).sort()
  console.log('--- UNIQUE GOVERNORATES ---')
  console.log(govs)
}

checkDamascus()
