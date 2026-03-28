import type { LayoutProps } from './contracts'

export default function DefaultLayout({ theme, children }: LayoutProps) {
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

