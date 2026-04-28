import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import AdminHeader from '@/components/admin/AdminHeader'
import UsersClient from './UsersClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getUsers() {
  const { data } = await supabaseAdmin
    .from('admins')
    .select('id, name, email, role, created_at')
    .order('created_at', { ascending: true })
    
  return data || []
}

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions)
  
  // Only super_admin can access the users page
  if (session?.user?.role !== 'super_admin') {
    redirect('/admin/products')
  }

  const users = await getUsers()

  return (
    <div className="flex flex-col min-h-screen" dir="rtl">
      <AdminHeader />
      
      <div className="flex-1 p-6 max-w-6xl w-full mx-auto">
        <UsersClient users={users as any} currentUserId={session.user.id} />
      </div>
    </div>
  )
}
