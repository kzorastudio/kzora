'use client'

import { useRef } from 'react'
import { Video, X, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import {
  PRODUCT_VIDEO_MAX_SECONDS,
  productVideoUrl,
  productVideoPosterUrl,
  formatVideoDuration,
} from '@/lib/cloudinaryUrl'

export interface ProductVideoDraft {
  url: string            // Cloudinary URL, or a blob: URL while the file is still local
  public_id: string
  duration: number | null
  file?: File
  isLocal?: boolean
}

// Cloudinary's free plan rejects videos over 100MB
const MAX_FILE_MB = 100
// Clips longer than this are almost certainly the wrong file
const MAX_PICK_SECONDS = 60

export const VIDEO_POSITIONS = [
  { value: 0,  label: 'الأول' },
  { value: 1,  label: 'الثاني' },
  { value: -1, label: 'الأخير' },
] as const

interface VideoUploaderProps {
  video: ProductVideoDraft | null
  position: number
  uploadProgress: number | null
  onPick: (video: ProductVideoDraft) => void
  onRemove: () => void
  onPositionChange: (position: number) => void
}

function readDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const el = document.createElement('video')
    el.preload = 'metadata'
    el.onloadedmetadata = () => { URL.revokeObjectURL(el.src); resolve(el.duration) }
    el.onerror = () => { URL.revokeObjectURL(el.src); reject(new Error('unreadable')) }
    el.src = URL.createObjectURL(file)
  })
}

/**
 * Uploads straight from the browser to Cloudinary with a server-made signature,
 * reporting progress (0–100). Videos never pass through our API.
 */
export async function uploadProductVideo(
  file: File,
  onProgress: (percent: number) => void
): Promise<{ url: string; public_id: string; duration: number | null }> {
  const signRes = await fetch('/api/videos/sign', { method: 'POST' })
  if (!signRes.ok) {
    const err = await signRes.json().catch(() => ({}))
    throw new Error(err.error || 'فشل تجهيز رفع الفيديو')
  }
  const { upload_url, signature, api_key, timestamp, folder, eager, eager_async } = await signRes.json()

  const form = new FormData()
  form.append('file', file)
  form.append('api_key', api_key)
  form.append('timestamp', String(timestamp))
  form.append('signature', signature)
  form.append('folder', folder)
  form.append('eager', eager)
  form.append('eager_async', eager_async)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', upload_url)
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)) }
    xhr.onload = () => {
      const data = (() => { try { return JSON.parse(xhr.responseText) } catch { return {} } })()
      if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
        resolve({ url: data.secure_url, public_id: data.public_id, duration: data.duration ?? null })
      } else {
        reject(new Error(data.error?.message ? `فشل رفع الفيديو: ${data.error.message}` : 'فشل رفع الفيديو'))
      }
    }
    xhr.onerror = () => reject(new Error('فشل رفع الفيديو — تأكد من الاتصال بالإنترنت'))
    xhr.send(form)
  })
}

export default function VideoUploader({
  video,
  position,
  uploadProgress,
  onPick,
  onRemove,
  onPositionChange,
}: VideoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('video/')) {
      toast.error('الملف المختار ليس فيديو')
      return
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`حجم الفيديو أكبر من ${MAX_FILE_MB} ميغابايت`)
      return
    }
    let duration: number | null = null
    try {
      duration = await readDuration(file)
    } catch {
      // Some formats (e.g. certain .mov files) can't be read in every browser — Cloudinary still accepts them
    }
    if (duration && duration > MAX_PICK_SECONDS) {
      toast.error(`الفيديو طويل (${Math.round(duration)} ثانية). اختر مقطعاً قصيراً`)
      return
    }
    if (duration && duration > PRODUCT_VIDEO_MAX_SECONDS) {
      toast(`سيُعرض أول ${PRODUCT_VIDEO_MAX_SECONDS} ثانية فقط من الفيديو`, { icon: 'ℹ️' })
    }
    onPick({ url: URL.createObjectURL(file), public_id: '', duration, file, isLocal: true })
  }

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept="video/*"
      className="hidden"
      onChange={e => { handleFile(e.target.files?.[0]); e.target.value = '' }}
    />
  )

  if (!video) {
    return (
      <div dir="rtl">
        {input}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 transition-colors border-outline-variant/60 hover:border-primary/50 hover:bg-surface-container/50 text-secondary"
        >
          <Video size={28} />
          <span className="text-sm font-arabic font-medium">انقر لاختيار فيديو قصير للمنتج</span>
          <span className="text-xs font-arabic text-secondary/70">
            MP4 أو MOV حتى {MAX_FILE_MB} ميغابايت · يُعرض أول {PRODUCT_VIDEO_MAX_SECONDS} ثانية · يُرفع عند حفظ المنتج
          </span>
        </button>
      </div>
    )
  }

  return (
    <div dir="rtl" className="flex flex-col sm:flex-row gap-4">
      {input}
      <div className="relative w-40 shrink-0 aspect-[4/5] rounded-xl overflow-hidden bg-surface-container border border-[#785600] ring-2 ring-[#785600]/20 shadow-sm">
        <video
          src={video.isLocal ? video.url : productVideoUrl(video.url)}
          poster={video.isLocal ? undefined : productVideoPosterUrl(video.url)}
          muted
          loop
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {video.isLocal && (
          <span className="absolute top-1 right-1 bg-primary/90 text-[8px] text-white px-1.5 py-0.5 rounded-full font-arabic shadow-sm">
            جديد
          </span>
        )}
        {video.duration != null && (
          <span className="absolute bottom-1.5 left-1.5 bg-black/65 text-white text-[10px] px-1.5 py-0.5 rounded tabular-nums" dir="ltr">
            {formatVideoDuration(video.duration)}
          </span>
        )}
        {uploadProgress !== null && (
          <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-2 text-white">
            <span className="text-sm font-arabic font-bold">جارٍ الرفع {uploadProgress}%</span>
            <div className="w-3/4 h-1.5 rounded-full bg-white/30 overflow-hidden">
              <div className="h-full bg-white transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 flex-1">
        <div>
          <p className="block text-sm font-arabic font-medium text-on-surface-variant mb-2">مكان الفيديو بين الصور</p>
          <div className="inline-flex rounded-xl border border-outline-variant/50 overflow-hidden">
            {VIDEO_POSITIONS.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => onPositionChange(p.value)}
                className={cn(
                  'px-4 py-2 text-sm font-arabic font-bold transition-colors',
                  position === p.value ? 'bg-primary text-white' : 'bg-surface-container text-secondary hover:bg-surface-container-high'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] font-arabic text-secondary mt-1.5">
            الصورة الرئيسية (النجمة) تبقى هي صورة المنتج في الأقسام والطلبات.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={uploadProgress !== null}
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container text-sm font-arabic font-bold text-on-surface hover:bg-surface-container-high disabled:opacity-50"
          >
            <RefreshCw size={15} /> تغيير الفيديو
          </button>
          <button
            type="button"
            disabled={uploadProgress !== null}
            onClick={onRemove}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-error/10 text-sm font-arabic font-bold text-error hover:bg-error/20 disabled:opacity-50"
          >
            <X size={15} /> حذف الفيديو
          </button>
        </div>
      </div>
    </div>
  )
}
