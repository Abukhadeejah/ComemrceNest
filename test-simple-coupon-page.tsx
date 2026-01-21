// Simple test page to check if routing works
export default function TestCouponPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">🎫 Test Coupon Page</h1>
      <p>If you can see this, the routing is working!</p>
      <p>Current time: {new Date().toLocaleString()}</p>
    </div>
  )
}