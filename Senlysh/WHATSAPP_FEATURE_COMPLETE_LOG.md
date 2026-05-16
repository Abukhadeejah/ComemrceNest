# WhatsApp Feature - Complete Architecture & Functionality Log

**Date:** May 12, 2026  
**Status:** ✅ FULLY IMPLEMENTED  
**Last Updated:** May 12, 2026

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Frontend Implementation](#frontend-implementation)
4. [Backend Implementation](#backend-implementation)
5. [Data Flow](#data-flow)
6. [Configuration](#configuration)
7. [Error Handling & Resilience](#error-handling--resilience)
8. [Workflow Examples](#workflow-examples)

---

## Overview

CommerceNest has implemented a **dual-layer WhatsApp integration** that enables:
- **Client-side direct messaging**: Users can contact merchants via WhatsApp directly from product pages
- **Server-side notifications**: Automated WhatsApp messages for order notifications and updates

### Key Features
✅ **Non-intrusive**: WhatsApp outages never break primary business operations  
✅ **Flexible**: Works with and without e-commerce features enabled  
✅ **Tenant-configurable**: Each tenant can configure their own WhatsApp number  
✅ **Idempotent**: Supports idempotency keys to prevent duplicate messages  
✅ **Production-ready**: Comprehensive error handling and logging  

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    COMMERCENEST WEB APP                      │
├──────────────────────┬──────────────────────────────────────┤
│  FRONTEND LAYER      │        BACKEND LAYER                  │
├──────────────────────┼──────────────────────────────────────┤
│                      │                                        │
│ ProductCard          │  WhatsApp Notification Client          │
│ (wa.me links)        │  (sendWhatsAppMessage)                │
│                      │          ↓ HTTP POST                  │
│ ProductDetailPage    │          │                            │
│ (wa.me links)        │          │                            │
│                      │          ↓                            │
│ BluebellProductGrid  │  WHATSAPP MICROSERVICE                │
│ (wa.me links)        │  (Port 3001)                          │
│                      │          ↓ WebSocket                  │
│                      │   Baileys Socket                      │
│                      │          ↓                            │
│                      │  WhatsApp Web Protocol                │
│                      │          ↓                            │
└──────────────────────┴──────────────────────────────────────┘
                              ↓
                    WhatsApp Servers
                              ↓
                    End User's Phone
```

### Frontend vs Backend Distinction

| Layer | Purpose | Trigger | Protocol | Risk |
|-------|---------|---------|----------|------|
| **Frontend (Client)** | Direct user-to-merchant inquiry | User clicks "Message on WhatsApp" | `wa.me` link | None (direct WhatsApp link) |
| **Backend (Server)** | Automated order notifications | Order status changes | HTTP to microservice | Isolated failure (logged, not propagated) |

---

## Frontend Implementation

### 1. ProductCard Component
**File:** `src/modules/products/components/ProductCard.tsx`

#### What It Does
- Displays "Message on WhatsApp" button on product grid cards
- Constructs pre-filled WhatsApp message with product name
- Opens WhatsApp Web or mobile app via `wa.me` link

#### How It Works

```typescript
// Line 30: WhatsApp number configuration
whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919029460064'

// Line 36: Construct wa.me link with pre-filled message
const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi, I'm interested in ${name}`)}`

// Lines 96-112: Render button
<a
  href={whatsappLink}
  target="_blank"
  rel="noopener noreferrer"
  className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3..."
>
  <svg /* WhatsApp icon */>
  Message on WhatsApp
</a>
```

#### Performance
- ✅ No API call required (direct `wa.me` link)
- ✅ Instant message composition
- ✅ Works offline (link created client-side)

---

### 2. Product Detail Page (PDP)
**File:** `src/app/(site)/products/[slug]/PdpClient.tsx`

#### What It Does
- Shows WhatsApp button on individual product pages
- Displays when e-commerce features are disabled (controlled via tenant config)
- Uses tenant-specific helper function to generate inquiry link

#### How It Works

```typescript
// Line 102: Get WhatsApp link using tenant helper
const whatsappLink = getProductInquiryLink(name)

// Line 103-105: Check if e-commerce is enabled
const showEcommerce = shouldShowAddToCart()

// Lines 213-230: Conditionally render WhatsApp button
{!showEcommerce && (
  <div className="mb-6">
    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="...">
      Message on WhatsApp
    </a>
  </div>
)}
```

#### Tenant Configuration Helper
```typescript
// From src/tenants/bluebell/config.ts

// Get WhatsApp link with custom message
export const getProductInquiryLink = (productName: string) => {
  const message = `Hi, I'd like to inquire about: ${productName}`
  return getWhatsAppLink(message)
}

// Base function for any WhatsApp message
export const getWhatsAppLink = (message?: string) => {
  const defaultMessage = message || 'Hi, I\'m interested in your products from Bluebell Interiors.'
  const encodedMessage = encodeURIComponent(defaultMessage)
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`
}
```

---

### 3. Bluebell Tenant Product Grid
**File:** `src/tenants/bluebell/components/BluebellProductGrid.tsx`

#### What It Does
- Renders product grid specific to Bluebell interior design tenant
- Integrates WhatsApp button as primary CTA (since e-commerce is disabled)
- Uses tenant-specific WhatsApp configuration

#### How It Works

```typescript
// Line 76: Generate WhatsApp inquiry link
const whatsappLink = getProductInquiryLink(product.name)

// Lines 151-165: Render fixed WhatsApp button at bottom of product card
<div className="mb-3">
  <a
    href={whatsappLink}
    target="_blank"
    rel="noopener noreferrer"
    className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3..."
  >
    <svg /* WhatsApp icon */>
    Message on WhatsApp
  </a>
</div>
```

#### Tenant Configuration
```typescript
// From src/tenants/bluebell/config.ts, Line 55

contact: {
  whatsapp: '919029460064', // Bluebell's WhatsApp number
},

features: {
  ecommerce: {
    enabled: false,              // Disable e-commerce
    showAddToCart: false,        // Hide cart button
    contactMethod: 'whatsapp',   // Use WhatsApp instead
  },
}
```

---

## Backend Implementation

### 1. WhatsApp Notification Client
**File:** `src/server/notifications/whatsapp.ts`

#### What It Does
- Sends automated WhatsApp messages from the server
- Acts as HTTP wrapper around standalone WhatsApp microservice
- Ensures failures never break primary operations

#### Function Signature
```typescript
async function sendWhatsAppMessage(
  phone: string,
  message: string,
  idempotencyKey?: string
): Promise<void>
```

#### Parameters
- **phone** (string): Recipient phone number in any format
- **message** (string): Message content
- **idempotencyKey** (optional): Unique key to prevent duplicate messages

#### How It Works - Step by Step

**Step 1: Input Validation**
```typescript
if (!phone?.trim() || !message?.trim()) {
  console.warn('[WhatsApp] Invalid input: phone and message must be non-empty strings')
  return
}
```
✓ Validates phone and message are non-empty  
✓ Exits gracefully if invalid

**Step 2: Service Configuration Check**
```typescript
const serviceUrl = process.env.WHATSAPP_SERVICE_URL

if (!serviceUrl) {
  console.warn('[WhatsApp] WHATSAPP_SERVICE_URL not configured. WhatsApp notifications are disabled.')
  return
}
```
✓ Checks if microservice URL is configured  
✓ Logs warning if disabled, exits gracefully

**Step 3: Prepare Request**
```typescript
const headers: Record<string, string> = {
  'Content-Type': 'application/json',
}

if (idempotencyKey) {
  headers['X-Idempotency-Key'] = idempotencyKey
  console.log(`[WhatsApp] Sending message (key: ${idempotencyKey})`)
}
```
✓ Sets Content-Type header  
✓ Adds idempotency key if provided (for deduplication)  
✓ Logs send attempt

**Step 4: Send HTTP Request with Timeout**
```typescript
const controller = new AbortController()
timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

const response = await fetch(`${serviceUrl}/send`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ phone, message }),
  signal: controller.signal,
})
```
✓ Creates abort controller for timeout handling  
✓ Sets 10-second timeout to prevent hanging requests  
✓ Posts to microservice `/send` endpoint

**Step 5: Handle Response**
```typescript
if (!response.ok) {
  const errorData = await response.json().catch(() => ({}))
  const errorMsg = typeof errorData === 'object' && 'error' in errorData
    ? errorData.error
    : `HTTP ${response.status}`
  
  console.error(`[WhatsApp] Failed to send (key: ${idempotencyKey}): ${errorMsg}`)
  return  // Exit without throwing error
}

console.log(`[WhatsApp] Message sent successfully (key: ${idempotencyKey})`)
```
✓ Parses error response if available  
✓ Logs failure with error details  
✓ **Critically: Does NOT throw error** - allows caller to continue

**Step 6: Error Handling**
```typescript
catch (error) {
  const errorMsg = error instanceof Error
    ? error.name === 'AbortError' ? 'Request timeout (10s)' : error.message
    : String(error)
  
  console.error(`[WhatsApp] Network error contacting microservice: ${errorMsg}. This will not affect the primary operation.`)
}
finally {
  if (timeoutId) clearTimeout(timeoutId)
}
```
✓ Catches network errors, timeouts, parsing errors  
✓ Logs detailed error message  
✓ Cleans up timeout timer  
✓ Function completes successfully despite error

#### Key Design Principle
**Failures are logged, NEVER propagated to caller.**

This ensures that if the WhatsApp microservice is down, slow, or unreachable, the primary operation (e.g., creating an order) continues successfully.

---

### 2. WhatsApp Microservice
**Location:** `f:\ComemrceNest\Commercenest\commercenest-whatsapp\`

#### What It Does
- Runs as standalone Node.js process
- Maintains persistent WebSocket connection to WhatsApp using Baileys library
- Exposes HTTP endpoints for message sending and health checks

#### Core Components

**A. Connection Manager (`src/whatsapp.ts`)**
```typescript
- Uses @whiskeysockets/baileys v6.3.0
- Maintains socket connection: makeWASocket()
- Authentication: useMultiFileAuthState() → auth_sessions/ folder
- QR Code: printQRInTerminal: true (for initial pairing)
- Reconnection: Auto-reconnects on disconnect (except logout)
- Performance: makeCacheableSignalKeyStore for efficiency
```

Configuration Details:
```typescript
makeWASocket({
  msgRetryCounterMap: {},              // Track message retries
  retryRequestDelayMs: 10,             // Retry delay in ms
  shouldSyncHistoryMessage: false,     // Skip history sync
  getMessage: async () => undefined,   // No message history
  maxMsToWaitForConnection: 10000,     // 10s connection timeout
  markOnlineOnConnect: false,          // Silent mode
  logger: pino({ level: 'silent' }),   // No logging in production
})
```

**B. Message Sender (`src/sender.ts`)**
```typescript
// Phone number sanitization
Input: "+91 9999 999999" OR "91-9999-999999" OR "919999999999"
↓ Strip non-numeric characters (/\D/g)
Output: "919999999999"
↓ Append @s.whatsapp.net
Final: "919999999999@s.whatsapp.net"

// Before sending, checks:
✓ Connection status
✓ Phone format validity
✓ Message content availability
```

**C. HTTP API Server (`src/server.ts`)**

**Endpoint 1: Health Check**
```
GET /health

Response (200):
{
  "status": "ok",
  "connected": true
}

Purpose: 
- Load balancer health checks
- Monitoring systems
- Connection status verification
```

**Endpoint 2: Send Message**
```
POST /send

Request Body:
{
  "phone": "91XXXXXXXXXX",
  "message": "Hello, your order is ready!"
}

Success Response (200):
{
  "success": true
}

Error Response (400 - Invalid input):
{
  "error": "phone is required and must be a non-empty string"
}

Error Response (500 - Microservice error):
{
  "error": "Socket not connected. Please try again later."
}

Headers (Optional):
X-Idempotency-Key: unique-key-here  (for deduplication)
```

#### Environment Variables
```bash
WHATSAPP_SERVICE_URL=http://localhost:3001  # Microservice URL
WHATSAPP_PORT=3001                          # Microservice port (default)
```

---

## Data Flow

### Frontend User Journey: Product Inquiry

```
User visits product page
    ↓
Clicks "Message on WhatsApp" button
    ↓
wa.me link generated with pre-filled message:
  https://wa.me/919029460064?text=Hi%2C%20I%27m%20interested%20in%20Modern%20Chair
    ↓
User redirected to:
  - WhatsApp Web (if on desktop)
  - WhatsApp Mobile App (if on mobile)
    ↓
Message pre-filled in chat with merchant
    ↓
User reviews and sends message
    ↓
Message arrives in merchant's WhatsApp chat
```

### Backend Server Journey: Order Notification

```
Order Status Changes (e.g., "pending" → "shipped")
    ↓
Server calls: sendWhatsAppMessage(phone, "Your order has been shipped!")
    ↓
Input Validation
  ✓ Phone not empty
  ✓ Message not empty
    ↓
Environment Check
  ✓ WHATSAPP_SERVICE_URL configured?
    ↓
Prepare HTTP Request
  - Headers: Content-Type, X-Idempotency-Key (optional)
  - Body: { phone, message }
  - Timeout: 10 seconds
    ↓
POST to Microservice /send
    ↓
Microservice receives request
    ↓
Sanitize phone number
  "+91 9999999999" → "919999999999@s.whatsapp.net"
    ↓
Send via Baileys/WhatsApp WebSocket
    ↓
Response back to CommerceNest
    ↓
Success: Log and return
Error: Log error message and return (DO NOT THROW)
    ↓
Primary operation continues
(Even if WhatsApp failed, order is still created/updated)
```

---

## Configuration

### Tenant-Level Configuration
**File:** `src/tenants/{tenant}/config.ts`

#### Example: Bluebell Tenant
```typescript
const bluebellConfig: TenantConfig = {
  content: {
    contact: {
      whatsapp: '919029460064',  // ← Tenant's WhatsApp number
    },
  },
  features: {
    ecommerce: {
      enabled: false,              // Disable e-commerce
      showPrices: false,           // Hide prices
      showAddToCart: false,        // Hide cart button
      showBuyNow: false,           // Hide buy now
      showCart: false,             // Hide cart icon
      showCheckout: false,         // Disable checkout
      contactMethod: 'whatsapp',   // Use WhatsApp for inquiries
    },
  },
}

// Export helpers
export const WHATSAPP_NUMBER = bluebellConfig.content.contact?.whatsapp ?? '919029460064'
export const getProductInquiryLink = (productName: string) => { /* ... */ }
export const isEcommerceEnabled = () => bluebellConfig.features.ecommerce?.enabled ?? false
```

### Environment Variables
```bash
# Frontend (public - baked into build)
NEXT_PUBLIC_WHATSAPP_NUMBER=919029460064

# Backend (server-side - secret)
WHATSAPP_SERVICE_URL=http://localhost:3001
```

### Type Definitions
**File:** `src/tenants/types.ts`

```typescript
export interface TenantConfig {
  content: {
    contact?: {
      whatsapp?: string  // WhatsApp number for product inquiries
    }
  }
  features: {
    ecommerce?: {
      enabled?: boolean
      contactMethod?: string  // 'whatsapp', 'email', etc.
    }
  }
}
```

---

## Error Handling & Resilience

### Design Principle
**WhatsApp failures are NEVER critical path failures.**

### Error Scenarios & Responses

#### Scenario 1: Microservice URL Not Configured
```
WHATSAPP_SERVICE_URL not set in environment
    ↓
sendWhatsAppMessage() detects missing URL
    ↓
Logs: "[WhatsApp] WHATSAPP_SERVICE_URL not configured. WhatsApp notifications are disabled."
    ↓
Returns without error
    ↓
Primary operation continues unaffected
```

#### Scenario 2: Microservice Down/Unreachable
```
POST to ${serviceUrl}/send fails (connection refused)
    ↓
Network error caught in catch block
    ↓
Logs: "[WhatsApp] Network error contacting microservice: ECONNREFUSED. This will not affect the primary operation."
    ↓
Returns without throwing
    ↓
Primary operation continues unaffected
```

#### Scenario 3: Request Timeout
```
10-second timeout elapses waiting for /send response
    ↓
AbortController.abort() triggered
    ↓
catch block receives AbortError
    ↓
Logs: "[WhatsApp] Failed to send: Request timeout (10s)"
    ↓
Returns without throwing
    ↓
Primary operation continues unaffected
```

#### Scenario 4: WhatsApp API Error (e.g., invalid phone)
```
Microservice responds with HTTP 400:
{
  "error": "Invalid phone number format"
}
    ↓
CommerceNest client receives error response
    ↓
Logs: "[WhatsApp] Failed to send: Invalid phone number format"
    ↓
Returns without throwing
    ↓
Primary operation continues unaffected
```

#### Scenario 5: Invalid Input (phone or message empty)
```
sendWhatsAppMessage('', 'Hello')
    ↓
Input validation fails
    ↓
Logs: "[WhatsApp] Invalid input: phone and message must be non-empty strings"
    ↓
Returns immediately
    ↓
Primary operation continues unaffected
```

### Logging Standards
All WhatsApp operations log to console with `[WhatsApp]` prefix:
- **INFO**: `[WhatsApp] Sending message (key: ...)`
- **SUCCESS**: `[WhatsApp] Message sent successfully (key: ...)`
- **WARNING**: `[WhatsApp] WHATSAPP_SERVICE_URL not configured...`
- **ERROR**: `[WhatsApp] Failed to send (key: ...): error reason`

### Idempotency Protection
Optional `idempotencyKey` parameter prevents duplicate messages:
```typescript
// Same key sent twice
sendWhatsAppMessage('919999999999', 'Hello', key='order-123')
sendWhatsAppMessage('919999999999', 'Hello', key='order-123')

// Microservice recognizes duplicate key
// Returns success for both without sending twice
```

---

## Workflow Examples

### Example 1: Customer Inquires About Product on Bluebell Store

**Scenario:** Interior design client browsing Bluebell Interiors store

**User Actions:**
1. Browses product grid
2. Sees "Message on WhatsApp" button on chair product
3. Clicks button

**System Flow:**
```javascript
// ProductCard component generates link
const whatsappLink = 'https://wa.me/919029460064?text=Hi%2C%20I%27m%20interested%20in%20Modern%20Chair'

// User's phone opens WhatsApp app
// Message auto-filled: "Hi, I'm interested in Modern Chair"
// User adds: "Do you have this in white?"
// Message sent to Bluebell Interiors number

// Merchant receives message immediately
```

**Result:** Customer connects with merchant for design consultation

---

### Example 2: Server Sends Order Shipment Notification

**Scenario:** Order status updated to "shipped"

**System Flow:**
```typescript
// 1. Order status changes in database
updateOrderStatus(orderId, 'shipped')

// 2. Trigger notification flow
const notification = {
  phone: '+91-9999999999',
  message: 'Your order #12345 has been shipped! Track it here: ...',
}

// 3. Call WhatsApp notification client
sendWhatsAppMessage(
  notification.phone,
  notification.message,
  idempotencyKey='shipment-12345'  // Prevent duplicate messages
)

// 4. Function validates input
✓ Phone: "+91-9999999999" (non-empty)
✓ Message: "Your order..." (non-empty)

// 5. Function checks service URL
✓ WHATSAPP_SERVICE_URL=http://localhost:3001

// 6. Function sends HTTP request
POST http://localhost:3001/send
Headers: {
  'Content-Type': 'application/json',
  'X-Idempotency-Key': 'shipment-12345'
}
Body: {
  "phone": "+91-9999999999",
  "message": "Your order #12345 has been shipped!..."
}

// 7. Microservice processes request
- Receives POST /send
- Extracts phone: "+91-9999999999"
- Sanitizes: "+919999999999" → "919999999999@s.whatsapp.net"
- Sends via Baileys/WhatsApp WebSocket
- Returns: { success: true }

// 8. CommerceNest receives success response
- Logs: "[WhatsApp] Message sent successfully (key: shipment-12345)"
- Returns from function

// 9. Primary operation completes
- Order status saved ✓
- Notification sent ✓
- Response sent to client ✓
```

**Result:** Customer receives notification about shipment

---

### Example 3: Graceful Degradation When Microservice Is Down

**Scenario:** WhatsApp microservice crashed

**System Flow:**
```typescript
// 1. Try to send notification
sendWhatsAppMessage('919999999999', 'Your package is out for delivery')

// 2. Validate input
✓ Phone and message non-empty

// 3. Prepare request
POST http://localhost:3001/send  ← Microservice is DOWN

// 4. Network error occurs
Error: ECONNREFUSED (connection refused)

// 5. Error handler catches it
const errorMsg = 'connect ECONNREFUSED 127.0.0.1:3001'

// 6. Error is logged
console.error('[WhatsApp] Network error contacting microservice: connect ECONNREFUSED. This will not affect the primary operation.')

// 7. Function returns (does NOT throw)
// Primary operation continues

// 8. In application code:
updateOrderStatus(orderId, 'out_for_delivery')
// ↑ This completes successfully despite WhatsApp failure
```

**Result:** Order status updated, customer not affected by WhatsApp outage

---

## Summary: What WhatsApp Feature Performs

### Frontend Layer
- ✅ Displays "Message on WhatsApp" buttons on product cards
- ✅ Displays WhatsApp buttons on product detail pages
- ✅ Generates pre-filled WhatsApp messages with product names
- ✅ Opens WhatsApp Web or mobile app via `wa.me` links
- ✅ Respects tenant configuration (shows/hides based on e-commerce settings)

### Backend Layer
- ✅ Sends automated order notifications
- ✅ Communicates with standalone WhatsApp microservice via HTTP
- ✅ Validates phone numbers and messages
- ✅ Implements idempotency to prevent duplicate messages
- ✅ Handles all failures gracefully without breaking primary operations
- ✅ Logs all activities for debugging and monitoring

### Microservice Layer
- ✅ Maintains persistent WebSocket connection to WhatsApp
- ✅ Sanitizes and formats phone numbers
- ✅ Sends messages via Baileys/WhatsApp protocol
- ✅ Provides health check endpoint
- ✅ Provides message sending endpoint
- ✅ Auto-reconnects on disconnection

### Overall System
✅ **Production-Ready**: Comprehensive error handling  
✅ **Tenant-Flexible**: Each tenant has own WhatsApp config  
✅ **Resilient**: WhatsApp outages never break core operations  
✅ **Scalable**: Independent microservice can scale separately  
✅ **Observable**: Detailed logging for all operations  

---

**End of Log**
