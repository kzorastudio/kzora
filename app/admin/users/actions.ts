'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { authOptions } from '@/lib/auth'
import { can, normalizeRole } from '@/lib/permissions'
import bcrypt from 'bcryptjs'

/**
 * Server Actions are POST endpoints reachable by anyone who knows the action id —
 * a page-level guard does NOT protect them. Every action below therefore checks
 * the caller's own session before touching the admins table.
 */
async function requireSuperAdmin(): Promise<{ id: string } | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || !can(session.user.role, 'manage_admins')) {
    return { error: 'غير مصرح لك بإدارة الموظفين' }
  }

  return { id: session.user.id }
}

export async function createUser(data: any) {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth

  const { name, email, password, role } = data
  if (!name || !email || !password || !role) {
    return { error: 'جميع الحقول مطلوبة' }
  }

  const safeRole = normalizeRole(role)
  if (!safeRole) {
    return { error: 'الصلاحية المحددة غير صالحة' }
  }

  if (typeof password !== 'string' || password.length < 6) {
    return { error: 'كلمة السر يجب أن تكون 6 أحرف على الأقل' }
  }

  try {
    const password_hash = await bcrypt.hash(password, 12)
    const { error } = await supabaseAdmin.from('admins').insert({
      name,
      email: email.toLowerCase().trim(),
      password_hash,
      role: safeRole
    })

    if (error) {
      if (error.code === '23505') {
         return { error: 'هذا الإيميل مستخدم مسبقاً' }
      }
      return { error: error.message }
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function updateUserPassword(id: string, newPassword: string) {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth

  if (!newPassword || newPassword.length < 6) {
    return { error: 'كلمة السر يجب أن تكون 6 أحرف على الأقل' }
  }

  try {
    const password_hash = await bcrypt.hash(newPassword, 12)
    const { error } = await supabaseAdmin
      .from('admins')
      .update({ password_hash })
      .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

/** Changes an admin's tier. Self-demotion is blocked so the store can never be
 *  left without an owner who can manage admins. */
export async function updateUserRole(id: string, role: string) {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth

  const safeRole = normalizeRole(role)
  if (!safeRole) {
    return { error: 'الصلاحية المحددة غير صالحة' }
  }

  if (id === auth.id && safeRole !== 'super_admin') {
    return { error: 'لا يمكنك تخفيض صلاحيات حسابك بنفسك' }
  }

  try {
    const { error } = await supabaseAdmin
      .from('admins')
      .update({ role: safeRole })
      .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function deleteUser(id: string) {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth

  if (id === auth.id) {
    return { error: 'لا يمكنك حذف حسابك الخاص' }
  }

  try {
    const { error } = await supabaseAdmin.from('admins').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}
