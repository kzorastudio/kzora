# خطة تطبيق نظام نقاط الولاء - Loyalty Points System

## الوضع الحالي في Supabase ✅

### جدول `loyalty_points` (موجود - فارغ - 0 صفوف)
| العمود | النوع | الوصف |
|--------|-------|-------|
| `id` | uuid | المفتاح الأساسي |
| `customer_phone` | varchar(50) | رقم هاتف العميل (NOT NULL) |
| `order_id` | uuid | مرتبط بجدول orders (FK CASCADE) |
| `status` | varchar(20) | `pending` / `confirmed` / `cancelled` |
| `cycle_used` | boolean | هل تم استخدام هذه النقطة في دورة خصم؟ (default: false) |
| `created_at` | timestamptz | تاريخ الإنشاء |

> فهارس موجودة: `idx_loyalty_phone`, `idx_loyalty_phone_status`, `idx_loyalty_order`
> RLS + Policies موجودة ✅

### جدول `orders` (أُضيف حقلان جديدان)
| العمود الجديد | النوع | الوصف |
|--------------|-------|-------|
| `loyalty_discount_syp` | numeric (default 0) | خصم الولاء بالليرة |
| `loyalty_discount_usd` | numeric (default 0) | خصم الولاء بالدولار |

### جدول `coupons` (فارغ - 0 صفوف)
لن نستخدمه لنظام الولاء. نظام الولاء مستقل تماماً.

### نسبة التحويل SYP/USD
- المنتج الحالي: `price_syp = 1850`, `price_usd = 15.00`
- النسبة: `1850 / 15 = 123.33 SYP/USD`
- **1000 ل.س ≈ $8.11**
- ⚠️ النسبة ستُحسب ديناميكياً من مجموع الطلب نفسه (كما يفعل الكود حالياً) وليس ثابتة

---

## منطق النظام

```
┌─────────────────────────────────────────────────────────────┐
│ 1. العميل يدخل رقم هاتفه في صفحة الـ checkout              │
│    ↓                                                        │
│ 2. GET /api/loyalty?phone=xxx                               │
│    ↓                                                        │
│ 3. النظام يحسب:                                            │
│    • confirmed + cycle_used=false → كم نقطة مؤكدة غير مُستهلكة │
│    • إذا >= 3 → خصم 1000 ل.س متاح!                        │
│    ↓                                                        │
│ 4. يُعرض للعميل شريط التقدم (0/3, 1/3, 2/3, 3/3)            │
│    + عدد النقاط المعلقة                                      │
│    + إذا الخصم متاح → يُطبق تلقائياً                       │
│    ↓                                                        │
│ 5. العميل يؤكد الطلب → POST /api/orders                    │
│    ↓                                                        │
│ 6. الـ API يقوم بـ:                                         │
│    أ. إذا العميل لديه خصم (3+ نقاط confirmed):             │
│       - خصم 1000 ل.س من الإجمالي                           │
│       - حساب USD بنسبة subtotalUsd/subtotalSyp              │
│       - تحديث أقدم 3 نقاط confirmed → cycle_used = true     │
│    ب. إنشاء الطلب مع حفظ loyalty_discount_syp/usd          │
│    ج. إدراج سطر جديد في loyalty_points بحالة pending        │
│    ↓                                                        │
│ 7. الأدمن يغير حالة الطلب:                                  │
│    • confirmed → loyalty_point.status = 'confirmed'          │
│    • cancelled → loyalty_point.status = 'cancelled'          │
│    ↓                                                        │
│ 8. بعد 3 نقاط confirmed جديدة → خصم متاح للطلب التالي      │
│    (الدورة تتكرر)                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## الملفات المطلوب تعديلها (8 ملفات)

### ✅ 1. `app/api/loyalty/route.ts` — تم إنشاؤه
GET endpoint يرجع حالة نقاط الولاء للعميل.

---

### 2. `app/api/orders/route.ts` — تعديل POST

**ما سيُحذف:**
```diff
- // Step 7: Loyalty coupon check (سطور 396-423)
- // كود توليد كوبون LOYAL-xxxx القديم بالكامل
```

**ما سيُضاف بعد إنشاء الطلب:**
```
أ. التحقق من خصم الولاء:
   - استعلام: SELECT من loyalty_points حيث phone + confirmed + cycle_used=false
   - إذا >= 3:
     → حساب loyaltyDiscountSyp = 1000
     → حساب loyaltyDiscountUsd = 1000 * (subtotalUsd / subtotalSyp)
     → تحديث أقدم 3 نقاط: cycle_used = true
   - دمج الخصم في الحساب النهائي (total)

ب. بعد إدراج الطلب:
   - INSERT INTO loyalty_points (customer_phone, order_id, status='pending')
```

---

### 3. `app/api/orders/[id]/route.ts` — تعديل PUT

**ما سيُضاف بعد تحديث الحالة:**
```
إذا status تغير:
  • إلى 'confirmed':
    → UPDATE loyalty_points SET status='confirmed' WHERE order_id=id
  • إلى 'cancelled':
    → UPDATE loyalty_points SET status='cancelled' WHERE order_id=id
    → إذا الطلب كان عليه loyalty_discount_syp > 0:
      → إرجاع cycle_used = false لأقدم 3 نقاط مستخدمة لهذا العميل
```

---

### 4. `components/checkout/LoyaltyStatus.tsx` — ملف جديد

ويدجت يظهر في الـ checkout:
- شريط تقدم بصري (3 نقاط)
- عدد النقاط المعلقة (pending)  
- رسالة "🎉 لديك خصم 1000 ل.س!" عند الاستحقاق
- تصميم متوافق مع ستايل كزورا (ألوان ذهبية)

---

### 5. `app/checkout/page.tsx` — تعديل

**ما سيُضاف:**
```
- state جديد: loyaltyDiscountSyp, loyaltyDiscountUsd, loyaltyInfo
- استدعاء GET /api/loyalty?phone=xxx عند تغيير رقم الهاتف (debounced)
- عرض مكون LoyaltyStatus
- تمرير loyalty discount إلى OrderSummaryPanel
- إرسال loyalty_discount_applied: true مع payload الطلب
```

**تحدي:** رقم الهاتف يُدار داخل CheckoutForm (react-hook-form) لكن نحتاج الوصول إليه من الصفحة الأب. الحل: إضافة callback `onPhoneChange` في CheckoutForm.

---

### 6. `components/checkout/OrderSummaryPanel.tsx` — تعديل

**ما سيُضاف:**
```
- props جديدة: loyaltyDiscountSyp, loyaltyDiscountUsd
- سطر عرض "خصم الولاء 🎁" بلون أخضر/ذهبي
- تضمين الخصم في حساب الإجمالي
```

---

### 7. `app/admin/orders/[id]/page.tsx` — تعديل

**ما سيُضاف:**
```
- استعلام loyalty_points المرتبطة بالطلب
- بطاقة جديدة "نقاط الولاء" تعرض:
  • حالة النقطة (pending/confirmed/cancelled)
  • التقدم الحالي للعميل (كم نقطة confirmed)
  • إذا تم تطبيق خصم ولاء → عرض المبلغ
```

---

### 8. `components/checkout/CheckoutForm.tsx` — تعديل صغير

**ما سيُضاف:**
```
- prop جديد: onPhoneChange?: (phone: string) => void
- استدعاءه في onBlur أو onChange لحقل الهاتف
```

---

## ملفات لا تحتاج تعديل
- ❌ `types/index.ts` — لا نحتاج type جديد لأن الـ loyalty صغير
- ❌ `lib/constants.ts` — لا تغييرات
- ❌ `lib/whatsapp.ts` — لا تغييرات (خصم الولاء يُضاف ضمن discount العام)
- ❌ Supabase schema — الجدول والحقول كلها موجودة الآن ✅

---

## ملخص التغييرات

| # | الملف | النوع | الحجم |
|---|-------|-------|-------|
| 1 | `app/api/loyalty/route.ts` | ✅ تم | جديد |
| 2 | `app/api/orders/route.ts` | تعديل | كبير |
| 3 | `app/api/orders/[id]/route.ts` | تعديل | متوسط |
| 4 | `components/checkout/LoyaltyStatus.tsx` | إنشاء | جديد |
| 5 | `app/checkout/page.tsx` | تعديل | متوسط |
| 6 | `components/checkout/OrderSummaryPanel.tsx` | تعديل | صغير |
| 7 | `app/admin/orders/[id]/page.tsx` | تعديل | صغير |
| 8 | `components/checkout/CheckoutForm.tsx` | تعديل | صغير |

> [!IMPORTANT]
> خصم الـ USD يُحسب ديناميكياً: `loyaltyDiscountUsd = 1000 × (subtotalUsd ÷ subtotalSyp)`
> مثال: إذا الطلب 1850 ل.س = $15 → الخصم = 1000 × (15/1850) = **$8.11**
