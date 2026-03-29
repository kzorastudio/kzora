# 🛠️ Kzora كزورا — Full-Stack Development Prompt

> **IMPORTANT:** This prompt must be used together with the **Design Specification Document** (`shoe-store-design-spec.md`). That document contains the complete visual design — colors, typography, spacing, shadows, animations, page layouts, and all Arabic text/labels. Follow it pixel-perfectly. This prompt covers the **technical implementation** only.

---

## PROJECT OVERVIEW

Build a full-stack e-commerce web application for **Kzora كزورا**, a premium shoe store based in Aleppo, Syria. The entire storefront is in **Arabic (RTL)**. Orders are placed via a form and then redirected to **WhatsApp** with a pre-filled message. Payment is **Cash on Delivery only**. No user accounts — guest checkout only.

---

## TECH STACK

| Layer            | Technology                                                        |
|------------------|-------------------------------------------------------------------|
| **Framework**    | Next.js 14+ (App Router)                                         |
| **Language**     | TypeScript                                                        |
| **Styling**      | Tailwind CSS (with RTL plugin `tailwindcss-rtl` or logical properties) |
| **Database**     | MongoDB (via Mongoose ODM)                                        |
| **Image Storage**| Cloudinary (upload, transform, delete via API)                    |
| **Auth (Admin)** | NextAuth.js (credentials provider — email/password for admin only)|
| **State Mgmt**   | Zustand (for cart state, currency toggle, UI state)               |
| **Forms**        | React Hook Form + Zod (validation with Arabic error messages)     |
| **Animations**   | Framer Motion (page transitions, micro-interactions)              |
| **Icons**        | Lucide React                                                      |
| **Fonts**        | Google Fonts: `Noto Sans Arabic` (primary), `Inter` (numbers)    |
| **Deployment**   | Vercel                                                            |
| **Rich Text**    | Tiptap (admin editor for product descriptions, static pages)      |

---

## PROJECT STRUCTURE

```
kzora/
├── app/
│   ├── layout.tsx                    # Root layout — RTL, Arabic fonts, global styles
│   ├── page.tsx                      # Homepage (الرئيسية)
│   ├── products/
│   │   └── page.tsx                  # All Products page (جميع المنتجات)
│   ├── product/
│   │   └── [slug]/
│   │       └── page.tsx              # Product Detail page (صفحة المنتج)
│   ├── category/
│   │   └── [slug]/
│   │       └── page.tsx              # Category page (صفحة القسم)
│   ├── search/
│   │   └── page.tsx                  # Search Results (نتائج البحث)
│   ├── checkout/
│   │   └── page.tsx                  # Checkout page (إتمام الطلب)
│   ├── order-success/
│   │   └── [orderId]/
│   │       └── page.tsx              # Order Success (تم الطلب)
│   ├── about/
│   │   └── page.tsx                  # About Us (من نحن)
│   ├── return-policy/
│   │   └── page.tsx                  # Return Policy (سياسة الإرجاع)
│   ├── not-found.tsx                 # 404 page
│   ├── admin/
│   │   ├── layout.tsx                # Admin shell (sidebar + header)
│   │   ├── page.tsx                  # Admin Dashboard (لوحة التحكم)
│   │   ├── login/
│   │   │   └── page.tsx              # Admin Login (تسجيل الدخول)
│   │   ├── products/
│   │   │   ├── page.tsx              # Product list
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # Add product
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx      # Edit product
│   │   ├── categories/
│   │   │   └── page.tsx              # Category management
│   │   ├── orders/
│   │   │   ├── page.tsx              # Order list
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Order detail
│   │   ├── coupons/
│   │   │   └── page.tsx              # Coupon management
│   │   ├── homepage/
│   │   │   └── page.tsx              # Homepage management (slides, banner, sections)
│   │   └── pages/
│   │       └── page.tsx              # Static pages editor (About, Return Policy)
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts          # NextAuth handler
│       ├── products/
│       │   ├── route.ts              # GET (list + filter + search) / POST (create)
│       │   └── [id]/
│       │       └── route.ts          # GET / PUT / DELETE single product
│       ├── categories/
│       │   ├── route.ts              # GET / POST
│       │   └── [id]/
│       │       └── route.ts          # GET / PUT / DELETE (with cascade)
│       ├── orders/
│       │   ├── route.ts              # GET (list) / POST (create)
│       │   └── [id]/
│       │       └── route.ts          # GET / PUT (status update)
│       ├── coupons/
│       │   ├── route.ts              # GET / POST
│       │   ├── validate/
│       │   │   └── route.ts          # POST — validate coupon code
│       │   └── [id]/
│       │       └── route.ts          # PUT / DELETE
│       ├── images/
│       │   ├── upload/
│       │   │   └── route.ts          # POST — upload to Cloudinary
│       │   ├── delete/
│       │   │   └── route.ts          # DELETE — delete by public_id
│       │   └── bulk-delete/
│       │       └── route.ts          # DELETE — delete array of public_ids
│       ├── homepage/
│       │   ├── slides/
│       │   │   └── route.ts          # GET / POST / PUT / DELETE hero slides
│       │   └── settings/
│       │       └── route.ts          # GET / PUT (banner, section visibility)
│       ├── pages/
│       │   └── [slug]/
│       │       └── route.ts          # GET / PUT (about, return-policy)
│       └── loyalty/
│           └── check/
│               └── route.ts          # POST — check loyalty status by phone
├── components/
│   ├── layout/
│   │   ├── Header.tsx                # Sticky header with logo, search, cart, currency
│   │   ├── MobileMenu.tsx            # Slide-in drawer menu (RTL — from right)
│   │   ├── Footer.tsx                # Store footer
│   │   ├── WhatsAppFAB.tsx           # Floating WhatsApp button
│   │   └── Breadcrumb.tsx            # Breadcrumb navigation
│   ├── home/
│   │   ├── HeroSlider.tsx            # Hero banner carousel
│   │   ├── CategoryGrid.tsx          # Browse by category grid
│   │   ├── ProductSection.tsx        # Reusable section (New Arrivals, Best Sellers, Offers)
│   │   └── PromoBanner.tsx           # Promotional banner
│   ├── product/
│   │   ├── ProductCard.tsx           # Product card (used in grids and carousels)
│   │   ├── ProductGrid.tsx           # Grid layout with infinite scroll
│   │   ├── ProductGallery.tsx        # Image gallery with zoom, thumbnails, lightbox
│   │   ├── ColorSelector.tsx         # Color swatch selector
│   │   ├── SizeSelector.tsx          # Size chip selector
│   │   ├── PriceDisplay.tsx          # Price with discount, currency-aware
│   │   ├── ProductBadge.tsx          # Tag badges (new, best seller, on sale)
│   │   ├── SizeGuideModal.tsx        # Size guide modal
│   │   └── RelatedProducts.tsx       # Related products horizontal scroll
│   ├── cart/
│   │   ├── CartDrawer.tsx            # Slide-in cart panel
│   │   ├── CartItem.tsx              # Single cart item row
│   │   ├── CouponInput.tsx           # Coupon code input + apply
│   │   └── CartSummary.tsx           # Subtotal, discount, total
│   ├── checkout/
│   │   ├── ShippingCompanySelector.tsx  # Radio card selector (Karam, Qadmous, Masarat)
│   │   ├── GovernorateDropdown.tsx      # Filtered by shipping company
│   │   ├── CheckoutForm.tsx             # Full checkout form
│   │   ├── OrderSummaryPanel.tsx        # Sticky order summary (desktop sidebar)
│   │   └── PaymentSection.tsx           # Cash on delivery card + warning
│   ├── search/
│   │   ├── SearchOverlay.tsx         # Full-screen (mobile) / dropdown (desktop) search
│   │   └── SearchResults.tsx         # Search results grid
│   ├── ui/
│   │   ├── Button.tsx                # Reusable button (primary, secondary, outline, disabled)
│   │   ├── Input.tsx                 # Text input with label, error, RTL
│   │   ├── Select.tsx                # Dropdown select
│   │   ├── Textarea.tsx              # Multi-line input
│   │   ├── Modal.tsx                 # Reusable modal
│   │   ├── Toast.tsx                 # Toast notification system
│   │   ├── Skeleton.tsx              # Shimmer loading skeleton
│   │   ├── Badge.tsx                 # Badge component
│   │   ├── Accordion.tsx             # Collapsible accordion
│   │   └── CurrencyToggle.tsx        # SYP/USD pill toggle
│   └── admin/
│       ├── AdminSidebar.tsx          # Admin navigation sidebar
│       ├── AdminHeader.tsx           # Admin top bar
│       ├── ProductForm.tsx           # Add/Edit product form
│       ├── CategoryForm.tsx          # Add/Edit category form
│       ├── CouponForm.tsx            # Add/Edit coupon form
│       ├── OrderTable.tsx            # Orders data table
│       ├── SlideManager.tsx          # Hero slides drag-and-drop manager
│       ├── ImageUploader.tsx         # Cloudinary drag-and-drop image uploader
│       ├── RichTextEditor.tsx        # Tiptap rich text editor
│       ├── StatsCard.tsx             # Dashboard summary card
│       └── StatusBadge.tsx           # Order status colored badge
├── lib/
│   ├── db.ts                         # MongoDB connection (Mongoose)
│   ├── cloudinary.ts                 # Cloudinary config + upload/delete helpers
│   ├── auth.ts                       # NextAuth config
│   ├── utils.ts                      # General utilities (cn, formatPrice, etc.)
│   ├── whatsapp.ts                   # Build WhatsApp order message URL
│   ├── constants.ts                  # Governorates, shipping companies, sizes, etc.
│   └── validators.ts                 # Zod schemas for all forms
├── models/
│   ├── Product.ts                    # Product Mongoose model
│   ├── Category.ts                   # Category model
│   ├── Order.ts                      # Order model
│   ├── Coupon.ts                     # Coupon model
│   ├── HeroSlide.ts                  # Hero slide model
│   ├── HomepageSettings.ts           # Banner, section visibility
│   ├── StaticPage.ts                 # About Us, Return Policy content
│   └── Admin.ts                      # Admin user model (email + hashed password)
├── store/
│   ├── cartStore.ts                  # Zustand cart store (persisted in localStorage)
│   └── currencyStore.ts              # Zustand currency toggle store (persisted)
├── hooks/
│   ├── useCart.ts                    # Cart hook (add, remove, update qty, clear)
│   ├── useCurrency.ts               # Currency hook (toggle, format price)
│   └── useDebounce.ts               # Debounce hook (for search)
├── types/
│   └── index.ts                     # All TypeScript interfaces and types
├── public/
│   ├── fonts/                        # Local font files if needed
│   └── images/                       # Static images (logo, empty states, illustrations)
├── tailwind.config.ts                # Tailwind config with custom colors, fonts, RTL
├── next.config.ts                    # Next.js config (images domains: cloudinary)
├── .env.local                        # Environment variables
└── middleware.ts                     # Protect /admin/* routes (redirect to login)
```

---

## ENVIRONMENT VARIABLES

```env
# Database
MONGODB_URI=mongodb+srv://...

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# NextAuth
NEXTAUTH_SECRET=your_random_secret
NEXTAUTH_URL=http://localhost:3000

# Admin (seed)
ADMIN_EMAIL=admin@kzora.com
ADMIN_PASSWORD=your_secure_password

# WhatsApp
WHATSAPP_NUMBER=963964514765
```

---

## DATABASE MODELS (MONGOOSE SCHEMAS)

### Product Schema

```typescript
const ProductSchema = new Schema({
  name: { type: String, required: true },                          // Arabic name
  slug: { type: String, required: true, unique: true },            // Auto-generated from name
  description: { type: String, required: true },                   // Rich text HTML (Arabic)
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  price_syp: { type: Number, required: true },                    // New Syrian Pound
  price_usd: { type: Number, required: true },
  discount_price_syp: { type: Number, default: null },
  discount_price_usd: { type: Number, default: null },
  images: [{
    url: { type: String, required: true },                         // Cloudinary URL
    public_id: { type: String, required: true },                   // Cloudinary public_id
    color_variant: { type: String, default: null },                // Color name (Arabic)
    order: { type: Number, default: 0 }                            // Display order
  }],
  colors: [{
    name_ar: { type: String, required: true },                     // Arabic color name
    hex_code: { type: String, required: true },                    // e.g., "#000000"
    swatch_image: {                                                // Optional swatch
      url: String,
      public_id: String
    }
  }],
  sizes: [{ type: Number }],                                       // [36, 37, 38, ...]
  tags: [{ type: String, enum: ['new', 'best_seller', 'on_sale'] }],
  view_count: { type: Number, default: 0 },
  is_featured: { type: Boolean, default: false },
  stock_status: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock'],
    default: 'in_stock'
  },
  sort_order: { type: Number, default: 0 },
  is_published: { type: Boolean, default: true },
}, { timestamps: true });

// Auto-tag logic (pre-save middleware):
// - If createdAt is within last 14 days → add 'new' tag
// - If discount_price_syp exists and < price_syp → add 'on_sale' tag
// - 'best_seller' tag is set manually by admin via sort_order or auto by view_count
```

### Category Schema

```typescript
const CategorySchema = new Schema({
  name_ar: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  image: {
    url: { type: String, required: true },
    public_id: { type: String, required: true }
  },
  description: { type: String, default: '' },
  sort_order: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });
```

### Order Schema

```typescript
const OrderSchema = new Schema({
  order_number: { type: String, required: true, unique: true },     // Auto-generated: KZ-XXXX
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    product_name: String,                                           // Snapshot at order time
    color: String,
    size: Number,
    quantity: Number,
    unit_price_syp: Number,
    unit_price_usd: Number,
  }],
  customer: {
    full_name: { type: String, required: true },
    phone: { type: String, required: true },
    governorate: { type: String, required: true },
    address: { type: String, required: true },
  },
  shipping_company: {
    type: String,
    enum: ['karam', 'qadmous', 'masarat'],
    required: true
  },
  coupon_code: { type: String, default: null },
  discount_amount_syp: { type: Number, default: 0 },
  discount_amount_usd: { type: Number, default: 0 },
  subtotal_syp: { type: Number, required: true },
  subtotal_usd: { type: Number, required: true },
  total_syp: { type: Number, required: true },
  total_usd: { type: Number, required: true },
  currency_used: { type: String, enum: ['SYP', 'USD'], default: 'SYP' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  status_history: [{
    status: String,
    changed_at: { type: Date, default: Date.now }
  }],
}, { timestamps: true });
```

### Coupon Schema

```typescript
const CouponSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  type: { type: String, enum: ['percentage', 'fixed_amount'], required: true },
  value: { type: Number, required: true },                       // 10 = 10% or 50 = 50 SYP
  min_order_syp: { type: Number, default: 0 },
  max_uses: { type: Number, default: null },                     // null = unlimited
  used_count: { type: Number, default: 0 },
  expires_at: { type: Date, default: null },
  is_active: { type: Boolean, default: true },
  auto_generated: { type: Boolean, default: false },
}, { timestamps: true });
```

### HeroSlide Schema

```typescript
const HeroSlideSchema = new Schema({
  desktop_image: {
    url: { type: String, required: true },
    public_id: { type: String, required: true }
  },
  mobile_image: {                                                  // Optional
    url: String,
    public_id: String
  },
  heading: { type: String, required: true },                       // Arabic
  sub_text: { type: String, required: true },                      // Arabic
  cta_text: { type: String, required: true },                      // Arabic
  cta_link: { type: String, required: true },                      // URL or route
  sort_order: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });
```

### HomepageSettings Schema

```typescript
const HomepageSettingsSchema = new Schema({
  promo_banner: {
    image: { url: String, public_id: String },
    link: String,
    is_active: { type: Boolean, default: false }
  },
  sections_visibility: {
    categories: { type: Boolean, default: true },
    new_arrivals: { type: Boolean, default: true },
    best_sellers: { type: Boolean, default: true },
    promo_banner: { type: Boolean, default: false },
    offers: { type: Boolean, default: true },
  }
});
// Singleton — only one document ever exists
```

### StaticPage Schema

```typescript
const StaticPageSchema = new Schema({
  slug: { type: String, required: true, unique: true },            // 'about' or 'return-policy'
  title: { type: String, required: true },                         // Arabic title
  content: { type: String, required: true },                       // Rich text HTML
  hero_image: {                                                    // Optional
    url: String,
    public_id: String
  },
}, { timestamps: true });
```

### Admin Schema

```typescript
const AdminSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },                      // bcrypt hashed
  name: { type: String, required: true },
}, { timestamps: true });
```

---

## API ROUTES — KEY BEHAVIORS

### Products API

**`GET /api/products`** — List products with filtering:
```
Query params:
  ?category=slug          — filter by category slug
  ?tag=new|best_seller|on_sale  — filter by tag
  ?search=keyword         — search in name + description (Arabic text)
  ?sort=newest|price_asc|price_desc|most_viewed
  ?size=42                — filter by available size
  ?color=أسود             — filter by color name
  ?min_price=100&max_price=500  — price range (SYP)
  ?on_sale=true           — only discounted products
  ?page=1&limit=20        — pagination
```

**`POST /api/products`** — Create product (admin only):
- Auto-generate slug from Arabic name (use a transliteration library or base64 slug)
- Auto-apply tags based on rules (new = within 14 days, on_sale = discount exists)
- Validate all required fields

**`DELETE /api/products/[id]`** — Delete product (admin only):
- **CRITICAL:** Before deleting the product document, extract ALL image `public_id` values from the product's `images` array and `colors[].swatch_image`
- Call Cloudinary bulk delete with all `public_id` values
- Then delete the product document from MongoDB

### Categories API

**`DELETE /api/categories/[id]`** — Cascade delete (admin only):
1. Find all products in this category
2. For each product: collect all image `public_id` values
3. Bulk delete ALL collected images from Cloudinary
4. Delete all products in this category from MongoDB
5. Delete the category's own image from Cloudinary
6. Delete the category document
- Show confirmation warning in the UI before this operation

### Orders API

**`POST /api/orders`** — Create new order:
1. Validate all fields (name, phone, governorate, address, shipping company)
2. Validate cart items still exist and have valid prices
3. If coupon code provided: validate coupon (active, not expired, not maxed out, min order met)
4. If coupon valid: increment `used_count` on coupon
5. Generate order number: `KZ-` + 4 random digits (ensure unique)
6. Save order with status `pending`
7. Check loyalty: count delivered orders for this phone number → if 3+, auto-generate coupon
8. Return order ID + order number

### Coupon Validation API

**`POST /api/coupons/validate`** — Validate coupon code:
```json
// Request
{ "code": "SAVE10", "order_total_syp": 500 }

// Response (success)
{ "valid": true, "type": "percentage", "value": 10, "discount_syp": 50, "discount_usd": 1.5 }

// Response (failure)
{ "valid": false, "message": "كود الخصم غير صالح أو منتهي الصلاحية" }
```

Validation checks:
1. Code exists in DB
2. `is_active === true`
3. `expires_at` is null or in the future
4. `used_count < max_uses` (or max_uses is null)
5. Order total meets `min_order_syp`

### Images API

**`POST /api/images/upload`** — Upload to Cloudinary:
- Accept: multipart form data with image file + folder path
- Upload to Cloudinary with specified folder (e.g., `kzora/products/[product_id]/`)
- Return: `{ url, public_id }`

**`DELETE /api/images/delete`** — Delete single image:
- Accept: `{ public_id: "kzora/products/abc/image1" }`
- Call `cloudinary.uploader.destroy(public_id)`
- Return: `{ success: true }`

**`DELETE /api/images/bulk-delete`** — Delete multiple images:
- Accept: `{ public_ids: ["id1", "id2", "id3"] }`
- Call `cloudinary.api.delete_resources(public_ids)`
- Return: `{ success: true, deleted_count: 3 }`

### Loyalty API

**`POST /api/loyalty/check`** — Check loyalty status:
- Accept: `{ phone: "0964514765" }`
- Count orders where `customer.phone === phone` AND `status === 'delivered'`
- If count >= 3 and no auto-generated active coupon exists for this phone:
  - Auto-generate a coupon: code = `LOYAL-` + 4 random chars, type = percentage, value = 10
  - Return: `{ eligible: true, coupon_code: "LOYAL-XXXX" }`
- Else return: `{ eligible: false, completed_orders: count, orders_until_reward: 3 - count }`

---

## KEY IMPLEMENTATION DETAILS

### 1. RTL Setup (Root Layout)

```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-noto-sans-arabic bg-[#FAF8F5] text-[#1A1A1A]">
        <Header />
        <main>{children}</main>
        <Footer />
        <WhatsAppFAB />
        <CartDrawer />
        <Toaster />
      </body>
    </html>
  );
}
```

### 2. Tailwind Config

```typescript
// tailwind.config.ts
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#FAF8F5',
        'bg-secondary': '#F2EDE8',
        'bg-tertiary': '#EDE7DF',
        'text-primary': '#1A1A1A',
        'text-secondary': '#6B6560',
        'text-muted': '#A39E99',
        'accent': '#B8860B',
        'accent-hover': '#9A7209',
        'accent-light': '#F5EDD6',
        'success': '#5A7247',
        'warning': '#C4851C',
        'error': '#A03B3B',
        'border': '#E8E4DF',
        'divider': '#D5D0CA',
      },
      fontFamily: {
        'noto-sans-arabic': ['"Noto Sans Arabic"', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'level-1': '0 1px 3px rgba(26,26,26,0.06)',
        'level-2': '0 4px 12px rgba(26,26,26,0.08)',
        'level-3': '0 8px 24px rgba(26,26,26,0.12)',
        'level-4': '0 12px 32px rgba(26,26,26,0.15)',
      },
      borderRadius: {
        'card': '8px',
        'button': '6px',
        'badge': '4px',
        'modal': '12px',
      }
    }
  },
  plugins: [require('tailwindcss-rtl')], // or use logical properties manually
}
```

### 3. Cart Store (Zustand + localStorage)

```typescript
// store/cartStore.ts
interface CartItem {
  productId: string;
  name: string;
  image: string;
  color: string;
  size: number;
  quantity: number;
  price_syp: number;
  price_usd: number;
}

interface CartState {
  items: CartItem[];
  coupon: { code: string; type: string; value: number } | null;
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, color: string, size: number) => void;
  updateQuantity: (productId: string, color: string, size: number, qty: number) => void;
  applyCoupon: (coupon: object) => void;
  removeCoupon: () => void;
  clearCart: () => void;
  toggleDrawer: () => void;
}

// Persist to localStorage using zustand/middleware persist
```

### 4. Currency Store

```typescript
// store/currencyStore.ts
interface CurrencyState {
  currency: 'SYP' | 'USD';
  toggleCurrency: () => void;
  formatPrice: (syp: number, usd: number) => string;
}

// formatPrice returns:
// If SYP: "250 ل.س" or "1,500 ل.س"
// If USD: "$15.00"
// Persist to localStorage
```

### 5. WhatsApp Order Message Builder

```typescript
// lib/whatsapp.ts
export function buildWhatsAppOrderURL(order: OrderData): string {
  const message = `
🛒 طلب جديد

📦 المنتجات:
${order.items.map(item =>
  `- ${item.name} | اللون: ${item.color} | المقاس: ${item.size} | الكمية: ${item.quantity} | السعر: ${item.price} ل.س`
).join('\n')}

💰 المجموع: ${order.total} ل.س
${order.coupon ? `🏷️ كوبون: ${order.coupon.code} (خصم: ${order.discount} ل.س)` : ''}

👤 الاسم: ${order.customer.full_name}
📱 الهاتف: ${order.customer.phone}
📍 المحافظة: ${order.customer.governorate}
🏠 العنوان: ${order.customer.address}
🚚 شركة الشحن: ${order.shipping_company}

💳 الدفع: عند الاستلام
  `.trim();

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
```

### 6. Product View Counter

- On every product detail page load, increment `view_count` via API
- Use a **debounced/throttled** approach — don't count the same session viewing the same product multiple times
- Store viewed product IDs in `sessionStorage` to avoid duplicate counts

### 7. Shipping Companies + Governorates

```typescript
// lib/constants.ts
export const SHIPPING_COMPANIES = [
  { id: 'karam', name_ar: 'كرم', is_best: true },
  { id: 'qadmous', name_ar: 'قدموس', is_best: false },
  { id: 'masarat', name_ar: 'مسارات', is_best: false },
];

export const GOVERNORATES_BY_COMPANY = {
  karam: ['دمشق', 'ريف دمشق', 'حلب', 'حمص', 'حماة', 'اللاذقية', 'طرطوس', 'إدلب', 'دير الزور', 'الحسكة', 'الرقة', 'السويداء', 'درعا', 'القنيطرة'],
  qadmous: ['دمشق', 'ريف دمشق', 'حلب', 'حمص', 'حماة', 'اللاذقية', 'طرطوس'],
  masarat: ['دمشق', 'ريف دمشق', 'حلب', 'حمص', 'حماة', 'اللاذقية', 'طرطوس', 'إدلب'],
};
// NOTE: Admin should adjust these lists based on actual company coverage.
// The above is a starting template — the actual governorate lists per company
// should be confirmed with each shipping company.
```

### 8. Auto-Tagging Logic (Server-Side)

Run as pre-save middleware on Product model or as a utility:

```typescript
function autoTagProduct(product: Product): string[] {
  const tags: string[] = [];

  // New: created within last 14 days
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  if (product.createdAt >= fourteenDaysAgo) {
    tags.push('new');
  }

  // On Sale: discount price exists and is lower than original
  if (product.discount_price_syp && product.discount_price_syp < product.price_syp) {
    tags.push('on_sale');
  }

  // Best Seller: manually set by admin via is_featured or sort_order,
  // OR auto-assigned to top 8 products by view_count (run as a cron/periodic task)

  return tags;
}
```

### 9. Image Deletion Cascade Logic

```typescript
// lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

export async function deleteImage(publicId: string) {
  return cloudinary.uploader.destroy(publicId);
}

export async function deleteImages(publicIds: string[]) {
  if (publicIds.length === 0) return;
  return cloudinary.api.delete_resources(publicIds);
}

// Usage in product deletion:
async function deleteProduct(productId: string) {
  const product = await Product.findById(productId);
  if (!product) throw new Error('Product not found');

  // Collect all public_ids
  const publicIds: string[] = [];
  product.images.forEach(img => publicIds.push(img.public_id));
  product.colors.forEach(color => {
    if (color.swatch_image?.public_id) publicIds.push(color.swatch_image.public_id);
  });

  // Delete from Cloudinary first
  await deleteImages(publicIds);

  // Then delete from MongoDB
  await Product.findByIdAndDelete(productId);
}

// Usage in category cascade deletion:
async function deleteCategoryWithCascade(categoryId: string) {
  const category = await Category.findById(categoryId);
  const products = await Product.find({ category: categoryId });

  // Collect ALL image public_ids from all products
  const allPublicIds: string[] = [];
  products.forEach(product => {
    product.images.forEach(img => allPublicIds.push(img.public_id));
    product.colors.forEach(color => {
      if (color.swatch_image?.public_id) allPublicIds.push(color.swatch_image.public_id);
    });
  });

  // Add category image
  if (category.image?.public_id) allPublicIds.push(category.image.public_id);

  // Delete all images from Cloudinary
  await deleteImages(allPublicIds);

  // Delete all products in this category
  await Product.deleteMany({ category: categoryId });

  // Delete the category
  await Category.findByIdAndDelete(categoryId);
}
```

### 10. Middleware (Admin Route Protection)

```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: { signIn: '/admin/login' }
});

export const config = {
  matcher: ['/admin/((?!login).*)']   // Protect all /admin/* except /admin/login
};
```

### 11. Admin Seed Script

Create a seed script to initialize the admin user and default data:

```typescript
// scripts/seed.ts
// Run with: npx ts-node scripts/seed.ts

// 1. Create admin user (email + bcrypt hashed password from env)
// 2. Create default homepage settings (all sections visible)
// 3. Create default static pages (About Us + Return Policy with placeholder Arabic content)
// 4. Create 4 default hero slides with placeholder data (headings/text from design spec Section 5.3)
```

---

## PAGE-BY-PAGE IMPLEMENTATION NOTES

### Homepage (`/`)
- Fetch all data in parallel using `Promise.all`: hero slides, categories, new arrivals (8 products), best sellers (8 products), offers (discounted products), homepage settings, promo banner
- Use Next.js `generateMetadata` for Arabic SEO: `<title>كزورا — أحذية فاخرة من حلب</title>`
- Each section checks `sections_visibility` from homepage settings — if `false`, don't render
- Product sections use `ProductSection` component with a `type` prop: `'scroll'` (horizontal) or `'grid'`

### Product Detail (`/product/[slug]`)
- Fetch product by slug using `generateStaticParams` for SSG or dynamic rendering
- Increment `view_count` via client-side API call (once per session per product)
- Color selector changes gallery images — filter `images` array by `color_variant`
- Size selector enables/disables the Add to Cart button
- "Add to Cart" calls `cartStore.addItem()` and shows toast "✓ تمت الإضافة"
- Related products: Fetch 8 products from the same category, exclude current product

### Checkout (`/checkout`)
- If cart is empty, redirect to `/` with toast "سلتك فارغة"
- Shipping company selector is FIRST — when changed, governorate dropdown resets and re-populates
- Karam is pre-selected by default with gold styling and "الخيار الأفضل" badge
- Phone input: `dir="ltr"` with static `+963` prefix
- On submit:
  1. Validate all fields with Zod (Arabic error messages)
  2. `POST /api/orders` — save order
  3. Show success modal (1.5 seconds, animated checkmark)
  4. Redirect to `/order-success/[orderId]`

### Order Success (`/order-success/[orderId]`)
- Fetch order details by ID
- Display order number + compact summary
- Primary CTA: WhatsApp button → `buildWhatsAppOrderURL(order)` → opens WhatsApp
- Secondary: "متابعة التسوق" → `/`
- If invalid order ID: redirect to homepage

### Admin Dashboard (`/admin`)
- Summary cards: Use MongoDB aggregation queries
  - Today's orders: `Order.countDocuments({ createdAt: { $gte: today } })`
  - Month revenue: `Order.aggregate` with `$match` this month + `$sum` total
  - Total products: `Product.countDocuments()`
  - Pending orders: `Order.countDocuments({ status: 'pending' })`
- Recent orders: Last 10 orders sorted by `createdAt` desc

### Admin Product Form (`/admin/products/new` or `/admin/products/[id]/edit`)
- Multi-step-like form (but single page — sections with labels)
- Image uploader: Drag-and-drop zone → upload to Cloudinary immediately on drop → show preview with delete button
- Color section: Dynamic repeatable fields — "إضافة لون" (Add Color) button adds new row
- Per color: Allow tagging uploaded images with that color's name
- Drag-to-reorder images using a library like `@dnd-kit/core`
- On save: Validate all fields → POST or PUT to API
- On delete image: Immediately call `/api/images/delete` with public_id

---

## CRITICAL IMPLEMENTATION RULES

1. **RTL EVERYWHERE:** Every component must work in RTL. Use Tailwind logical properties (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`) instead of `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`. Mirror all directional icons (arrows, chevrons).

2. **ARABIC ONLY IN STOREFRONT:** Every single piece of text the user sees must be in Arabic — labels, buttons, placeholders, error messages, empty states, tooltips, toast messages, meta tags. No English text anywhere in the customer-facing UI.

3. **CLOUDINARY CLEANUP:** Never orphan images. Every time a product, category, slide, or banner is deleted or its image is replaced, the OLD image must be deleted from Cloudinary using its `public_id` BEFORE uploading the new one or deleting the record.

4. **PRICES IN NEW SYP:** All SYP prices use the new Syrian Pound (3 zeros removed). A shoe that costs 250 new SYP is displayed as `250 ل.س`, NOT `250,000 ل.س`.

5. **NO DARK MODE:** Light theme only. Background is always `#FAF8F5`, never dark. Do not add a dark mode toggle or `prefers-color-scheme` media query.

6. **MOBILE-FIRST:** Build all styles mobile-first and scale up. Test every page on 375px width. Touch targets must be minimum 44px. Cart drawer is 100% width on mobile. Checkout form must be easy to fill on a small screen.

7. **GUEST CHECKOUT ONLY:** No user accounts, no registration, no login for customers. Cart is stored in `localStorage`. Loyalty is tracked by phone number on the backend.

8. **NO PAYMENT GATEWAY:** Cash on Delivery is the only payment method. Do not integrate any payment provider.

9. **WHATSAPP IS THE CONFIRMATION CHANNEL:** After order is placed and saved to DB, the user is redirected to WhatsApp with the pre-filled order message. This is the primary order confirmation flow.

10. **PERFORMANCE:** Lazy-load all images below the fold. Use Next.js `<Image>` component with Cloudinary loader. Preload Arabic fonts. Use `loading="lazy"` on images and `Suspense` boundaries for dynamic content.

---

## BUILD ORDER (RECOMMENDED SEQUENCE)

**Phase 1 — Foundation:**
1. Initialize Next.js project with TypeScript + Tailwind
2. Set up MongoDB connection + all Mongoose models
3. Set up Cloudinary config + upload/delete helpers
4. Set up NextAuth for admin authentication
5. Create root layout with RTL, fonts, global styles
6. Build `tailwind.config.ts` with all design tokens (colors, shadows, fonts, etc.)
7. Build all reusable UI components (`Button`, `Input`, `Modal`, `Toast`, `Skeleton`, etc.)
8. Build Zustand stores (cart + currency)
9. Create the seed script and run it to populate admin user + default data

**Phase 2 — Admin Dashboard:**
10. Build admin layout (sidebar + header)
11. Admin login page
12. Category CRUD (simplest — good warm-up)
13. Product CRUD (complex — images, colors, sizes)
14. Order management (list + detail + status updates)
15. Coupon management
16. Homepage management (slides, banner, sections)
17. Static pages editor

**Phase 3 — Storefront:**
18. Header + Footer + WhatsApp FAB (global components)
19. Homepage (all sections: hero slider, category grid, product sections)
20. Category page (grid + filters + infinite scroll)
21. All Products page (grid + filters + sort)
22. Product Detail page (gallery, colors, sizes, add to cart, accordions)
23. Search (overlay + results page)
24. Cart drawer
25. Checkout page (full form + validation + order creation)
26. Order success page (WhatsApp redirect)
27. About Us + Return Policy pages
28. 404 page

**Phase 4 — Polish:**
29. Animations (Framer Motion: page transitions, hover effects, micro-interactions)
30. SEO (meta tags, JSON-LD schemas, sitemap, robots.txt)
31. Performance optimization (image optimization, code splitting, font preloading)
32. Accessibility (ARIA labels, focus states, keyboard navigation, contrast)
33. Mobile testing across all breakpoints
34. Final RTL review — check every page for misaligned elements

---

## TESTING CHECKLIST

Before launching, verify:

- [ ] All storefront text is in Arabic — no English text visible
- [ ] RTL layout is correct on every page (text right-aligned, icons mirrored, drawers from correct side)
- [ ] Currency toggle works — all prices update instantly, persists across pages
- [ ] Color selector changes product images dynamically
- [ ] Size selector enables/disables Add to Cart correctly
- [ ] Cart persists in localStorage across page refreshes
- [ ] Coupon validation works (valid, expired, maxed out, minimum order)
- [ ] Shipping company selection filters governorate dropdown correctly
- [ ] Karam is pre-selected and highlighted as "الخيار الأفضل"
- [ ] Phone field shows +963 prefix and WhatsApp notice
- [ ] Payment warning "لا يمكن فحص المنتج قبل الدفع" is visible
- [ ] Order saves to database correctly
- [ ] WhatsApp redirect works with correctly formatted Arabic message
- [ ] Order success page shows correct order details
- [ ] Admin login protects all /admin/* routes
- [ ] Product CRUD works (create, edit, delete) with images
- [ ] Category cascade delete removes all products + images from Cloudinary
- [ ] Image replacement deletes old image from Cloudinary
- [ ] No orphaned images in Cloudinary after deletions
- [ ] Homepage slides, sections, and banner are manageable from admin
- [ ] Loyalty system tracks orders by phone and auto-generates coupon after 3
- [ ] 404 page shows for invalid URLs
- [ ] Mobile layout works on 375px width
- [ ] All touch targets are at least 44px
- [ ] Lazy loading works on images
- [ ] Skeleton loading shows while data fetches
- [ ] All animations respect `prefers-reduced-motion: reduce`