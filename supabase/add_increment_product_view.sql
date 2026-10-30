-- ─────────────────────────────────────────────────────────────────────────────
-- عدّاد مشاهدات المنتج (يستدعيه /api/products/[id]/view عند فتح صفحة المنتج)
--
-- طريقة التشغيل: افتح Supabase → SQL Editor → الصق هذا كامل → Run.
-- آمن تماماً: ينشئ دالة فقط ولا يغيّر أي بيانات.
--
-- قبل هذه الدالة كان الكود يستدعي دالة غير موجودة فيرجع 500 ولا يزيد العدّاد.
-- الكود الآن يعمل بدونها (قراءة ثم كتابة)، لكن الدالة تزيد العدّاد بخطوة واحدة
-- آمنة حتى لو فتح عدة زوار نفس المنتج في نفس اللحظة.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_product_view(product_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE products
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = product_id;
$$;

-- يستدعيها السيرفر فقط بمفتاح الخدمة، فلا داعي لإتاحتها للزوار
REVOKE EXECUTE ON FUNCTION increment_product_view(UUID) FROM PUBLIC, anon, authenticated;
