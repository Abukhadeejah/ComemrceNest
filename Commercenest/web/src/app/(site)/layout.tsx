import TenantProvider from '@/components/TenantProvider'
import SenlyshHeader from '@/tenants/senlysh/SenlyshHeader'
import SenlyshFooter from '@/tenants/senlysh/SenlyshFooter'

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TenantProvider>
      <div className="min-h-screen flex flex-col">
        <SenlyshHeader />
        <main className="flex-1">
          {children}
        </main>
        <SenlyshFooter />
      </div>
    </TenantProvider>
  )
}
