require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMembershipSystemUpdate() {
  console.log('🧪 Testing updated membership system...\n');

  const userEmail = 'shariqrahman03@gmail.com';
  const tenantId = '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c';

  // 1. Get user and customer
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const authUser = authUsers.users.find(u => u.email === userEmail);
  
  const { data: customer } = await supabase
    .from('customers')
    .select('id, user_id, created_at')
    .eq('user_id', authUser.id)
    .eq('tenant_id', tenantId)
    .single();

  console.log(`👤 Customer: ${customer.id}`);
  console.log(`📅 Customer created: ${customer.created_at}`);

  // 2. Check current membership
  const { data: membership } = await supabase
    .from('memberships')
    .select('*')
    .eq('customer_id', customer.id)
    .eq('tenant_id', tenantId)
    .order('valid_until', { ascending: false })
    .limit(1)
    .single();

  if (membership) {
    console.log('\n🎫 Current Membership:');
    console.log(`   Type: ${membership.membership_type}`);
    console.log(`   Status: ${membership.status}`);
    console.log(`   Valid from: ${membership.valid_from}`);
    console.log(`   Valid until: ${membership.valid_until}`);
    
    const now = new Date();
    const validUntil = new Date(membership.valid_until);
    const daysRemaining = Math.max(0, Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const isActive = membership.status === 'ACTIVE' && validUntil > now;
    
    console.log(`   Days remaining: ${daysRemaining}`);
    console.log(`   Is active: ${isActive}`);
    console.log(`   Expires soon: ${isActive && daysRemaining <= 30}`);
  } else {
    console.log('\n❌ No membership found');
  }

  // 3. Test membership status API
  console.log('\n🌐 Testing membership status API...');
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/customers/membership/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
        'x-customer-id': customer.id
      }
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ API Response:', result.membership);
    } else {
      console.log('❌ API Error:', result.error);
    }
  } catch (error) {
    console.error('❌ API call error:', error.message);
  }

  // 4. Test cashback eligibility
  console.log('\n💰 Testing cashback eligibility...');
  
  const testOrder = {
    totalSalePriceCents: 10000, // ₹100
    totalPurchasePriceCents: 6000, // ₹60 cost
    walletUsedCents: 0,
    cashPaidCents: 10000
  };

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/customers/wallet/preview-cashback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
        'x-customer-id': customer.id
      },
      body: JSON.stringify(testOrder)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Cashback Preview:', {
        eligible: result.eligible,
        reason: result.reason,
        cashbackAmount: `₹${result.cashbackRupees || 0}`
      });
    } else {
      console.log('❌ Cashback API Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Cashback API call error:', error.message);
  }

  // 5. Summary
  console.log('\n🎯 MEMBERSHIP SYSTEM STATUS:');
  
  if (membership) {
    const now = new Date();
    const validUntil = new Date(membership.valid_until);
    const isActive = membership.status === 'ACTIVE' && validUntil > now;
    const daysRemaining = Math.max(0, Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    if (membership.membership_type === 'FREE' && isActive) {
      console.log('✅ FREE membership active - cashback enabled');
      console.log(`📅 ${daysRemaining} days remaining`);
      
      if (daysRemaining <= 30) {
        console.log('⚠️ Premium button should appear (expires soon)');
      } else {
        console.log('ℹ️ Premium button hidden (plenty of time left)');
      }
    } else if (membership.membership_type === 'PREMIUM' && isActive) {
      console.log('✅ PREMIUM membership active - cashback enabled');
    } else {
      console.log('❌ Membership expired - Premium button should appear');
      console.log('❌ Cashback disabled for non-members');
    }
  } else {
    console.log('❌ No membership - Premium button should appear');
    console.log('❌ Cashback disabled for non-members');
  }
}

testMembershipSystemUpdate().catch(console.error);