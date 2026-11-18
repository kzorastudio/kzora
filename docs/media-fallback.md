# خطة الطوارئ: إذا توقفت Cloudinary

كل صور وفيديوهات المتجر محفوظة على Cloudinary، **ومعها نسخة احتياطية كاملة** في
Supabase Storage (bucket اسمه `media`، عام). إذا أوقفت Cloudinary الحساب أو تعطّلت،
نحوّل الموقع كله إلى النسخة الاحتياطية بتغيير متغيّر واحد — بدون تعديل أي كود أو بيانات.

## التفعيل (حوالي 3 دقائق)

1. **حدّث النسخة الاحتياطية أولاً** (حتى تشمل أي صور رُفعت مؤخراً). إذا كانت Cloudinary
   متوقفة تماماً فتخطَّ هذه الخطوة — الموجود في النسخة يكفي:
   ```
   node scripts/backup-media-to-supabase.mjs
   ```
2. في Vercel → المشروع → **Settings → Environment Variables** أضف:
   - Name: `NEXT_PUBLIC_MEDIA_FALLBACK`
   - Value: `supabase`
   - Environment: Production
3. **Deployments** → آخر نشر → **⋯ → Redeploy** (ضروري: المتغيّر يُقرأ وقت البناء).
4. بعد انتهاء النشر افتح الموقع وتأكد أن الصور ظاهرة.

## الإلغاء (العودة إلى Cloudinary)

احذف المتغيّر `NEXT_PUBLIC_MEDIA_FALLBACK` من Vercel ثم Redeploy.

## ما الذي يعمل وما لا يعمل أثناء الطوارئ

| | الحالة |
|---|---|
| صور المنتجات، السلايدر، التصنيفات، البانر، QR شام كاش | ✅ من Supabase (مع ضغط وتصغير Vercel كالمعتاد) |
| فيديوهات المنتجات وصورها المصغّرة | ✅ من Supabase (النسخة 480p الصغيرة) |
| **رفع صور/فيديوهات جديدة من لوحة الأدمن** | ❌ الرفع ما زال يذهب إلى Cloudinary |

## صيانة دورية

- شغّل `node scripts/backup-media-to-supabase.mjs` كل فترة (مثلاً أسبوعياً، أو بعد إضافة
  منتجات جديدة). السكربت ينسخ الجديد فقط ويتخطى الموجود.
- حدود Supabase المجانية: 1GB تخزين (النسخة الحالية ~60MB)، و5GB تحميل شهرياً. الصور
  تمر عبر Vercel وتُحفظ مؤقتاً فلا تستهلك كثيراً؛ الفيديو ~1.3MB لكل تشغيل.

## كيف يعمل تقنياً

- `lib/cloudinaryUrl.ts`: عند `NEXT_PUBLIC_MEDIA_FALLBACK=supabase` تحوّل
  `optimizeCloudinaryUrl()` و `mediaUrl()` و `productVideoUrl()` / `productVideoPosterUrl()`
  أي رابط Cloudinary إلى نسخته في
  `https://<project>.supabase.co/storage/v1/object/public/media/{image|video}/<public_id>.<ext>`.
- كل مكان يعرض صورة مخزّنة يمرّ عبر إحدى هذه الدوال — **أي مكوّن جديد يعرض صورة من
  قاعدة البيانات يجب أن يستخدم `mediaUrl()` أو `optimizeCloudinaryUrl()`**.
- النسخة الاحتياطية: `scripts/backup-media-to-supabase.mjs`.
