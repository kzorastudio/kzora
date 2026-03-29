'use client'

import { useState } from 'react'
import { Category } from '@/types'
import { Reorder, AnimatePresence } from 'framer-motion'
import { GripVertical, Plus, Trash2, Save, FolderOpen } from 'lucide-react'
import { toast } from 'react-hot-toast'

function CategoryImage({ src, alt, className }: { src: string | null | undefined; alt: string; className?: string }) {
  const [error, setError] = useState(false)
  if (!src || error) {
    return (
      <div className={`flex items-center justify-center bg-[#F0EBE3] text-[#B8860B] w-full h-full ${className ?? ''}`}>
        <FolderOpen size={18} />
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      className={`object-cover w-full h-full ${className ?? ''}`}
      onError={() => setError(true)}
    />
  )
}

interface NavigationClientProps {
  categories: Category[]
}

export default function NavigationClient({ categories }: NavigationClientProps) {
  const [allCategories] = useState(categories)
  const [headerLinks, setHeaderLinks] = useState<Category[]>(
    categories.filter(c => c.show_in_header).sort((a, b) => (a.header_order || 0) - (b.header_order || 0))
  )
  const [footerLinks, setFooterLinks] = useState<Category[]>(
    categories.filter(c => c.show_in_footer).sort((a, b) => (a.footer_order || 0) - (b.footer_order || 0))
  )
  const [homeLinks, setHomeLinks] = useState<Category[]>(
    categories.filter(c => c.show_in_home).sort((a, b) => (a.home_order || 0) - (b.home_order || 0))
  )
  const [isSaving, setIsSaving] = useState(false)

  const MAX_HEADER = 6
  const MAX_FOOTER = 5
  const MAX_HOME = 4

  const addToHeader = (category: Category) => {
    if (headerLinks.find(l => l.id === category.id)) {
      toast.error('القسم موجود بالفعل في الهيدر')
      return
    }
    if (headerLinks.length >= MAX_HEADER) {
      toast.error(`لا يمكنك إضافة أكثر من ${MAX_HEADER} أقسام في الهيدر لضمان تناسق التصميم`)
      return
    }
    setHeaderLinks([...headerLinks, { ...category, show_in_header: true }])
  }

  const addToFooter = (category: Category) => {
    if (footerLinks.find(l => l.id === category.id)) {
      toast.error('القسم موجود بالفعل في الفوتر')
      return
    }
    if (footerLinks.length >= MAX_FOOTER) {
      toast.error(`لا يمكنك إضافة أكثر من ${MAX_FOOTER} أقسام في الفوتر`)
      return
    }
    setFooterLinks([...footerLinks, { ...category, show_in_footer: true }])
  }

  const addToHome = (category: Category) => {
    if (homeLinks.find(l => l.id === category.id)) {
      toast.error('القسم موجود بالفعل في الرئيسية')
      return
    }
    if (homeLinks.length >= MAX_HOME) {
      toast.error(`شبكة التصنيفات في الرئيسية تستوعب ${MAX_HOME} أقسام فقط`)
      return
    }
    setHomeLinks([...homeLinks, { ...category, show_in_home: true }])
  }

  const removeFromHeader = (id: string) => {
    setHeaderLinks(headerLinks.filter(l => l.id !== id))
  }

  const removeFromFooter = (id: string) => {
    setFooterLinks(footerLinks.filter(l => l.id !== id))
  }

  const removeFromHome = (id: string) => {
    setHomeLinks(homeLinks.filter(l => l.id !== id))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/navigation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headerLinks, footerLinks, homeLinks }),
      })
      if (!res.ok) throw new Error()
      toast.success('تم حفظ التعديلات بنجاح')
    } catch (error) {
      console.error(error)
      toast.error('حدث خطأ أثناء الحفظ')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 md:py-10 md:px-6">
      <div className="flex items-center justify-between mb-6 md:mb-10">
        <div>
          <p className="text-[#6B6560] font-arabic mt-2 font-medium">تحكم في الترتيب وظهور الأقسام في المتجر</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-[#B8860B] text-white px-8 py-3 rounded-2xl font-arabic font-bold hover:bg-[#785600] transition-all disabled:opacity-50 shadow-lg shadow-[#B8860B]/20"
        >
          {isSaving ? 'جاري الحفظ...' : <><Save size={18} /> حفظ التغييرات</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">

        {/* All Categories Panel */}
        <div className="lg:col-span-4 bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-[#F0EBE3] p-5 md:p-8 shadow-sm h-fit lg:sticky lg:top-24">
          <h2 className="text-xl font-black text-[#1A1A1A] font-arabic mb-6 flex items-center gap-2">
            <Plus className="text-[#B8860B]" size={20} />
            جميع الأقسام
          </h2>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {allCategories.map((cat) => (
              <div key={cat.id} className="group p-4 bg-[#FAF8F5] rounded-2xl border border-[#F0EBE3] hover:border-[#B8860B] transition-all">
                <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white shrink-0">
                        <CategoryImage src={cat.image_url} alt={cat.name_ar} className="w-full h-full rounded-xl" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-arabic font-bold text-[#1A1A1A] truncate">{cat.name_ar}</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                    <button 
                        onClick={() => addToHeader(cat)}
                        className="flex-1 py-1.5 px-2 bg-white text-[#1A1A1A] text-xs font-arabic font-bold rounded-xl border border-[#F0EBE3] hover:bg-[#B8860B] hover:text-white hover:border-[#B8860B] transition-all flex items-center justify-center gap-1"
                    >
                        + الهيدر
                    </button>
                    <button 
                        onClick={() => addToHome(cat)}
                        className="flex-1 py-1.5 px-2 bg-white text-[#1A1A1A] text-xs font-arabic font-bold rounded-xl border border-[#F0EBE3] hover:bg-[#785600] hover:text-white hover:border-[#785600] transition-all flex items-center justify-center gap-1"
                    >
                        + الرئيسية
                    </button>
                    <button 
                        onClick={() => addToFooter(cat)}
                        className="flex-1 py-1.5 px-2 bg-white text-[#1A1A1A] text-xs font-arabic font-bold rounded-xl border border-[#F0EBE3] hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A] transition-all flex items-center justify-center gap-1"
                    >
                        + الفوتر
                    </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Organized Navigation Panel */}
        <div className="lg:col-span-8 space-y-6 lg:space-y-10">

            {/* Home Section */}
            <div className="bg-[#FFFBEF] rounded-[2rem] lg:rounded-[3rem] p-6 md:p-10 shadow-sm border border-[#E8D99A]/60 relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-[#1A1A1A] font-arabic text-[#B8860B]">أقسام الرئيسية</h2>
                        <p className="text-[#6B6560] text-sm font-arabic mt-1">تظهر في شبكة "تسوق حسب القسم" بالواجهة الرئيسية (يجب اختيار 4 أقسام)</p>
                    </div>
                    <span className="text-[10px] bg-white text-[#B8860B] px-3 py-1 rounded-full font-black tracking-widest uppercase border border-[#F0EBE3]">
                        {homeLinks.length} / {MAX_HOME}
                    </span>
                </div>

                <Reorder.Group axis="y" values={homeLinks} onReorder={setHomeLinks} className="space-y-3">
                    <AnimatePresence>
                        {homeLinks.map((link) => (
                            <Reorder.Item 
                                key={link.id} 
                                value={link}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex items-center gap-4 bg-white border border-[#F0EBE3] p-4 rounded-2xl cursor-grab active:cursor-grabbing hover:border-[#B8860B] transition-colors shadow-sm"
                            >
                                <GripVertical className="text-[#DDD8D0] shrink-0" size={20} />
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#FAF8F5] shrink-0">
                                    <CategoryImage src={link.image_url} alt={link.name_ar} className="w-full h-full" />
                                </div>
                                <span className="flex-1 font-arabic font-bold text-[#1A1A1A]">{link.name_ar}</span>
                                <button 
                                    onClick={() => removeFromHome(link.id)}
                                    className="p-2 text-[#9E9890] hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </Reorder.Item>
                        ))}
                    </AnimatePresence>
                </Reorder.Group>

                {homeLinks.length === 0 && (
                    <div className="py-12 text-center border-2 border-dashed border-[#F0EBE3] rounded-[2rem]">
                        <p className="font-arabic text-[#9E9890]">قم بإضافة 4 أقسام رئيسية لتعرض في متجرك</p>
                    </div>
                )}
            </div>

            {/* Header Section */}
            <div className="bg-[#1A1A1A] rounded-[2rem] lg:rounded-[3rem] p-6 md:p-10 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-32 h-32 bg-[#B8860B]/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-white font-arabic">أقسام الهيدر</h2>
                            <p className="text-white/40 text-sm font-arabic mt-1">يمكنك سحب وإفلات العناصر لترتيبها (بحد أقصى {MAX_HEADER})</p>
                        </div>
                        <span className="text-[10px] bg-white/10 text-white/60 px-3 py-1 rounded-full font-black tracking-widest uppercase">
                            {headerLinks.length} / {MAX_HEADER}
                        </span>
                    </div>

                    <Reorder.Group axis="y" values={headerLinks} onReorder={setHeaderLinks} className="space-y-3">
                        <AnimatePresence>
                            {headerLinks.map((link) => (
                                <Reorder.Item 
                                    key={link.id} 
                                    value={link}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors"
                                >
                                    <GripVertical className="text-white/20 shrink-0" size={20} />
                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 shrink-0">
                                        <CategoryImage src={link.image_url} alt={link.name_ar} className="w-full h-full" />
                                    </div>
                                    <span className="flex-1 font-arabic font-bold text-white">{link.name_ar}</span>
                                    <button 
                                        onClick={() => removeFromHeader(link.id)}
                                        className="p-2 text-white/40 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </Reorder.Item>
                            ))}
                        </AnimatePresence>
                    </Reorder.Group>

                    {headerLinks.length === 0 && (
                        <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                            <p className="font-arabic text-white/20">لا توجد أقسام مضافة بعد، أضف من القائمة الجانبية</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Section */}
            <div className="bg-white rounded-[2rem] lg:rounded-[3rem] border border-[#F0EBE3] p-6 md:p-10 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-[#1A1A1A] font-arabic">أقسام الفوتر</h2>
                        <p className="text-[#6B6560] text-sm font-arabic mt-1">تظهر في العمود الثالث تحت عنوان "الأقسام" (بحد أقصى {MAX_FOOTER})</p>
                    </div>
                    <span className="text-[10px] bg-[#FAF8F5] text-[#6B6560] px-3 py-1 rounded-full font-black tracking-widest uppercase border border-[#F0EBE3]">
                        {footerLinks.length} / {MAX_FOOTER}
                    </span>
                </div>

                <Reorder.Group axis="y" values={footerLinks} onReorder={setFooterLinks} className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {footerLinks.map((link) => (
                            <Reorder.Item 
                                key={link.id} 
                                value={link}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex items-center gap-4 bg-[#FAF8F5] p-4 rounded-2xl border border-[#F0EBE3] cursor-grab active:cursor-grabbing hover:bg-white hover:shadow-xl hover:border-[#B8860B] transition-all"
                            >
                                <GripVertical className="text-[#DDD8D0] shrink-0" size={20} />
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white shrink-0">
                                    <CategoryImage src={link.image_url} alt={link.name_ar} className="w-full h-full" />
                                </div>
                                <span className="flex-1 font-arabic font-bold text-[#1A1A1A]">{link.name_ar}</span>
                                <button 
                                    onClick={() => removeFromFooter(link.id)}
                                    className="p-2 text-[#9E9890] hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </Reorder.Item>
                        ))}
                    </AnimatePresence>
                </Reorder.Group>

                {footerLinks.length === 0 && (
                    <div className="py-12 text-center border-2 border-dashed border-[#F0EBE3] rounded-[2rem]">
                        <p className="font-arabic text-[#9E9890]">لا توجد أقسام مضافة بعد</p>
                    </div>
                )}
            </div>

        </div>

      </div>
    </div>
  )
}
