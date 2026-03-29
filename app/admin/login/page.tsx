'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2, Lock, Mail } from 'lucide-react'
import { loginSchema, type LoginFormData } from '@/lib/validators'
import { cn } from '@/lib/utils'

export default function AdminLoginPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(data: LoginFormData) {
    setServerError(null)
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setServerError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
        return
      }

      router.push('/admin')
      router.refresh()
    } catch {
      setServerError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.')
    }
  }

  const FIELD_CLASS =
    'w-full rounded-xl border border-outline-variant/50 bg-surface-container px-4 py-3 text-sm font-arabic text-on-surface placeholder:text-secondary/60 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition'

  return (
    <div
      className="min-h-screen bg-surface-dim flex items-center justify-center px-4 py-12"
      dir="rtl"
      lang="ar"
    >
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient-lg px-8 py-10 flex flex-col gap-7">
          {/* Logo + title */}
          <div className="flex flex-col items-center gap-2 text-center">
            <Image
              src="/newlogo.png"
              alt="كزورا Kzora"
              width={170}
              height={102}
              className="h-36 w-auto object-contain"
              priority
            />
            <p className="text-sm font-arabic text-secondary">لوحة الإدارة</p>
            <div className="h-10 w-10 rounded-xl bg-primary-fixed/60 flex items-center justify-center">
              <Lock size={20} className="text-primary" />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            
            {/* Server error */}
            {serverError && (
              <div className="rounded-xl bg-error-container px-4 py-3 text-sm font-arabic text-on-error-container text-center">
                {serverError}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-arabic font-medium text-on-surface-variant mb-1.5">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none"
                />
                <input
                  type="email"
                  placeholder="admin@kzora.com"
                  autoComplete="email"
                  {...register('email')}
                  className={cn(
                    FIELD_CLASS,
                    'pr-10',
                    errors.email && 'border-error focus:border-error focus:ring-error/20'
                  )}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs font-arabic text-error">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-arabic font-medium text-on-surface-variant mb-1.5">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none"
                />
                <input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password')}
                  className={cn(
                    FIELD_CLASS,
                    'pr-10',
                    errors.password && 'border-error focus:border-error focus:ring-error/20'
                  )}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs font-arabic text-error">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-bronze-gradient text-white text-sm font-arabic font-semibold hover:bg-bronze-gradient-hover transition-all shadow-ambient disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'جاري الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs font-arabic text-secondary">
          كزورا — لوحة التحكم الإدارية
        </p>
      </div>
    </div>
  )
}
