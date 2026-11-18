/**
 * Downloads every Cloudinary asset at FULL original quality to a local folder
 * (default: ~/Desktop/Kzora-media-backup), plus manifest.json mapping each file
 * to its Cloudinary URL. This is the offline copy — the Supabase mirror only keeps
 * the small 480p delivery version of each video.
 *
 * Re-runnable: files already downloaded with the right size are skipped.
 *   node scripts/download-media-originals.mjs [targetDir]
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter(l => /^\w+=/.test(l))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, '')] })
)
const CLOUD = env.CLOUDINARY_CLOUD_NAME
const AUTH = 'Basic ' + Buffer.from(`${env.CLOUDINARY_API_KEY}:${env.CLOUDINARY_API_SECRET}`).toString('base64')
const target = process.argv[2] || path.join(os.homedir(), 'Desktop', 'Kzora-media-backup')

async function list(type) {
  const out = []
  let cursor
  do {
    const r = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD}/resources/${type}?max_results=500${cursor ? `&next_cursor=${cursor}` : ''}`,
      { headers: { Authorization: AUTH } }
    ).then(r => r.json())
    if (r.error) throw new Error(r.error.message)
    out.push(...r.resources)
    cursor = r.next_cursor
  } while (cursor)
  return out
}

const assets = [...await list('image'), ...await list('video')]
const manifest = []
const count = { downloaded: 0, skipped: 0, failed: 0 }
for (let i = 0; i < assets.length; i += 4) {
  await Promise.all(assets.slice(i, i + 4).map(async a => {
    const rel = `${a.resource_type}/${a.public_id}.${a.format}`
    const file = path.join(target, rel)
    manifest.push({ file: rel, url: a.secure_url, bytes: a.bytes, created_at: a.created_at })
    if (fs.existsSync(file) && fs.statSync(file).size === a.bytes) { count.skipped++; return }
    try {
      const res = await fetch(a.secure_url)
      if (!res.ok) throw new Error(`${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length !== a.bytes) throw new Error(`size ${buf.length} != ${a.bytes}`)
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, buf)
      count.downloaded++
    } catch (e) { count.failed++; console.error('FAILED', rel, e.message) }
  }))
}
manifest.sort((a, b) => a.file.localeCompare(b.file))
fs.writeFileSync(path.join(target, 'manifest.json'), JSON.stringify(manifest, null, 2))
const mb = manifest.reduce((s, m) => s + m.bytes, 0) / 1e6
console.log(`${target}\n${count.downloaded} downloaded, ${count.skipped} already there, ${count.failed} failed — ${manifest.length} assets, ${mb.toFixed(0)}MB`)
