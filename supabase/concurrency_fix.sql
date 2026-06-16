-- ============================================================
-- KZORA كزورا — إصلاح التزامن (Concurrency-safe order creation)
-- ------------------------------------------------------------
-- هذا الملف *إضافي بالكامل*: ينشئ تسلسلاً (sequence) ودوالّ (functions)
-- جديدة فقط. لا يحذف ولا يعدّل أي صف أو عمود موجود في قاعدة بياناتك.
-- آمن للتشغيل أكثر من مرة (idempotent).
-- شغّله في: Supabase ▸ SQL Editor ▸ New query ▸ Run
-- ============================================================

-- ── 1) تسلسل أرقام الطلبات (آمن ضد التزامن، يلغي تكرار الأرقام) ──────────────
CREATE SEQUENCE IF NOT EXISTS order_number_seq;

-- مزامنة التسلسل مع أعلى رقم KZ- موجود حالياً حتى يكمل الترقيم بسلاسة.
-- (يقرأ جدول orders فقط لحساب الأعلى — لا يعدّل أي صف)
SELECT setval(
  'order_number_seq',
  GREATEST(
    1,
    COALESCE((
      SELECT MAX( (regexp_replace(order_number, '\D', '', 'g'))::bigint )
      FROM orders
      WHERE order_number ~ '^KZ-\d+$'
    ), 1)
  ),
  true
);

-- ── 2) مولّد رقم الطلب (KZ-000123) ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION next_order_number()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT 'KZ-' || lpad(nextval('order_number_seq')::text, 6, '0');
$$;

-- ── 3) حجز المخزون الذرّي (كل القطع أو لا شيء) ──────────────────────────────
-- يخصم كميات كل القطع داخل معاملة واحدة. إذا نفدت كمية أي قطعة، يُلغى الخصم
-- كله ويُرفع خطأ OUT_OF_STOCK. الشرط (quantity >= ...) يُقيَّم لحظة الكتابة
-- نفسها، ما يمنع البيع الزائد عند الطلب المتزامن على آخر قطعة.
CREATE OR REPLACE FUNCTION reserve_stock(p_items jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  it       jsonb;
  affected int;
BEGIN
  FOR it IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- تخطَّ القطع غير المتتبَّعة بالمخزون (بدون variant_id)
    CONTINUE WHEN (it->>'variant_id') IS NULL OR (it->>'variant_id') = '';

    UPDATE product_variants
      SET quantity = quantity - (it->>'quantity')::int
      WHERE id = (it->>'variant_id')::uuid
        AND quantity >= (it->>'quantity')::int;

    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected = 0 THEN
      RAISE EXCEPTION 'OUT_OF_STOCK:%', COALESCE(it->>'product_name', '');
    END IF;
  END LOOP;
END;
$$;

-- ── 4) زيادة عدّاد الكوبون بشكل مشروط (لا يتجاوز max_uses أبداً) ─────────────
-- يعيد العدد الجديد، أو NULL إذا كان الكوبون قد استُنفد فعلاً.
CREATE OR REPLACE FUNCTION increment_coupon_usage(p_coupon_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE new_count integer;
BEGIN
  UPDATE coupons
    SET used_count = used_count + 1
    WHERE id = p_coupon_id
      AND (max_uses IS NULL OR used_count < max_uses)
    RETURNING used_count INTO new_count;
  RETURN new_count;
END;
$$;

-- ── 5) صلاحيات التنفيذ لدور الخدمة (كل مسارات الـ API تستخدمه) ───────────────
GRANT EXECUTE ON FUNCTION next_order_number()              TO service_role;
GRANT EXECUTE ON FUNCTION reserve_stock(jsonb)             TO service_role;
GRANT EXECUTE ON FUNCTION increment_coupon_usage(uuid)     TO service_role;

-- تم. لا تغييرات على بياناتك — فقط أدوات جديدة جاهزة للاستخدام.
