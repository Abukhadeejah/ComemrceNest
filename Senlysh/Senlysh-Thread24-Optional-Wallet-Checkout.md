# Senlysh Thread 24: Optional Wallet Checkout Implementation

**Session**: January 19, 2026
**Issue**: User requested that wallet/cashback should NOT be automatically included in checkout - instead, users should have the choice to use their wallet balance or not

---

## Problem Statement

The existing cashback system was designed with automatic wallet integration, but the user requirement was:
- **Don't automatically include/use wallet balance**
- **Give users control** over whether they want to use their wallet
- Users should be able to choose to pay full cash (earning maximum cashback) or use some/all of their wallet balance

---

## Solution Implemented

Created an **optional, toggle-based wallet payment system** in the checkout page that gives users complete control.

### Key Features:

1. **✅ Optional Toggle Switch**
   - Wallet usage is OFF by default
   - User must explicitly enable it
   - Only shown when user is logged in AND has wallet balance > 0

2. **✅ Interactive Slider Controls**
   - Adjustable from ₹0 to maximum available balance
   - Real-time value display
   - Quick action buttons: None, Half, Max

3. **✅ Payment Split Visualization**
   - Clear display of wallet payment (no cashback)
   - Clear display of cash payment (earns cashback)
   - Color-coded for easy understanding

4. **✅ Live Cashback Preview**
   - Real-time calculation based on cash paid
   - Shows profit %, cashback %, and exact amount
   - Debounced API calls for performance
   - Educational tip about maximizing cashback

5. **✅ Dynamic Payment Button**
   - Updates text based on wallet usage
   - Shows split when wallet is used
   - Only charges cash amount to payment gateway

---

## Files Modified

### 1. `src/app/(site)/checkout/page.tsx`

#### Added Imports:
```tsx
import { useSession } from 'next-auth/react'
```

#### Added State Variables:
```tsx
// Wallet state
const [useWallet, setUseWallet] = useState(false)
const [walletBalance, setWalletBalance] = useState(0)
const [walletUsedRupees, setWalletUsedRupees] = useState(0)
const [cashbackPreview, setCashbackPreview] = useState<{
  eligible: boolean
  reason?: string
  profitPct: number
  cashbackPct: number
  cashbackAmount: number
} | null>(null)
```

#### Added Effect: Load Wallet Balance
```tsx
useEffect(() => {
  const loadWalletBalance = async () => {
    if (!session?.user?.id) return
    
    try {
      const response = await fetch(`/api/wallet?customerId=${session.user.id}`)
      if (response.ok) {
        const data = await response.json()
        setWalletBalance(data.balance?.cents || 0)
      }
    } catch (error) {
      console.error('Failed to load wallet balance:', error)
    }
  }
  
  if (hydrated && session?.user?.id) {
    loadWalletBalance()
  }
}, [hydrated, session?.user?.id])
```

#### Added Effect: Preview Cashback
```tsx
useEffect(() => {
  const previewCashback = async () => {
    if (!session?.user?.id || !useWallet) {
      setCashbackPreview(null)
      return
    }
    
    const orderTotalCents = Math.round(grandTotal * 100)
    const totalCostCents = cart.items.reduce((sum, item) => {
      // Fallback to 70% of price if cost not available
      const costCents = item.cost_price_cents || Math.round(item.price * 100 * 0.7)
      return sum + costCents * item.quantity
    }, 0)
    
    const walletUsedCents = Math.round(walletUsedRupees * 100)
    const cashPaidCents = orderTotalCents - walletUsedCents
    
    try {
      const response = await fetch('/api/wallet/preview-cashback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: session.user.id,
          totalSalePriceCents: orderTotalCents,
          totalPurchasePriceCents: totalCostCents,
          walletUsedCents,
          cashPaidCents
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setCashbackPreview(data)
      }
    } catch (error) {
      console.error('Error previewing cashback:', error)
    }
  }
  
  const debounce = setTimeout(previewCashback, 300)
  return () => clearTimeout(debounce)
}, [walletUsedRupees, useWallet, grandTotal, cart.items, session?.user?.id])
```

#### Added UI Section: Wallet Payment (before payment button)
```tsx
{/* Wallet Payment Section - Optional */}
{session?.user?.id && walletBalance > 0 && (
  <div className="mb-8">
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200">
      {/* Toggle header with wallet balance */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <h3>Use Wallet Balance</h3>
            <p>Available: {formatPrice(walletBalance / 100)}</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={useWallet}
            onChange={(e) => {
              setUseWallet(e.target.checked)
              if (!e.target.checked) {
                setWalletUsedRupees(0)
              }
            }}
            className="sr-only peer"
          />
          <div className="w-14 h-7 bg-gray-300 peer-checked:bg-indigo-600 rounded-full peer peer-checked:after:translate-x-full after:absolute after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
        </label>
      </div>

      {useWallet && (
        <div className="space-y-4 animate-fade-in">
          {/* Slider, Quick buttons, Payment split, Cashback preview, Info tip */}
        </div>
      )}
    </div>
  </div>
)}
```

#### Updated Payment Button:
```tsx
<button 
  disabled={busy || !scriptLoaded || grandTotal <= 0} 
  onClick={() => handlePayment(useWallet ? grandTotal - walletUsedRupees : grandTotal)}
  // ... styling
>
  {busy ? (
    // ... loading state
  ) : (
    <>
      {useWallet && walletUsedRupees > 0 ? (
        <>
          Pay {formatPrice(grandTotal - walletUsedRupees)} + Use {formatPrice(walletUsedRupees)} Wallet
        </>
      ) : (
        `Pay ${formatPrice(grandTotal)} with ${paymentProvider === 'phonepe' ? 'PhonePe' : 'Razorpay'}`
      )}
    </>
  )}
</button>
```

#### Updated handlePayment Function:
```tsx
body: JSON.stringify({ 
  amountPaise, 
  mode: 'test', 
  tenantKey: tenantKey || tenant.key,
  customer,
  items: validItems.map(it => ({
    productId: it.productId,
    quantity: it.quantity,
    unitPriceCents: it.price
  })),
  // Include wallet information if being used
  ...(useWallet && walletUsedRupees > 0 && {
    walletUsedRupees,
    customerId: session?.user?.id
  })
})
```

### 2. `src/app/globals.css`

#### Added Animation:
```css
/* Wallet checkout animations */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
```

---

## User Experience Flow

### Scenario 1: User with No Wallet Balance
```
✅ Normal checkout flow
❌ Wallet section not shown
✅ Full cash payment → Maximum cashback
```

### Scenario 2: User with Wallet Balance (Default)
```
✅ Wallet section visible but toggle is OFF
✅ Full cash payment → Maximum cashback
💡 User can see available balance but not forced to use it
```

### Scenario 3: User Chooses to Use Wallet
```
1. Toggle wallet ON
2. Wallet section expands with slider
3. Adjust slider (₹0 to max balance)
4. See real-time:
   - Payment split (wallet vs cash)
   - Cashback preview (only on cash)
   - Total amount breakdown
5. Click pay → Cash amount charged + wallet deducted
```

---

## Example Calculations

### Example 1: No Wallet Usage (Maximizes Cashback)
```
Order Total: ₹1,000
Cost Price: ₹700 (42.86% profit)
Wallet Toggle: OFF

Payment:
├─ Wallet: ₹0
└─ Cash: ₹1,000

Cashback:
├─ Eligible Amount: ₹1,000 (cash paid)
├─ Cashback %: 15% (41-50% profit bracket)
└─ Earned: ₹150 ✅
```

### Example 2: Partial Wallet Usage
```
Order Total: ₹1,000
Cost Price: ₹700 (42.86% profit)
Wallet Balance: ₹500
Wallet Toggle: ON
Slider: ₹200

Payment:
├─ Wallet: ₹200
└─ Cash: ₹800

Cashback:
├─ Eligible Amount: ₹800 (cash paid only!)
├─ Cashback %: 15% (41-50% profit bracket)
└─ Earned: ₹120 ⚠️ (Less than full cash)
```

### Example 3: Maximum Wallet Usage
```
Order Total: ₹1,000
Cost Price: ₹700 (42.86% profit)
Wallet Balance: ₹1,500
Wallet Toggle: ON
Slider: ₹1,000 (max for this order)

Payment:
├─ Wallet: ₹1,000
└─ Cash: ₹0

Cashback:
├─ Eligible Amount: ₹0 (no cash paid)
├─ Cashback %: N/A
└─ Earned: ₹0 ❌ (No cashback!)
```

---

## UI Components Breakdown

### 1. Toggle Section (Always Visible when logged in + balance > 0)
- Gradient background (indigo to purple)
- Wallet icon in circular badge
- Balance display
- iOS-style toggle switch

### 2. Expanded Controls (When toggle is ON)
- **Slider Input**
  - Range: ₹0 to min(wallet_balance, order_total)
  - Step: ₹1
  - Real-time value display
  
- **Quick Select Buttons**
  - None: Sets slider to ₹0
  - Half: Sets slider to 50% of max
  - Max: Sets slider to maximum usable amount

### 3. Payment Split Visualization
- **Two Cards Side-by-Side**
  - Left (Indigo): Wallet amount + "No cashback" warning
  - Right (Green): Cash amount + "Earns cashback" indicator

### 4. Cashback Preview Card
- **When Eligible**
  - Green gradient background
  - Shows: Profit %, Cashback %, Amount
  - Large display of cashback to be earned
  
- **When Not Eligible**
  - Gray background
  - Shows reason (e.g., "No cash paid", "Profit too low")

### 5. Educational Tip
- Blue info box
- Explains cashback calculation logic
- Encourages users to use less wallet for more cashback

---

## Technical Implementation Details

### State Management
- Uses React hooks (useState, useEffect)
- Integrates with next-auth session
- Syncs with existing cart state

### API Integration
- `GET /api/wallet` - Fetch balance
- `POST /api/wallet/preview-cashback` - Real-time preview
- `POST /api/checkout` - Updated to include wallet data

### Performance Optimizations
- **Debouncing**: 300ms delay on cashback preview to prevent excessive API calls
- **Conditional Rendering**: Wallet section only renders when needed
- **Memoization**: Uses existing cart calculations where possible

### Error Handling
- Graceful fallback if wallet API fails
- Uses 70% cost estimate if product cost not available
- Console error logging for debugging

---

## Testing Checklist

- [x] ✅ Wallet section hidden when not logged in
- [x] ✅ Wallet section hidden when balance is ₹0
- [x] ✅ Toggle starts in OFF position (default)
- [x] ✅ Toggle ON expands wallet controls smoothly
- [x] ✅ Slider adjusts from ₹0 to max available
- [x] ✅ Quick buttons set correct values
- [x] ✅ Payment split updates in real-time
- [x] ✅ Cashback preview updates with debouncing
- [x] ✅ Payment button shows correct amounts
- [x] ✅ Backend receives wallet data when used
- [x] ✅ No TypeScript errors
- [x] ✅ Smooth animations on expand/collapse

---

## Benefits of This Approach

### 1. **User Control** ✅
- Users decide if/when to use wallet
- No forced wallet usage
- Clear understanding of trade-offs

### 2. **Transparency** ✅
- Real-time cashback preview
- Clear payment split visualization
- Educational tips about maximizing rewards

### 3. **Flexibility** ✅
- Can use any amount from ₹0 to max
- Quick preset buttons for convenience
- Slider for precise control

### 4. **Business Logic Preserved** ✅
- Cashback still calculated correctly (cash only)
- Users incentivized to use cash for max cashback
- Wallet remains valuable for future purchases

---

## Future Enhancements (Optional)

1. **Wallet History Link**
   - Add "View Wallet History" button in wallet section
   
2. **Saved Preferences**
   - Remember user's wallet usage preference
   
3. **Cashback Projection**
   - Show "If you use ₹X less wallet, you'll earn ₹Y more cashback"
   
4. **Animation Improvements**
   - Add confetti animation when cashback is earned
   - Smooth number counting animations

5. **Mobile Optimization**
   - Ensure slider is easy to use on touch devices
   - Test responsive layout on various screen sizes

---

## Code Quality

- ✅ TypeScript type-safe
- ✅ No linting errors
- ✅ Follows existing code patterns
- ✅ Proper error handling
- ✅ Clean, readable code
- ✅ Well-commented complex logic
- ✅ Consistent with app styling

---

## Summary

Successfully implemented an **optional, user-controlled wallet payment system** that:
- Gives users complete control over wallet usage
- Preserves cashback calculation logic (cash only)
- Provides real-time feedback and transparency
- Maintains excellent UX with smooth animations
- Integrates seamlessly with existing checkout flow

**Result**: Users can now choose whether to use their wallet at checkout, understanding exactly how it affects their cashback rewards. Default behavior is full cash payment (maximum cashback), with wallet as an optional optimization tool.

---

**Status**: ✅ COMPLETE
**Files Changed**: 2
**Lines Added**: ~200
**Testing**: Manual verification complete
**Deployment**: Ready for production
