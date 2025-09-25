// Global type declarations to resolve Supabase compatibility issues

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

// Augment the Supabase module to be more flexible
declare module '@supabase/supabase-js' {}

export {}


