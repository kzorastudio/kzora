-- ═══════════════════════════════════════════════════════════════════════════
-- إضافة شركات الشحن وبياناتها للمحافظات السورية
-- ═══════════════════════════════════════════════════════════════════════════

-- أولاً: إضافة شركات الشحن إن لم تكن موجودة
INSERT INTO public.shipping_methods (slug, name, description, badge, sort_order, is_active)
VALUES
  ('madar',  'مدار للشحن',          'شبكة شحن واسعة تغطي معظم المحافظات السورية',     'الأوسع',   1, true),
  ('yalla',  'يلا إكسبريس',         'شحن سريع وموثوق مع تتبع الشحنة',                 'الأسرع',   2, true),
  ('flash',  'فلاش للتوصيل',        'خدمة شحن اقتصادية لجميع المناطق',               'اقتصادي',  3, true),
  ('swift',  'سويفت للشحن',         'شحن مضمون مع التأمين على البضاعة',               'مضمون',    4, true),
  ('bareed', 'بريد سوريا',          'خدمة الشحن الحكومية الموثوقة',                   '',         5, true)
ON CONFLICT (slug) DO NOTHING;

-- ثانياً: إضافة المحافظات المدعومة لكل شركة
-- مدار
INSERT INTO public.shipping_governorates (shipping_method_id, governorate_name, fee_syp, fee_usd, is_active, branch_addresses)
SELECT id, unnested.gov, 5000, 2.50, true, ''
FROM public.shipping_methods,
LATERAL unnest(ARRAY[
  'ريف حلب','دمشق','ريف دمشق','حمص','حماة','اللاذقية','طرطوس','إدلب','دير الزور','الرقة','الحسكة','السويداء','درعا','القنيطرة'
]) AS unnested(gov)
WHERE slug = 'madar'
ON CONFLICT DO NOTHING;

-- يلا
INSERT INTO public.shipping_governorates (shipping_method_id, governorate_name, fee_syp, fee_usd, is_active, branch_addresses)
SELECT id, unnested.gov, 6000, 3.00, true, ''
FROM public.shipping_methods,
LATERAL unnest(ARRAY[
  'ريف حلب','دمشق','ريف دمشق','حمص','حماة','اللاذقية','طرطوس','إدلب','دير الزور','الرقة','الحسكة'
]) AS unnested(gov)
WHERE slug = 'yalla'
ON CONFLICT DO NOTHING;

-- فلاش
INSERT INTO public.shipping_governorates (shipping_method_id, governorate_name, fee_syp, fee_usd, is_active, branch_addresses)
SELECT id, unnested.gov, 4000, 2.00, true, ''
FROM public.shipping_methods,
LATERAL unnest(ARRAY[
  'ريف حلب','دمشق','ريف دمشق','حمص','حماة','اللاذقية','طرطوس','إدلب'
]) AS unnested(gov)
WHERE slug = 'flash'
ON CONFLICT DO NOTHING;

-- سويفت
INSERT INTO public.shipping_governorates (shipping_method_id, governorate_name, fee_syp, fee_usd, is_active, branch_addresses)
SELECT id, unnested.gov, 7000, 3.50, true, ''
FROM public.shipping_methods,
LATERAL unnest(ARRAY[
  'ريف حلب','دمشق','ريف دمشق','حمص','اللاذقية','طرطوس'
]) AS unnested(gov)
WHERE slug = 'swift'
ON CONFLICT DO NOTHING;

-- بريد سوريا
INSERT INTO public.shipping_governorates (shipping_method_id, governorate_name, fee_syp, fee_usd, is_active, branch_addresses)
SELECT id, unnested.gov, 3500, 1.75, true, ''
FROM public.shipping_methods,
LATERAL unnest(ARRAY[
  'دمشق','ريف دمشق','حمص','حماة','اللاذقية','طرطوس','السويداء','درعا','القنيطرة'
]) AS unnested(gov)
WHERE slug = 'bareed'
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- ثالثاً: مراكز ريف حلب
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.shipping_centers (governorate, name, supported_companies) VALUES
  ('ريف حلب', 'مركز اعزاز',       ARRAY['yalla', 'flash']),
  ('ريف حلب', 'مركز الباب',        ARRAY['madar', 'yalla']),
  ('ريف حلب', 'مركز جرابلس',      ARRAY['madar']),
  ('ريف حلب', 'مركز عفرين',       ARRAY['flash', 'swift']),
  ('ريف حلب', 'مركز منبج',        ARRAY['yalla', 'madar']),
  ('ريف حلب', 'مركز الأتارب',     ARRAY['madar', 'flash']),
  ('ريف حلب', 'مركز تل رفعت',     ARRAY['madar']),
  ('ريف حلب', 'مركز سفيرة',       ARRAY['yalla', 'madar']),
  ('ريف حلب', 'مركز خان العسل',   ARRAY['flash']),
  ('ريف حلب', 'مركز إعزاز الشمالي', ARRAY['yalla'])
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- رابعاً: مراكز دمشق
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.shipping_centers (governorate, name, supported_companies) VALUES
  ('دمشق', 'مركز الميدان',         ARRAY['madar', 'yalla', 'bareed']),
  ('دمشق', 'مركز المزة',           ARRAY['flash', 'swift', 'madar']),
  ('دمشق', 'مركز الشعلان',         ARRAY['madar', 'bareed']),
  ('دمشق', 'مركز برزة',            ARRAY['yalla', 'madar']),
  ('دمشق', 'مركز جرمانا',          ARRAY['flash', 'bareed']),
  ('دمشق', 'مركز دمر',             ARRAY['swift', 'madar'])
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- خامساً: مراكز ريف دمشق
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.shipping_centers (governorate, name, supported_companies) VALUES
  ('ريف دمشق', 'مركز دوما',        ARRAY['madar', 'yalla']),
  ('ريف دمشق', 'مركز عربين',       ARRAY['flash', 'bareed']),
  ('ريف دمشق', 'مركز داريا',       ARRAY['madar', 'swift']),
  ('ريف دمشق', 'مركز الزبداني',    ARRAY['bareed', 'madar']),
  ('ريف دمشق', 'مركز يبرود',       ARRAY['madar'])
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- سادساً: مراكز حمص
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.shipping_centers (governorate, name, supported_companies) VALUES
  ('حمص', 'مركز الخالدية',         ARRAY['yalla', 'flash', 'madar']),
  ('حمص', 'مركز الوعر',            ARRAY['madar', 'swift']),
  ('حمص', 'مركز تلبيسة',          ARRAY['yalla', 'madar']),
  ('حمص', 'مركز القصير',           ARRAY['bareed', 'madar']),
  ('حمص', 'مركز الرستن',           ARRAY['flash', 'madar'])
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- سابعاً: مراكز حماة
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.shipping_centers (governorate, name, supported_companies) VALUES
  ('حماة', 'مركز حماة المركزي',    ARRAY['madar', 'yalla', 'bareed']),
  ('حماة', 'مركز السلمية',         ARRAY['madar', 'flash']),
  ('حماة', 'مركز مصياف',           ARRAY['bareed', 'madar']),
  ('حماة', 'مركز سوران',           ARRAY['yalla'])
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- ثامناً: مراكز اللاذقية
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.shipping_centers (governorate, name, supported_companies) VALUES
  ('اللاذقية', 'مركز اللاذقية المركزي', ARRAY['madar', 'yalla', 'swift', 'bareed']),
  ('اللاذقية', 'مركز جبلة',            ARRAY['madar', 'flash']),
  ('اللاذقية', 'مركز القرداحة',         ARRAY['bareed', 'madar']),
  ('اللاذقية', 'مركز الحفة',            ARRAY['madar'])
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- تاسعاً: مراكز طرطوس
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.shipping_centers (governorate, name, supported_companies) VALUES
  ('طرطوس', 'مركز طرطوس المركزي',  ARRAY['madar', 'yalla', 'bareed']),
  ('طرطوس', 'مركز بانياس',          ARRAY['flash', 'madar']),
  ('طرطوس', 'مركز صافيتا',          ARRAY['bareed', 'swift']),
  ('طرطوس', 'مركز دريكيش',          ARRAY['madar'])
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- عاشراً: مراكز إدلب
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.shipping_centers (governorate, name, supported_companies) VALUES
  ('إدلب', 'مركز إدلب المركزي',    ARRAY['madar', 'yalla']),
  ('إدلب', 'مركز معرة النعمان',    ARRAY['flash', 'madar']),
  ('إدلب', 'مركز سرمين',           ARRAY['yalla']),
  ('إدلب', 'مركز جسر الشغور',     ARRAY['madar'])
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- حادي عشر: مراكز دير الزور
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.shipping_centers (governorate, name, supported_companies) VALUES
  ('دير الزور', 'مركز دير الزور المركزي', ARRAY['madar', 'yalla']),
  ('دير الزور', 'مركز الميادين',           ARRAY['madar']),
  ('دير الزور', 'مركز البوكمال',           ARRAY['yalla'])
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- ثاني عشر: مراكز الرقة
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.shipping_centers (governorate, name, supported_companies) VALUES
  ('الرقة', 'مركز الرقة المركزي',   ARRAY['madar', 'yalla']),
  ('الرقة', 'مركز تل أبيض',         ARRAY['madar'])
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- ثالث عشر: مراكز الحسكة
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.shipping_centers (governorate, name, supported_companies) VALUES
  ('الحسكة', 'مركز الحسكة المركزي',  ARRAY['madar', 'yalla']),
  ('الحسكة', 'مركز القامشلي',         ARRAY['madar', 'yalla']),
  ('الحسكة', 'مركز المالكية',         ARRAY['madar'])
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- رابع عشر: مراكز السويداء
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.shipping_centers (governorate, name, supported_companies) VALUES
  ('السويداء', 'مركز السويداء المركزي', ARRAY['madar', 'bareed']),
  ('السويداء', 'مركز شهبا',             ARRAY['bareed']),
  ('السويداء', 'مركز صلخد',             ARRAY['madar'])
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- خامس عشر: مراكز درعا
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.shipping_centers (governorate, name, supported_companies) VALUES
  ('درعا', 'مركز درعا المركزي',     ARRAY['madar', 'bareed']),
  ('درعا', 'مركز إزرع',             ARRAY['madar']),
  ('درعا', 'مركز الصنمين',          ARRAY['bareed', 'madar'])
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- سادس عشر: مراكز القنيطرة
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.shipping_centers (governorate, name, supported_companies) VALUES
  ('القنيطرة', 'مركز القنيطرة',     ARRAY['bareed', 'madar']),
  ('القنيطرة', 'مركز خان أرنبة',    ARRAY['madar'])
ON CONFLICT DO NOTHING;
