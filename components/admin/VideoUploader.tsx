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
  url: string            // Stored video URL, or a blob: URL while the file is still local
  public_id: string
  duration: number | null
  file?: File
  isLocal?: boolean
}

// The browser compresses every video before upload (compressVideo below), so the picked
// file can be big. If this browser can't compress, the original is uploaded as-is and must
// then stay under RAW_MAX_MB, because every play downloads the whole file.
const MAX_FILE_MB = 200
const RAW_MAX_MB = 20
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

/** First frame of a local video as a JPG (≤720px wide), used as thumbnail and poster. */
function makePoster(file: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const el = document.createElement('video')
    const src = URL.createObjectURL(file)
    const fail = () => { URL.revokeObjectURL(src); reject(new Error('unplayable')) }
    el.muted = true
    el.playsInline = true
    el.preload = 'auto'
    el.onerror = fail
    el.onloadeddata = () => { el.currentTime = Math.min(0.1, (el.duration || 1) / 2) }
    el.onseeked = () => {
      const scale = Math.min(1, 720 / (el.videoWidth || 720))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round((el.videoWidth || 720) * scale)
      canvas.height = Math.round((el.videoHeight || 900) * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx || !el.videoWidth) return fail()
      ctx.drawImage(el, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(b => { URL.revokeObjectURL(src); b ? resolve(b) : reject(new Error('poster')) }, 'image/jpeg', 0.8)
    }
    el.src = src
  })
}

function putFile(url: string, body: Blob, contentType: string, onProgress?: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', contentType)
    xhr.setRequestHeader('x-upsert', 'true')
    xhr.setRequestHeader('cache-control', 'max-age=31536000')
    if (onProgress) xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)) }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve()
      const msg = (() => { try { return JSON.parse(xhr.responseText).message } catch { return '' } })()
      reject(new Error(msg ? `فشل رفع الفيديو: ${msg}` : 'فشل رفع الفيديو'))
    }
    xhr.onerror = () => reject(new Error('فشل رفع الفيديو — تأكد من الاتصال بالإنترنت'))
    xhr.send(body)
  })
}

/**
 * Re-encodes the video in the browser with the same settings Cloudinary used to apply:
 * H.264 MP4, at most 480px wide, ~600kbps, cut at PRODUCT_VIDEO_MAX_SECONDS — about 1–1.5MB
 * for a 15s clip. Uses the device's hardware encoder through WebCodecs (mediabunny).
 * Returns null when this browser can't do it (no WebCodecs/H.264 encoder, or a format it
 * can't decode such as HEVC on some PCs); the caller then falls back to the original.
 */
async function compressVideo(file: File, onProgress: (p: number) => void): Promise<Blob | null> {
  try {
    if (typeof VideoEncoder === 'undefined') return null
    const mb = await import('mediabunny')
    if (!(await mb.canEncodeVideo('avc', { width: 480, height: 854, bitrate: VIDEO_BITRATE }))) return null
    const aac = await mb.canEncodeAudio('aac').catch(() => false)
    const input = new mb.Input({ source: new mb.BlobSource(file), formats: mb.ALL_FORMATS })
    const target = new mb.BufferTarget()
    const output = new mb.Output({ format: new mb.Mp4OutputFormat({ fastStart: 'in-memory' }), target })
    const conversion = await mb.Conversion.init({
      input,
      output,
      tracks: 'primary',
      trim: { start: 0, end: PRODUCT_VIDEO_MAX_SECONDS },
      video: track => {
        const w = Math.min(480, track.displayWidth)
        return { codec: 'avc', width: w - (w % 2), bitrate: VIDEO_BITRATE, forceTranscode: true }
      },
      audio: aac ? { codec: 'aac', bitrate: 64_000 } : { discard: true },
      showWarnings: false,
    })
    if (!conversion.isValid || !conversion.utilizedTracks.some(t => t.isVideoTrack())) return null
    conversion.onProgress = p => onProgress(Math.round(p * 100))
    await conversion.execute()
    return target.buffer ? new Blob([target.buffer], { type: 'video/mp4' }) : null
  } catch (e) {
    console.error('Video compression failed, uploading the original instead:', e)
    return null
  }
}

const VIDEO_BITRATE = 600_000

/**
 * Uploads straight from the browser to Supabase Storage through signed URLs made by
 * the server, reporting progress (0–100). Videos never pass through our API.
 */
export async function uploadProductVideo(
  file: File,
  onProgress: (percent: number) => void
): Promise<{ url: string; public_id: string; duration: number | null }> {
  // Progress: compression 0–60%, upload 60–100%
  const compressed = await compressVideo(file, p => onProgress(Math.round(p * 0.6)))
  if (!compressed && file.size > RAW_MAX_MB * 1024 * 1024) {
    throw new Error(`تعذّر ضغط الفيديو في هذا المتصفح والملف أكبر من ${RAW_MAX_MB} ميغابايت. جرّب من Chrome أو Safari حديث، أو صغّر الفيديو أولاً`)
  }
  const body: Blob = compressed ?? file
  let poster: Blob
  try {
    poster = await makePoster(body)
  } catch {
    throw new Error('لا يمكن تشغيل هذا الفيديو في المتصفح. صدّره بصيغة MP4 (H.264) ثم أعد المحاولة')
  }
  const signRes = await fetch('/api/videos/sign', { method: 'POST' })
  if (!signRes.ok) {
    const err = await signRes.json().catch(() => ({}))
    throw new Error(err.error || 'فشل تجهيز رفع الفيديو')
  }
  const { video_upload_url, poster_upload_url, url, public_id } = await signRes.json()
  await putFile(poster_upload_url, poster, 'image/jpeg')
  await putFile(video_upload_url, body, 'video/mp4', p => onProgress(60 + Math.round(p * 0.4)))
  return { url, public_id, duration: null }
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
      // Unreadable here — uploadProductVideo will reject it if the browser can't play it at all
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
            MP4 أو MOV حتى {MAX_FILE_MB} ميغابايت · يُضغط تلقائياً ويُعرض أول {PRODUCT_VIDEO_MAX_SECONDS} ثانية · يُرفع عند حفظ المنتج
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
            <span className="text-sm font-arabic font-bold">{uploadProgress < 60 ? 'جارٍ ضغط الفيديو' : 'جارٍ الرفع'} {uploadProgress}%</span>
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
