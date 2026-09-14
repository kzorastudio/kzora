import 'next-auth'
import type { AdminRole } from '@/lib/permissions'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      /** null when the account was removed or the stored role is unknown. */
      role: AdminRole | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: AdminRole | null
    roleCheckedAt?: number
  }
}
