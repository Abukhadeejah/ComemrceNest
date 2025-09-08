import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { assertTenantAdmin } from '@/server/auth'
import { resolveTenantIdFromRequest } from '@/server/tenant'

export async function POST(request: NextRequest) {
    try {
      const { name, slug, parentId, imageUrl, imageAlt } = await request.json();
  
      if (!name || !slug) {
        return NextResponse.json({ error: 'name and slug are required' }, { status: 400 });
      }
  
      const tenantId = await resolveTenantIdFromRequest();
      if (!tenantId) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
      }
  
      await assertTenantAdmin(tenantId);
  
      // Validate optional parentId under same tenant
      let parent_id: string | null = null;
      if (typeof parentId === 'string' && parentId.trim() !== '') {
        const { data: parent, error: parentErr } = await supabaseAdmin
          .from('categories')
          .select('id')
          .eq('id', parentId)
          .eq('tenant_id', tenantId)
          .maybeSingle();

        if (parentErr) {
          return NextResponse.json({ error: parentErr.message }, { status: 500 });
        }
        if (!parent) {
          return NextResponse.json({ error: 'Invalid parentId for this tenant' }, { status: 400 });
        }

        parent_id = parentId;
      }
  
      const { data, error } = await supabaseAdmin
        .from('categories')
        .insert({ tenant_id: tenantId, name, slug, parent_id, image_url: imageUrl ?? null, image_alt: imageAlt ?? null })
        .select('id, name, slug, parent_id, image_url, image_alt, created_at')
        .maybeSingle();
  
      if (error) {
        // For unique constraint violations consider returning 409
        // if (error.code === '23505') return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
  
      return NextResponse.json({ data }, { status: 201 });
    } catch (err: unknown) {
      console.error('Create category error:', err);
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
  }

  export async function PUT(request: NextRequest) {
    try {
      const { id, name, slug, parentId, imageUrl, imageAlt } = await request.json();
  
      if (!id || !name || !slug) {
        return NextResponse.json({ error: 'id, name and slug are required' }, { status: 400 });
      }
  
      const tenantId = await resolveTenantIdFromRequest();
      if (!tenantId) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
      }
  
      await assertTenantAdmin(tenantId);
  
      let parent_id: string | null = null;
      if (typeof parentId === 'string' && parentId.trim() !== '') {
        if (parentId === id) {
          return NextResponse.json({ error: 'parentId cannot equal id' }, { status: 400 });
        }
        const { data: parent, error: parentErr } = await supabaseAdmin
          .from('categories')
          .select('id')
          .eq('id', parentId)
          .eq('tenant_id', tenantId)
          .maybeSingle();

        if (parentErr) {
          return NextResponse.json({ error: parentErr.message }, { status: 500 });
        }
        if (!parent) {
          return NextResponse.json({ error: 'Invalid parentId for this tenant' }, { status: 400 });
        }

        parent_id = parentId;
      }
  
      const { data, error } = await supabaseAdmin
        .from('categories')
        .update({ name, slug, parent_id, image_url: imageUrl ?? null, image_alt: imageAlt ?? null })
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select('id, name, slug, parent_id, image_url, image_alt, created_at')
        .maybeSingle();
  
      if (error) {
        // Optional: map unique constraint on (tenant_id, slug) to 409
        // if (error.code === '23505') {
        //   return NextResponse.json({ error: 'Slug already exists in this tenant' }, { status: 409 });
        // }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
  
      return NextResponse.json({ data });
    } catch (err: unknown) {
      console.error('Update category error:', err);
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }
  }

  export async function DELETE(request: NextRequest) {
    try {
      // Accept id from query first, or JSON body fallback
      const idFromQuery = request.nextUrl.searchParams.get('id');
      let id = idFromQuery ?? null;
      if (!id) {
        try {
          const body = await request.json();
          id = body?.id ?? null;
        } catch {
          // ignore parse errors, will fall through to validation
        }
      }
      if (!id) {
        return NextResponse.json({ error: 'id is required' }, { status: 400 });
      }
  
      const tenantId = await resolveTenantIdFromRequest();
      if (!tenantId) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
      }
  
      await assertTenantAdmin(tenantId);
  
      // 1) Clean join table references for this tenant/category
      const { error: joinErr } = await supabaseAdmin
        .from('product_categories')
        .delete()
        .eq('tenant_id', tenantId)
        .eq('category_id', id);
  
      if (joinErr) {
        return NextResponse.json({ error: joinErr.message }, { status: 500 });
      }
  
      // 2) Delete the category scoped to tenant
      // Use returning to detect not-found
      const { data: deletedRows, error: delErr } = await supabaseAdmin
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select('id') // return deleted rows to check count
        .limit(1);
  
      if (delErr) {
        return NextResponse.json({ error: delErr.message }, { status: 500 });
      }
  
      if (!deletedRows || deletedRows.length === 0) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }
  
      // Children auto-set parent_id = null via FK ON DELETE SET NULL (ensure constraint exists)
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Delete category error:', error);
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }
  }


