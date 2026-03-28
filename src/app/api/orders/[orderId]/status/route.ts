import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/server/supabaseAdmin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('status, order_number')
      .eq('order_number', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'order_not_found' }, { status: 404 });
    }

    return NextResponse.json({ 
      status: order.status,
      orderNumber: order.order_number 
    });

  } catch (error: any) {
    console.error('Order status check error:', error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
