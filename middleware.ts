import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const host = req.headers.get('host') || ''
  const path = url.pathname

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
  
  // Fallback just in case NEXTAUTH_URL forced a non-secure cookie even in production
  if (!token) {
    token = await getToken({
      req,
      secret,
      secureCookie: false
    })
  }
  
  if (!token) {
    // Redirect to login if unauthenticated
    const url = req.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/admin'],
}
