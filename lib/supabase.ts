import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-service-key'

// Client-side client (anon key, respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side admin client (service role, bypasses RLS for admin operations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

/**
 * Admin client that never reads from a cache.
 *
 * Next.js patches global `fetch` and caches GET responses by default. supabase-js
 * talks to PostgREST over `fetch`, so an ordinary query inside a route handler can
 * keep returning the very first response it ever got — the order-tracking endpoint
 * was serving customers a snapshot that never changed, no matter how many times the
 * order's status was updated.
 *
 * Use this client for anything that must reflect the current state of the database
 * on every single request. Everything else keeps using `supabaseAdmin`, so pages
 * that rely on ISR caching are untouched.
 */
export const supabaseAdminLive = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  global: {
    fetch: (input: RequestInfo | URL, init?: RequestInit) =>
      fetch(input, { ...init, cache: 'no-store' }),
  },
})

/**
 * Fetch ALL rows from a Supabase query, bypassing PostgREST's server-side
 * row cap (default 1000). Passing `.limit(100000)` does NOT override that cap,
 * so large tables like `site_visits` silently return only the first 1000 rows.
 *
 * This paginates with `.range()` until every row is retrieved.
 *
 * @param buildQuery factory that returns a fresh query for the given range.
 *   Must include a deterministic `.order(...)` so pages don't overlap/skip.
 *   Example:
 *     fetchAllRows((from, to) =>
 *       supabaseAdmin.from('site_visits')
 *         .select('session_id, visited_at')
 *         .gte('visited_at', since)
 *         .order('visited_at', { ascending: true })
 *         .range(from, to)
 *     )
 */
export async function fetchAllRows<T = any>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>,
  pageSize = 1000
): Promise<T[]> {
  const all: T[] = []
  let from = 0

  // Safety cap to avoid an unbounded loop (500k rows max).
  for (let page = 0; page < 500; page++) {
    const to = from + pageSize - 1
    const { data, error } = await buildQuery(from, to)
    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < pageSize) break
    from += pageSize
  }

  return all
}
