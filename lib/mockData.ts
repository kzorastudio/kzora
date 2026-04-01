import type { Category, ProductFull, HeroSlide, HomepageSettings } from '@/types'

// ─── Mock Categories ───────────────────────────────────────────────────────────
export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name_ar: 'أحذية رجالية',
    slug: 'mens-shoes',
    image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1000&auto=format&fit=crop',
    image_public_id: 'mock/mens',
    description: 'تشكيلة فاخرة من الأحذية الرجالية الرسمية واليومية',
    sort_order: 1,
    is_active: true,
    show_in_header: true,
    show_in_footer: true,
    show_in_home: true,
    header_order: 1,
    footer_order: 1,
    home_order: 1,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-2',
    name_ar: 'أحذية نسائية',
    slug: 'womens-shoes',
    image_url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=1000&auto=format&fit=crop',
    image_public_id: 'mock/womens',
    description: 'تصاميم راقية تجمع بين الأناقة والراحة لكل مناسبة',
    sort_order: 2,
    is_active: true,
    show_in_header: true,
    show_in_footer: true,
    show_in_home: true,
    header_order: 2,
    footer_order: 2,
    home_order: 2,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-3',
    name_ar: 'أحذية رياضية',
    slug: 'sport',
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop',
    image_public_id: 'mock/sport',
    description: 'أداء عالي وتصاميم عصرية للرياضة والاستخدام اليومي',
    sort_order: 3,
    is_active: true,
    show_in_header: true,
    show_in_footer: true,
    show_in_home: true,
    header_order: 3,
    footer_order: 3,
    home_order: 3,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-4',
    name_ar: 'إكسسوارات',
    slug: 'accessories',
    image_url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=1000&auto=format&fit=crop',
    image_public_id: 'mock/acc',
    description: 'حقائب جلدية وإكسسوارات فاخرة تكمل إطلالتك',
    sort_order: 4,
    is_active: true,
    show_in_header: true,
    show_in_footer: true,
    show_in_home: true,
    header_order: 4,
    footer_order: 4,
    home_order: 4,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
]

// ─── Color & Image Mapping for Mocking ──────────────────────────────────────────
const COLOR_IMAGES: Record<string, string[]> = {
  'أسود': [
    'https://images.unsplash.com/photo-1449241513240-023b6320509a?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1560343090-f0409e92791a?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=800&auto=format&fit=crop',
  ],
  'بني': [
    'https://images.unsplash.com/photo-1533867617858-e7b97e060509?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1512466695117-99238692794c?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=800&auto=format&fit=crop',
  ],
  'عاجي': [
    'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1514989940723-e8e51635b782?q=80&w=800&auto=format&fit=crop',
  ]
}

// ─── Mock Products ─────────────────────────────────────────────────────────────
function makeProduct(
  id: string,
  name: string,
  slug: string,
  categoryId: string,
  priceSyp: number,
  priceUsd: number,
  tags: ('new' | 'best_seller' | 'on_sale')[],
  mainImg: string,
  discountSyp?: number,
  discountUsd?: number,
): ProductFull {
  const category = MOCK_CATEGORIES.find(c => c.id === categoryId) ?? null
  
  const colors = [
    { id: `col-${id}-1`, product_id: id, name_ar: 'أسود',  hex_code: '#1A1A1A', swatch_url: null, swatch_public_id: null, is_available: true },
    { id: `col-${id}-2`, product_id: id, name_ar: 'بني',   hex_code: '#5D4037', swatch_url: null, swatch_public_id: null, is_available: true },
    { id: `col-${id}-3`, product_id: id, name_ar: 'عاجي',  hex_code: '#F5F5DC', swatch_url: null, swatch_public_id: null, is_available: true },
  ]

  // Mocking image per color
  const allImages = [
    {
      id: `img-${id}-main`,
      product_id: id,
      url: mainImg,
      public_id: `mock/${id}-main`,
      color_variant: null,
      is_main: true,
      display_order: 0,
      created_at: '2026-01-01T00:00:00.000Z',
    },
    ...colors.flatMap(c => (COLOR_IMAGES[c.name_ar] || []).map((url, idx) => ({
      id: `img-${id}-${c.name_ar}-${idx}`,
      product_id: id,
      url,
      public_id: `mock/${id}-${c.name_ar}-${idx}`,
      color_variant: c.name_ar, // Link to color name for demo filtering
      is_main: false,
      display_order: idx + 1,
      created_at: '2026-01-01T00:00:00.000Z',
    })))
  ]

  return {
    id,
    name,
    slug,
    description: `<p>نقدم لك هذا المنتج من كزورا بتصميم يجمع بين الأصالة والحداثة. صُنع يدوياً من جلود طبيعية فائقة الجودة لضمان أقصى درجات الراحة طوال اليوم.</p><p>المميزات:<br/>• بطانة داخلية مريحة<br/>• نعل خارجي مقاوم للانزلاق<br/>• تهوية مثالية للقدم</p>`,
    category_id: categoryId,
    price_syp: priceSyp,
    price_usd: priceUsd,
    discount_price_syp: discountSyp ?? null,
    discount_price_usd: discountUsd ?? null,
    stock_status: 'in_stock',
    is_featured: tags.includes('best_seller'),
    is_published: true,
    sort_order: 0,
    view_count: 250,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    images: allImages,
    colors,
    sizes: [
      { size: 39, is_available: true },
      { size: 40, is_available: true },
      { size: 41, is_available: true },
      { size: 42, is_available: true },
      { size: 43, is_available: true },
      { size: 44, is_available: true },
      { size: 45, is_available: true }
    ],
    tags,
    category,
    variants: [],
    mold_type: 'normal',
  }
}

export const MOCK_PRODUCTS: ProductFull[] = [
  // ═══ أحذية رجالية (cat-1) — 12 منتج ═══════════════════════════════════════
  makeProduct('p1',  'حذاء كلاسيكي برونزي',       'classic-bronze',       'cat-1', 285000, 78,  ['new', 'best_seller'], 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=800&auto=format&fit=crop'),
  makeProduct('p2',  'لوفر جلدي إيطالي',           'italian-loafer',       'cat-1', 225000, 62,  ['new', 'best_seller'], 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop'),
  makeProduct('p3',  'بوت تشيلسي شتوي',           'winter-chelsea',       'cat-1', 345000, 95,  ['best_seller'],        'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=800&auto=format&fit=crop'),
  makeProduct('p16', 'حذاء رسمي أكسفورد',         'oxford-formal-v2',     'cat-1', 310000, 85,  ['on_sale'],            'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&auto=format&fit=crop', 260000, 72),
  makeProduct('m5',  'حذاء موكاسين فاخر',         'luxury-moccasin',      'cat-1', 265000, 73,  ['new'],                'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800&auto=format&fit=crop'),
  makeProduct('m6',  'حذاء ديربي جلد طبيعي',      'derby-natural',        'cat-1', 295000, 81,  ['best_seller'],        'https://images.unsplash.com/photo-1449241513240-023b6320509a?w=800&auto=format&fit=crop'),
  makeProduct('m7',  'حذاء سليب أون أنيق',        'slip-on-elegant',      'cat-1', 175000, 48,  ['on_sale'],            'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&auto=format&fit=crop', 140000, 39),
  makeProduct('m8',  'بوت جلد بقري متين',          'cowhide-boot',         'cat-1', 380000, 105, ['new', 'best_seller'], 'https://images.unsplash.com/photo-1605733513597-a8f8341084e6?w=800&auto=format&fit=crop'),
  makeProduct('m9',  'حذاء كاجوال يومي',           'daily-casual',         'cat-1', 155000, 43,  ['on_sale'],            'https://images.unsplash.com/photo-1512466695117-99238692794c?w=800&auto=format&fit=crop', 125000, 35),
  makeProduct('m10', 'حذاء مونك ستراب مزدوج',      'double-monk',          'cat-1', 330000, 91,  ['new'],                'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&auto=format&fit=crop'),
  makeProduct('m11', 'حذاء بروغ بريطاني',          'british-brogue',       'cat-1', 300000, 82,  ['best_seller'],        'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&auto=format&fit=crop'),
  makeProduct('m12', 'حذاء صحراوي شمواه',          'desert-suede',         'cat-1', 240000, 66,  ['on_sale', 'new'],     'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800&auto=format&fit=crop', 195000, 54),

  // ═══ أحذية نسائية (cat-2) — 12 منتج ═══════════════════════════════════════
  makeProduct('p5',  'حذاء كعب عالي ملكي',         'royal-heels',          'cat-2', 195000, 54,  ['new', 'best_seller'], 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop'),
  makeProduct('p6',  'صندل صيفي مرصع',             'jeweled-sandal',       'cat-2', 155000, 43,  ['on_sale'],            'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop', 125000, 35),
  makeProduct('p7',  'بوت نسائي طويل',             'womens-tall-boot',     'cat-2', 320000, 88,  ['new'],                'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop'),
  makeProduct('p8',  'حذاء فلات مريح',             'casual-flat',          'cat-2', 145000, 40,  ['best_seller', 'on_sale'], 'https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?w=800&auto=format&fit=crop', 115000, 32),
  makeProduct('w5',  'حذاء بالرينا وردي',          'pink-ballerina',       'cat-2', 120000, 33,  ['new'],                'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800&auto=format&fit=crop'),
  makeProduct('w6',  'كعب ستيليتو ذهبي',           'gold-stiletto',        'cat-2', 275000, 76,  ['best_seller'],        'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&auto=format&fit=crop'),
  makeProduct('w7',  'صندل جلدي مسطح',             'flat-leather-sandal',  'cat-2', 135000, 37,  ['on_sale'],            'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800&auto=format&fit=crop', 110000, 30),
  makeProduct('w8',  'حذاء لوفر نسائي أنيق',       'womens-loafer',        'cat-2', 185000, 51,  ['new', 'best_seller'], 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop'),
  makeProduct('w9',  'حذاء ويدج كاجوال',           'wedge-casual',         'cat-2', 210000, 58,  ['on_sale', 'best_seller'], 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop', 175000, 48),
  makeProduct('w10', 'بوت كاحل بسحاب',             'ankle-zip-boot',       'cat-2', 260000, 72,  ['new'],                'https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?w=800&auto=format&fit=crop'),
  makeProduct('w11', 'حذاء مزين بالكريستال',      'crystal-heels',        'cat-2', 350000, 96,  ['best_seller'],        'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&auto=format&fit=crop'),
  makeProduct('w12', 'صندل بلاتفورم صيفي',         'platform-summer',      'cat-2', 165000, 45,  ['on_sale', 'new'],     'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800&auto=format&fit=crop', 130000, 36),

  // ═══ أحذية رياضية (cat-3) — 12 منتج ════════════════════════════════════════
  makeProduct('p9',  'حذاء رياضي الترا',           'ultra-sport',          'cat-3', 245000, 68,  ['new', 'best_seller'], 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop'),
  makeProduct('p10', 'حذاء ركض احترافي',           'pro-running',          'cat-3', 210000, 58,  ['new', 'on_sale'],     'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&auto=format&fit=crop', 170000, 48),
  makeProduct('p11', 'سنيكرز عصري أبيض',           'modern-white-snk',     'cat-3', 185000, 52,  ['on_sale'],            'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop', 160000, 45),
  makeProduct('s4',  'حذاء كرة سلة عالي',          'basketball-high',      'cat-3', 290000, 80,  ['best_seller'],        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop'),
  makeProduct('s5',  'حذاء مشي مريح جداً',        'comfort-walk',         'cat-3', 165000, 45,  ['new'],                'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&auto=format&fit=crop'),
  makeProduct('s6',  'حذاء تدريب متعدد',           'cross-training',       'cat-3', 220000, 61,  ['on_sale', 'best_seller'], 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop', 185000, 51),
  makeProduct('s7',  'حذاء ركض تريل',              'trail-runner',         'cat-3', 275000, 76,  ['new', 'best_seller'], 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop'),
  makeProduct('s8',  'سنيكرز ريترو ملون',          'retro-sneaker',        'cat-3', 195000, 54,  ['on_sale'],            'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&auto=format&fit=crop', 155000, 43),
  makeProduct('s9',  'حذاء تنس احترافي',           'pro-tennis',           'cat-3', 310000, 85,  ['best_seller'],        'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&auto=format&fit=crop'),
  makeProduct('s10', 'حذاء كاجوال رياضي',          'sport-casual',         'cat-3', 145000, 40,  ['new', 'on_sale'],     'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop', 120000, 33),
  makeProduct('s11', 'حذاء هايكنج جبلي',           'hiking-mountain',      'cat-3', 340000, 93,  ['new'],                'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop'),
  makeProduct('s12', 'سنيكرز سكيتشرز مرن',         'flex-skechers',        'cat-3', 175000, 48,  ['on_sale', 'best_seller'], 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&auto=format&fit=crop', 140000, 39),

  // ═══ إكسسوارات (cat-4) — 12 منتج ═══════════════════════════════════════════
  makeProduct('p12', 'حقيبة يد جلدية',             'leather-bag-lux',      'cat-4', 420000, 115, ['best_seller'],        'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&auto=format&fit=crop'),
  makeProduct('p13', 'محفظة كزورا الفاخرة',        'kzora-wallet',         'cat-4', 95000,  26,  ['new'],                'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop'),
  makeProduct('p14', 'حزام كلاسيكي أسود',           'classic-belt',         'cat-4', 85000,  23,  ['best_seller', 'on_sale'], 'https://images.unsplash.com/photo-1624222247344-3151893ed61c?w=800&auto=format&fit=crop', 65000, 18),
  makeProduct('a4',  'حقيبة ظهر جلدية',            'leather-backpack',     'cat-4', 380000, 104, ['new', 'best_seller'], 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&auto=format&fit=crop'),
  makeProduct('a5',  'محفظة بطاقات صغيرة',        'card-holder',          'cat-4', 55000,  15,  ['new'],                'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop'),
  makeProduct('a6',  'حزام مزدوج الوجه',            'reversible-belt',      'cat-4', 110000, 30,  ['on_sale'],            'https://images.unsplash.com/photo-1624222247344-3151893ed61c?w=800&auto=format&fit=crop', 85000, 23),
  makeProduct('a7',  'حقيبة كروس بودي',            'crossbody-bag',        'cat-4', 285000, 78,  ['best_seller'],        'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&auto=format&fit=crop'),
  makeProduct('a8',  'محفظة سفر كبيرة',           'travel-wallet',        'cat-4', 145000, 40,  ['on_sale', 'new'],     'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop', 115000, 32),
  makeProduct('a9',  'حقيبة لابتوب جلدية',        'laptop-bag',           'cat-4', 490000, 135, ['new', 'best_seller'], 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&auto=format&fit=crop'),
  makeProduct('a10', 'حزام منقوش فاخر',            'engraved-belt',        'cat-4', 125000, 34,  ['best_seller'],        'https://images.unsplash.com/photo-1624222247344-3151893ed61c?w=800&auto=format&fit=crop'),
  makeProduct('a11', 'حقيبة يد صغيرة سهرة',       'clutch-evening',       'cat-4', 230000, 63,  ['on_sale', 'best_seller'], 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&auto=format&fit=crop', 190000, 52),
  makeProduct('a12', 'محفظة عملات معدنية',         'coin-purse',           'cat-4', 65000,  18,  ['new', 'on_sale'],     'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop', 50000, 14),
]

// ─── Mock Hero Slides ──────────────────────────────────────────────────────────
export const MOCK_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    desktop_image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=2000&auto=format&fit=crop',
    desktop_image_public_id: 'mock/hero1',
    mobile_image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1000&auto=format&fit=crop',
    mobile_image_public_id: 'mock/hero1m',
    heading: 'أناقة لا تضاهى — لكل خطوة مقام',
    sub_text: 'اكتشف مجموعتنا المختارة من الأحذية الكلاسيكية الفاخرة، صُنعت بشغف من أجود أنواع الجلود الإيطالية.',
    cta_text: 'تصفح التشكيلة الجديدة',
    cta_link: '/products?tag=new',
    sort_order: 1,
    is_active: true,
    heading_color: '#1A1A1A',
    accent_color: '#785600',
    subtext_color: '#4A4742',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'slide-2',
    desktop_image_url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=2000&auto=format&fit=crop',
    desktop_image_public_id: 'mock/hero2',
    mobile_image_url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=1000&auto=format&fit=crop',
    mobile_image_public_id: 'mock/hero2m',
    heading: 'الراحة العصرية — تصميم ينبض بالحرية',
    sub_text: 'تصاميم سنيكرز حصرية تجمع بين الأداء الرياضي الممتاز واللمسة الفنية التي تليق بكل أوقاتك.',
    cta_text: 'اكتشف الرياضي',
    cta_link: '/category/sport',
    sort_order: 2,
    is_active: true,
    heading_color: '#1A1A1A',
    accent_color: '#785600',
    subtext_color: '#4A4742',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
]

// ─── Mock Homepage Settings ────────────────────────────────────────────────────
export const MOCK_HOMEPAGE_SETTINGS: HomepageSettings = {
  id: '00000000-0000-0000-0000-000000000001',
  promo_banner_url: null,
  promo_banner_public_id: null,
  promo_banner_link: null,
  promo_banner_active: false,
  section_categories: true,
  section_new_arrivals: true,
  section_best_sellers: true,
  section_promo_banner: false,
  section_offers: true,
  promo_banner_heading: 'عروض الموسم بدأت',
  promo_banner_subtext: 'خصومات تصل إلى 50% على تشكيلة الربيع الحصرية',
  promo_banner_button_text: 'تسوقي الآن',
  section_stats: true,
  stat_customers_count: '5000+',
  stat_satisfaction_rate: '99%',
  stat_returns_count: '1%',
  stat_exchanges_count: '2%',
  shipping_policy: 'توصيل سريع لكافة المحافظات',
  return_policy: 'تبديل وإرجاع سهل خلال 14 يوماً',
  hero_badge_text: 'تشكيلة كزورا الفاخرة ٢٠٢٦',
  hero_badge_color: '#785600',
  sham_cash_enabled: false,
  sham_cash_number: null,
  sham_cash_image_url: null,
  sham_cash_public_id: null,
  sham_cash_instructions: null,
  discount_multi_items_enabled: false,
  discount_2_items_syp: 2000,
  discount_3_items_plus_syp: 3000,
  shipping_fee_1_piece_syp: 0,
  shipping_fee_1_piece_usd: 0,
  shipping_fee_2_pieces_syp: 0,
  shipping_fee_2_pieces_usd: 0,
  shipping_fee_3_plus_pieces_syp: 0,
  shipping_fee_3_plus_pieces_usd: 0,
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
export function getMockProductsByTag(tag: string, limit = 8): ProductFull[] {
  return MOCK_PRODUCTS.filter(p => p.tags.includes(tag as 'new' | 'best_seller' | 'on_sale')).slice(0, limit)
}

export function getMockProductsByCategory(categorySlug: string, limit = 20): ProductFull[] {
  const cat = MOCK_CATEGORIES.find(c => c.slug === categorySlug)
  if (!cat) return []
  return MOCK_PRODUCTS.filter(p => p.category_id === cat.id).slice(0, limit)
}

export function getMockProductBySlug(slug: string): ProductFull | null {
  return MOCK_PRODUCTS.find(p => p.slug === slug) ?? null
}

// ─── Mock Orders (full OrderFull shape) ──────────────────────────────────────
export const MOCK_ORDERS: any[] = [
  {
    id: 'ord-1',
    order_number: 'KZ-1001',
    customer_full_name: 'محمد العبدالله',
    customer_phone: '+963 933 445 566',
    customer_governorate: 'دمشق',
    customer_address: 'المزة، شارع الجلاء، بناية 42',
    shipping_company: 'karam',
    coupon_code: null,
    discount_amount_syp: 0,
    discount_amount_usd: 0,
    subtotal_syp: 285000,
    subtotal_usd: 78,
    total_syp: 285000,
    total_usd: 78,
    currency_used: 'SYP',
    status: 'pending',
    notes: null,
    created_at: '2026-03-28T12:00:00.000Z',
    updated_at: '2026-03-28T12:00:00.000Z',
    items: [
      { id: 'itm-1', order_id: 'ord-1', product_id: 'p1', product_name: 'حذاء كلاسيكي برونزي', product_image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=800&auto=format&fit=crop', color: 'أسود', size: '42', quantity: 1, unit_price_syp: 285000, unit_price_usd: 78 },
    ],
    status_history: [
      { id: 'sh-1-1', order_id: 'ord-1', status: 'pending', changed_at: '2026-03-28T12:00:00.000Z' },
    ],
  },
  {
    id: 'ord-2',
    order_number: 'KZ-1002',
    customer_full_name: 'سارة الحمصي',
    customer_phone: '+963 944 112 233',
    customer_governorate: 'حلب',
    customer_address: 'حي الشهباء، شارع النيل، بناية السلام',
    shipping_company: 'qadmous',
    coupon_code: 'KZORA10',
    discount_amount_syp: 42000,
    discount_amount_usd: 11,
    subtotal_syp: 420000,
    subtotal_usd: 115,
    total_syp: 378000,
    total_usd: 104,
    currency_used: 'SYP',
    status: 'confirmed',
    notes: 'الرجاء الاتصال قبل التوصيل',
    created_at: '2026-03-27T00:00:00.000Z',
    updated_at: '2026-03-27T01:00:00.000Z',
    items: [
      { id: 'itm-2', order_id: 'ord-2', product_id: 'p12', product_name: 'حقيبة يد جلدية', product_image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&auto=format&fit=crop', color: 'بني', size: null, quantity: 1, unit_price_syp: 420000, unit_price_usd: 115 },
    ],
    status_history: [
      { id: 'sh-2-1', order_id: 'ord-2', status: 'pending',   changed_at: '2026-03-27T00:00:00.000Z' },
      { id: 'sh-2-2', order_id: 'ord-2', status: 'confirmed', changed_at: '2026-03-27T01:00:00.000Z' },
    ],
  },
  {
    id: 'ord-3',
    order_number: 'KZ-1003',
    customer_full_name: 'أحمد الخطيب',
    customer_phone: '+963 999 888 777',
    customer_governorate: 'اللاذقية',
    customer_address: 'المشروع العاشر، جانب صيدلية الهدى',
    shipping_company: 'masarat',
    coupon_code: null,
    discount_amount_syp: 0,
    discount_amount_usd: 0,
    subtotal_syp: 210000,
    subtotal_usd: 58,
    total_syp: 210000,
    total_usd: 58,
    currency_used: 'SYP',
    status: 'shipped',
    notes: null,
    created_at: '2026-03-26T00:00:00.000Z',
    updated_at: '2026-03-27T00:00:00.000Z',
    items: [
      { id: 'itm-3', order_id: 'ord-3', product_id: 'p9', product_name: 'حذاء رياضي الترا', product_image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop', color: 'أسود', size: '41', quantity: 1, unit_price_syp: 210000, unit_price_usd: 58 },
    ],
    status_history: [
      { id: 'sh-3-1', order_id: 'ord-3', status: 'pending',   changed_at: '2026-03-26T00:00:00.000Z' },
      { id: 'sh-3-2', order_id: 'ord-3', status: 'confirmed', changed_at: '2026-03-26T08:00:00.000Z' },
      { id: 'sh-3-3', order_id: 'ord-3', status: 'shipped',   changed_at: '2026-03-27T00:00:00.000Z' },
    ],
  },
  {
    id: 'ord-4',
    order_number: 'KZ-1004',
    customer_full_name: 'نور الشام',
    customer_phone: '+963 955 667 788',
    customer_governorate: 'حمص',
    customer_address: 'شارع الحضارة، مقابل مدرسة الشريف',
    shipping_company: 'karam',
    coupon_code: null,
    discount_amount_syp: 0,
    discount_amount_usd: 0,
    subtotal_syp: 155000,
    subtotal_usd: 43,
    total_syp: 155000,
    total_usd: 43,
    currency_used: 'SYP',
    status: 'delivered',
    notes: null,
    created_at: '2026-03-25T00:00:00.000Z',
    updated_at: '2026-03-26T00:00:00.000Z',
    items: [
      { id: 'itm-4', order_id: 'ord-4', product_id: 'p5', product_name: 'حذاء كعب عالي ملكي', product_image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop', color: 'عاجي', size: '38', quantity: 1, unit_price_syp: 155000, unit_price_usd: 43 },
    ],
    status_history: [
      { id: 'sh-4-1', order_id: 'ord-4', status: 'pending',   changed_at: '2026-03-25T00:00:00.000Z' },
      { id: 'sh-4-2', order_id: 'ord-4', status: 'confirmed', changed_at: '2026-03-25T06:00:00.000Z' },
      { id: 'sh-4-3', order_id: 'ord-4', status: 'shipped',   changed_at: '2026-03-25T12:00:00.000Z' },
      { id: 'sh-4-4', order_id: 'ord-4', status: 'delivered', changed_at: '2026-03-26T00:00:00.000Z' },
    ],
  },
  {
    id: 'ord-5',
    order_number: 'KZ-1005',
    customer_full_name: 'خالد المنصور',
    customer_phone: '+963 911 223 344',
    customer_governorate: 'دير الزور',
    customer_address: 'حي الجورة، شارع الوادي',
    shipping_company: 'karam',
    coupon_code: null,
    discount_amount_syp: 0,
    discount_amount_usd: 0,
    subtotal_syp: 630000,
    subtotal_usd: 173,
    total_syp: 630000,
    total_usd: 173,
    currency_used: 'SYP',
    status: 'cancelled',
    notes: 'العميل طلب الإلغاء',
    created_at: '2026-03-24T00:00:00.000Z',
    updated_at: '2026-03-24T12:00:00.000Z',
    items: [
      { id: 'itm-5a', order_id: 'ord-5', product_id: 'p1',  product_name: 'حذاء كلاسيكي برونزي', product_image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=800&auto=format&fit=crop', color: 'بني', size: '43', quantity: 1, unit_price_syp: 285000, unit_price_usd: 78 },
      { id: 'itm-5b', order_id: 'ord-5', product_id: 'p14', product_name: 'حزام كلاسيكي أسود',  product_image: 'https://images.unsplash.com/photo-1624222247344-3151893ed61c?w=800&auto=format&fit=crop', color: 'أسود', size: null, quantity: 2, unit_price_syp: 65000,  unit_price_usd: 18 },
    ],
    status_history: [
      { id: 'sh-5-1', order_id: 'ord-5', status: 'pending',   changed_at: '2026-03-24T00:00:00.000Z' },
      { id: 'sh-5-2', order_id: 'ord-5', status: 'cancelled', changed_at: '2026-03-24T12:00:00.000Z' },
    ],
  },
]

export function getMockOrderById(id: string) {
  return MOCK_ORDERS.find(o => o.id === id) ?? null
}

// ─── Mock Coupons ─────────────────────────────────────────────────────────────
export const MOCK_COUPONS: any[] = [
  { id: 'coup-1', code: 'KZORA10',   type: 'percentage',   value: 10,     min_order_syp: 0,      max_uses: null, used_count: 47,  expires_at: null,                        is_active: true,  auto_generated: false, created_at: '2026-02-26T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' },
  { id: 'coup-2', code: 'WELCOME15', type: 'percentage',   value: 15,     min_order_syp: 100000, max_uses: 200,  used_count: 88,  expires_at: '2026-04-27T00:00:00.000Z', is_active: true,  auto_generated: false, created_at: '2026-03-13T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' },
  { id: 'coup-3', code: 'SAVE50K',   type: 'fixed_amount', value: 50000,  min_order_syp: 200000, max_uses: 50,   used_count: 50,  expires_at: '2026-03-27T00:00:00.000Z', is_active: false, auto_generated: false, created_at: '2026-03-18T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' },
  { id: 'coup-4', code: 'SUMMER25',  type: 'percentage',   value: 25,     min_order_syp: 300000, max_uses: 100,  used_count: 23,  expires_at: '2026-05-27T00:00:00.000Z', is_active: true,  auto_generated: false, created_at: '2026-03-23T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' },
  { id: 'coup-5', code: 'LOYAL-5566-7391', type: 'percentage', value: 10, min_order_syp: 0,      max_uses: 1,    used_count: 0,   expires_at: '2026-04-27T00:00:00.000Z', is_active: true,  auto_generated: true,  created_at: '2026-03-26T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' },
]

// ─── Mock Static Pages ────────────────────────────────────────────────────────
export const MOCK_STATIC_PAGES: any[] = [
  { id: 'pg-1', slug: 'about',         title: 'من نحن',           content: 'متجر كزورا — أناقة تبدأ من خطوتك. نقدم لكم أرقى تشكيلات الأحذية الفاخرة والإكسسوارات المصنوعة بعناية فائقة.',        hero_image_url: null, hero_image_public_id: null, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' },
  { id: 'pg-4', slug: 'shipping',      title: 'سياسة الشحن',      content: 'نوفر التوصيل لجميع المحافظات السورية. مدة التوصيل من 24 إلى 72 ساعة حسب المحافظة وشركة الشحن.',                     hero_image_url: null, hero_image_public_id: null, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' },
  { id: 'pg-5', slug: 'return-policy', title: 'سياسة الإرجاع',    content: 'يحق للعميل إرجاع المنتج خلال 14 يوماً شريطة أن يكون بحالته الأصلية وبعبوته. لا يُقبل الإرجاع بعد الاستخدام.',       hero_image_url: null, hero_image_public_id: null, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' },
  { id: 'pg-6', slug: 'privacy-policy', title: 'سياسة الخصوصية',   content: 'نحن نحترم خصوصيتك ولا نشارك بياناتك مع أي طرف ثالث. بياناتك محمية وآمنة لدينا.',                                   hero_image_url: null, hero_image_public_id: null, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' },
  { id: 'pg-7', slug: 'terms',         title: 'الشروط والأحكام',  content: 'باستخدامك لهذا الموقع، فإنك توافق على شروط الاستخدام الخاصة بنا. يحق لكزورا تعديل هذه الشروط في أي وقت.',           hero_image_url: null, hero_image_public_id: null, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' },
]

export const IS_DEMO = false
