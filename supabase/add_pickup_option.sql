-- ─────────────────────────────────────────────────────────────────────────────
-- خيار "استلام من مكتب الدليفري" لزبائن حلب (يتحكم به من لوحة التحكم ← الرئيسية ← أسعار التوصيل)
--
-- طريقة التشغيل: افتح Supabase → SQL Editor → الصق هذا كامل → Run.
-- آمن تماماً: يضيف أعمدة إعدادات فقط. الخيار مطفأ افتراضياً، فلا يظهر للزبائن حتى تشغّله.
--   pickup_enabled   تشغيل/إيقاف الخيار
--   pickup_fee_syp   الأجرة بالليرة (افتراضياً 100)
--   pickup_fee_usd   الأجرة بالدولار
--   pickup_location  اسم المكان كما يظهر للزبون وفي الطلب
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE homepage_settings
  ADD COLUMN IF NOT EXISTS pickup_enabled  BOOLEAN       NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pickup_fee_syp  BIGINT        NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS pickup_fee_usd  NUMERIC(10,2) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS pickup_location TEXT          NOT NULL DEFAULT 'مكتب الدليفري (الموكامبو)';
