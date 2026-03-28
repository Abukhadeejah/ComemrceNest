import { supabaseAdmin } from '@/server/supabaseAdmin';
import { NextResponse } from 'next/server';

// GET /api/admin/products/drafts/[id] - Get specific draft
export async function GET(
  request: Request,
  { params }: { params:Promise< { id: string } > }
) {
  try {
    const supabase = supabaseAdmin ;
    const { id } = await params;

    const { data, error } = await supabase
      .from('product_drafts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching draft:', error);
      return NextResponse.json({ error: error.message }, { status: 404 });
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

// PATCH /api/admin/products/drafts/[id] - Update draft
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = supabaseAdmin ; // ← FIXED: was createServerClient()
    const { id } = await params;
    const body = await request.json();
    const { draft_data, ...productFields } = body;

    const { data, error } = await supabase
      .from('product_drafts')
      .update({
        draft_data: draft_data || {},
        updated_at: new Date().toISOString(),
        // Update searchable fields
        name: productFields.name || null,
        sku: productFields.sku || null,
        price_cents: productFields.price_cents || null,
        category_id: productFields.category_id || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating draft:', error);
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

// DELETE /api/admin/products/drafts/[id] - Delete draft
export async function DELETE(
  request: Request,
  { params }: { params:Promise< { id: string } > }
) {
  try {
    const supabase = supabaseAdmin ; // ← FIXED: was createServerClient()
    const { id } = await params;

    const { error } = await supabase
      .from('product_drafts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting draft:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
