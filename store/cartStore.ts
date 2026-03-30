'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem } from '@/types'

interface CartStore {
  items: CartItem[]
  isOpen: boolean

  // Actions
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void

  addItem: (item: CartItem) => void
  removeItem: (productId: string, color?: string | null, size?: number | null) => void
  updateQuantity: (productId: string, color: string | null | undefined, size: number | null | undefined, qty: number) => void
  clearCart: () => void

  // Computed
  itemCount: () => number
  subtotalSyp: () => number
  subtotalUsd: () => number
}

function itemKey(id: string, color?: string | null, size?: number | null) {
  return `${id}__${color ?? 'none'}__${size ?? 'none'}`
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      openCart:   () => set({ isOpen: true }),
      closeCart:  () => set({ isOpen: false }),
      toggleCart: () => set(s => ({ isOpen: !s.isOpen })),

      addItem: (newItem) => {
        const items = get().items
        const key = itemKey(newItem.id, newItem.color, newItem.size)
        const existing = items.find(
          i => itemKey(i.id, i.color, i.size) === key
        )

        if (existing) {
          set({
            items: items.map(i =>
              itemKey(i.id, i.color, i.size) === key
                ? { ...i, quantity: i.quantity + newItem.quantity }
                : i
            ),
          })
        } else {
          set({ items: [...items, newItem] })
        }
      },

      removeItem: (productId, color, size) => {
        const key = itemKey(productId, color, size)
        set({ items: get().items.filter(i => itemKey(i.id, i.color, i.size) !== key) })
      },

      updateQuantity: (productId, color, size, qty) => {
        const key = itemKey(productId, color, size)
        if (qty <= 0) {
          set({ items: get().items.filter(i => itemKey(i.id, i.color, i.size) !== key) })
        } else {
          set({
            items: get().items.map(i =>
              itemKey(i.id, i.color, i.size) === key ? { ...i, quantity: qty } : i
            ),
          })
        }
      },

      clearCart: () => set({ items: [] }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotalSyp: () =>
        get().items.reduce((sum, i) => {
          const price = i.discount_price_syp ?? i.price_syp
          return sum + price * i.quantity
        }, 0),

      subtotalUsd: () =>
        get().items.reduce((sum, i) => {
          const price = i.discount_price_usd ?? i.price_usd
          return sum + price * i.quantity
        }, 0),
    }),
    {
      name: 'kzora-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
