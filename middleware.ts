import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { can, homePathFor, normalizeRole, type Capability } from '@/lib/permissions'

/**
 * Capability required to open each admin page, most specific prefix first.
 *
 * This is the single choke point for page access: it covers client components
 * too, which cannot run a server-side guard of their own. Individual pages and
 * API routes still enforce their own rules (ownership in particular) — this only
 * decides whether the page may be opened at all.
 *
 * A path not listed here needs a signed-in admin of any tier. `/admin/orders/[id]`
 * is deliberately open to every tier: the page itself hides orders the viewer
 * does not own.
 */
const PAGE_RULES: { prefix: string; capability: Capability }[] = [
  { prefix: '/admin/users',          capability: 'manage_admins'  },
  { prefix: '/admin/stats-preview',  capability: 'view_stats'     },
  { prefix: '/admin/stats',          capability: 'view_stats'     },
  { prefix: '/admin/products/new',   capability: 'manage_products' },
  { prefix: '/admin/products',       capability: 'view_products'  },
  { prefix: '/admin/categories',     capability: 'manage_catalog' },
  { prefix: '/admin/coupons',        capability: 'manage_catalog' },
  { prefix: '/admin/reviews',        capability: 'manage_catalog' },
  { prefix: '/admin/homepage',       capability: 'manage_content' },
  { prefix: '/admin/navigation',     capability: 'manage_content' },
  { prefix: '/admin/pages',          capability: 'manage_content' },
  { prefix: '/admin/shipping',       capability: 'manage_content' },
  { prefix: '/admin/orders/print',   capability: 'print_orders'   },
  { prefix: '/admin/staff-orders',   capability: 'create_staff_orders' },
]

/** Trailing slashes and query strings are already stripped from `path`. */
function requiredCapability(path: string): Capability | null {
  for (const rule of PAGE_RULES) {
    if (path === rule.prefix || path.startsWith(rule.prefix + '/')) {
      return rule.capability
    }
  }

  // The orders list (but not a single order's page) needs the full-orders view.
  if (path === '/admin/orders') return 'view_all_orders'

  // The dashboard itself.
  if (path === '/admin') return 'view_dashboard'

  return null
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const path = url.pathname.replace(/\/+$/, '') || '/admin'

  // Allow access to public admin routes (using startsWith to handle trailing slashes/queries)
  if (path.startsWith('/admin/login') || path.startsWith('/admin/setup')) {
    return NextResponse.next()
  }

  // Try to get the token (Edge-compatible)
  // We use the secret explicitly so it always works on Vercel Edge Runtime
  const secret = process.env.NEXTAUTH_SECRET
  const isProduction = process.env.NODE_ENV === 'production'

  // Explicitly tell NextAuth which cookie to look for to bypass Vercel Proxy protocol confusion
  let token = await getToken({
    req,
    secret,
    secureCookie: isProduction
  })

  // Fallback: try the opposite secureCookie flag in case NEXTAUTH_URL protocol
  // differs from the actual request protocol (e.g. https NEXTAUTH_URL in dev).
  if (!token) {
    token = await getToken({
      req,
      secret,
      secureCookie: !isProduction
    })
  }

  if (!token) {
    // Redirect to login if unauthenticated
    const url = req.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  // ─── Role check ────────────────────────────────────────────────────────────
  // `lib/auth.ts` re-reads the role from the database on every request and clears
  // it when the account no longer exists, so a removed admin lands here with no
  // role and is sent back to the login page.
  const role = normalizeRole((token as any).role)

  if (!role) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/admin/login'
    return NextResponse.redirect(loginUrl)
  }

  const capability = requiredCapability(path)

  if (capability && !can(role, capability)) {
    const target = homePathFor(role)
    // Never redirect a page onto itself — that would loop.
    if (target !== path) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = target
      redirectUrl.search = ''
      return NextResponse.redirect(redirectUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/admin'],
}
