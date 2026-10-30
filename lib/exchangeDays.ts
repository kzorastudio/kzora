// Client-safe helpers for the size-exchange window. The server-side reader lives in
// lib/returnPolicy.ts (it uses the admin Supabase client, so never import it from a
// 'use client' file).
import { toArabicNumerals } from './utils'

export const DEFAULT_EXCHANGE_DAYS = 3

/** The returns-page card that states the window ("فترة الإرجاع"/"فترة التبديل") — now built from the number instead. */
export function isPeriodCard(card: { label?: string }): boolean {
  return (card.label ?? '').includes('فترة')
}

/** "يوم واحد" / "يومين" / "٣ أيام" / "١١ يوماً" */
export function daysText(days: number): string {
  if (days === 1) return 'يوم واحد'
  if (days === 2) return 'يومين'
  if (days >= 3 && days <= 10) return `${toArabicNumerals(days)} أيام`
  return `${toArabicNumerals(days)} يوماً`
}
