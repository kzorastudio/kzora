'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminHeader from '@/components/admin/AdminHeader'
import SlideManager from './SlideManager'
import ImageUploader, { type UploadedImage } from '@/components/admin/ImageUploader'
import { Loader2, Save, LayoutDashboard, Image as ImageIcon, ShieldCheck, Truck, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import type { HomepageSettings, Category } from '@/types'
import { supabase } from '@/lib/supabase'

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

const MAIN_LINK_OPTIONS = [
  { label: 'الصفحة الرئيسية', value: '/' },
  { label: 'المنتجات الأكثر مبيعاً', value: '/products?tag=best_seller' },
  { label: 'وصل حديثاً', value: '/products?tag=new' },
  { label: 'عروض حصرية (تخفيضات)', value: '/products?tag=on_sale' },
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
  hero_badge_text:        'تشكيلة كزورا الفاخرة ٢٠٢٦',
  hero_badge_color:       '#785600',
  sham_cash_enabled:      false,
  sham_cash_number:       '',
  sham_cash_image_url:    null,
  sham_cash_public_id:    null,
  sham_cash_instructions: '',
  discount_multi_items_enabled: false,
  discount_2_items_syp: 2000,
  discount_3_items_plus_syp: 3000,
  shipping_fee_1_piece_syp: 0,
  shipping_fee_1_piece_usd: 0,
  shipping_fee_2_pieces_syp: 0,
  shipping_fee_2_pieces_usd: 0,
  shipping_fee_3_plus_pieces_syp: 0,
  shipping_fee_3_plus_pieces_usd: 0,
  delivery_fee_syp: 0,
  delivery_fee_usd: 0,
  delivery_fee_1_piece_syp: 1000,
  delivery_fee_1_piece_usd: 0.1,
  delivery_fee_2_pieces_syp: 1000,
  delivery_fee_2_pieces_usd: 0.1,
  delivery_fee_3_plus_pieces_syp: 1000,
  delivery_fee_3_plus_pieces_usd: 0.1,
}

export default function HomepagePage() {
  const [settings, setSettings]   = useState<HomepageSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [dirty, setDirty]         = useState(false)
  const [bannerImages, setBannerImages] = useState<UploadedImage[]>([])
  const [shamCashImages, setShamCashImages] = useState<UploadedImage[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])
  const [categories, setCategories] = useState<Category[]>([])

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
          isLocal: false,
          is_main: true
        }])
      }
      if (s.sham_cash_image_url) {
        setShamCashImages([{
          id: 'sham',
          url: s.sham_cash_image_url,
          public_id: s.sham_cash_public_id!,
          isLocal: false,
          is_main: true
        }])
      }
    } catch {
      toast.error('فشل تحميل إعدادات الصفحة الرئيسية')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*').eq('is_active', true).order('name_ar')
    if (data) setCategories(data)
  }, [])

  useEffect(() => { 
    fetchSettings()
    fetchCategories()
  }, [fetchSettings, fetchCategories])

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

      if (shamCashImages[0]?.isLocal && shamCashImages[0].file) {
        const fd = new FormData()
        fd.append('file', shamCashImages[0].file)
        fd.append('folder', 'homepage')
        const res = await fetch('/api/images/upload', { method: 'POST', body: fd })
        const uploadData = await res.json()
        finalSettings.sham_cash_image_url = uploadData.url
        finalSettings.sham_cash_public_id = uploadData.public_id
      } else if (shamCashImages.length === 0) {
        finalSettings.sham_cash_image_url = null
        finalSettings.sham_cash_public_id = null
      }

      // No need to delete images at save time if we delete them in real-time
      // But we still need to keep the code for cleanup if necessary, 
      // though real-time is preferred.

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

            {/* إعدادات الهيرو الإضافية */}
            <section className="bg-surface-container-lowest rounded-3xl shadow-ambient p-6 border border-outline-variant/20">
              <h2 className="text-base font-arabic font-bold text-on-surface mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full" />
                إعدادات الهيرو الإضافية
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-arabic font-bold text-secondary">نص الشارة (Badge Text)</label>
                  <input
                    type="text"
                    value={settings.hero_badge_text || ''}
                    onChange={(e) => { setSettings({ ...settings, hero_badge_text: e.target.value }); setDirty(true); }}
                    className="w-full px-4 py-3 rounded-2xl bg-surface-container border border-outline-variant/40 text-sm font-arabic focus:border-primary outline-none transition-all"
                  />
                  <p className="text-[10px] text-secondary/60">هذا النص يظهر فوق العنوان الرئيسي في كل الشرائح</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-arabic font-bold text-secondary">لون الشارة (Badge Color)</label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={settings.hero_badge_color || '#785600'}
                      onChange={(e) => { setSettings({ ...settings, hero_badge_color: e.target.value }); setDirty(true); }}
                      className="h-11 w-20 rounded-xl bg-surface-container border border-outline-variant/40 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.hero_badge_color || '#785600'}
                      onChange={(e) => { setSettings({ ...settings, hero_badge_color: e.target.value }); setDirty(true); }}
                      className="flex-1 px-4 py-3 rounded-2xl bg-surface-container border border-outline-variant/40 text-sm font-arabic focus:border-primary outline-none"
                    />
                  </div>
                </div>
              </div>
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
                      <label className="text-xs font-bold text-secondary">رابط البانر (الوجهة)</label>
                      <div className="relative">
                        <select
                          value={settings.promo_banner_link || ''}
                          onChange={(e) => { setSettings({ ...settings, promo_banner_link: e.target.value }); setDirty(true); }}
                          className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-sm outline-none appearance-none cursor-pointer focus:border-primary transition-colors"
                        >
                          <option value="">-- اختر الوجهة --</option>
                          <optgroup label="المناطق الرئيسية">
                            {MAIN_LINK_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </optgroup>
                          <optgroup label="الأقسام">
                            {categories.map(cat => (
                              <option key={cat.id} value={`/products?category=${cat.slug}`}>{cat.name_ar}</option>
                            ))}
                          </optgroup>
                        </select>
                        <ChevronDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary" />
                      </div>
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
                        setBannerImages([{ id: 'new', file, url: URL.createObjectURL(file), public_id: '', isLocal: true, is_main: true }]);
                        setDirty(true);
                      }}
                      onRemoveImage={() => { 
                        if (bannerImages[0] && !bannerImages[0].isLocal && bannerImages[0].public_id) {
                          // Real-time deletion from Cloudinary
                          fetch('/api/images/delete', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ public_id: bannerImages[0].public_id })
                          }).catch(err => console.error('Failed to delete banner image', err))
                        }
                        if (bannerImages[0]?.isLocal && bannerImages[0].url) URL.revokeObjectURL(bannerImages[0].url)
                        setBannerImages([]); 
                        setDirty(true); 
                      }}
                      onSetMain={() => {}}
                      maxFiles={1}
                    />
                  </div>
                </div>
              )}
            </section>

            {/* إعدادات شام كاش */}
            <section className="bg-surface-container-lowest rounded-3xl shadow-ambient p-6 border border-outline-variant/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-arabic font-bold text-on-surface flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-[#785600] rounded-full" />
                  إعدادات شام كاش (Sham Cash)
                </h2>
                <button
                  type="button"
                  onClick={() => { setSettings({ ...settings, sham_cash_enabled: !settings.sham_cash_enabled }); setDirty(true); }}
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors',
                    settings.sham_cash_enabled ? 'bg-[#785600]' : 'bg-surface-container-high'
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                    settings.sham_cash_enabled ? 'translate-x-5' : 'translate-x-0.5'
                  )} />
                </button>
              </div>

              {settings.sham_cash_enabled && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <label className="text-sm font-arabic font-bold text-secondary">رقم المحفظة (Wallet Number)</label>
                    <input
                      type="text"
                      value={settings.sham_cash_number || ''}
                      onChange={(e) => { setSettings({ ...settings, sham_cash_number: e.target.value }); setDirty(true); }}
                      placeholder="مثال: 09xx xxx xxx"
                      className="w-full px-4 py-3 rounded-2xl bg-surface-container border border-outline-variant/40 text-sm font-body focus:border-[#785600] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-arabic font-bold text-secondary">تعليمات الدفع (تظهر للزبون عند اختيار شام كاش)</label>
                    <textarea
                      value={settings.sham_cash_instructions || ''}
                      onChange={(e) => { setSettings({ ...settings, sham_cash_instructions: e.target.value }); setDirty(true); }}
                      placeholder="اشرح للزبون كيفية التحويل وماذا يفعل بعد التحويل..."
                      className="w-full px-4 py-3 rounded-2xl bg-surface-container border border-outline-variant/40 text-sm font-arabic focus:border-[#785600] outline-none min-h-[100px] transition-all"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-arabic font-bold text-secondary flex items-center gap-2">
                      <ImageIcon size={16} /> صورة الحساب أو QR Code (اختياري)
                    </label>
                    <ImageUploader
                      images={shamCashImages}
                      onAddFiles={(files) => {
                        const file = files[0]; if (!file) return;
                        setShamCashImages([{ id: 'new-sham', file, url: URL.createObjectURL(file), public_id: '', isLocal: true, is_main: true }]);
                        setDirty(true);
                      }}
                      onRemoveImage={() => { 
                        if (shamCashImages[0] && !shamCashImages[0].isLocal && shamCashImages[0].public_id) {
                          fetch('/api/images/delete', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ public_id: shamCashImages[0].public_id })
                          }).catch(err => console.error('Failed to delete sham image', err))
                        }
                        if (shamCashImages[0]?.isLocal && shamCashImages[0].url) URL.revokeObjectURL(shamCashImages[0].url)
                        setShamCashImages([]); 
                        setDirty(true); 
                      }}
                      onSetMain={() => {}}
                      maxFiles={1}
                    />
                    <p className="text-[11px] text-secondary/60 font-arabic">سوف تظهر هذه الصورة للزبون عند اختيار شام كاش لتسهيل عملية التحويل.</p>
                  </div>
                </div>
              )}
              {!settings.sham_cash_enabled && (
                <p className="text-xs font-arabic text-secondary/60">خيار الدفع عبر شام كاش معطل حالياً للزبائن.</p>
              )}
            </section>

            {/* إعدادات الخصم المتعدد */}
            <section className="bg-surface-container-lowest rounded-3xl shadow-ambient p-6 border border-outline-variant/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-arabic font-bold text-on-surface flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-[#B8860B] rounded-full" />
                  خصم تعدد المنتجات (Multi-Product Discount)
                </h2>
                <button
                  type="button"
                  onClick={() => { setSettings({ ...settings, discount_multi_items_enabled: !settings.discount_multi_items_enabled }); setDirty(true); }}
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors',
                    settings.discount_multi_items_enabled ? 'bg-[#B8860B]' : 'bg-surface-container-high'
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                    settings.discount_multi_items_enabled ? 'translate-x-5' : 'translate-x-0.5'
                  )} />
                </button>
              </div>

              {settings.discount_multi_items_enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <label className="text-sm font-arabic font-bold text-secondary">خصم منتجين (ل.س)</label>
                    <input
                      type="number"
                      value={settings.discount_2_items_syp || 0}
                      onChange={(e) => { setSettings({ ...settings, discount_2_items_syp: parseInt(e.target.value) || 0 }); setDirty(true); }}
                      className="w-full px-4 py-3 rounded-2xl bg-surface-container border border-outline-variant/40 text-sm font-body focus:border-[#B8860B] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-arabic font-bold text-secondary">خصم 3 منتجات فأكثر (ل.س)</label>
                    <input
                      type="number"
                      value={settings.discount_3_items_plus_syp || 0}
                      onChange={(e) => { setSettings({ ...settings, discount_3_items_plus_syp: parseInt(e.target.value) || 0 }); setDirty(true); }}
                      className="w-full px-4 py-3 rounded-2xl bg-surface-container border border-outline-variant/40 text-sm font-body focus:border-[#B8860B] outline-none transition-all"
                    />
                  </div>
                </div>
              )}
              {!settings.discount_multi_items_enabled && (
                <p className="text-xs font-arabic text-secondary/60">خصم تعدد المنتجات معطل حالياً.</p>
              )}
            </section>

            {/* أسعار التوصيل والشحن */}
            <section className="bg-surface-container-lowest rounded-3xl shadow-ambient p-6 border border-outline-variant/20">
              <h2 className="text-base font-arabic font-bold text-on-surface mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#2E7D32] rounded-full" />
                أسعار التوصيل والشحن
              </h2>
              
              {/* Delivery Fee per pieces */}
              <div className="mb-8 p-6 rounded-3xl bg-[#2E7D32]/5 border border-[#2E7D32]/10">
                <div className="space-y-4">
                  {/* Flat Delivery Fee */}
                  <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/20">
                    <p className="text-xs font-arabic font-bold text-secondary mb-3">أجرة التوصيل الثابتة (لكافة الطلبات داخل حلب)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-arabic text-secondary">ل.س</label>
                        <input
                          type="number"
                          min={0}
                          value={settings.delivery_fee_syp || 0}
                          onChange={(e) => { 
                            const val = parseInt(e.target.value) || 0;
                            setSettings({ 
                              ...settings, 
                              delivery_fee_syp: val,
                              delivery_fee_1_piece_syp: val,
                              delivery_fee_2_pieces_syp: val,
                              delivery_fee_3_plus_pieces_syp: val
                            }); 
                            setDirty(true); 
                          }}
                          className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-sm font-body focus:border-[#2E7D32] outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-arabic text-secondary">$</label>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={settings.delivery_fee_usd || 0}
                          onChange={(e) => { 
                            const val = parseFloat(e.target.value) || 0;
                            setSettings({ 
                              ...settings, 
                              delivery_fee_usd: val,
                              delivery_fee_1_piece_usd: val,
                              delivery_fee_2_pieces_usd: val,
                              delivery_fee_3_plus_pieces_usd: val
                            }); 
                            setDirty(true); 
                          }}
                          className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-sm font-body focus:border-[#2E7D32] outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-2xl bg-[#E8F5E9] border border-[#A5D6A7]">
                    <p className="text-[11px] font-arabic text-[#1B5E20] leading-relaxed">
                      يتم احتساب هذه الأجرة بشكل ثابت لجميع الطلبات داخل مدينة حلب، بغض النظر عن عدد القطع في السلة.
                    </p>
                  </div>
                </div>
              </div>

              {/* Shipping Fee per pieces */}
              <div className="mt-8 pt-8 border-t border-outline-variant/10">
                <h3 className="text-sm font-arabic font-bold text-on-surface mb-2 flex items-center gap-2">
                  <Truck size={16} className="text-[#1565C0]" />
                  أجور الشحن للمحافظات (حسب عدد القطع)
                </h3>
                <p className="text-xs font-arabic text-secondary mb-4">يتم حساب تكلفة الشحن بناءً على إجمالي عدد القطع في سلة المشتريات.</p>
                
                <div className="space-y-4">
                  {/* 1 piece */}
                  <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/20">
                    <p className="text-xs font-arabic font-bold text-secondary mb-3">عند وجود قطعة واحدة (1)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-arabic text-secondary">ل.س</label>
                        <input
                          type="number"
                          min={0}
                          value={settings.shipping_fee_1_piece_syp || 0}
                          onChange={(e) => { setSettings({ ...settings, shipping_fee_1_piece_syp: parseInt(e.target.value) || 0 }); setDirty(true); }}
                          className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-sm font-body focus:border-[#1565C0] outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-arabic text-secondary">$</label>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={settings.shipping_fee_1_piece_usd || 0}
                          onChange={(e) => { setSettings({ ...settings, shipping_fee_1_piece_usd: parseFloat(e.target.value) || 0 }); setDirty(true); }}
                          className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-sm font-body focus:border-[#1565C0] outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  {/* 2 pieces */}
                  <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/20">
                    <p className="text-xs font-arabic font-bold text-secondary mb-3">عند وجود قطعتين (2)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-arabic text-secondary">ل.س</label>
                        <input
                          type="number"
                          min={0}
                          value={settings.shipping_fee_2_pieces_syp || 0}
                          onChange={(e) => { setSettings({ ...settings, shipping_fee_2_pieces_syp: parseInt(e.target.value) || 0 }); setDirty(true); }}
                          className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-sm font-body focus:border-[#1565C0] outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-arabic text-secondary">$</label>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={settings.shipping_fee_2_pieces_usd || 0}
                          onChange={(e) => { setSettings({ ...settings, shipping_fee_2_pieces_usd: parseFloat(e.target.value) || 0 }); setDirty(true); }}
                          className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-sm font-body focus:border-[#1565C0] outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  {/* 3 pieces */}
                  <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/20">
                    <p className="text-xs font-arabic font-bold text-secondary mb-3">عند وجود 3 قطع فقط</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-arabic text-secondary">ل.س</label>
                        <input
                          type="number"
                          min={0}
                          value={settings.shipping_fee_3_plus_pieces_syp || 0}
                          onChange={(e) => { setSettings({ ...settings, shipping_fee_3_plus_pieces_syp: parseInt(e.target.value) || 0 }); setDirty(true); }}
                          className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-sm font-body focus:border-[#1565C0] outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-arabic text-secondary">$</label>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={settings.shipping_fee_3_plus_pieces_usd || 0}
                          onChange={(e) => { setSettings({ ...settings, shipping_fee_3_plus_pieces_usd: parseFloat(e.target.value) || 0 }); setDirty(true); }}
                          className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-sm font-body focus:border-[#1565C0] outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Note for more than 3 */}
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                    <p className="text-xs font-arabic font-bold text-amber-800 mb-1">أكثر من 3 قطع:</p>
                    <p className="text-[11px] font-arabic text-amber-700 leading-relaxed">
                      عند طلب أكثر من 3 قطع، لا يتم احتساب رسوم الشحن تلقائياً، وستظهر للزبون رسالة تُفيد بأن تكلفة الشحن تُحدَّد بالتواصل المباشر عبر واتساب، ليتم الاتفاق على السعر المناسب حسب حجم الطلب ووجهة الشحن.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* شريط الحفظ العائم */}
      <div className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] sm:w-auto transition-all duration-300 transform",
        dirty ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
      )}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex w-full sm:w-auto justify-center items-center gap-3 px-8 py-4 rounded-full bg-primary text-white shadow-2xl hover:scale-105 transition-transform whitespace-nowrap"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span className="font-arabic font-bold">حفظ كل التغييرات</span>
        </button>
      </div>
    </div>
  )
}
