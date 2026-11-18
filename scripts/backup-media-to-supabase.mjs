/**
 * Copies every Cloudinary asset into the public Supabase Storage bucket "media",
 * so the site can switch to it instantly if Cloudinary stops delivering
 * (see docs/media-fallback.md and NEXT_PUBLIC_MEDIA_FALLBACK).
 *
 *   images → media/image/<public_id>.<format>   (the stored original, already ≤1200px)
 *   videos → media/video/<public_id>.mp4         (the small 480p delivery version)
 *            media/video/<public_id>.jpg         (its poster frame)
 *
 * Safe to re-run any time: files already in the bucket are skipped, so a re-run
 * only copies what was uploaded since. Run:  node scripts/backup-media-to-supabase.mjs
 */
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter(l => /^\w+=/.test(l))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, '')] })
)

const CLOUD = env.CLOUDINARY_CLOUD_NAME
const AUTH = 'Basic ' + Buffer.from(`${env.CLOUDINARY_API_KEY}:${env.CLOUDINARY_API_SECRET}`).toString('base64')
const BUCKET = 'media'
// Must match VIDEO_TRANSFORM / POSTER_TRANSFORM in lib/cloudinaryUrl.ts
const VIDEO_TRANSFORM = 'vc_h264,q_auto:eco,br_600k,w_480,c_limit,du_15'
const POSTER_TRANSFORM = 'so_0,w_720,c_limit,q_auto'

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

async function listCloudinary(type) {
  const out = []
  let cursor
  do {
    const r = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD}/resources/${type}?max_results=500${cursor ? `&next_cursor=${cursor}` : ''}`,
      { headers: { Authorization: AUTH } }
    ).then(r => r.json())
    if (r.error) throw new Error(`Cloudinary ${type}: ${r.error.message}`)
    out.push(...r.resources)
    cursor = r.next_cursor
  } while (cursor)
  return out
}

async function listBucket(prefix, acc = new Set()) {
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000, offset })
    if (error) throw error
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name
      if (item.id === null) await listBucket(path, acc) // folder
      else acc.add(path)
    }
    if (data.length < 1000) return acc
  }
}

async function ensureBucket() {
  const { data } = await supabase.storage.getBucket(BUCKET)
  if (data) return
  const { error } = await supabase.storage.createBucket(BUCKET, { public: true })
  if (error) throw error
  console.log(`Created public bucket "${BUCKET}"`)
}

async function copy(url, path, contentType, existing) {
  if (existing.has(path)) return 'skip'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} fetching ${url}`)
  const body = Buffer.from(await res.arrayBuffer())
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType, upsert: true, cacheControl: '31536000',
  })
  if (error) throw new Error(`${path}: ${error.message}`)
  return 'copied'
}

await ensureBucket()
const existing = await listBucket('')
const jobs = []
for (const img of await listCloudinary('image')) {
  jobs.push([img.secure_url, `image/${img.public_id}.${img.format}`, `image/${img.format === 'jpg' ? 'jpeg' : img.format}`])
}
for (const v of await listCloudinary('video')) {
  const base = `https://res.cloudinary.com/${CLOUD}/video/upload`
  jobs.push([`${base}/${VIDEO_TRANSFORM}/v${v.version}/${v.public_id}.mp4`, `video/${v.public_id}.mp4`, 'video/mp4'])
  jobs.push([`${base}/${POSTER_TRANSFORM}/v${v.version}/${v.public_id}.jpg`, `video/${v.public_id}.jpg`, 'image/jpeg'])
}

const count = { copied: 0, skip: 0, failed: 0 }
for (let i = 0; i < jobs.length; i += 6) {
  await Promise.all(jobs.slice(i, i + 6).map(async ([url, path, type]) => {
    try { count[await copy(url, path, type, existing)]++ }
    catch (e) { count.failed++; console.error('FAILED', e.message) }
  }))
}
console.log(`Done: ${count.copied} copied, ${count.skip} already there, ${count.failed} failed (of ${jobs.length})`)
