export type TenantConfig = {
  key: string
  theme: {
    colors: {
      primary: string
      mustard?: string
      white?: string
      crimson?: string
      brown?: string
      accent?: string
    }
    fonts?: { heading?: string; body?: string }
  }
  homepage: {
    sections: string[]
    copy?: Record<string, unknown>
  }
  overrides?: Record<string, React.ComponentType<unknown>>
  enabledModules?: string[]
}


