import { ProductDraft } from '@/types/product';

const API_BASE = '/api/admin/products/drafts';

export const draftService = {
  // Create new draft
  async createDraft(tenantId: string, draftData: any): Promise<ProductDraft> {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenantId, draft_data: draftData }),
    });
    
    if (!res.ok) throw new Error('Failed to create draft');
    return res.json();
  },

  // Get all drafts for tenant
  async getDrafts(tenantId: string): Promise<ProductDraft[]> {
    const res = await fetch(`${API_BASE}?tenant_id=${tenantId}`);
    if (!res.ok) throw new Error('Failed to fetch drafts');
    return res.json();
  },

  // Get specific draft
  async getDraft(draftId: string): Promise<ProductDraft> {
    const res = await fetch(`${API_BASE}/${draftId}`);
    if (!res.ok) throw new Error('Failed to fetch draft');
    return res.json();
  },

  // Update draft
  async updateDraft(draftId: string, draftData: any): Promise<ProductDraft> {
    const res = await fetch(`${API_BASE}/${draftId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draft_data: draftData }),
    });
    
    if (!res.ok) throw new Error('Failed to update draft');
    return res.json();
  },

  // Delete draft
  async deleteDraft(draftId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/${draftId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete draft');
  },
};
