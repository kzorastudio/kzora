-- إنشاء جدول مراكز المناطق ليعمل نظام الشحن الجديد
CREATE TABLE IF NOT EXISTS public.shipping_centers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    governorate text NOT NULL,
    name text NOT NULL,
    supported_companies text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now()
);

-- تفعيل حدود الحماية
ALTER TABLE public.shipping_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.shipping_centers FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated" ON public.shipping_centers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated" ON public.shipping_centers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated" ON public.shipping_centers FOR DELETE TO authenticated USING (true);

-- إضافة عمود حفظ المركز للطلبات لتظهر في صفحة الأدمن
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS center_name text DEFAULT NULL;
