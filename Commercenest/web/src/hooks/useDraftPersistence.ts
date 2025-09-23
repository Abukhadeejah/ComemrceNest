'use client'

import { useCallback, useEffect, useRef } from 'react'

interface UseDraftPersistenceOptions {
  draftKey: string
  formData: Record<string, unknown>
  enabled?: boolean
  debounceMs?: number
}

interface UseDraftPersistenceReturn {
  loadDraft: () => Record<string, unknown> | null
  saveDraft: () => void
  clearDraft: () => void
  hasDraft: () => boolean
}

export function useDraftPersistence({
  draftKey,
  formData,
  enabled = true,
  debounceMs = 1000
}: UseDraftPersistenceOptions): UseDraftPersistenceReturn {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const saveDraft = useCallback(() => {
    if (!enabled) return
    
    try {
      localStorage.setItem(`draft_${draftKey}`, JSON.stringify(formData))
    } catch (error) {
      console.warn('Failed to save draft:', error)
    }
  }, [draftKey, formData, enabled])

  const loadDraft = useCallback((): Record<string, unknown> | null => {
    if (!enabled) return null
    
    try {
      const saved = localStorage.getItem(`draft_${draftKey}`)
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      console.warn('Failed to load draft:', error)
      return null
    }
  }, [draftKey, enabled])

  const clearDraft = useCallback(() => {
    if (!enabled) return
    
    try {
      localStorage.removeItem(`draft_${draftKey}`)
    } catch (error) {
      console.warn('Failed to clear draft:', error)
    }
  }, [draftKey, enabled])

  const hasDraft = useCallback((): boolean => {
    if (!enabled) return false
    
    try {
      return localStorage.getItem(`draft_${draftKey}`) !== null
    } catch (error) {
      console.warn('Failed to check draft:', error)
      return false
    }
  }, [draftKey, enabled])

  // Auto-save draft with debouncing
  useEffect(() => {
    if (!enabled) return

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      saveDraft()
    }, debounceMs)

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [formData, saveDraft, debounceMs, enabled])

  return {
    loadDraft,
    saveDraft,
    clearDraft,
    hasDraft
  }
}
