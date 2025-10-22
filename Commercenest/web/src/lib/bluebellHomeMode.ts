'use client'

import { create } from 'zustand'

type BluebellHomeMode = 'interiors' | 'fabrics'

type BluebellHomeModeState = {
	mode: BluebellHomeMode
	setMode: (mode: BluebellHomeMode) => void
}

export const useBluebellHomeMode = create<BluebellHomeModeState>((set) => ({
	mode: 'fabrics',
	setMode: (mode) => set({ mode }),
}))


