'use client'

import { useState } from 'react'
import { Trash2, KeyRound, Plus, Shield, ShieldAlert, Loader2, UserPlus, Mail, User as UserIcon, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'
import type { Admin } from '@/types'
import { createUser, updateUserPassword, deleteUser } from './actions'

interface UsersClientProps {
  users: Admin[]
  currentUserId: string
}

const FIELD_CLASS =
  'w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition'

const LABEL_CLASS = 'text-xs font-arabic font-bold text-secondary'

function RoleBadge({ role }: { role: Admin['role'] }) {
  if (role === 'super_admin') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-error-container/30 text-error text-xs font-arabic font-bold whitespace-nowrap">
        <ShieldAlert size={13} strokeWidth={2.5} />
        مدير عام
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#006E1C]/10 text-[#006E1C] text-xs font-arabic font-bold whitespace-nowrap">
      <Shield size={13} strokeWidth={2.5} />
      موظف
    </span>
  )
}

export default function UsersClient({ users, currentUserId }: UsersClientProps) {
  // Modal state
  const [addOpen, setAddOpen] = useState(false)
  const [passwordTarget, setPasswordTarget] = useState<Admin | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Admin | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'super_admin' | 'employee'>('employee')
  const [newPassword, setNewPassword] = useState('')

  // Loading flags
  const [creating, setCreating] = useState(false)
  const [changingPw, setChangingPw] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function resetCreateForm() {
    setName('')
    setEmail('')
    setPassword('')
    setRole('employee')
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    const res = await createUser({ name, email, password, role })
    setCreating(false)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('تمت إضافة الموظف بنجاح')
      setAddOpen(false)
      resetCreateForm()
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!passwordTarget) return
    setChangingPw(true)
    const res = await updateUserPassword(passwordTarget.id, newPassword)
    setChangingPw(false)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('تم تغيير كلمة السر بنجاح')
      setPasswordTarget(null)
      setNewPassword('')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    if (deleteTarget.id === currentUserId) {
      toast.error('لا يمكنك حذف حسابك الشخصي')
      return
    }
    setDeleting(true)
    const res = await deleteUser(deleteTarget.id)
    setDeleting(false)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('تم الحذف بنجاح')
      setDeleteTarget(null)
    }
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-6" dir="rtl">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-arabic font-black text-[#1A1A1A]">المدراء والموظفون</h2>
          <p className="text-xs font-arabic text-secondary mt-1">إدارة حسابات وصلاحيات الدخول للوحة التحكم</p>
        </div>
        <button
          onClick={() => { resetCreateForm(); setAddOpen(true) }}
          className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-primary text-white font-arabic font-bold text-sm hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
        >
          <UserPlus size={16} strokeWidth={2.5} />
          إضافة حساب جديد
        </button>
      </div>

      {/* ── MOBILE CARDS ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 md:hidden">
        {users.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-sm font-arabic text-secondary shadow-ambient border border-outline-variant/10">
            لا يوجد مستخدمون بعد
          </div>
        ) : users.map((user) => {
          const isMe = user.id === currentUserId
          return (
            <div
              key={user.id}
              className="bg-white rounded-2xl p-4 shadow-ambient border border-outline-variant/10 flex flex-col gap-3"
            >
              {/* Top row: name + role */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-base font-arabic font-bold text-on-surface truncate">{user.name}</span>
                    {isMe && (
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-arabic font-bold whitespace-nowrap">
                        أنت
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-label text-secondary truncate" dir="ltr">{user.email}</p>
                </div>
                <RoleBadge role={user.role} />
              </div>

              {/* Actions row */}
              <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => { setPasswordTarget(user); setNewPassword('') }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-xl bg-surface-container-high text-xs font-arabic font-bold text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <KeyRound size={14} strokeWidth={2.5} />
                  تغيير كلمة السر
                </button>
                {!isMe && (
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(user)}
                    aria-label={`حذف ${user.name}`}
                    className="h-10 w-10 inline-flex items-center justify-center rounded-xl bg-error-container/20 text-error hover:bg-error-container/40 active:scale-95 transition-all"
                  >
                    <Trash2 size={15} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── DESKTOP TABLE ──────────────────────────────────────────── */}
      <div className="hidden md:block bg-white rounded-2xl shadow-ambient border border-outline-variant/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-container/50 border-b border-outline-variant/20">
                <th className="px-5 py-4 text-right text-[11px] font-arabic font-black text-secondary uppercase tracking-wider">الاسم</th>
                <th className="px-5 py-4 text-right text-[11px] font-arabic font-black text-secondary uppercase tracking-wider">البريد الإلكتروني</th>
                <th className="px-5 py-4 text-right text-[11px] font-arabic font-black text-secondary uppercase tracking-wider">الصلاحية</th>
                <th className="px-5 py-4 text-right text-[11px] font-arabic font-black text-secondary uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center text-sm font-arabic text-secondary">
                    لا يوجد مستخدمون بعد
                  </td>
                </tr>
              ) : users.map((user) => {
                const isMe = user.id === currentUserId
                return (
                  <tr key={user.id} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-arabic font-bold text-on-surface">{user.name}</span>
                        {isMe && (
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-arabic font-bold">أنت</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-label text-secondary" dir="ltr">{user.email}</span>
                    </td>
                    <td className="px-5 py-4">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => { setPasswordTarget(user); setNewPassword('') }}
                          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-surface-container-high text-xs font-arabic font-bold text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <KeyRound size={14} strokeWidth={2.5} />
                          تغيير السر
                        </button>
                        {!isMe && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(user)}
                            aria-label={`حذف ${user.name}`}
                            className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-error-container/20 text-error hover:bg-error-container/40 transition-colors"
                            title="حذف"
                          >
                            <Trash2 size={14} strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: Add user ────────────────────────────────────────── */}
      <Modal isOpen={addOpen} onClose={() => !creating && setAddOpen(false)} title="إضافة حساب جديد" maxWidth="max-w-lg">
        <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>
                <UserIcon size={12} className="inline ml-1 -mt-0.5" />
                الاسم الكامل
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثلاً: أحمد محمد"
                className={FIELD_CLASS}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>
                <Mail size={12} className="inline ml-1 -mt-0.5" />
                البريد الإلكتروني (للتسجيل)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@kzora.co"
                className={FIELD_CLASS}
                dir="ltr"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>
                <Lock size={12} className="inline ml-1 -mt-0.5" />
                كلمة السر (6 أحرف على الأقل)
              </label>
              <input
                type="text"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className={FIELD_CLASS}
                dir="ltr"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>
                <Shield size={12} className="inline ml-1 -mt-0.5" />
                الصلاحية
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'super_admin' | 'employee')}
                className={cn(FIELD_CLASS, 'py-2.5')}
              >
                <option value="employee">موظف (رؤية المنتجات والطلبات)</option>
                <option value="super_admin">مدير عام (صلاحيات كاملة)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              disabled={creating}
              className="h-11 px-5 rounded-xl bg-surface-container text-on-surface font-arabic font-bold text-sm hover:bg-outline-variant/30 transition-colors disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-[#1A1A1A] text-white font-arabic font-bold text-sm hover:bg-black transition-colors disabled:opacity-50"
            >
              {creating && <Loader2 size={16} className="animate-spin" />}
              حفظ الحساب
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: Change password ─────────────────────────────────── */}
      <Modal
        isOpen={passwordTarget !== null}
        onClose={() => !changingPw && setPasswordTarget(null)}
        title={passwordTarget ? `تغيير كلمة سر: ${passwordTarget.name}` : ''}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <p className="text-xs font-arabic text-secondary">
            ستحلّ كلمة السر الجديدة محل الحالية فوراً. لا يمكن استعادة كلمة السر القديمة بعد الحفظ.
          </p>

          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>
              <Lock size={12} className="inline ml-1 -mt-0.5" />
              كلمة السر الجديدة
            </label>
            <input
              type="text"
              required
              minLength={6}
              autoFocus
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="6 أحرف على الأقل"
              className={FIELD_CLASS}
              dir="ltr"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={() => setPasswordTarget(null)}
              disabled={changingPw}
              className="h-11 px-5 rounded-xl bg-surface-container text-on-surface font-arabic font-bold text-sm hover:bg-outline-variant/30 transition-colors disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={changingPw}
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-primary text-white font-arabic font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {changingPw && <Loader2 size={16} className="animate-spin" />}
              حفظ كلمة السر
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: Delete confirm ──────────────────────────────────── */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="تأكيد الحذف"
        maxWidth="max-w-md"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-error-container/20 border border-error/20">
            <ShieldAlert size={20} className="text-error shrink-0 mt-0.5" strokeWidth={2.5} />
            <div className="flex-1">
              <p className="text-sm font-arabic font-bold text-on-surface mb-1">
                هل أنت متأكد من حذف هذا الحساب؟
              </p>
              <p className="text-xs font-arabic text-secondary">
                سيتم حذف <strong className="text-on-surface">{deleteTarget?.name}</strong> ({deleteTarget?.email}) نهائياً ولن يستطيع الوصول للوحة التحكم. لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="h-11 px-5 rounded-xl bg-surface-container text-on-surface font-arabic font-bold text-sm hover:bg-outline-variant/30 transition-colors disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-error text-white font-arabic font-bold text-sm hover:bg-error/90 transition-colors disabled:opacity-50"
            >
              {deleting && <Loader2 size={16} className="animate-spin" />}
              نعم، احذف
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
