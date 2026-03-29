import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from './supabase'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 }, // 24 hours
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
            .select('id, email, name, password_hash')
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
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id    = token.id as string
        session.user.email = token.email as string
        session.user.name  = token.name as string
      }
      return session
    },
  },
}

// Helper to hash password for seeding
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}
