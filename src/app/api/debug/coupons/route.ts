import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    // Debug: get ALL coupons without tenant filter to see if table has any data
    console.log('🔍 DEBUG: Fetching ALL coupons from database...');
    
    const { data, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .limit(5);

    if (error) {
      return NextResponse.json({ 
        error: 'Table query failed',
        details: error,
        code: error.code
      }, { status: 500 })
    }

    console.log('✅ Query successful. Row count:', data?.length || 0);
    
    return NextResponse.json({ 
      status: 'ok',
      rowCount: data?.length || 0,
      sampleRows: data,
      message: 'If you see rows here, the table exists. If empty, no coupons created yet.'
    })
  } catch (err) {
    console.error('❌ Error:', err);
    return NextResponse.json({ 
      error: String(err)
    }, { status: 500 })
  }
}
