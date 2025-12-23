import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/server/supabaseAdmin';
import { resolveTenantIdFromRequest } from '@/server/tenant';

// GET /api/admin/attributes
export async function GET(request: Request) {
  try {
    const tenantId = await resolveTenantIdFromRequest();

    const { data, error } = await supabaseAdmin
      .from('attributes')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true });

    if (error) {
      console.error('GET /api/admin/attributes error', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/admin/attributes unexpected error', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// POST /api/admin/attributes
export async function POST(request: Request) {
  try {
    const tenantId = await resolveTenantIdFromRequest();
    const body = await request.json();

    const rawName = body?.name;
    const name = typeof rawName === 'string' ? rawName.trim() : '';

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from('attributes')
      .insert({
        tenant_id: tenantId,
        name,
      })
      .select()
      .single();

    if (error) {
      console.error('POST /api/admin/attributes error', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/admin/attributes unexpected error', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// PUT /api/admin/attributes
export async function PUT(request: Request) {
  try {
    const tenantId = await resolveTenantIdFromRequest();
    const body = await request.json();

    const id = body?.id;
    const rawName = body?.name;
    const name = typeof rawName === 'string' ? rawName.trim() : '';

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 },
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from('attributes')
      .update({ name })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('PUT /api/admin/attributes error', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    console.error('PUT /api/admin/attributes unexpected error', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
