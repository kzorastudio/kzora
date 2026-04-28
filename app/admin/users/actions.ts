'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function createUser(data: any) {
  const { name, email, password, role } = data
  if (!name || !email || !password || !role) {
    return { error: 'جميع الحقول مطلوبة' }
  }

  try {
    const password_hash = await bcrypt.hash(password, 12)
    const { error } = await supabaseAdmin.from('admins').insert({
      name,
      email: email.toLowerCase().trim(),
      password_hash,
      role
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

export async function deleteUser(id: string) {
  try {
    const { error } = await supabaseAdmin.from('admins').delete().eq('id', id)
    if (error) return { error: error.message }
    
    revalidatePath('/admin/users')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}
