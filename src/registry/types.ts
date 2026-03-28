import type { Metadata } from 'next'
import type { ComponentType } from 'react'

export type TenantKey = 'bluebell' | 'senlysh' | 'default' | string

export type Slot = 'header' | 'footer' | 'layout' | 'home' | 'metadata' | 'adminBranding' | 'welcomeBanner'

// More flexible component loader type that can handle various component signatures
export type ComponentLoader<T = ComponentType<Record<string, unknown>>> = () => Promise<{ default: T }>

// Use Next.js Metadata type directly
export type PageMetadata = Metadata

export interface AdminBrandingConfig {
  // Brand colors
  primaryColor: string
  secondaryColor: string
  accentColor: string
  
  // Brand information
  brandName: string
  brandTagline?: string
  brandLogo: string
  
  // Admin panel customization
  sidebarBg: string
  headerBg: string
  primaryButtonClass?: string
  secondaryButtonClass?: string
  
  // Module-specific styling
  moduleIcons?: Record<string, string>
  
  // Welcome message
  welcomeMessage?: string
  
  // Custom CSS classes
  customClasses?: Record<string, string>
  
  // Legacy properties for backward compatibility
  logo?: string
  backgroundColor?: string
  textColor?: string
  sidebarColor?: string
  headerColor?: string
}

export type MetadataLoader = () => Promise<{ 
  defaultMetadata: PageMetadata, 
  getPageMetadata: (pageTitle?: string, pageDescription?: string) => PageMetadata 
}>

export type AdminBrandingLoader = () => Promise<{ 
  default: ComponentType<{ children: React.ReactNode }>, 
  adminBrandingConfig: AdminBrandingConfig 
}>

export type RegistryEntry = Readonly<{ 
	header: ComponentLoader
	footer: ComponentLoader
	layout: ComponentLoader
	home: ComponentLoader
	metadata: MetadataLoader
	adminBranding: AdminBrandingLoader
	welcomeBanner: ComponentLoader
}>
