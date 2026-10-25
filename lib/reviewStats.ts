import { unstable_cache } from 'next/cache'
import { supabase, fetchAllRows } from '@/lib/supabase'

export const REVIEW_STATS_TAG = 'review-stats'

export interface ReviewStats {
  count: number
  average: number
}

const getCachedReviewStats = unstable_cache(
  async (): Promise<ReviewStats> => {
    const rows = await fetchAllRows<{ rating: number }>((from, to) =>
      supabase.from('product_reviews').select('rating').eq('is_published', true).range(from, to)
    )
    const count = rows.length
    const average = count > 0
      ? Number((rows.reduce((sum, r) => sum + (r.rating || 0), 0) / count).toFixed(1))
      : 0
    return { count, average }
  },
  ['review-stats'],
  { revalidate: 3600, tags: [REVIEW_STATS_TAG] }
)

// Store-wide rating from every published review. Shared by the root layout's
// business schema, the homepage badge and /llms.txt so all three always show the
// same real figure. Cached for an hour and busted by REVIEW_STATS_TAG whenever a
// review is added or deleted. A failed fetch returns zeros without being cached,
// and callers hide the rating when count is 0.
export async function getReviewStats(): Promise<ReviewStats> {
  try {
    return await getCachedReviewStats()
  } catch (err) {
    console.error('getReviewStats error:', err)
    return { count: 0, average: 0 }
  }
}
