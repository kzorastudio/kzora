'use client'

import { useState } from 'react'
import { Trash2, KeyRound, Plus, Shield, ShieldAlert, X } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Admin } from '@/types'
import { createUser, updateUserPassword, deleteUser } from './actions'

interface UsersClientProps {
  users: Admin[]
  currentUserId: string
}

export default function UsersClient({ users, currentUserId }: UsersClientProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [changingPasswordId, setChangingPasswordId] = useState<string | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'super_admin' | 'employee'>('employee')
  
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await createUser({ name, email, password, role })
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('تمت إضافة الموظف بنجاح')
      setIsAdding(false)
      setName('')
      setEmail('')
      setPassword('')
      setRole('employee')
    }
    setLoading(false)
  }

  async function handleChangePassword(e: React.FormEvent, id: string) {
    e.preventDefault()
    setLoading(true)
    const res = await updateUserPassword(id, newPassword)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('تم تغيير كلمة السر بنجاح')
      setChangingPasswordId(null)
      setNewPassword('')
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (id === currentUserId) {
      toast.error('لا يمكنك حذف حسابك الشخصي')
      return
    }
    if (!confirm('هل أنت متأكد من حذف هذا الحساب؟ لا يمكن التراجع عن هذا الإجراء.')) return

    setLoading(true)
    const res = await deleteUser(id)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('تم الحذف بنجاح')
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-arabic font-black text-[#1A1A1A]">المدراء والموظفين</h2>
          <p className="text-xs font-arabic text-secondary mt-1">إدارة حسابات وصلاحيات الدخول للوحة التحكم</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-arabic font-bold hover:bg-primary/90 transition-all active:scale-95 text-sm"
        >
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          <span>{isAdding ? 'إلغاء' : 'إضافة موظف جديد'}</span>
        </button>
      </div>

      {/* Add User Form */}
      {isAdding && (
        <form onSubmit={handleCreateUser} className="bg-white p-6 rounded-2xl shadow-ambient border border-outline-variant/10 flex flex-col gap-5 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-sm font-arabic font-bold text-on-surface border-b border-outline-variant/20 pb-3">إضافة حساب جديد</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-arabic font-bold text-secondary">الاسم كامل</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-arabic font-bold text-secondary">البريد الإلكتروني (للسبجيل)</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                dir="ltr"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-arabic font-bold text-secondary">كلمة السر</label>
              <input
                type="text"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                dir="ltr"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-arabic font-bold text-secondary">الصلاحية (الرتبة)</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as any)}
                className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-2.5 text-sm font-arabic text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="employee">موظف (رؤية المنتجات فقط)</option>
                <option value="super_admin">مدير عام (صلاحيات كاملة)</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2.5 bg-[#1A1A1A] text-white font-arabic font-bold rounded-xl hover:bg-black transition-colors disabled:opacity-50 text-sm"
            >
              حفظ الحساب
            </button>
          </div>
        </form>
      )}

      {/* Users List */}
      <div className="bg-white rounded-2xl shadow-ambient border border-outline-variant/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-surface-container/50 border-b border-outline-variant/20">
                <th className="px-6 py-4 text-right text-[11px] font-arabic font-black text-[#9E9890] uppercase">الاسم</th>
                <th className="px-6 py-4 text-right text-[11px] font-arabic font-black text-[#9E9890] uppercase">الإيميل</th>
                <th className="px-6 py-4 text-right text-[11px] font-arabic font-black text-[#9E9890] uppercase">الصلاحية</th>
                <th className="px-6 py-4 text-right text-[11px] font-arabic font-black text-[#9E9890] uppercase">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-surface-container-lowest transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-arabic font-bold text-on-surface">{user.name}</span>
                    {user.id === currentUserId && <span className="mr-2 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">أنت</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-label text-secondary" dir="ltr">{user.email}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {user.role === 'super_admin' ? (
                        <>
                          <ShieldAlert size={14} className="text-error" />
                          <span className="text-xs font-arabic font-bold text-error">مدير عام</span>
                        </>
                      ) : (
                        <>
                          <Shield size={14} className="text-[#006E1C]" />
                          <span className="text-xs font-arabic font-bold text-[#006E1C]">موظف</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {changingPasswordId === user.id ? (
                        <form onSubmit={(e) => handleChangePassword(e, user.id)} className="flex items-center gap-2">
                          <input
                            type="text"
                            required
                            minLength={6}
                            placeholder="كلمة السر الجديدة"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="w-32 bg-white border border-outline-variant/50 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-primary"
                            dir="ltr"
                          />
                          <button type="submit" disabled={loading} className="text-[10px] bg-primary text-white px-3 py-1.5 rounded-lg font-bold hover:bg-primary/90">حفظ</button>
                          <button type="button" onClick={() => setChangingPasswordId(null)} className="text-[10px] bg-surface-container text-on-surface px-3 py-1.5 rounded-lg font-bold hover:bg-outline-variant/30">إلغاء</button>
                        </form>
                      ) : (
                        <>
                          <button
                            onClick={() => { setChangingPasswordId(user.id); setNewPassword(''); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high text-xs font-arabic font-bold text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <KeyRound size={14} />
                            تغيير السر
                          </button>
                          {user.id !== currentUserId && (
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="p-1.5 rounded-lg bg-error-container/20 text-error hover:bg-error-container/50 transition-colors"
                              title="حذف"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
