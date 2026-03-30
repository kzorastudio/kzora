import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

export async function getAuthSession(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET
  const isProduction = process.env.NODE_ENV === 'production'
  
  let token = await getToken({ req, secret, secureCookie: isProduction })
  
  if (!token) {
    token = await getToken({ req, secret, secureCookie: false })
  }
  return token
}
