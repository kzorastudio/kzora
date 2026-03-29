// ============================================================
// KZORA — TypeScript Types & Interfaces
// ============================================================

// --- Database Row Types ---

export interface Category {
  id: string
  name_ar: string
  slug: string
  image_url: string
  image_public_id: string
  description: string
  sort_order: number
  show_in_header: boolean
  show_in_footer: boolean
  show_in_home: boolean
  header_order: number
  footer_order: number
  home_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  category_id: string | null
  price_syp: number
  price_usd: number
  discount_price_syp: number | null
  discount_price_usd: number | null
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock'
  is_featured: boolean
  is_published: boolean
  sort_order: number
  view_count: number
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  public_id: string
  color_variant: string | null
  display_order: number | null
  is_main: boolean
  created_at: string
}

export interface ProductColor {
  id: string
  product_id: string
  name_ar: string
  hex_code: string
  swatch_url: string | null
  swatch_public_id: string | null
}

export interface ProductSize {
  id: string
  product_id: string
  size: number
}

export type ProductTag = 'new' | 'best_seller' | 'on_sale'

export interface ProductTagRow {
  id: string
  product_id: string
  tag: ProductTag
}

// Full product with all relations
export interface ProductFull extends Product {
  images: ProductImage[]
  colors: ProductColor[]
  sizes: number[]
  tags: ProductTag[]
  category: Category | null
}

export interface Order {
  id: string
  order_number: string
  customer_full_name: string
  customer_phone: string
  customer_governorate: string
  customer_address: string
  shipping_company: string
  coupon_code: string | null
  discount_amount_syp: number
  discount_amount_usd: number
  subtotal_syp: number
  subtotal_usd: number
  total_syp: number
  total_usd: number
  currency_used: 'SYP' | 'USD'
  status: OrderStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  product_image: string | null
  color: string | null
  size: number | null
  quantity: number
  unit_price_syp: number
  unit_price_usd: number
}

export interface OrderStatusHistory {
  id: string
  order_id: string
  status: OrderStatus
  changed_at: string
}

export interface OrderFull extends Order {
  items: OrderItem[]
  status_history: OrderStatusHistory[]
}

export interface Coupon {
  id: string
  code: string
  type: 'percentage' | 'fixed_amount'
  value: number
  min_order_syp: number
  max_uses: number | null
  used_count: number
  expires_at: string | null
  is_active: boolean
  auto_generated: boolean
  created_at: string
  updated_at: string
}

export interface HeroSlide {
  id: string
  desktop_image_url: string
  desktop_image_public_id: string
  mobile_image_url: string | null
  mobile_image_public_id: string | null
  heading: string
  sub_text: string
  cta_text: string
  cta_link: string
  sort_order: number
  is_active: boolean
  heading_color: string
  accent_color: string
  subtext_color: string
  created_at: string
  updated_at: string
}

export interface HomepageSettings {
  id: string
  promo_banner_url: string | null
  promo_banner_public_id: string | null
  promo_banner_link: string | null
  promo_banner_active: boolean
  section_categories: boolean
  section_new_arrivals: boolean
  section_best_sellers: boolean
  section_promo_banner: boolean
  section_offers: boolean
  promo_banner_heading: string | null
  promo_banner_subtext: string | null
  promo_banner_button_text: string | null
  section_stats: boolean
  stat_customers_count: string | null
  stat_satisfaction_rate: string | null
  stat_returns_count: string | null
  stat_exchanges_count: string | null
  shipping_policy: string | null
  return_policy: string | null
}

export interface StaticPage {
  id: string
  slug: string
  title: string
  content: string
  hero_image_url: string | null
  hero_image_public_id: string | null
  created_at: string
  updated_at: string
}

export interface Admin {
  id: string
  email: string
  name: string
  created_at: string
}

// --- Cart Types ---

export interface CartItem {
  id: string             // product id
  slug: string
  name: string
  image: string
  color: string | null
  color_hex: string | null
  size: number | null
  quantity: number
  price_syp: number
  price_usd: number
  discount_price_syp: number | null
  discount_price_usd: number | null
}

// --- Currency ---
export type Currency = 'SYP' | 'USD'

// --- API Payloads ---

export interface CreateProductPayload {
  name: string
  description: string
  category_id: string | null
  price_syp: number
  price_usd: number
  discount_price_syp?: number | null
  discount_price_usd?: number | null
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock'
  is_featured: boolean
  is_published: boolean
  sort_order: number
  images: { url: string; public_id: string; color_variant?: string | null; display_order: number; is_main: boolean }[]
  colors: { name_ar: string; hex_code: string; swatch_url?: string; swatch_public_id?: string }[]
  sizes: number[]
  tags: ProductTag[]
}

export interface CreateOrderPayload {
  items: {
    product_id: string
    product_name: string
    product_image: string | null
    color: string | null
    size: number | null
    quantity: number
    unit_price_syp: number
    unit_price_usd: number
  }[]
  customer: {
    full_name: string
    phone: string
    governorate: string
    address: string
  }
  shipping_company: string
  coupon_code?: string
  currency_used: Currency
  notes?: string
}

export interface CouponValidationResult {
  valid: boolean
  coupon?: Coupon
  discount_syp?: number
  discount_usd?: number
  message?: string
}

// --- Filter/Query Params ---

export interface ProductFilters {
  category?: string
  tag?: ProductTag
  search?: string
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'most_viewed'
  size?: number
  color?: string
  min_price?: number
  max_price?: number
  on_sale?: boolean
  page?: number
  limit?: number
}

// --- Cloudinary ---
export interface CloudinaryUploadResult {
  url: string
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
}

// --- UI State ---
export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}
