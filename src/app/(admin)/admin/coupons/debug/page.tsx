export default function CouponDebugPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-green-600">🎯 Coupon Debug Page</h1>
      <p className="mt-4">If you can see this page, the routing is working!</p>
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold">Debug Info:</h3>
        <p>Timestamp: {new Date().toISOString()}</p>
        <p>Environment: {process.env.NODE_ENV}</p>
      </div>
    </div>
  )
}