import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from './supabase'
import { normalizeRole } from './permissions'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { 
    strategy: 'jwt', 
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,   // 24 hours
  },
  pages: {
    signIn: '/admin/login',
    error:  '/admin/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH] Missing credentials')
          return null
        }

        try {
          const { data: admin, error } = await supabaseAdmin
            .from('admins')
            .select('id, email, name, password_hash, role')
            .eq('email', credentials.email.toLowerCase().trim())
            .single()

          if (error || !admin) {
            console.log('[AUTH] User not found or Supabase error:', error?.message)
            return null
          }

          const passwordMatch = await bcrypt.compare(credentials.password, admin.password_hash)
          
          if (!passwordMatch) {
            console.log('[AUTH] Password does not match for:', admin.email)
            return null
          }

          console.log('[AUTH] Success for:', admin.email)
          return {
            id:    admin.id,
            email: admin.email,
            name:  admin.name,
            // Fall back to the column default rather than to a privileged role:
            // a NULL/unknown role must never grant more access than it should.
            role:  normalizeRole(admin.role || 'employee'),
          }
        } catch (err: any) {
          console.error('[AUTH] Catch-all error:', err.message)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id    = user.id
        token.email = user.email
        token.name  = user.name
        token.role  = (user as any).role
        token.roleCheckedAt = Date.now()
      }

      // Re-fetch role from DB so a demotion/promotion takes effect,
      // but throttle it (once every 5 minutes) to avoid frequent DB hits,
      // and critically NEVER invalidate the token if there is a network/DB glitch.
      if (token?.id) {
        const now = Date.now()
        const lastChecked = (token.roleCheckedAt as number) || 0
        const shouldCheck = now - lastChecked > 5 * 60 * 1000

        if (shouldCheck) {
          try {
            const { data: admin, error } = await supabaseAdmin
              .from('admins')
              .select('role, name')
              .eq('id', token.id as string)
              .maybeSingle()

            if (error) {
              // Supabase returned an error (timeout, network hiccup, rate limit, etc.)
              // Keep the existing token values rather than locking the user out!
              console.error('[AUTH] Supabase error while checking admin role:', error.message)
            } else if (admin) {
              token.role = normalizeRole(admin.role || 'employee')
              token.name = admin.name
              token.roleCheckedAt = now
            } else {
              // Admin was genuinely deleted from the database (admin is null and error is null)
              token.role = undefined
            }
          } catch (err: any) {
            // On unhandled exception, keep the existing token values rather than locking the user out
            console.error('[AUTH] Catch-all error while checking admin role:', err?.message)
          }
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id    = token.id as string
        session.user.email = token.email as string
        session.user.name  = token.name as string
        session.user.role  = normalizeRole(token.role)
      }
      return session
    },
  },
}

// Helper to hash password for seeding
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}
