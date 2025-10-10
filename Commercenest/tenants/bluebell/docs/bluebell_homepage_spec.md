## Bluebell Interiors — Homepage Design Spec (P1.3)

Goal: Reproduce the Interiar theme homepage structure with Bluebell brand palette and modular components suitable for our Next.js + Tailwind Invisible SaaS platform.

Brand Palette (CSS vars)
- Primary Blue: `--bluebell-primary: #01589D`
- Mustard Accent: `--bluebell-mustard: #FDCE59`
- White: `--bluebell-white: #FEFEFE`
- Crimson Accent: `--bluebell-crimson: #DC2A38`
- Brown Accent: `--bluebell-brown: #4E302E`

Structure
1) Navigation/Header
   - Left: Logo; Center: nav links; Right: CTA button.
   - Sticky on scroll; background: white with subtle shadow.
2) Hero/Banner
   - Left: headline, subheadline, primary CTA (bg-primary), secondary CTA (outline-primary).
   - Right: illustrative image or collage.
3) Services Highlight (3–6 cards)
   - Icons + titles + short descriptions; hover uses mustard border/underline.
4) Featured Projects (Portfolio Showcase)
   - Masonry or grid of 3–6 items; each card with image, title, category; hover overlay with primary.
   - CTA: View all portfolio.
5) Featured Products (Catalog Teaser)
   - 3–6 product cards; brand hover; CTA: View all products.
6) Testimonials & Client Logos
   - Carousel or grid quotes; strip of client logos in grayscale; accent separators.
7) CTA Band
   - Full-width band with headline and primary button (bg-primary) + secondary button.
8) Footer
   - 3–4 columns (About, Links, Contact, Social); bottom bar with copyright.

Accessibility/Responsiveness
- Heading hierarchy: h1 (Hero), h2 (sections), label/aria for nav.
- Keyboard focus styles preserved; contrast AA.
- Breakpoints: xs: single column; md+: two-column hero; lg+: multi-column grids.

Component Inventory (Next.js server components)
- `components/SiteHeader.tsx` (existing) — extend with nav links, sticky behavior
- `components/Hero.tsx` (existing) — adjust to two-col hero layout; buttons styled with brand utilities
- `components/ServiceCard.tsx` — icon, title, text
- `components/Services.tsx` — grid of ServiceCard
- `components/ProjectCard.tsx` — image, title, category
- `components/FeaturedProjects.tsx` — grid of projects (uses `fetchPublishedProjects`)
- `components/ProductTeaser.tsx` — grid of top 6 products (uses products service)
- `components/Testimonials.tsx` — static or CMS-sourced quotes
- `components/ClientLogos.tsx` — grid/strip of logos
- `components/CtaBand.tsx` — full-width band with headline + CTAs
- `components/SiteFooter.tsx` (existing)

Data sources
- Products/Portfolio (existing tables). Services/Testimonials/Client logos can be static for MVP or later added to CMS tables.

Styling approach
- Use CSS vars for brand palette (already added in globals.css). Map Interiar styles to Tailwind classes; avoid custom CSS except for gradients.

Implementation Notes
- Add sections to home `/` in this order: Hero → Services → Featured Projects → Product Teaser → Testimonials → Client Logos → CTA Band.
- Reuse existing brand header/footer.
- Ensure Lighthouse >= 90 for Accessibility.

