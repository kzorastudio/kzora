'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminHeader from '@/components/admin/AdminHeader'
import SlideManager from './SlideManager'
import ImageUploader, { type ImageFile } from '@/components/admin/ImageUploader'
import { Loader2, Save, LayoutDashboard, Image as ImageIcon, ShieldCheck, Truck } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import type { HomepageSettings } from '@/types'

const SECTION_TOGGLES: { key: keyof HomepageSettings; label: string; description: string }[] = [
  {
    key:         'section_categories',
    label:       'قسم الأقسام',
    description: 'عرض قسم الأقسام في الصفحة الرئيسية',
  },
  {
    key:         'section_new_arrivals',
    label:       'الوصولات الجديدة',
    description: 'عرض أحدث المنتجات المضافة',
  },
  {
    key:         'section_best_sellers',
    label:       'الأكثر مبيعاً',
    description: 'عرض المنتجات الأكثر مبيعاً',
  },
  {
    key:         'section_promo_banner',
    label:       'البانر الترويجي',
    description: 'عرض البانر الترويجي في منتصف الصفحة',
  },
  {
    key:         'section_offers',
    label:       'قسم العروض',
    description: 'عرض قسم العروض والتخفيضات',
  },
  {
    key:         'section_stats',
    label:       'إحصائيات النجاح',
    description: 'عرض أرقام الزبائن والرضا (Social Proof)',
  },
]

const DEFAULT_SETTINGS: HomepageSettings = {
  id: '',
  promo_banner_url:       null,
  promo_banner_public_id: null,
  promo_banner_link:      null,
  promo_banner_active:    false,
  section_categories:     true,
  section_new_arrivals:   true,
  section_best_sellers:   true,
  section_promo_banner:   false,
  section_offers:         true,
  promo_banner_heading:   '',
  promo_banner_subtext:   '',
  promo_banner_button_text: '',
  section_stats:          true,
  stat_customers_count:   '+١٠٠٠ زبون',
  stat_satisfaction_rate: '٩٩٪ رضا العملاء',
  stat_returns_count:     '٥٠ عملية إرجاع',
  stat_exchanges_count:   '١٠٠ عملية تبديل',
  shipping_policy:        'نوفر خدمة التوصيل إلى جميع المحافظات السورية.',
  return_policy:          'إرجاع خلال 7 أيام من الاستلام.',
}

export default function HomepagePage() {
  const [settings, setSettings]   = useState<HomepageSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [dirty, setDirty]         = useState(false)
  const [bannerImages, setBannerImages] = useState<ImageFile[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/homepage/settings')
      if (!res.ok) throw new Error()
      const data = await res.json()
      const s = data.settings ?? DEFAULT_SETTINGS
      setSettings(s)
      if (s.promo_banner_url) {
        setBannerImages([{
          id: 'promo',
          url: s.promo_banner_url,
          public_id: s.promo_banner_public_id!,
          isLocal: false
        }])
      }
    } catch {
      toast.error('فشل تحميل إعدادات الصفحة الرئيسية')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  function toggleSection(key: keyof HomepageSettings) {
    setSettings((prev) => {
      const newVal = !prev[key]
      const next = { ...prev, [key]: newVal }
      if (key === 'section_promo_banner') {
        next.promo_banner_active = newVal
      }
      return next
    })
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      let finalSettings = { ...settings }

      if (bannerImages[0]?.isLocal && bannerImages[0].file) {
        const fd = new FormData()
        fd.append('file', bannerImages[0].file)
        fd.append('folder', 'homepage')
        const res = await fetch('/api/images/upload', { method: 'POST', body: fd })
        const uploadData = await res.json()
        finalSettings.promo_banner_url = uploadData.url
        finalSettings.promo_banner_public_id = uploadData.public_id
      } else if (bannerImages.length === 0) {
        finalSettings.promo_banner_url = null
        finalSettings.promo_banner_public_id = null
      }

      if (imagesToDelete.length > 0) {
        await Promise.all(imagesToDelete.map(pid => 
          fetch('/api/images/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ public_id: pid })
          })
        ))
      }

      const res = await fetch('/api/homepage/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalSettings),
      })
      if (!res.ok) throw new Error('فشل الحفظ')
      
      const data = await res.json()
      setSettings(data.settings)
      setImagesToDelete([])
      setDirty(false)
      toast.success('تم حفظ الإعدادات بنجاح')
    } catch (err: any) {
      toast.error('فشل حفظ الإعدادات')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen pb-20" dir="rtl">
      <AdminHeader />

      <div className="flex-1 p-4 md:p-6 flex flex-col gap-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <LayoutDashboard size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-arabic font-bold text-on-surface">إدارة محتوى المتجر</h1>
            <p className="text-sm font-arabic text-secondary">التحكم في الصفحة الرئيسية والسياسات العامة</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* شرائح الهيرو */}
            <section className="bg-surface-container-lowest rounded-3xl shadow-ambient p-6 border border-outline-variant/20">
              <h2 className="text-base font-arabic font-bold text-on-surface mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full" />
                شرائح الهيرو (Hero Slides)
              </h2>
              <SlideManager />
            </section>

            {/* سياسات المتجر */}
            <section className="bg-surface-container-lowest rounded-3xl shadow-ambient p-6 border border-outline-variant/20">
              <h2 className="text-base font-arabic font-bold text-on-surface mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#785600] rounded-full" />
                سياسات المنتج (تظهر في صفحة التفاصيل)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-arabic font-bold text-secondary flex items-center gap-2">
                    <Truck size={16} /> معلومات الشحن
                  </label>
                  <textarea
                    value={settings.shipping_policy || ''}
                    onChange={(e) => { setSettings({ ...settings, shipping_policy: e.target.value }); setDirty(true); }}
                    className="w-full px-4 py-3 rounded-2xl bg-surface-container border border-outline-variant/40 text-sm font-arabic focus:border-primary outline-none min-h-[100px] transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-arabic font-bold text-secondary flex items-center gap-2">
                    <ShieldCheck size={16} /> سياسة الإرجاع
                  </label>
                  <textarea
                    value={settings.return_policy || ''}
                    onChange={(e) => { setSettings({ ...settings, return_policy: e.target.value }); setDirty(true); }}
                    className="w-full px-4 py-3 rounded-2xl bg-surface-container border border-outline-variant/40 text-sm font-arabic focus:border-primary outline-none min-h-[100px] transition-all"
                  />
                </div>
              </div>
            </section>

            {/* إحصائيات النجاح */}
            {settings.section_stats && (
              <section className="bg-surface-container-lowest rounded-3xl shadow-ambient p-6 border border-outline-variant/20">
                <h2 className="text-base font-arabic font-bold text-on-surface mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-primary rounded-full" />
                  إحصائيات النجاح والرضا
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'عدد الزبائن', key: 'stat_customers_count' },
                    { label: 'نسبة الرضا', key: 'stat_satisfaction_rate' },
                    { label: 'عمليات الإرجاع', key: 'stat_returns_count' },
                    { label: 'عمليات التبديل', key: 'stat_exchanges_count' },
                  ].map((item) => (
                    <div key={item.key} className="space-y-1.5">
                      <label className="text-xs font-arabic font-bold text-secondary">{item.label}</label>
                      <input
                        type="text"
                        value={(settings as any)[item.key] || ''}
                        onChange={(e) => { setSettings({ ...settings, [item.key]: e.target.value }); setDirty(true); }}
                        className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-sm font-arabic focus:border-primary outline-none"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* إظهار الأقسام والبانر */}
            <section className="bg-surface-container-lowest rounded-3xl shadow-ambient p-6 border border-outline-variant/20">
              <h2 className="text-base font-arabic font-bold text-on-surface mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full" />
                خيارات العرض والبانر الترويجي
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {SECTION_TOGGLES.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between p-4 rounded-2xl bg-surface-container">
                    <span className="text-sm font-arabic font-medium">{label}</span>
                    <button
                      type="button"
                      onClick={() => toggleSection(key)}
                      className={cn(
                        'relative h-6 w-11 rounded-full transition-colors',
                        settings[key] ? 'bg-primary' : 'bg-surface-container-high'
                      )}
                    >
                      <span className={cn(
                        'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                        settings[key] ? 'translate-x-5' : 'translate-x-0.5'
                      )} />
                    </button>
                  </div>
                ))}
              </div>

              {settings.section_promo_banner && (
                <div className="p-6 rounded-2xl bg-surface-container border border-primary/10 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-secondary">عنوان البانر</label>
                      <input
                        type="text"
                        value={settings.promo_banner_heading || ''}
                        onChange={(e) => { setSettings({ ...settings, promo_banner_heading: e.target.value }); setDirty(true); }}
                        className="w-full px-4 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-sm outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-secondary">نص الزر</label>
                      <input
                        type="text"
                        value={settings.promo_banner_button_text || ''}
                        onChange={(e) => { setSettings({ ...settings, promo_banner_button_text: e.target.value }); setDirty(true); }}
                        className="w-full px-4 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-sm outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-secondary">النص الفرعي</label>
                    <textarea
                      value={settings.promo_banner_subtext || ''}
                      onChange={(e) => { setSettings({ ...settings, promo_banner_subtext: e.target.value }); setDirty(true); }}
                      className="w-full px-4 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-sm outline-none min-h-[60px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold flex items-center gap-2"><ImageIcon size={16}/> صورة البانر</label>
                    <ImageUploader
                      images={bannerImages}
                      onAddFiles={(files) => {
                        const file = files[0]; if (!file) return;
                        setBannerImages([{ id: 'new', file, url: URL.createObjectURL(file), public_id: '', isLocal: true }]);
                        setDirty(true);
                      }}
                      onRemoveImage={() => { setBannerImages([]); setDirty(true); }}
                      maxFiles={1}
                    />
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* شريط الحفظ العائم */}
      <div className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 transform",
        dirty ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
      )}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-3 px-8 py-4 rounded-full bg-primary text-white shadow-2xl hover:scale-105 transition-transform"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span className="font-arabic font-bold">حفظ كل التغييرات</span>
        </button>
      </div>
    </div>
  )
}
