-- ─────────────────────────────────────────────────────────────────────────────
-- Meta Conversions API — أعمدة تتبّع فيس بوك على جدول الطلبات
--
-- الهدف: نخزّن بيانات متصفّح الزبون (خاصة fbc = معرّف نقرة الإعلان) لحظة إنشاء
-- الطلب، حتى نرسل حدث Purchase لفيس بوك لاحقاً عند تأكيدك للطلب — فيربطه فيس
-- بالإعلان الصحيح رغم مرور الوقت.
--
-- طريقة التشغيل: افتح Supabase → SQL Editor → الصق هذا كامل → Run.
-- آمن تماماً: كل الأعمدة اختيارية (nullable) ولا تؤثّر على الطلبات الموجودة.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE orders ADD COLUMN IF NOT EXISTS fb_fbp               TEXT DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fb_fbc               TEXT DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fb_client_ip         TEXT DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fb_client_ua         TEXT DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fb_event_source_url  TEXT DEFAULT NULL;
-- علم يمنع إرسال الحدث مرّتين لنفس الطلب
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fb_purchase_sent     BOOLEAN DEFAULT false;
