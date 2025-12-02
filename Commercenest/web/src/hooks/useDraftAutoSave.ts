import { useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

export function useDraftAutoSave(
  tenantId: string,
  formData: any,
  draftId?: string | null
) {
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId || null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const debouncedFormData = useDebounce(formData, 10000);

  useEffect(() => {
  if (!debouncedFormData) return;

  const saveDraft = async () => {
    setIsSaving(true);
    
    // Clean up empty variant data before saving
    const cleanedData = { ...debouncedFormData };
    if (!cleanedData.has_variants) {
      cleanedData.variantOptions = [];
      cleanedData.variantCombinations = [];
    }
    
    try {
      if (currentDraftId) {
        // Update existing draft
        const res = await fetch(`/api/admin/products/drafts/${currentDraftId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draft_data: cleanedData }),
        });
        if (!res.ok) throw new Error('Failed to update draft');
      } else {
        // Create new draft
        const bodyData = { tenant_id: tenantId, draft_data: cleanedData };
        
        const res = await fetch('/api/admin/products/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData),
        });
        if (!res.ok) throw new Error('Failed to create draft');
        const draft = await res.json();
        setCurrentDraftId(draft.id);
      }
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setIsSaving(false);
    }
  };

  saveDraft();
}, [debouncedFormData, currentDraftId, tenantId]);


  const deleteDraft = async () => {
    if (!currentDraftId) return;
    try {
      const res = await fetch(`/api/admin/products/drafts/${currentDraftId}`, { 
        method: 'DELETE' 
      });
      if (!res.ok) throw new Error('Failed to delete draft');
      setCurrentDraftId(null);
    } catch (error) {
      console.error('Failed to delete draft:', error);
    }
  };

  return {
    draftId: currentDraftId,
    isSaving,
    lastSaved,
    deleteDraft,
  };
}
