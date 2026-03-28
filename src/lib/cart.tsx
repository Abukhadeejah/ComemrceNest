'use client'

import { createContext, useContext, useReducer, useEffect, ReactNode, useRef } from 'react'
import { useTenant } from '@/hooks/useTenant'
import { useSupabaseSession } from '@/hooks/useSupabaseSession'

export interface CartItem {
  id: string
  productId: string
  name: string
  price: number // in cents
  imageUrl?: string
  quantity: number
  variant?: {
    id: string
    name: string
    options: Record<string, string>
  }
}

interface CartState {
  items: CartItem[]
  total: number
  itemCount: number
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'id'> }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] }

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(
        item => item.productId === action.payload.productId &&
                JSON.stringify(item.variant) === JSON.stringify(action.payload.variant)
      )

      let newItems: CartItem[]

      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        )
      } else {
        // Add new item with safe price conversion
        const newItem: CartItem = {
          ...action.payload,
          price: Number(action.payload.price) || 0, // 🔧 FIX: Ensure price is a valid number
          id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
        newItems = [...state.items, newItem]
      }

      // 🔧 FIX: Safe calculation with Number() conversion
      const total = newItems.reduce((sum, item) => {
        const price = Number(item.price) || 0
        const quantity = Number(item.quantity) || 0
        return sum + (price * quantity)
      }, 0)
      const itemCount = newItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)

      return {
        items: newItems,
        total,
        itemCount
      }
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload)
      // 🔧 FIX: Safe calculation with Number() conversion
      const total = newItems.reduce((sum, item) => {
        const price = Number(item.price) || 0
        const quantity = Number(item.quantity) || 0
        return sum + (price * quantity)
      }, 0)
      const itemCount = newItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)

      return {
        items: newItems,
        total,
        itemCount
      }
    }

    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: Math.max(0, action.payload.quantity) }
          : item
      ).filter(item => item.quantity > 0)

      // 🔧 FIX: Safe calculation with Number() conversion
      const total = newItems.reduce((sum, item) => {
        const price = Number(item.price) || 0
        const quantity = Number(item.quantity) || 0
        return sum + (price * quantity)
      }, 0)
      const itemCount = newItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)

      return {
        items: newItems,
        total,
        itemCount
      }
    }

    case 'CLEAR_CART':
      return initialState

    case 'LOAD_CART':
      // 🔧 FIX: Safe calculation with Number() conversion and normalize prices on load
      const normalizedItems = action.payload.map(item => ({
        ...item,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 0
      }))
      
      const total = normalizedItems.reduce((sum, item) => {
        const price = Number(item.price) || 0
        const quantity = Number(item.quantity) || 0
        return sum + (price * quantity)
      }, 0)
      const itemCount = normalizedItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)

      return {
        items: normalizedItems,
        total,
        itemCount
      }

    default:
      return state
  }
}

function isSameCartLine(a: CartItem, b: CartItem): boolean {
  return (
    a.productId === b.productId &&
    JSON.stringify(a.variant ?? null) === JSON.stringify(b.variant ?? null)
  )
}

function mergeCartItems(primary: CartItem[], secondary: CartItem[]): CartItem[] {
  const merged = [...primary]

  secondary.forEach((incoming) => {
    const idx = merged.findIndex((existing) => isSameCartLine(existing, incoming))
    if (idx >= 0) {
      const existingQty = Number(merged[idx].quantity) || 0
      const incomingQty = Number(incoming.quantity) || 0
      merged[idx] = {
        ...merged[idx],
        ...incoming,
        id: merged[idx].id || incoming.id || `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        price: Number(incoming.price ?? merged[idx].price) || 0,
        quantity: Math.max(existingQty, incomingQty),
      }
      return
    }

    merged.push({
      ...incoming,
      id: incoming.id || `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      price: Number(incoming.price) || 0,
      quantity: Number(incoming.quantity) || 0,
    })
  })

  return merged.filter((item) => item.quantity > 0)
}

interface CartContextType {
  state: CartState
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

// Cart storage is tenant-scoped to avoid cross-tenant mixing in the same browser
function getCartStorageKey(tenantKey: string | undefined) {
  const key = tenantKey && tenantKey.length > 0 ? tenantKey : 'default'
  return `commerce_cart_${key}`
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  const tenant = useTenant()
  const { data: session } = useSupabaseSession()
  const storageKey = getCartStorageKey(tenant.key)
  const hydratedRef = useRef(false)
  const remoteReadyRef = useRef(false)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stateItemsRef = useRef<CartItem[]>([])

  useEffect(() => {
    stateItemsRef.current = state.items
  }, [state.items])

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(storageKey)
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart)
        dispatch({ type: 'LOAD_CART', payload: cartItems })
      } catch (error) {
        console.error('Failed to load cart from localStorage:', error)
      }
    }
    hydratedRef.current = true
    remoteReadyRef.current = false
  }, [storageKey])

  // Load and merge server-side customer cart after login
  useEffect(() => {
    if (!hydratedRef.current) return

    if (!session?.user?.id) {
      remoteReadyRef.current = false
      return
    }

    let cancelled = false

    const syncFromServer = async () => {
      try {
        const response = await fetch('/api/customers/cart', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        })

        if (!response.ok) {
          remoteReadyRef.current = true
          return
        }

        const json = await response.json()
        const serverItems = Array.isArray(json?.items) ? json.items : []
        const localItems = stateItemsRef.current
        const mergedItems = mergeCartItems(serverItems, localItems)

        dispatch({ type: 'LOAD_CART', payload: mergedItems })

        await fetch('/api/customers/cart', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ items: mergedItems }),
        })
      } catch (error) {
        console.error('Failed to sync cart from server:', error)
      } finally {
        if (!cancelled) {
          remoteReadyRef.current = true
        }
      }
    }

    syncFromServer()

    return () => {
      cancelled = true
    }
  }, [session?.user?.id, storageKey])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state.items))
  }, [state.items, storageKey])

  // Persist cart to DB for authenticated users
  useEffect(() => {
    if (!session?.user?.id || !remoteReadyRef.current) return

    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current)
    }

    syncTimerRef.current = setTimeout(async () => {
      try {
        await fetch('/api/customers/cart', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ items: state.items }),
        })
      } catch (error) {
        console.error('Failed to persist cart to server:', error)
      }
    }, 400)

    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current)
      }
    }
  }, [state.items, session?.user?.id])

  const addItem = (item: Omit<CartItem, 'id'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item })
  }

  const removeItem = (itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: itemId })
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: itemId, quantity } })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  return (
    <CartContext.Provider value={{
      state,
      addItem,
      removeItem,
      updateQuantity,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

// Helper function to format price
export function formatPrice(priceInCents: number): string {
  // Prices are stored as tax-inclusive cents; show rounded rupee for shelf/cart UI
  const safePriceInCents = Number(priceInCents) || 0
  return (safePriceInCents / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  })
}

export function formatPriceWithPaise(priceInCents: number): string {
  // Utility to show precise tax-inclusive amounts (e.g., GST breakdown)
  const safePriceInCents = Number(priceInCents) || 0
  return (safePriceInCents / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}
