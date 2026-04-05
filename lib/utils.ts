import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Currency } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format price with currency
export function formatPrice(amount: number, currency: Currency): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style:    'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(amount)
  }
  return 'السعر : ' + new Intl.NumberFormat('ar-SY', {
    maximumFractionDigits: 0,
  }).format(amount) + ' ل.س'
}

// Generate slug from Arabic text using transliteration
export function generateSlug(text: string): string {
  const arabicToLatin: Record<string, string> = {
    'ا': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th',
    'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
    'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a',
    'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'h', 'ء': '', 'ئ': 'y',
    'ؤ': 'w', 'لا': 'la', ' ': '-',
  }

  let slug = text
    .trim()
    .split('')
    .map(char => arabicToLatin[char] ?? char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return slug || Buffer.from(text).toString('base64').slice(0, 20)
}

// Generate order number: KZ-XXXX
export function generateOrderNumber(): string {
  const digits = Math.floor(1000 + Math.random() * 9000).toString()
  return `KZ-${digits}`
}

// Discount percentage
export function getDiscountPercent(original: number, discounted: number): number {
  return Math.round((1 - discounted / original) * 100)
}

// Stock status label (Arabic)
export const STOCK_STATUS_LABELS: Record<string, string> = {
  in_stock:    'متوفر',
  low_stock:   'كمية محدودة',
  out_of_stock: 'نفذ',
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending:   'قيد الانتظار',
  confirmed: 'مؤكد',
  shipped:   'تم الشحن',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي',
}

export const SHIPPING_LABELS: Record<string, string> = {
  'karam':   'كرم (Karam)',
  'qadmous': 'قدموس (Qadmous)',
  'masarat': 'مسارات (Masarat)',
  'delivery': '🚀 توصيل عادي (حلب)',
  'regular_delivery': '🚀 توصيل عادي (حلب)',
  'shipping': '📦 شحن للمحافظات',
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '...'
}

// Format date in Arabic
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ar-SY', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

// Check if product is new (within 14 days)
export function isNewProduct(createdAt: string): boolean {
  const created = new Date(createdAt)
  const now = new Date()
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= 14
}
