const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually read .env.local since we don't have dotenv installed as a dependency
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([^#\s]+)\s*=\s*["']?([^"'\s]+)["']?\s*$/);
      if (match) {
        process.env[match[1]] = match[2];
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables:');
  console.error('URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('Key:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BRANCHES_BY_GOV = {
  'دمشق': 'فرع البرامكة (الرئيسي)\nفرع الفحامة - شارع خالد بن الوليد\nفرع كراجات العباسيين\nفرع حي المزة - أوتوستراد المزة\nفرع مشروع دمر - السوق السكني',
  'ريف دمشق': 'فرع جرمانا - الخضر\nفرع أشرفية صحنايا - طريق عام\nفرع قدسيا - شارع الجمعيات\nفرع صحنايا - شارع الكورنيش\nفرع التل - طريق منين',
  'حلب': 'فرع الجميلية - مقابل مدرسة المأمون\nفرع الفرقان - الساحة الرئيسية\nفرع السليمانية - شارع المحطة\nفرع المحافظة - دوار المحافظة\nفرع حي الشهباء - شارع النيل',
  'ريف حلب': 'فرع السفيرة - السوق الرئيسي\nفرع منبج - طريق عام\nفرع اعزاز - المنطقة الصناعية',
  'حمص': 'فرع المحطة - مقابل جامع الزهراء\nفرع الدبلان - شارع المطاعم\nفرع كراج حماه القديم\nفرع طريق الشام - مقابل المشفى\nفرع حي الزهراء - الساحة الرئيسية',
  'حماة': 'فرع ساحة العاصي - بناء المالية\nفرع حي الشريعة - شارع المدارس\nفرع كراجات حماه - مدخل المدينة\nفرع سلمية - شارع الوادي\nفرع مصياف - الشارع العريض',
  'اللاذقية': 'فرع الكورنيش الجنوبي - طلعة المرفأ\nفرع حي الزراعة - مقابل الجامعة\nفرع المشروع السابع - قرب المشفى\nفرع كراجات جبلة - الساحة الخارجية\nفرع شارع بغداد - بناء البريد',
  'طرطوس': 'فرع الكورنيش البحري - مقابل فندق الشاطئ\nفرع بانياس - السوق المركزي\nفرع صافيتا - حي القلعة\nفرع الدريكيش - الساحة العامة',
  'إدلب': 'فرع المدينة الرئيسي - شارع الثلاثين\nفرع سلقين - حارة السوق\nفرع حارم - الساحة القديمة\nفرع سرمدا - المنطقة الحرة',
  'الحسكة': 'فرع القامشلي - شارع الوحدة\nفرع الحسكة المدينة - العزيزية\nفرع المالكية - طريق عام\nفرع عامودا - الساحة المركزية',
  'دير الزور': 'فرع شارع سينما فؤاد\nفرع حي الجورة - مقابل الحديقة العامة\nفرع الميادين\nفرع البوكمال',
  'الرقة': 'فرع المدينة - شارع المنصور\nفرع الطبقة - الشارع الرئيسي\nفرع تل أبيض',
  'السويداء': 'فرع السويداء المدينة - دوار المشنقة\nفرع شهبا - الشارع الرئيسي\nفرع صلخد - الكورنيش',
  'درعا': 'فرع درعا المحطة - قرب البريد\nفرع طفس - سوق الخضرة\nفرع إزرع\nفرع بصرى الشام',
  'القنيطرة': 'فرع مدينة البعث - الساحة العامة\nفرع خان أرنبة - طريق عام'
};

async function seed() {
  console.log('Fetching shipping governorates...');
  
  const { data: govs, error } = await supabase
    .from('shipping_governorates')
    .select('*');

  if (error) {
    console.error('Error fetching governorates:', error);
    return;
  }

  console.log(`Found ${govs.length} governorate entries. Updating branch addresses...`);

  let updatedCount = 0;
  for (const gov of govs) {
    const branches = BRANCHES_BY_GOV[gov.governorate_name];
    if (branches) {
      const { error: updateError } = await supabase
        .from('shipping_governorates')
        .update({ branch_addresses: branches })
        .eq('id', gov.id);

      if (updateError) {
        console.error(`Error updating ${gov.governorate_name}:`, updateError);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`Successfully updated ${updatedCount} governorate entries with branch addresses.`);
}

seed();
