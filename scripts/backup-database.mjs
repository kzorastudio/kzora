/**
 * Full backup of the store's data + a readable map of where every image/video belongs.
 *
 *   node scripts/backup-database.mjs [targetDir]     (default: ~/Desktop/Kzora-media-backup)
 *
 * Writes into <targetDir>:
 *   database/<YYYY-MM-DD>/<table>.json   every row of every table (products, colors,
 *                                        product_images with color + order, categories,
 *                                        hero_slides, settings, orders, …)
 *   media-map.json / media-map.csv       product → category → color → images in display
 *                                        order (main flagged) → video + its position,
 *                                        plus categories, hero slides, banner, Sham Cash QR.
 *                                        Each entry names its local file and Supabase mirror URL
 *                                        and whether both exist.
 *
 * ⚠ The database export contains customer names, phones and addresses and admin
 *   password hashes. Keep the folder private.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter(l => /^\w+=/.test(l))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, '')] })
)
const U = env.NEXT_PUBLIC_SUPABASE_URL
const H = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` }
const MIRROR = `${U}/storage/v1/object/public/media`
const target = process.argv[2] || path.join(os.homedir(), 'Desktop', 'Kzora-media-backup')
const day = new Date().toISOString().slice(0, 10)

// ── 1. Export every table ────────────────────────────────────────────────────
const spec = await fetch(`${U}/rest/v1/`, { headers: H }).then(r => r.json())
const tables = Object.keys(spec.definitions).sort()
const db = {}
const dbDir = path.join(target, 'database', day)
fs.mkdirSync(dbDir, { recursive: true })
for (const t of tables) {
  const rows = []
  const order = 'id' in spec.definitions[t].properties ? '&order=id' : ''
  for (let off = 0; ; off += 1000) {
    const r = await fetch(`${U}/rest/v1/${t}?select=*${order}&offset=${off}&limit=1000`, { headers: H })
    const page = await r.json()
    if (!Array.isArray(page)) throw new Error(`${t}: ${page.message}`)
    rows.push(...page)
    if (page.length < 1000) break
  }
  db[t] = rows
  fs.writeFileSync(path.join(dbDir, `${t}.json`), JSON.stringify(rows, null, 1))
  console.log(`${t}: ${rows.length} rows`)
}

// ── 2. Media map ─────────────────────────────────────────────────────────────
function locate(url) {
  const m = url?.match(/res\.cloudinary\.com\/[^/]+\/(image|video)\/upload\/(.+)$/)
  if (!m) return null
  const parts = m[2].split(/[?#]/)[0].split('/')
  const v = parts.findIndex(p => /^v\d+$/.test(p))
  const rel = (v !== -1 ? parts.slice(v + 1) : parts).join('/')
  const noExt = rel.replace(/\.[a-z0-9]+$/i, '')
  return m[1] === 'image'
    ? { local: `image/${rel}`, mirror: `${MIRROR}/image/${rel}` }
    : { local: `video/${rel}`, mirror: `${MIRROR}/video/${noExt}.mp4` }
}
const mirrorOk = new Map()
async function checkMirror(u) {
  if (!mirrorOk.has(u)) {
    let r
    for (let k = 0; k < 4; k++) {
      r = await fetch(u, { headers: { Range: 'bytes=0-0' } })
      if (r.status !== 429) break
      await new Promise(z => setTimeout(z, 1500))
    }
    mirrorOk.set(u, r.ok)
  }
  return mirrorOk.get(u)
}
async function entry(where, url, extra = {}) {
  const loc = locate(url)
  return {
    ...where, ...extra, cloudinary_url: url,
    local_file: loc?.local ?? null,
    local_ok: loc ? fs.existsSync(path.join(target, loc.local)) : false,
    mirror_url: loc?.mirror ?? null,
    mirror_ok: loc ? await checkMirror(loc.mirror) : false,
  }
}

const cats = Object.fromEntries(db.categories.map(c => [c.id, c.name_ar]))
const map = []
for (const p of [...db.products].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))) {
  const base = { section: 'product', product: p.name, slug: p.slug, category: cats[p.category_id] ?? '' }
  const imgs = db.product_images.filter(i => i.product_id === p.id)
    .sort((a, b) => (a.color_variant ?? '').localeCompare(b.color_variant ?? '') || (a.display_order ?? 0) - (b.display_order ?? 0))
  for (const i of imgs) {
    map.push(await entry({ ...base, kind: 'image' }, i.url, { color: i.color_variant ?? '', display_order: i.display_order, is_main: i.is_main }))
  }
  if (p.video_url) {
    map.push(await entry({ ...base, kind: 'video' }, p.video_url, { color: '', display_order: p.video_position, is_main: false }))
  }
}
for (const c of db.categories) if (c.image_url) map.push(await entry({ section: 'category', product: c.name_ar, slug: c.slug, kind: 'image' }, c.image_url))
for (const s of db.hero_slides) {
  if (s.desktop_image_url) map.push(await entry({ section: 'hero_slide', product: s.heading, kind: 'image' }, s.desktop_image_url, { color: 'desktop', display_order: s.sort_order }))
  if (s.mobile_image_url) map.push(await entry({ section: 'hero_slide', product: s.heading, kind: 'image' }, s.mobile_image_url, { color: 'mobile', display_order: s.sort_order }))
}
for (const h of db.homepage_settings) {
  if (h.promo_banner_url) map.push(await entry({ section: 'promo_banner', product: h.promo_banner_heading ?? '', kind: 'image' }, h.promo_banner_url))
  if (h.sham_cash_image_url) map.push(await entry({ section: 'sham_cash_qr', product: '', kind: 'image' }, h.sham_cash_image_url))
}

fs.writeFileSync(path.join(target, 'media-map.json'), JSON.stringify(map, null, 1))
const cols = ['section', 'category', 'product', 'slug', 'kind', 'color', 'display_order', 'is_main', 'local_file', 'local_ok', 'mirror_ok', 'cloudinary_url', 'mirror_url']
const csv = [cols.join(','), ...map.map(r => cols.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(','))].join('\r\n')
fs.writeFileSync(path.join(target, 'media-map.csv'), '﻿' + csv) // BOM so Excel shows Arabic

const bad = map.filter(r => !r.local_ok || !r.mirror_ok)
console.log(`\nmedia map: ${map.length} placements; ${map.length - bad.length} fully backed up (local + mirror)`)
for (const b of bad) console.log(`  MISSING ${b.section} | ${b.product} | ${b.color ?? ''} | local=${b.local_ok} mirror=${b.mirror_ok} | ${b.cloudinary_url}`)
console.log(`\n${target}`)
