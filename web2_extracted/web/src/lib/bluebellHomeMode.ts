'use client'

import { create } from 'zustand'

export type BluebellHomeMode = 'interiors' | 'fabrics'

type BluebellHomeModeState = {
  mode: BluebellHomeMode
  setMode: (mode: BluebellHomeMode) => void
}

export const useBluebellHomeMode = create<BluebellHomeModeState>((set) => ({
  mode: 'interiors',
  setMode: (mode) => set({ mode }),
}))


