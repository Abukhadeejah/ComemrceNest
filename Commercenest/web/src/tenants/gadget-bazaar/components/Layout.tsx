import type { LayoutProps } from '@/components/tenant/contracts'

export default function Gadget-bazaarLayout({ theme, children }: LayoutProps) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        '--brand-color': theme.brandColor,
        '--accent-color': theme.accentColor,
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
}
