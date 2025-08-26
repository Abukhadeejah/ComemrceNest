export type TenantKey = 'bluebell' | 'senlysh' | 'default'

export type Slot = 'header' | 'footer' | 'layout'

export type ComponentLoader<T = React.ComponentType<Record<string, unknown>>> = () => Promise<{ default: T }>

export type RegistryEntry = Readonly<{ 
	header: ComponentLoader
	footer: ComponentLoader
	layout: ComponentLoader 
}>
