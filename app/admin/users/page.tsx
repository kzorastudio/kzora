import { requireCapability } from '@/lib/adminGuard'
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
  // Managing admins is reserved for super_admin.
  const session = await requireCapability('manage_admins')

  const users = await getUsers()

  return (
    <div className="flex flex-col min-h-screen" dir="rtl">
      <AdminHeader />
      
      <div className="flex-1 p-4 sm:p-6 max-w-6xl w-full mx-auto">
        <UsersClient users={users as any} currentUserId={session.id} />
      </div>
    </div>
  )
}
