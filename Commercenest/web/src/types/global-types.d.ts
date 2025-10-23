// Global type declarations for CommerceNest
/* eslint-disable @typescript-eslint/no-explicit-any */


declare global {
  // Make TypeScript more lenient with null/undefined
  type Nullable<T> = T | null | undefined
  
  // Override strict type checking for database operations
  namespace Supabase {
    interface Client {
      from(table: string): unknown
    }
  }
}

// ============================================
// Supabase Modules
// ============================================

declare module '@supabase/supabase-js' {
  export function createClient(url: string, key: string, options?: any): any
  export type SupabaseClient = any
  export type User = any
  export type Session = any
}

declare module '@supabase/ssr' {
  export function createBrowserClient(url: string, key: string): any
  export function createServerClient(
    url: string,
    key: string,
    options?: any
  ): any
  export type CookieOptions = any
}

// ============================================
// Headless UI Components
// ============================================

declare module '@headlessui/react' {
  import { ComponentType, ReactNode } from 'react'
  
  export const Dialog: ComponentType<any>
  export const Transition: ComponentType<any>
  export const Menu: ComponentType<any>
  export const Listbox: ComponentType<any>
  export const Switch: ComponentType<any>
  export const Disclosure: ComponentType<any>
  export const Tab: ComponentType<any>
  export const Popover: ComponentType<any>
  export const RadioGroup: ComponentType<any>
  export const Combobox: ComponentType<any>
}

// ============================================
// Heroicons
// ============================================

declare module '@heroicons/react/24/outline' {
  import { FC, SVGProps } from 'react'
  
  export const Bars3Icon: FC<SVGProps<SVGSVGElement>>
  export const XMarkIcon: FC<SVGProps<SVGSVGElement>>
  export const MagnifyingGlassIcon: FC<SVGProps<SVGSVGElement>>
  export const BellIcon: FC<SVGProps<SVGSVGElement>>
  export const UserCircleIcon: FC<SVGProps<SVGSVGElement>>
  export const HomeIcon: FC<SVGProps<SVGSVGElement>>
  export const ShoppingCartIcon: FC<SVGProps<SVGSVGElement>>
  export const CogIcon: FC<SVGProps<SVGSVGElement>>
  export const ChartBarIcon: FC<SVGProps<SVGSVGElement>>
  export const UsersIcon: FC<SVGProps<SVGSVGElement>>
  export const DocumentIcon: FC<SVGProps<SVGSVGElement>>
  export const FolderIcon: FC<SVGProps<SVGSVGElement>>
  export const PlusIcon: FC<SVGProps<SVGSVGElement>>
  export const PencilIcon: FC<SVGProps<SVGSVGElement>>
  export const TrashIcon: FC<SVGProps<SVGSVGElement>>
  export const ArrowLeftIcon: FC<SVGProps<SVGSVGElement>>
  export const ArrowRightIcon: FC<SVGProps<SVGSVGElement>>
  export const CheckIcon: FC<SVGProps<SVGSVGElement>>
  
  // Catch-all for any other outline icons
  const icons: { [key: string]: FC<SVGProps<SVGSVGElement>> }
  export default icons
}

declare module '@heroicons/react/24/solid' {
  import { FC, SVGProps } from 'react'
  
  // Catch-all for solid icons
  const icons: { [key: string]: FC<SVGProps<SVGSVGElement>> }
  export default icons
}

declare module '@heroicons/react/20/solid' {
  import { FC, SVGProps } from 'react'
  
  const icons: { [key: string]: FC<SVGProps<SVGSVGElement>> }
  export default icons
}

// ============================================
// UI Utility Libraries
// ============================================

declare module 'react-hot-toast' {
  export const toast: any
  export const Toaster: any
  export default toast
}

declare module 'clsx' {
  export default function clsx(...args: any[]): string
}

declare module 'tailwind-merge' {
  export function twMerge(...args: string[]): string
}

declare module 'class-variance-authority' {
  export const cva: any
  export type VariantProps<T> = any
}

declare module 'next-themes' {
  export const ThemeProvider: any
  export const useTheme: any
}

// ============================================
// Radix UI Components
// ============================================

declare module '@radix-ui/react-dialog' {
  export const Dialog: any
  export const DialogTrigger: any
  export const DialogContent: any
  export const DialogHeader: any
  export const DialogFooter: any
  export const DialogTitle: any
  export const DialogDescription: any
}

declare module '@radix-ui/react-dropdown-menu' {
  export const DropdownMenu: any
  export const DropdownMenuTrigger: any
  export const DropdownMenuContent: any
  export const DropdownMenuItem: any
  export const DropdownMenuSeparator: any
  export const DropdownMenuLabel: any
}

declare module '@radix-ui/react-label' {
  export const Label: any
}

declare module '@radix-ui/react-select' {
  export const Select: any
  export const SelectTrigger: any
  export const SelectValue: any
  export const SelectContent: any
  export const SelectItem: any
}

declare module '@radix-ui/react-slot' {
  export const Slot: any
}

declare module '@radix-ui/react-tabs' {
  export const Tabs: any
  export const TabsList: any
  export const TabsTrigger: any
  export const TabsContent: any
}

declare module '@radix-ui/react-toast' {
  export const Toast: any
  export const ToastProvider: any
  export const ToastViewport: any
  export const ToastTitle: any
  export const ToastDescription: any
  export const ToastAction: any
}

declare module '@radix-ui/react-popover' {
  export const Popover: any
  export const PopoverTrigger: any
  export const PopoverContent: any
}

declare module '@radix-ui/react-switch' {
  export const Switch: any
}

// ============================================
// Charts and Data Visualization
// ============================================

declare module 'recharts' {
  export const ResponsiveContainer: any
  export const LineChart: any
  export const BarChart: any
  export const PieChart: any
  export const AreaChart: any
  export const Line: any
  export const Bar: any
  export const Pie: any
  export const Area: any
  export const XAxis: any
  export const YAxis: any
  export const CartesianGrid: any
  export const Tooltip: any
  export const Legend: any
  export const Cell: any
}

declare module 'lucide-react' {
  import { FC, SVGProps } from 'react'
  
  const icons: { [key: string]: FC<SVGProps<SVGSVGElement>> }
  export default icons
}

// ============================================
// Asset Type Declarations
// ============================================

declare module '*.svg' {
  const content: React.FC<React.SVGProps<SVGSVGElement>>
  export default content
}

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.jpg' {
  const content: string
  export default content
}

declare module '*.jpeg' {
  const content: string
  export default content
}

declare module '*.gif' {
  const content: string
  export default content
}

declare module '*.webp' {
  const content: string
  export default content
}

// ============================================
// Export to make this a module
// ============================================

export {}
