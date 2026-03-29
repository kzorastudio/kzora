'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, ImageIcon, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface UploadedImage {
  id: string
  file?: File
  url: string
  public_id: string
  color_variant?: string | null
  is_main: boolean
  isLocal?: boolean
}

interface ImageUploaderProps {
  images: UploadedImage[]
  onAddFiles: (files: File[]) => void
  onRemoveImage: (id: string) => void
  onColorChange?: (id: string, color: string | null) => void
  onSetMain: (id: string) => void
  colorOptions?: { label: string; value: string }[]
  maxFiles?: number
  className?: string
}

export default function ImageUploader({
  images,
  onAddFiles,
  onRemoveImage,
  onColorChange,
  onSetMain,
  colorOptions = [],
  maxFiles = 10,
  className,
}: ImageUploaderProps) {
  const canUploadMore = images.length < maxFiles

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const remaining = maxFiles - images.length
      const filesToPreview = acceptedFiles.slice(0, remaining)
      if (filesToPreview.length > 0) {
        onAddFiles(filesToPreview)
      }
    },
    [images.length, maxFiles, onAddFiles]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.avif'] },
    multiple: true,
    disabled: !canUploadMore,
  })

  return (
    <div dir="rtl" className={cn('flex flex-col gap-3', className)}>
      {canUploadMore && (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors',
            isDragActive
              ? 'border-primary bg-primary-fixed/20 text-primary'
              : 'border-outline-variant/60 hover:border-primary/50 hover:bg-surface-container/50 text-secondary'
          )}
        >
          <input {...getInputProps()} />
          <Upload size={28} className={isDragActive ? 'text-primary' : 'text-secondary'} />
          <div className="text-center">
            <p className="text-sm font-arabic font-medium">
              {isDragActive ? 'أفلت الصور هنا' : 'اسحب الصور أو انقر للاختيار'}
            </p>
            <p className="text-xs font-arabic text-secondary/70 mt-0.5">
               سيتم رفع الصور فقط عند حفظ المنتج ({images.length}/{maxFiles}) - يمكنك اختيار صورة غلاف للمنتج بالنقر على النجمة.
            </p>
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {images.map((img) => (
            <div key={img.id} className="relative flex flex-col gap-2">
              <div className={cn(
                "relative group aspect-square rounded-xl overflow-hidden bg-surface-container border shadow-sm transition-all",
                img.is_main ? "border-[#785600] ring-2 ring-[#785600]/20" : "border-outline-variant/30"
              )}>
                <img
                  src={img.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
                
                {img.isLocal && (
                   <div className="absolute top-1 right-1 bg-primary/90 text-[8px] text-white px-1.5 py-0.5 rounded-full font-arabic shadow-sm">
                     جديدة
                   </div>
                )}

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="absolute top-2 left-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => onRemoveImage(img.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-full bg-error flex items-center justify-center text-white shadow-lg"
                    >
                      <X size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSetMain(img.id)}
                      className={cn(
                        "transition-all h-8 w-8 rounded-full flex items-center justify-center shadow-lg",
                        img.is_main 
                          ? "bg-[#785600] text-white opacity-100" 
                          : "bg-white/90 text-secondary opacity-0 group-hover:opacity-100 hover:bg-[#785600] hover:text-white"
                      )}
                    >
                      <Star size={16} fill={img.is_main ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>
              </div>

              {onColorChange && colorOptions.length > 0 && (
                <select
                  value={img.color_variant || ''}
                  onChange={(e) => onColorChange(img.id, e.target.value || null)}
                  className="w-full text-[10px] font-arabic bg-surface-container px-1.5 py-1 rounded-md border border-outline-variant/50 focus:outline-none focus:ring-1 focus:ring-primary/40 truncate"
                >
                  <option value="">اختر اللون</option>
                  {colorOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && !canUploadMore && (
        <div className="flex flex-col items-center gap-2 py-6 text-secondary">
          <ImageIcon size={28} />
          <p className="text-sm font-arabic">لا توجد صور</p>
        </div>
      )}
    </div>
  )
}
