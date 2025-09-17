'use client'

import { useEffect, useCallback, useRef } from 'react'

interface UseDraftPersistenceOptions<T = Record<string, unknown>> {
  /** Unique key for the draft (e.g., 'product_create', 'category_edit_123') */
  draftKey: string
  /** Form data to persist */
  formData: T
  /** Auto-save interval in milliseconds (default: 2000ms) */
  autoSaveInterval?: number
  /** Whether to enable auto-save (default: true) */
  enabled?: boolean
}

interface DraftData {
  data: Record<string, unknown>
  timestamp: number
  version: string
}

export function useDraftPersistence<T = Record<string, unknown>>({
  draftKey,
  formData,
  autoSaveInterval = 2000,
  enabled = true
}: UseDraftPersistenceOptions<T>) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedDataRef = useRef<string>('')
  const DRAFT_VERSION = '1.0.0' // For future migration compatibility

  // Generate storage key
  const storageKey = `commercenest_draft_${draftKey}`

  // Save draft to localStorage
  const saveDraft = useCallback((data: T) => {
    if (!enabled) return

    try {
      const draftData: DraftData = {
        data: data as Record<string, unknown>,
        timestamp: Date.now(),
        version: DRAFT_VERSION
      }
      
      const serializedData = JSON.stringify(draftData)
      
      // Only save if data has actually changed
      if (serializedData !== lastSavedDataRef.current) {
        localStorage.setItem(storageKey, serializedData)
        lastSavedDataRef.current = serializedData
        console.log(`[Draft] Auto-saved: ${draftKey}`)
      }
    } catch (error) {
      console.error('[Draft] Failed to save:', error)
    }
  }, [storageKey, enabled, draftKey])

  // Load draft from localStorage
  const loadDraft = useCallback((): T | null => {
    if (!enabled) return null

    try {
      const stored = localStorage.getItem(storageKey)
      if (!stored) return null

      const draftData: DraftData = JSON.parse(stored)
      
      // Check if draft is not too old (24 hours)
      const MAX_DRAFT_AGE = 24 * 60 * 60 * 1000 // 24 hours
      if (Date.now() - draftData.timestamp > MAX_DRAFT_AGE) {
        localStorage.removeItem(storageKey)
        return null
      }

      console.log(`[Draft] Loaded: ${draftKey}`)
      return draftData.data as T
    } catch (error) {
      console.error('[Draft] Failed to load:', error)
      // Clean up corrupted data
      localStorage.removeItem(storageKey)
      return null
    }
  }, [storageKey, enabled, draftKey])

  // Clear draft
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
      console.log(`[Draft] Cleared: ${draftKey}`)
    } catch (error) {
      console.error('[Draft] Failed to clear:', error)
    }
  }, [storageKey, draftKey])

  // Check if draft exists
  const hasDraft = useCallback((): boolean => {
    if (!enabled) return false
    return localStorage.getItem(storageKey) !== null
  }, [storageKey, enabled])

  // Debounced auto-save effect
  useEffect(() => {
    if (!enabled) return

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      saveDraft(formData)
    }, autoSaveInterval)

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [formData, saveDraft, autoSaveInterval, enabled])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft,
    storageKey
  }
}

// Utility function to get all draft keys (for cleanup/debugging)
export function getAllDraftKeys(): string[] {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('commercenest_draft_')) {
      keys.push(key)
    }
  }
  return keys
}

// Utility function to clear all drafts (for cleanup)
export function clearAllDrafts(): void {
  const draftKeys = getAllDraftKeys()
  draftKeys.forEach(key => localStorage.removeItem(key))
  console.log(`[Draft] Cleared ${draftKeys.length} drafts`)
}

