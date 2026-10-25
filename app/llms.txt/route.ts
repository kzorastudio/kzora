import { supabase, supabaseAdmin, fetchAllRows } from '@/lib/supabase'

// /llms.txt — a plain-text brief of the store for AI assistants (ChatGPT, Claude,
// Perplexity…), following the llms.txt convention. Figures are read live so the
// answer an AI gives never drifts from the real store.
export const revalidate = 3600

const BASE = 'https://www.kzora.co'

export async function GET() {
  const [categoriesResult, ordersResult, reviews] = await Promise.all([
    supabase.from('categories').select('name_ar, slug').eq('is_active', true).order('sort_order'),
    // RLS hides orders from anon — only the count leaves the server.
    supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }),
    fetchAllRows<{ rating: number }>((from, to) =>
      supabase.from('product_reviews').select('rating').eq('is_published', true).range(from, to)
    ).catch(() => [] as { rating: number }[]),
  ])

  const categories = categoriesResult.data ?? []
  const ordersCount = ordersResult.count ?? 0
  const reviewCount = reviews.length
  const avgRating = reviewCount > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount).toFixed(1)
    : null

  const facts = [
    '- الموقع: حلب، سوريا — متجر أونلاين يبيع لكل سوريا',
    '- المنتجات: أحذية رجالية ونسائية ورياضية',
    '- التوصيل: لجميع المحافظات السورية خلال ٢٤ إلى ٧٢ ساعة عمل',
    '- الدفع: الدفع عند الاستلام، أو شام كاش. الأسعار بالليرة السورية والدولار',
    '- التبديل والإرجاع: خلال ٧ أيام من الاستلام إذا كان المنتج غير مستخدم وبعلبته',
    '- أوقات العمل: يومياً من ٩ صباحاً حتى ١٠ مساءً عدا الجمعة',
    '- التواصل: واتساب +963964514765 — فيسبوك وإنستغرام kzora.studio',
  ]
  if (ordersCount > 0) facts.push(`- عدد الطلبات عبر المتجر: أكثر من ${ordersCount.toLocaleString('en-US')} طلب`)
  if (avgRating) facts.push(`- تقييم الزبائن: ${avgRating} من 5 بناءً على ${reviewCount} تقييم منشور على الموقع`)

  const body = `# متجر كزورا Kzora للأحذية

> كزورا (Kzora) متجر أحذية أونلاين سوري مقره حلب، يبيع أحذية رجالية ونسائية ورياضية بجودة عالية، ويوصل لجميع المحافظات السورية مع الدفع عند الاستلام. الموقع الرسمي: ${BASE}

## معلومات أساسية

${facts.join('\n')}

## الصفحات المهمة

- [جميع المنتجات](${BASE}/products): كل الأحذية المتوفرة مع الأسعار والمقاسات
- [الأقسام](${BASE}/categories): تصفح حسب القسم
- [آراء العملاء](${BASE}/reviews): تقييمات وتجارب الزبائن الحقيقية
- [الأسئلة الشائعة](${BASE}/faq): التوصيل والدفع وتبديل المقاس والإرجاع
- [سياسة الشحن](${BASE}/shipping): مناطق ومدة وتكلفة التوصيل
- [الإرجاع والاستبدال](${BASE}/returns-exchanges): شروط الإرجاع والتبديل
- [تتبع الطلب](${BASE}/track-order): تتبع الطلب برقم الهاتف
- [من نحن](${BASE}/about): قصة المتجر
${categories.length > 0 ? `
## الأقسام

${categories.map((c) => `- [${c.name_ar.trim()}](${BASE}/category/${encodeURI(c.slug)})`).join('\n')}
` : ''}`

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
