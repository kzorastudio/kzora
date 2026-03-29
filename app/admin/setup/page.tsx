'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function AdminSetupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', name: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'حدث خطأ')
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/admin/login'), 2000)
    } catch {
      setError('حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center" dir="rtl">
        <div className="bg-white rounded-2xl p-10 shadow-lg text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-arabic font-bold text-[#1A1A1A] mb-2">تم إنشاء الحساب!</h2>
          <p className="text-sm font-arabic text-[#6B6560]">جارٍ تحويلك لصفحة تسجيل الدخول...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md">

        <div className="flex justify-center mb-8">
          <Image src="/newlogo.png" alt="كزورا" width={120} height={72} className="h-16 w-auto object-contain" />
        </div>

        <h1 className="text-2xl font-arabic font-bold text-[#1A1A1A] mb-1 text-center">إعداد حساب المدير</h1>
        <p className="text-sm font-arabic text-[#9E9890] text-center mb-8">يتم هذا مرة واحدة فقط</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-arabic font-medium text-[#1A1A1A] mb-1.5">الاسم</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="اسمك"
              required
              className="w-full h-11 px-4 rounded-xl bg-[#F5F1EB] border-none outline-none font-arabic text-sm text-[#1A1A1A] placeholder:text-[#C0B8B0] focus:ring-2 focus:ring-[#785600]/30"
            />
          </div>

          <div>
            <label className="block text-sm font-arabic font-medium text-[#1A1A1A] mb-1.5">البريد الإلكتروني</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="admin@example.com"
              required
              dir="ltr"
              className="w-full h-11 px-4 rounded-xl bg-[#F5F1EB] border-none outline-none text-sm text-[#1A1A1A] placeholder:text-[#C0B8B0] focus:ring-2 focus:ring-[#785600]/30"
            />
          </div>

          <div>
            <label className="block text-sm font-arabic font-medium text-[#1A1A1A] mb-1.5">كلمة المرور</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="8 أحرف على الأقل"
              required
              minLength={8}
              dir="ltr"
              className="w-full h-11 px-4 rounded-xl bg-[#F5F1EB] border-none outline-none text-sm text-[#1A1A1A] placeholder:text-[#C0B8B0] focus:ring-2 focus:ring-[#785600]/30"
            />
          </div>

          {error && (
            <p className="text-sm font-arabic text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-[#785600] text-white font-arabic font-bold text-sm hover:bg-[#986D00] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'جارٍ الإنشاء...' : 'إنشاء الحساب'}
          </button>
        </form>
      </div>
    </div>
  )
}
