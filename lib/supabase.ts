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
