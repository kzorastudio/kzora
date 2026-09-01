import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authOptions } from './auth'
import { getAuthSession } from './getSession'
import { can, homePathFor, normalizeRole, type AdminRole, type Capability } from './permissions'

// ─── Server Components (admin pages) ─────────────────────────────────────────

export interface AdminGuardResult {
  id: string
  name: string
  email: string
  role: AdminRole
}

/**
 * Guards an admin page. Redirects to the login page when signed out, or to the
 * role's own landing page when it lacks the capability — so a hidden link typed
 * manually into the address bar is rejected on the server, not just hidden in the UI.
 */
export async function requireCapability(capability: Capability): Promise<AdminGuardResult> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/admin/login')
  }

  const role = normalizeRole(session.user.role)

  // A revoked/unknown role has no capabilities — send it back to the login page.
  if (!role) {
    redirect('/admin/login')
  }

  if (!can(role, capability)) {
    redirect(homePathFor(role))
  }

  return {
    id:    session.user.id,
    name:  session.user.name,
    email: session.user.email,
    role,
  }
}

/** Same as requireCapability but only requires a signed-in admin of any tier. */
export async function requireAdmin(): Promise<AdminGuardResult> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/admin/login')
  }

  const role = normalizeRole(session.user.role)
  if (!role) {
    redirect('/admin/login')
  }

  return {
    id:    session.user.id,
    name:  session.user.name,
    email: session.user.email,
    role,
  }
}

// ─── Route Handlers (API) ────────────────────────────────────────────────────

export interface ApiSession {
  id: string
  role: AdminRole
  name?: string
  email?: string
}

/**
 * Authorizes an API request. Returns either the caller's session or a ready-made
 * error response — never both:
 *
 *   const auth = await authorizeApi(request, 'manage_catalog')
 *   if ('response' in auth) return auth.response
 *   // auth.session is the caller
 */
export async function authorizeApi(
  request: NextRequest,
  capability: Capability
): Promise<{ session: ApiSession } | { response: NextResponse }> {
  const token = await getAuthSession(request)

  if (!token) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const role = normalizeRole((token as any).role)

  if (!role || !can(role, capability)) {
    return {
      response: NextResponse.json(
        { error: 'غير مصرح لك بهذا الإجراء' },
        { status: 403 }
      ),
    }
  }

  return {
    session: {
      id:    (token as any).id as string,
      role,
      name:  (token as any).name as string | undefined,
      email: (token as any).email as string | undefined,
    },
  }
}

/** Authorizes an API request for any signed-in admin, returning the normalized role. */
export async function authorizeAnyAdmin(
  request: NextRequest
): Promise<{ session: ApiSession } | { response: NextResponse }> {
  const token = await getAuthSession(request)

  if (!token) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const role = normalizeRole((token as any).role)
  if (!role) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  return {
    session: {
      id:    (token as any).id as string,
      role,
      name:  (token as any).name as string | undefined,
      email: (token as any).email as string | undefined,
    },
  }
}
