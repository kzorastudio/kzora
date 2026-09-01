// ─────────────────────────────────────────────────────────────────────────────
// Central permission model — the single source of truth for admin roles.
//
// Four tiers, from most to least privileged:
//
//   super_admin  المدير العام   — everything, including revenue figures and
//                                 managing admins/employees.
//   manager      مسؤول          — everything EXCEPT managing admins/employees and
//                                 seeing statistics/revenue.
//   employee     موظف           — products + their own manual orders (the tier the
//                                 existing employees are on; unchanged behaviour).
//   order_staff  موظف طلبات     — manual orders only: create, and edit/delete the
//                                 ones they created. No products, no store content,
//                                 no stats, no customer orders.
//
// Anything not listed in a role's capability set is denied. New admin pages and
// API routes must be added here rather than growing ad-hoc `role === '...'` checks.
// ─────────────────────────────────────────────────────────────────────────────

export type AdminRole = 'super_admin' | 'manager' | 'employee' | 'order_staff'

/** Roles that may exist in the `admins.role` column. Any other value is rejected
 *  outright by `normalizeRole`, so an unknown/corrupt value can never escalate. */
export const ADMIN_ROLES: AdminRole[] = ['super_admin', 'manager', 'employee', 'order_staff']

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'مدير عام (صلاحيات كاملة)',
  manager:     'مسؤول (كل شيء عدا الأرباح وإدارة الموظفين)',
  employee:    'موظف (المنتجات + طلبياته)',
  order_staff: 'موظف طلبات (طلبياته فقط)',
}

export const ROLE_SHORT_LABELS: Record<AdminRole, string> = {
  super_admin: 'مدير عام',
  manager:     'مسؤول',
  employee:    'موظف',
  order_staff: 'موظف طلبات',
}

export const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  super_admin: 'كل شيء: الطلبات، المنتجات، محتوى المتجر، الإحصائيات، وإدارة الموظفين.',
  manager:     'يرى كل طلبات الموقع ويدير المنتجات ومحتوى المتجر. لا يرى الأرباح والإحصائيات ولا يدير الموظفين.',
  employee:    'يرى المنتجات ويديرها، ويرى طلبياته اليدوية فقط (لا يرى طلبات الزبائن).',
  order_staff: 'يرفع طلبيات يدوية ويعدّل ويحذف ما أنشأه هو فقط. لا يرى المنتجات ولا الإحصائيات.',
}

// ─── Capabilities ────────────────────────────────────────────────────────────

export type Capability =
  /** Open the admin dashboard home page. */
  | 'view_dashboard'
  /** Sales/visitor statistics and revenue figures. */
  | 'view_stats'
  /** See the products list in the admin panel. */
  | 'view_products'
  /** Create/edit/delete products and their images. */
  | 'manage_products'
  /** Create/edit/delete categories, coupons and reviews. Deliberately separate
   *  from manage_products: the `employee` tier edits products but has never had
   *  these pages in its menu, and that stays true. */
  | 'manage_catalog'
  /** Create/edit/delete store content: homepage, navigation, pages, shipping. */
  | 'manage_content'
  /** See customer (store) orders, not just their own manual ones. */
  | 'view_all_orders'
  /** Create manual (staff) orders. */
  | 'create_staff_orders'
  /** Bulk printing / print-data endpoints. */
  | 'print_orders'
  /** Add, remove, or change the role of admins. */
  | 'manage_admins'

const CAPABILITIES: Record<AdminRole, Capability[]> = {
  super_admin: [
    'view_dashboard', 'view_stats', 'view_products', 'manage_products',
    'manage_catalog', 'manage_content', 'view_all_orders', 'create_staff_orders',
    'print_orders', 'manage_admins',
  ],
  // Deliberately without view_stats: revenue and sales totals stay with the owner.
  manager: [
    'view_dashboard', 'view_products', 'manage_products', 'manage_catalog',
    'manage_content', 'view_all_orders', 'create_staff_orders', 'print_orders',
  ],
  // Exactly what these accounts can do today: the products pages and their own
  // manual orders — nothing else appears in their menu.
  employee: [
    'view_products', 'manage_products', 'create_staff_orders',
  ],
  order_staff: [
    'create_staff_orders',
  ],
}

/**
 * Normalizes any stored/JWT role value.
 *
 * Returns `null` — not a fallback role — for a missing/unknown value. A deleted
 * admin keeps a technically valid JWT until it expires, and `lib/auth.ts` clears
 * the role on that token; mapping it to any real tier would leave a removed
 * employee still able to act. `null` has no capabilities at all, so such a session
 * is denied everywhere and has to sign in again.
 */
export function normalizeRole(role: unknown): AdminRole | null {
  return ADMIN_ROLES.includes(role as AdminRole) ? (role as AdminRole) : null
}

/** The one check every page and API route should use. */
export function can(role: unknown, capability: Capability): boolean {
  const normalized = normalizeRole(role)
  if (!normalized) return false
  return CAPABILITIES[normalized].includes(capability)
}

/** True when this role sees only the orders it created itself. */
export function isOwnOrdersOnly(role: unknown): boolean {
  return !can(role, 'view_all_orders')
}

/** Landing page for a role that lacks access to the page it requested. */
export function homePathFor(role: unknown): string {
  const r = normalizeRole(role)
  if (!r) return '/admin/login'
  if (can(r, 'view_dashboard')) return '/admin'
  if (can(r, 'view_products'))  return '/admin/products'
  return '/admin/staff-orders'
}
