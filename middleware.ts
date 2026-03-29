import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default function middleware(req: any) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/admin'],
}
