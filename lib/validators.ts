import { z } from 'zod'

// Checkout form
export const checkoutSchema = z.object({
  full_name: z
    .string()
    .min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل')
    .max(100, 'الاسم طويل جداً')
    .regex(/^[\u0600-\u06FFa-zA-Z\s]+$/, 'يرجى كتابة الاسم باللغة العربية أو الإنجليزية'),
  phone: z
    .string()
    .regex(/^(\+963|0)?[9٩][0-9٠-٩]{8}$/, 'رقم الهاتف غير صحيح. مثال: 0987654321'),
  delivery_type: z.enum(['delivery', 'shipping'], {
    required_error: 'يرجى اختيار طريقة الاستلام',
    invalid_type_error: 'يرجى اختيار طريقة الاستلام',
  }),
  // Delivery (حلب فقط): manual address
  address: z.string().optional(),
  // Shipping: governorate + center + company
  governorate: z.string().optional(),
  center: z.string().optional(),
  center_name: z.string().optional(),
  shipping_company: z.string().optional().nullable(),
  coupon_code: z.string().optional(),
  payment_method: z.enum(['cod', 'sham_cash']).default('cod'),
  payment_transaction_id: z.string().optional(),
  notes: z.string().max(300, 'الملاحظات طويلة جداً').optional(),
}).refine(
  (data) => {
    // Delivery mode: address is required
    if (data.delivery_type === 'delivery') {
      return !!data.address && data.address.trim().length >= 5
    }
    return true
  },
  {
    message: 'يرجى إدخال عنوانك بالتفصيل (5 أحرف على الأقل)',
    path: ['address'],
  }
).refine(
  (data) => {
    // Shipping mode: governorate required
    if (data.delivery_type === 'shipping') {
      return !!data.governorate && data.governorate.length > 0
    }
    return true
  },
  {
    message: 'يرجى اختيار المحافظة',
    path: ['governorate'],
  }
).refine(
  (data) => {
    // Shipping mode: center required
    if (data.delivery_type === 'shipping') {
      return !!data.center && data.center.length > 0
    }
    return true
  },
  {
    message: 'يرجى اختيار المركز',
    path: ['center'],
  }
).refine(
  (data) => {
    // Shipping mode: shipping company required
    if (data.delivery_type === 'shipping') {
      return !!data.shipping_company && data.shipping_company.length > 0
    }
    return true
  },
  {
    message: 'يرجى اختيار شركة الشحن',
    path: ['shipping_company'],
  }
).refine(
  (data) => {
    if (data.payment_method === 'sham_cash') {
      return !!data.payment_transaction_id && data.payment_transaction_id.trim().length >= 3
    }
    return true
  },
  {
    message: 'يرجى إدخال رقم/رمز عملية التحويل',
    path: ['payment_transaction_id'],
  }
)

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
  category_id: z.preprocess(
    val => (val === '' || val == null) ? null : val,
    z.string().uuid('يرجى اختيار قسم صحيح').nullable()
  ),
  price_syp: z.number().positive('السعر بالليرة مطلوب'),
  price_usd: z.number().positive('السعر بالدولار مطلوب'),
  discount_price_syp: z.number().positive().nullable().optional(),
  discount_price_usd: z.number().positive().nullable().optional(),
  mold_type: z.enum(['chinese', 'normal']).default('normal'),
  stock_status: z.enum(['in_stock', 'low_stock', 'out_of_stock']),
  is_featured: z.boolean(),
  is_published: z.boolean(),
  sort_order: z.number().min(0).optional().default(0),
  sizes: z.array(z.object({
    size:         z.number(),
    is_available: z.boolean(),
  })).min(1, 'يرجى اختيار مقاس واحد على الأقل'),
  tags: z.array(z.enum(['new', 'best_seller', 'on_sale'])),
  colors: z.array(z.object({
    name_ar: z.string().min(1, 'اسم اللون مطلوب'),
    hex_code: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'كود اللون غير صحيح'),
    swatch_url: z.string().optional(),
    swatch_public_id: z.string().optional(),
    is_available: z.boolean().default(true),
  })),
  variants: z.array(z.object({
    color: z.string(),
    size: z.number(),
    quantity: z.number().int().min(0, 'الكمية لا يمكن أن تكون سالبة').default(0),
  })).optional().default([]),
  multi_discount_enabled: z.boolean().default(false),
  multi_discount_2_items_syp: z.number().int().min(0).default(0),
  multi_discount_2_items_usd: z.number().min(0).default(0),
  multi_discount_3_plus_syp: z.number().int().min(0).default(0),
  multi_discount_3_plus_usd: z.number().min(0).default(0),
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
