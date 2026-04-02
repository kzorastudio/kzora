export const GOVERNORATES = [
  'دمشق',
  'ريف دمشق',
  'حلب',
  'ريف حلب',
  'حمص',
  'حماة',
  'اللاذقية',
  'طرطوس',
  'إدلب',
  'الحسكة',
  'دير الزور',
  'الرقة',
  'السويداء',
  'درعا',
  'القنيطرة',
]

export const SHIPPING_COMPANIES = [
  {
    id: 'karam',
    name: 'كرم (Karam)',
    description: 'توصيل سريع خلال 24-48 ساعة لكافة المحافظات.',
    badge: 'الأفضل',
    governorates: GOVERNORATES,
  },
  {
    id: 'qadmous',
    name: 'قدموس (Qadmous)',
    description: 'توصيل اقتصادي إلى مراكز المحافظات.',
    badge: null,
    governorates: ['دمشق', 'ريف دمشق', 'حلب', 'حمص', 'حماة', 'اللاذقية', 'طرطوس'],
  },
  {
    id: 'masarat',
    name: 'مسارات (Masarat)',
    description: 'توصيل مباشر للمنازل في مناطق محددة.',
    badge: null,
    governorates: ['دمشق', 'ريف دمشق', 'حلب', 'اللاذقية'],
  },
] as const

export type ShippingCompanyId = 'karam' | 'qadmous' | 'masarat'

export const SHOE_SIZES = [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46]

export const PRODUCT_TAGS = [
  { id: 'new',         label: 'جديد'         },
  { id: 'best_seller', label: 'الأكثر مبيعاً' },
  { id: 'on_sale',     label: 'تخفيض'        },
] as const

export const STOCK_STATUS_OPTIONS = [
  { id: 'in_stock',     label: 'متوفر'         },
  { id: 'low_stock',    label: 'كمية محدودة'   },
  { id: 'out_of_stock', label: 'نفذ من المخزن' },
] as const

export const CURRENCY_SYMBOL: Record<string, string> = {
  SYP: 'ل.س.ج',
  USD: '$',
}

export const ORDER_STATUS_OPTIONS = [
  { id: 'pending',   label: 'قيد الانتظار', color: 'text-amber-600 bg-amber-50'   },
  { id: 'confirmed', label: 'مؤكد',         color: 'text-blue-600 bg-blue-50'     },
  { id: 'shipped',   label: 'تم الشحن',    color: 'text-purple-600 bg-purple-50' },
  { id: 'delivered', label: 'تم التوصيل', color: 'text-green-600 bg-green-50'   },
  { id: 'cancelled', label: 'ملغي',         color: 'text-red-600 bg-red-50'       },
] as const

export const ITEMS_PER_PAGE = 20
export const ADMIN_ITEMS_PER_PAGE = 12
