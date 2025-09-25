## 2025-09-24 — Development Log (Bluebell)

### Summary of Changes
- Added top-left heading in Bluebell header: “Bluebell Interiors Studio”.
- Replaced subtitle tagline with: “Feel the luxurious life”.
- Implemented HOME nav dropdown with two options:
  - Bluebell Interiors
  - Bluebell Fabric (renamed from “BB Fabric” to “Bluebell Fabric”)
- Restored separate FABRICS navigation entry with dropdown (desktop) and quick links (mobile), retaining category loading from backend.
- Set “Bluebell Interiors” dropdown item to link to Portfolio previously; later wired it to toggle homepage mode (no navigation when already on home).
- Set “Bluebell Fabric” dropdown item to toggle homepage mode (no navigation when already on home).
- Made Bluebell homepage dynamic (client-side toggle between Interiors and Fabrics):
  - Default mode: Interiors.
  - Interiors mode: Interiors hero + title/subtitle, Portfolio section visible; Fabrics sections hidden.
  - Fabrics mode: Fabrics hero + title/subtitle, Products sections visible; Portfolio hidden.
  - Dropdown in hero also allows switching modes.

- Product card QR flip on hover:
  - Added 3D flip effect on product image; back side shows a generated QR code linking to the product page.
  - Implemented with `qrcode` library and CSS transforms; includes desktop hover and mobile tap support via overlay link.
  - Switched to external QR image service (no new dependency) and removed the in-image “View Details” overlay; added a "View Product" button under price.

### Files Touched
- src/tenants/bluebell/components/Header.tsx
  - Added HOME dropdown; updated labels; removed then restored FABRICS nav with dropdown; changed Interiors link to toggle mode; wired dropdown items to set mode via store.
  - Updated subtitle tagline under site title.
- src/tenants/bluebell/components/Home.tsx
  - Implemented in-page mode switcher and conditional rendering for Interiors vs Fabrics.
  - Added dual hero slide sets and dynamic hero title/subtitle.
  - Hid Portfolio when in Fabrics mode; hid Fabrics sections when in Interiors mode.
- src/lib/bluebellHomeMode.ts (new)
  - Added Zustand store `useBluebellHomeMode` to manage homepage mode globally.
- src/tenants/bluebell/components/BluebellProductGrid.tsx
  - Added QR flip effect and product URL QR generation on cards.
  - Removed overlay button; added bottom "View Product" CTA.
- src/tenants/bluebell/components/Home.tsx
  - Made CTA secondary button dynamic: "View Portfolio" in Interiors mode linking to `/bluebell/portfolio`, and "Browse Catalog" in Fabrics mode linking to `#products`.
  - Fabrics-mode “Browse Catalog” now downloads `public/catalog.pdf` via `/catalog.pdf`.
 - src/tenants/bluebell/components/Header.tsx
  - Added nested “Coming Soon” submenu under FABRICS with items: BB Sofa, BB Curtains, BB Cushion, BB Bedsheets (desktop + mobile).

### Implementation Details
- Mode management
  - Global store: `useBluebellHomeMode` with `mode: 'interiors' | 'fabrics'` and `setMode`.
  - Header dropdown sets mode and prevents navigation if already on Bluebell home; otherwise navigates to `/bluebell` then mode applies.
  - `Home.tsx` subscribes to the store and conditionally renders hero and sections.
- Accessibility/UX
  - Preserved keyboard focus via native <select> in hero; links in header remain accessible.

### Todos Addressed
- Show “Bluebell Interiors Studio” heading — completed.
- Add HOME dropdown for “Bluebell Interiors” and “Bluebell Fabric” — completed.
- Tagline updated to “Feel the luxurious life” — completed.
- Remove and later restore FABRICS nav with categories — completed.
- Rename “BB Fabric” to “Bluebell Fabric” — completed.
- Link “Bluebell Interiors” to Portfolio initially, then wire to mode toggle — completed.
- Add dynamic homepage toggle between Interiors and Fabrics — completed.
- Wire header dropdown to toggle homepage mode without navigation — completed.

### Notes
- No linter errors after changes.
- Behavior verified for both desktop and mobile nav.


