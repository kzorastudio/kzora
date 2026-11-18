/**
 * Restore store data from a backup made by scripts/backup-database.mjs.
 *
 * CHECK (default, read-only) — compares the backup with the live database:
 *   node scripts/restore-database.mjs <backupDayDir>
 *   e.g.  node scripts/restore-database.mjs "C:/Users/moham/Desktop/Kzora-media-backup/database/2026-11-18"
 *
 *   For each table it reports rows that exist in the backup but are MISSING from the
 *   live DB, and rows whose content CHANGED since the backup.
 *
 * APPLY — writes the backup back (upsert by primary key `id`):
 *   node scripts/restore-database.mjs <backupDayDir> --apply missing  --tables=products,product_images
 *   node scripts/restore-database.mjs <backupDayDir> --apply all      --tables=products
 *
 *   --apply missing   only re-inserts rows that were deleted (never touches existing rows)
 *   --apply all       also overwrites changed rows with their backed-up version
 *   --tables=...      required with --apply; tables are processed in dependency order
 *
 * Rows created after the backup are never deleted. Always run CHECK first.
 * Needs the tables to exist (on a brand-new Supabase project, run supabase/schema.sql
 * and the other supabase/*.sql files first; _schema.openapi.json in the backup lists
 * every table's columns for anything those files miss).
 */
import fs from 'node:fs'
import path from 'node:path'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter(l => /^\w+=/.test(l))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, '')] })
)
const U = env.NEXT_PUBLIC_SUPABASE_URL
const H = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` }

const dir = process.argv[2]
const applyIdx = process.argv.indexOf('--apply')
const mode = applyIdx === -1 ? 'check' : process.argv[applyIdx + 1]
const tablesArg = process.argv.find(a => a.startsWith('--tables='))?.slice(9).split(',').filter(Boolean)
if (!dir || !fs.existsSync(dir)) { console.error('Usage: node scripts/restore-database.mjs <backupDayDir> [--apply missing|all --tables=a,b]'); process.exit(1) }
if (mode !== 'check' && (!['missing', 'all'].includes(mode) || !tablesArg?.length)) {
  console.error('--apply needs "missing" or "all" and --tables=...'); process.exit(1)
}

// Parents before children so foreign keys resolve
const ORDER = [
  'admins', 'categories', 'products', 'product_colors', 'product_sizes', 'product_variants',
  'product_images', 'product_tags', 'product_reviews', 'hero_slides', 'homepage_settings',
  'static_pages', 'shipping_governorates', 'shipping_centers', 'shipping_methods', 'coupons',
  'orders', 'order_items', 'order_status_history', 'loyalty_points', 'fcm_tokens', 'site_visits',
]
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith('_')).map(f => f.slice(0, -5))
const tables = [...ORDER.filter(t => files.includes(t)), ...files.filter(t => !ORDER.includes(t)).sort()]
  .filter(t => mode === 'check' || tablesArg.includes(t))

async function live(t) {
  const rows = []
  for (let off = 0; ; off += 1000) {
    const page = await fetch(`${U}/rest/v1/${t}?select=*&order=id&offset=${off}&limit=1000`, { headers: H }).then(r => r.json())
    if (!Array.isArray(page)) throw new Error(`${t}: ${page.message}`)
    rows.push(...page)
    if (page.length < 1000) return rows
  }
}
const same = (a, b) => JSON.stringify(a, Object.keys(a).sort()) === JSON.stringify(b, Object.keys(b).sort())

let totalMissing = 0, totalChanged = 0
for (const t of tables) {
  const backup = JSON.parse(fs.readFileSync(path.join(dir, `${t}.json`), 'utf8'))
  if (backup.length && !('id' in backup[0])) { console.log(`${t}: no id column — skipped`); continue }
  const now = new Map((await live(t)).map(r => [r.id, r]))
  const missing = backup.filter(r => !now.has(r.id))
  const changed = backup.filter(r => now.has(r.id) && !same(r, now.get(r.id)))
  totalMissing += missing.length; totalChanged += changed.length
  console.log(`${t.padEnd(24)} backup ${String(backup.length).padStart(6)} | missing in live ${String(missing.length).padStart(5)} | changed since ${String(changed.length).padStart(5)} | new since backup ${now.size - (backup.length - missing.length)}`)

  if (mode === 'check') continue
  const rows = mode === 'all' ? [...missing, ...changed] : missing
  for (let i = 0; i < rows.length; i += 500) {
    const r = await fetch(`${U}/rest/v1/${t}?on_conflict=id`, {
      method: 'POST',
      headers: { ...H, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(rows.slice(i, i + 500)),
    })
    if (!r.ok) { console.error(`  FAILED ${t}: ${r.status} ${await r.text()}`); process.exit(1) }
  }
  if (rows.length) console.log(`  ✓ restored ${rows.length} rows into ${t}`)
}
console.log(mode === 'check'
  ? `\nCHECK only (nothing written): ${totalMissing} rows missing from live, ${totalChanged} changed since the backup.`
  : '\nDone.')
