import { supabaseAdmin } from '@/server/supabaseAdmin';
import { getAuthenticatedUserId } from '@/server/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenant_id, draft_data } = body;

    if (!tenant_id) {
      return NextResponse.json(
        { error: 'tenant_id is required' }, 
        { status: 400 }
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Get authenticated user ID; use null if not available
    const userId = await getAuthenticatedUserId();

    const { data, error } = await supabaseAdmin  // NO PARENTHESES
      .from('product_drafts')
      .insert({
        tenant_id,
        created_by: userId || null,
        draft_data: draft_data || {},
        expires_at: expiresAt.toISOString(),
        name: draft_data?.name || null,
        sku: draft_data?.sku || null,
        price_cents: draft_data?.price_cents || null,
        category_id: draft_data?.category_id || null,
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Draft creation error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');

    if (!tenant_id) {
      return NextResponse.json(
        { error: 'tenant_id is required' }, 
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin  // NO PARENTHESES
      .from('product_drafts')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Draft fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
