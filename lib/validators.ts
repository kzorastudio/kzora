import { z } from 'zod'

// Checkout form
export const checkoutSchema = z.object({
  full_name: z
    .string()
    .min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل')
    .max(100, 'الاسم طويل جداً'),
  phone: z
    .string()
    .regex(/^(\+963|0)?9\d{8}$/, 'رقم الهاتف غير صحيح. مثال: 0987654321'),
  governorate: z
    .string()
    .min(1, 'يرجى اختيار المحافظة'),
  address: z
    .string()
    .min(10, 'العنوان يجب أن يكون 10 أحرف على الأقل')
    .max(500, 'العنوان طويل جداً'),
  shipping_company: z.string({ required_error: 'يرجى اختيار شركة الشحن' }).min(1, 'يرجى اختيار شركة الشحن'),
  coupon_code: z.string().optional(),
  payment_method: z.enum(['cod', 'sham_cash']).default('cod'),
  notes: z.string().max(300, 'الملاحظات طويلة جداً').optional(),
})

export type CheckoutFormData = z.infer<typeof checkoutSchema>

// Admin login
export const loginSchema = z.object({
  email: z
    .string()
    .email('البريد الإلكتروني غير صحيح')
    .toLowerCase(),
  password: z
    .string()
    .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
})

export type LoginFormData = z.infer<typeof loginSchema>

// Product form (admin)
export const productSchema = z.object({
  name: z.string().min(2, 'اسم المنتج مطلوب').max(200),
  description: z.string().min(10, 'الوصف يجب أن يكون 10 أحرف على الأقل'),
  category_id: z.string().uuid('يرجى اختيار قسم').nullable(),
  price_syp: z.number().positive('السعر بالليرة مطلوب'),
  price_usd: z.number().positive('السعر بالدولار مطلوب'),
  discount_price_syp: z.number().positive().nullable().optional(),
  discount_price_usd: z.number().positive().nullable().optional(),
  stock_status: z.enum(['in_stock', 'low_stock', 'out_of_stock']),
  is_featured: z.boolean(),
  is_published: z.boolean(),
  sort_order: z.number().min(0),
  sizes: z.array(z.number()).min(1, 'يرجى اختيار مقاس واحد على الأقل'),
  tags: z.array(z.enum(['new', 'best_seller', 'on_sale'])),
  colors: z.array(z.object({
    name_ar: z.string().min(1, 'اسم اللون مطلوب'),
    hex_code: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'كود اللون غير صحيح'),
    swatch_url: z.string().optional(),
    swatch_public_id: z.string().optional(),
  })),
})

export type ProductFormData = z.infer<typeof productSchema>

// Category form
export const categorySchema = z.object({
  name_ar: z.string().min(2, 'اسم القسم مطلوب').max(100),
  description: z.string().max(500).optional(),
  sort_order: z.number().min(0).default(0),
  is_active: z.boolean(),
  show_in_header: z.boolean().default(false),
  show_in_footer: z.boolean().default(false),
  show_in_home: z.boolean().default(false),
  header_order: z.number().min(0).default(0),
  footer_order: z.number().min(0).default(0),
  home_order: z.number().min(0).default(0),
})

export type CategoryFormData = z.infer<typeof categorySchema>

// Coupon form
export const couponSchema = z.object({
  code: z
    .string()
    .min(3, 'كود الخصم يجب أن يكون 3 أحرف على الأقل')
    .max(20, 'كود الخصم طويل جداً')
    .toUpperCase(),
  type: z.enum(['percentage', 'fixed_amount']),
  value: z.number().positive('القيمة يجب أن تكون موجبة'),
  min_order_syp: z.number().min(0),
  max_uses: z.number().positive().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  is_active: z.boolean(),
})

export type CouponFormData = z.infer<typeof couponSchema>

// Coupon validation request
export const couponValidateSchema = z.object({
  code: z.string().min(1),
  order_total_syp: z.number().positive(),
  order_total_usd: z.number().positive(),
})
