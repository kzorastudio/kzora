-- ─────────────────────────────────────────────────────────────────────────────
-- فيديو قصير لكل منتج (يُعرض في معرض الصور بصفحة المنتج)
--
-- طريقة التشغيل: افتح Supabase → SQL Editor → الصق هذا كامل → Run.
-- شغّله قبل نشر الكود الجديد. آمن تماماً: يضيف أعمدة فارغة فقط ولا يغيّر أي بيانات.
--
-- الفيديو مخزّن على المنتج نفسه وليس مع الصور، حتى لا يظهر أبداً كصورة رئيسية
-- في بطاقات المنتجات أو الطلبات أو كتالوج فيسبوك.
--   video_url        رابط Cloudinary الأصلي للفيديو
--   video_public_id  للحذف من Cloudinary عند تغيير الفيديو أو حذف المنتج
--   video_duration   المدة بالثواني (تظهر على الصورة المصغّرة)
--   video_position   مكانه بين الصور: 0 = الأول، 1 = الثاني، -1 = الأخير
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS video_url       TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS video_public_id TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS video_duration  NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS video_position  INTEGER NOT NULL DEFAULT 0;
