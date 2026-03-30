import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const path = req.nextUrl.pathname
        
        // Allow access to public admin routes
        if (path === '/admin/login' || path === '/admin/setup') {
          return true
        }
        
        // Ensure user is authenticated for all other admin routes
        return !!token
      }
    },
    pages: {
      signIn: '/admin/login',
    }
  }
)

export const config = {
  matcher: ['/admin/:path*', '/admin'],
}
