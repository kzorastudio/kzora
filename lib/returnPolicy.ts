import { unstable_cache } from 'next/cache'
import { supabaseAdmin } from './supabase'
import { DEFAULT_EXCHANGE_DAYS } from './exchangeDays'

export { DEFAULT_EXCHANGE_DAYS, daysText, isPeriodCard } from './exchangeDays'

export const RETURN_POLICY_TAG = 'return-policy'

const getCachedExchangeDays = unstable_cache(
  async (): Promise<number> => {
    const { data, error } = await supabaseAdmin
      .from('static_pages')
      .select('meta')
      .eq('slug', 'returns-exchanges')
      .maybeSingle()
    if (error) throw error
    const days = Number(data?.meta?.exchange_days)
    return Number.isInteger(days) && days > 0 ? days : DEFAULT_EXCHANGE_DAYS
  },
  ['exchange-days'],
  { revalidate: 3600, tags: [RETURN_POLICY_TAG] }
)

/**
 * The size-exchange window in days — the single source for the returns page card,
 * the FAQ, /llms.txt and Google's return-policy markup. Set in /admin/pages →
 * سياسة الإرجاع والاستبدال → "مدة تبديل المقاس" (static_pages.meta.exchange_days).
 * Busted by RETURN_POLICY_TAG when that page is saved; a failed read falls back to
 * the default without being cached. Server only.
 */
export async function getExchangeDays(): Promise<number> {
  try {
    return await getCachedExchangeDays()
  } catch (err) {
    console.error('getExchangeDays error:', err)
    return DEFAULT_EXCHANGE_DAYS
  }
}
