'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Currency } from '@/types'

interface CurrencyStore {
  currency: Currency
  toggle: () => void
  setCurrency: (c: Currency) => void
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      currency: 'SYP',
      toggle: () => set({ currency: get().currency === 'SYP' ? 'USD' : 'SYP' }),
      setCurrency: (c) => set({ currency: c }),
    }),
    {
      name: 'kzora-currency',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
