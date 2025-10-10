import { getAnalytics } from '../../../../(admin)/admin/analytics/actions'
import { AnalyticsOverview } from '../../../../(admin)/admin/analytics/AnalyticsOverview'
import { SalesChart } from '../../../../(admin)/admin/analytics/SalesChart'
import { TopProducts } from '../../../../(admin)/admin/analytics/TopProducts'

export default async function AdminAnalytics() {
  const analytics = await getAnalytics()

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track your store performance and customer insights
        </p>
      </div>

      <AnalyticsOverview analytics={analytics.overview} />
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SalesChart data={analytics.salesData} />
        <TopProducts products={analytics.topProducts} />
      </div>
    </div>
  )
}
