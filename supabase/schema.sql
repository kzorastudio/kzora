-- ============================================================
-- KZORA كزورا — Supabase Schema with Row Level Security
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar         TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  image_url       TEXT NOT NULL,
  image_public_id TEXT NOT NULL,
  description     TEXT DEFAULT '',
  sort_order      INTEGER DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  show_in_header  BOOLEAN DEFAULT false,
  show_in_footer  BOOLEAN DEFAULT false,
  show_in_home    BOOLEAN DEFAULT false,
  header_order    INTEGER DEFAULT 0,
  footer_order    INTEGER DEFAULT 0,
  home_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                  TEXT NOT NULL,
  slug                  TEXT NOT NULL UNIQUE,
  description           TEXT NOT NULL DEFAULT '',
  category_id           UUID REFERENCES categories(id) ON DELETE SET NULL,
  price_syp             NUMERIC(12,2) NOT NULL,
  price_usd             NUMERIC(10,2) NOT NULL,
  discount_price_syp    NUMERIC(12,2) DEFAULT NULL,
  discount_price_usd    NUMERIC(10,2) DEFAULT NULL,
  mold_type             TEXT NOT NULL DEFAULT 'normal' CHECK (mold_type IN ('chinese','normal')),
  stock_status          TEXT NOT NULL DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock','low_stock','out_of_stock')),
  is_featured           BOOLEAN DEFAULT false,
  is_published          BOOLEAN DEFAULT true,
  sort_order            INTEGER DEFAULT 0,
  view_count            INTEGER DEFAULT 0,
  multi_discount_enabled     BOOLEAN DEFAULT false,
  multi_discount_2_items_syp INTEGER DEFAULT 0,
  multi_discount_2_items_usd NUMERIC(10,2) DEFAULT 0,
  multi_discount_3_plus_syp  INTEGER DEFAULT 0,
  multi_discount_3_plus_usd  NUMERIC(10,2) DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Product Images
CREATE TABLE IF NOT EXISTS product_images (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  public_id       TEXT NOT NULL,
  color_variant   TEXT DEFAULT NULL,
  display_order   INTEGER DEFAULT 0,
  is_main         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Product Colors
CREATE TABLE IF NOT EXISTS product_colors (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name_ar         TEXT NOT NULL,
  hex_code        TEXT NOT NULL,
  swatch_url      TEXT DEFAULT NULL,
  swatch_public_id TEXT DEFAULT NULL,
  is_available    BOOLEAN DEFAULT true
);

-- Product Sizes
CREATE TABLE IF NOT EXISTS product_sizes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size          NUMERIC NOT NULL,
  is_available  BOOLEAN DEFAULT true
);

-- Product Tags
CREATE TABLE IF NOT EXISTS product_tags (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag         TEXT NOT NULL CHECK (tag IN ('new','best_seller','on_sale'))
);

-- Product Variants (Inventory by Color + Size)
CREATE TABLE IF NOT EXISTS product_variants (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color       TEXT DEFAULT '',
  size        NUMERIC DEFAULT 0,
  quantity    INTEGER NOT NULL DEFAULT 0,
  UNIQUE(product_id, color, size)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number        TEXT NOT NULL UNIQUE,
  customer_full_name  TEXT NOT NULL,
  customer_phone      TEXT NOT NULL,
  customer_governorate TEXT NOT NULL,
  customer_address    TEXT NOT NULL,
  shipping_company    TEXT NOT NULL DEFAULT '',
  delivery_type       TEXT NOT NULL DEFAULT 'shipping' CHECK (delivery_type IN ('delivery','shipping')),
  shipping_fee_syp    NUMERIC(12,2) DEFAULT 0,
  shipping_fee_usd    NUMERIC(10,2) DEFAULT 0,
  shipping_fee_determined BOOLEAN DEFAULT false,
  payment_method      TEXT DEFAULT 'cod',
  payment_transaction_id TEXT DEFAULT NULL,
  coupon_code         TEXT DEFAULT NULL,
  discount_amount_syp NUMERIC(12,2) DEFAULT 0,
  discount_amount_usd NUMERIC(10,2) DEFAULT 0,
  loyalty_discount_syp NUMERIC(12,2) DEFAULT 0,
  loyalty_discount_usd NUMERIC(10,2) DEFAULT 0,
  subtotal_syp        NUMERIC(12,2) NOT NULL,
  subtotal_usd        NUMERIC(10,2) NOT NULL,
  total_syp           NUMERIC(12,2) NOT NULL,
  total_usd           NUMERIC(10,2) NOT NULL,
  currency_used       TEXT DEFAULT 'SYP' CHECK (currency_used IN ('SYP','USD')),
  status              TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  notes               TEXT DEFAULT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name    TEXT NOT NULL,
  product_image   TEXT DEFAULT NULL,
  color           TEXT DEFAULT NULL,
  size            NUMERIC DEFAULT NULL,
  quantity        INTEGER NOT NULL DEFAULT 1,
  unit_price_syp  NUMERIC(12,2) NOT NULL,
  unit_price_usd  NUMERIC(10,2) NOT NULL
);

-- Order Status History
CREATE TABLE IF NOT EXISTS order_status_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status      TEXT NOT NULL,
  changed_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            TEXT NOT NULL UNIQUE,
  type            TEXT NOT NULL CHECK (type IN ('percentage','fixed_amount')),
  value           NUMERIC(10,2) NOT NULL,
  min_order_syp   NUMERIC(12,2) DEFAULT 0,
  max_uses        INTEGER DEFAULT NULL,
  used_count      INTEGER DEFAULT 0,
  expires_at      TIMESTAMPTZ DEFAULT NULL,
  is_active       BOOLEAN DEFAULT true,
  auto_generated  BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Hero Slides
CREATE TABLE IF NOT EXISTS hero_slides (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  desktop_image_url       TEXT NOT NULL,
  desktop_image_public_id TEXT NOT NULL,
  mobile_image_url        TEXT DEFAULT NULL,
  mobile_image_public_id  TEXT DEFAULT NULL,
  heading                 TEXT NOT NULL,
  sub_text                TEXT NOT NULL,
  cta_text                TEXT NOT NULL,
  cta_link                TEXT NOT NULL,
  sort_order              INTEGER DEFAULT 0,
  is_active               BOOLEAN DEFAULT true,
  heading_color          TEXT DEFAULT '#1A1A1A',
  accent_color           TEXT DEFAULT '#785600',
  subtext_color          TEXT DEFAULT '#4A4742',
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Homepage Settings (singleton)
CREATE TABLE IF NOT EXISTS homepage_settings (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promo_banner_url            TEXT DEFAULT NULL,
  promo_banner_public_id      TEXT DEFAULT NULL,
  promo_banner_link           TEXT DEFAULT NULL,
  promo_banner_active         BOOLEAN DEFAULT false,
  section_categories          BOOLEAN DEFAULT true,
  section_new_arrivals        BOOLEAN DEFAULT true,
  section_best_sellers        BOOLEAN DEFAULT true,
  section_promo_banner        BOOLEAN DEFAULT false,
  section_offers              BOOLEAN DEFAULT true,
  promo_banner_heading        TEXT DEFAULT '',
  promo_banner_subtext        TEXT DEFAULT '',
  promo_banner_button_text    TEXT DEFAULT '',
  section_stats               BOOLEAN DEFAULT true,
  stat_customers_count        TEXT DEFAULT '5000+',
  stat_satisfaction_rate      TEXT DEFAULT '99%',
  stat_returns_count          TEXT DEFAULT '1%',
  stat_exchanges_count        TEXT DEFAULT '2%',
  shipping_policy             TEXT DEFAULT '',
  return_policy               TEXT DEFAULT '',
  hero_badge_text             TEXT DEFAULT '',
  hero_badge_color            TEXT DEFAULT '#785600',
  sham_cash_enabled           BOOLEAN DEFAULT false,
  sham_cash_number            TEXT DEFAULT '',
  sham_cash_image_url         TEXT DEFAULT NULL,
  sham_cash_public_id         TEXT DEFAULT NULL,
  sham_cash_instructions      TEXT DEFAULT '',
  discount_multi_items_enabled BOOLEAN DEFAULT false,
  discount_2_items_syp        INTEGER DEFAULT 2000,
  discount_2_items_usd        NUMERIC(10,2) DEFAULT 0,
  discount_3_items_plus_syp   INTEGER DEFAULT 3000,
  discount_3_items_plus_usd   NUMERIC(10,2) DEFAULT 0,
  delivery_fee_syp            BIGINT DEFAULT 0,
  delivery_fee_usd            NUMERIC(10,2) DEFAULT 0,
  shipping_fee_1_piece_syp    BIGINT DEFAULT 0,
  shipping_fee_1_piece_usd    NUMERIC(10,2) DEFAULT 0,
  shipping_fee_2_pieces_syp   BIGINT DEFAULT 0,
  shipping_fee_2_pieces_usd   NUMERIC(10,2) DEFAULT 0,
  shipping_fee_3_plus_pieces_syp BIGINT DEFAULT 0,
  shipping_fee_3_plus_pieces_usd NUMERIC(10,2) DEFAULT 0,
  delivery_fee_1_piece_syp    BIGINT DEFAULT 0,
  delivery_fee_1_piece_usd    NUMERIC(10,2) DEFAULT 0,
  delivery_fee_2_pieces_syp   BIGINT DEFAULT 0,
  delivery_fee_2_pieces_usd   NUMERIC(10,2) DEFAULT 0,
  delivery_fee_3_plus_pieces_syp BIGINT DEFAULT 0,
  delivery_fee_3_plus_pieces_usd NUMERIC(10,2) DEFAULT 0,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- Static Pages (about, return-policy)
CREATE TABLE IF NOT EXISTS static_pages (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug              TEXT NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  content           TEXT NOT NULL DEFAULT '',
  hero_image_url    TEXT DEFAULT NULL,
  hero_image_public_id TEXT DEFAULT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Admins
CREATE TABLE IF NOT EXISTS admins (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Shipping Companies
CREATE TABLE IF NOT EXISTS shipping_methods (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT DEFAULT NULL,
  badge       TEXT DEFAULT NULL,
  is_active   BOOLEAN DEFAULT true,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Shipping Governorates & Fees
CREATE TABLE IF NOT EXISTS shipping_governorates (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  method_id         UUID REFERENCES shipping_methods(id) ON DELETE CASCADE,
  governorate_name  TEXT NOT NULL,
  fee_syp           BIGINT DEFAULT 0,
  fee_usd           NUMERIC(10,2) DEFAULT 0,
  is_active         BOOLEAN DEFAULT true,
  branch_addresses  TEXT DEFAULT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Product Reviews
CREATE TABLE IF NOT EXISTS product_reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_name     TEXT NOT NULL,
  rating        INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment       TEXT DEFAULT '',
  is_published  BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Site Visits (analytics)
CREATE TABLE IF NOT EXISTS site_visits (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  TEXT NOT NULL,
  page_path   TEXT NOT NULL,
  user_agent  TEXT DEFAULT '',
  visited_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Loyalty Points
CREATE TABLE IF NOT EXISTS loyalty_points (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_phone  VARCHAR(50) NOT NULL,
  order_id        UUID REFERENCES orders(id) ON DELETE CASCADE,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  cycle_used      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_products_category    ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug        ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_published   ON products(is_published);
CREATE INDEX IF NOT EXISTS idx_products_featured    ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_product_images_pid   ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_colors_pid   ON product_colors(product_id);
CREATE INDEX IF NOT EXISTS idx_product_sizes_pid    ON product_sizes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_pid     ON product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_phone         ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order    ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug      ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_coupons_code         ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_shipping_gov_method  ON shipping_governorates(method_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_pid   ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_pub   ON product_reviews(is_published);
CREATE INDEX IF NOT EXISTS idx_site_visits_session   ON site_visits(session_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_visited   ON site_visits(visited_at);
CREATE INDEX IF NOT EXISTS idx_loyalty_phone          ON loyalty_points(customer_phone);
CREATE INDEX IF NOT EXISTS idx_loyalty_phone_status   ON loyalty_points(customer_phone, status);
CREATE INDEX IF NOT EXISTS idx_loyalty_order          ON loyalty_points(order_id);

-- ============================================================
-- TRIGGERS — auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_categories_updated
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_products_updated
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_orders_updated
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_coupons_updated
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_hero_slides_updated
  BEFORE UPDATE ON hero_slides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_homepage_settings_updated
  BEFORE UPDATE ON homepage_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_static_pages_updated
  BEFORE UPDATE ON static_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images     ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_colors     ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sizes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags       ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants   ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons            ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_slides        ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE static_pages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins             ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_methods   ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_governorates ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews    ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits        ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points     ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PUBLIC READ POLICIES (anon role)
-- ============================================================

-- Categories: public can read active categories
CREATE POLICY "public_read_categories" ON categories
  FOR SELECT TO anon
  USING (is_active = true);

-- Products: public can read published products
CREATE POLICY "public_read_products" ON products
  FOR SELECT TO anon
  USING (is_published = true);

-- Product supporting tables: public can read
CREATE POLICY "public_read_product_images" ON product_images
  FOR SELECT TO anon USING (true);

CREATE POLICY "public_read_product_colors" ON product_colors
  FOR SELECT TO anon USING (true);

CREATE POLICY "public_read_product_sizes" ON product_sizes
  FOR SELECT TO anon USING (true);

CREATE POLICY "public_read_product_tags" ON product_tags
  FOR SELECT TO anon USING (true);

CREATE POLICY "public_read_product_variants" ON product_variants
  FOR SELECT TO anon USING (true);

-- Hero slides: public can read active slides
CREATE POLICY "public_read_hero_slides" ON hero_slides
  FOR SELECT TO anon
  USING (is_active = true);

-- Homepage settings: public can read
CREATE POLICY "public_read_homepage_settings" ON homepage_settings
  FOR SELECT TO anon USING (true);

-- Static pages: public can read
CREATE POLICY "public_read_static_pages" ON static_pages
  FOR SELECT TO anon USING (true);

-- Shipping: public can read
CREATE POLICY "public_read_shipping_methods" ON shipping_methods
  FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "public_read_shipping_governorates" ON shipping_governorates
  FOR SELECT TO anon USING (is_active = true);

-- Product Reviews: public can read published, insert new
CREATE POLICY "public_read_product_reviews" ON product_reviews
  FOR SELECT TO anon USING (is_published = true);

CREATE POLICY "public_insert_product_reviews" ON product_reviews
  FOR INSERT TO anon WITH CHECK (true);

-- Site Visits: public can insert visit tracking, cannot read
CREATE POLICY "public_insert_site_visits" ON site_visits
  FOR INSERT TO anon WITH CHECK (true);

-- ============================================================
-- SERVICE ROLE FULL ACCESS POLICIES
-- All API routes use the service role key — full access
-- ============================================================

-- Categories: service role full access
CREATE POLICY "service_role_all_categories" ON categories
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Products: service role full access
CREATE POLICY "service_role_all_products" ON products
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_product_images" ON product_images
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_product_colors" ON product_colors
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_product_sizes" ON product_sizes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_product_tags" ON product_tags
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_product_variants" ON product_variants
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Orders: service role only (no public access)
CREATE POLICY "service_role_all_orders" ON orders
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_order_items" ON order_items
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_order_status_history" ON order_status_history
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Coupons: service role only
CREATE POLICY "service_role_all_coupons" ON coupons
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Hero slides: service role full access
CREATE POLICY "service_role_all_hero_slides" ON hero_slides
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Homepage settings: service role full access
CREATE POLICY "service_role_all_homepage_settings" ON homepage_settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Static pages: service role full access
CREATE POLICY "service_role_all_static_pages" ON static_pages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Admins: service role only
CREATE POLICY "service_role_all_admins" ON admins
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_shipping_methods" ON shipping_methods
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_shipping_governorates" ON shipping_governorates
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_product_reviews" ON product_reviews
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_site_visits" ON site_visits
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_loyalty_points" ON loyalty_points
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Insert singleton homepage settings
INSERT INTO homepage_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Insert default static pages
INSERT INTO static_pages (slug, title, content) VALUES
('about',
 'من نحن',
 '<p>كزورا — وجهتكم الأولى للأحذية الكلاسيكية والفاخرة في سوريا. جودة استثنائية وتصاميم تليق بذوقكم الرفيع.</p>'
),
('return-policy',
 'سياسة الإرجاع',
 '<p>يمكنك إرجاع أو استبدال المنتج خلال 14 يوماً من تاريخ الاستلام، بشرط أن يكون في حالته الأصلية وتغليفه الأصلي.</p>'
),
('privacy-policy',
 'سياسة الخصوصية',
 '<p>نحن في كزورا نلتزم بحماية خصوصية بياناتك ومعلوماتك الشخصية ولن نقوم بمشاركتها مع أطراف ثالثة إلا في حدود تقديم الخدمة.</p>'
),
('terms',
 'الشروط والأحكام',
 '<p>استخدامك لموقع كزورا يعني موافقتك على جميع الشروط والأحكام الموضحة لضمان تجربة تسوق آمنة ومريحة للجميع.</p>'
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- HELPER FUNCTION: Get full product with relations
-- ============================================================

CREATE OR REPLACE FUNCTION get_product_with_relations(p_slug TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'product', row_to_json(p),
    'images',  (SELECT json_agg(row_to_json(pi)) FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.display_order),
    'colors',  (SELECT json_agg(row_to_json(pc)) FROM product_colors pc WHERE pc.product_id = p.id),
    'sizes',   (SELECT json_agg(ps.size ORDER BY ps.size) FROM product_sizes ps WHERE ps.product_id = p.id),
    'tags',    (SELECT json_agg(pt.tag) FROM product_tags pt WHERE pt.product_id = p.id),
    'variants',(SELECT json_agg(row_to_json(pv)) FROM product_variants pv WHERE pv.product_id = p.id),
    'category',(SELECT row_to_json(c) FROM categories c WHERE c.id = p.category_id)
  )
  INTO result
  FROM products p
  WHERE p.slug = p_slug AND p.is_published = true;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


