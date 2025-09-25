## Bluebell Interiors — MVP Specification

### Vision
- Build a luxurious, modern, responsive e‑commerce experience for Bluebell Interiors with an image‑first aesthetic, smooth interactions, and a professional admin.
- Design inspirations: Bergen (white space), Divi (hover/animations), Nevara (elegant, fluid), Figma interior kits, Webflow interior templates, Framer marketplace patterns.
- Cultural alignment: Incorporate tasteful Indian motifs and symbolism appropriate for a premium brand in India (e.g., subtle peepal‑leaf dividers, fine gold kinnauri lines, minimal paisley micro‑textures) applied sparingly for polish, not distraction.

### Tech Stack
- Next.js 14 (App Router, TypeScript), Tailwind CSS, Framer Motion, Supabase (Auth, Postgres, Storage, RLS), Razorpay (Checkout, Webhooks) for payments in India.
- State: local UI (Zustand) for cart drawer; server actions/route handlers for data mutations.
- SEO: next-seo, next-sitemap. Image CDN via Supabase Storage public buckets + signed URLs for originals.

### Information Architecture & Routes
- Public
  - `/` Home (hero, featured products, featured projects, brand story)
  - `/products` Catalog (grid, filters)
  - `/products/[slug]` PDP (gallery, details, add-to-cart)
  - `/portfolio` Projects gallery (masonry/grid)
  - `/portfolio/[slug]` Project detail (hero, gallery, description)
  - `/cart` Cart page (also slide-out drawer on any page)
  - `/checkout` Razorpay order initiation + status
  - `/contact` Form (lead capture)
  - `/blog` (basic list) and `/blog/[slug]` (optional Phase 1 simple)
  - `/legal/[slug]` (privacy, terms)
- Admin (protected)
  - `/admin` Dashboard (sales snapshot)
  - `/admin/products` (list, create/edit, images)
  - `/admin/portfolio` (projects, images)
  - `/admin/orders` (view, update status)
  - `/admin/content` (homepage copy, company profile, contact details)
- API (route handlers)
  - `/api/products`, `/api/portfolio`, `/api/cart`, `/api/checkout` (creates Razorpay order), `/api/webhooks/razorpay`, `/api/contact`

### Design System
- Typography: Headings: Playfair Display; Body: Inter/Manrope; large elegant display for heros.
- Color palette: sophisticated neutrals (cream, soft gray, white) with subtle luxury accents (deep charcoal, soft gold).
  - Example tokens: `--bg: #FAFAF7`, `--surface: #FFFFFF`, `--text: #1C1C1C`, `--muted: #6B6B6B`, `--accent: #C9A227`, `--line: #EAEAEA`.
- Spacing: generous white space; 8px scale with larger blocks (24/32/48).
- Radius & Shadow: small radii (6–10px), soft ambient shadows.
- Imagery: large, edge‑to‑edge hero and gallery sections; subtle parallax on hero.
- Brand motifs for India: minimal, refined Indian symbols integrated into dividers, section accents, or cursor treatments; ensure accessibility and avoid visual noise.

### Interaction & Motion
- Framer Motion for page transitions, hero fades, grid reveal, filter transitions; 200–350ms durations, spring easing where appropriate.
- Hover zoom on product cards, magnetic button effect (subtle), custom cursor for desktop (small circular cursor with opacity fade).
- Slide‑out cart drawer from right; smooth overscroll prevention; trap focus; ESC to close.

### Components (in `src/components`)
- Layout: `SiteHeader`, `MobileNavSheet`, `Footer`
- UI primitives: `Button`, `Input`, `Select`, `Badge`, `Card`, `Sheet`, `Dialog`, `Skeleton`
- Content: `Hero`, `SectionHeading`, `FeatureTiles`, `MasonryGallery`, `ProductCard`, `FilterBar`, `BreadCrumbs`
- Commerce: `CartDrawer`, `CartLineItem`, `CheckoutButton`, `PriceTag`
- Effects: `CustomCursor`, `RevealOnScroll`, `ParallaxHero`
- Admin: `AdminShell`, `DataTable`, `ImageUploader` (Supabase), `Form` (react-hook-form + zod)

### Accessibility
- Keyboard-first nav, focus visible, semantic landmarks, motion-reduced mode, color contrast ≥ WCAG AA, govern all sheets/dialogs with ARIA roles.

### Data Model (Supabase) — MVP
- Tables
  - `categories` (id, name, slug)
  - `products` (id, name, slug, description, price_cents, currency, status, hero_image_url, stock, created_at, updated_at)
  - `product_images` (id, product_id, url, alt, sort_order)
  - `product_categories` (product_id, category_id)
  - `portfolio_projects` (id, title, slug, description, location, featured, status, hero_image_url, created_at)
  - `portfolio_images` (id, project_id, url, alt, sort_order)
  - `orders` (id, order_number, email, total_cents, currency, status, payment_provider, razorpay_order_id, created_at)
  - `order_items` (id, order_id, product_id, quantity, unit_price_cents, subtotal_cents)
  - `cms_pages` (id, key, title, content jsonb, updated_at)
  - `settings_company_profile` (id, name, logo_url, address, phone, email, gstin, social jsonb, brand_accent_hex, brand_neutrals jsonb)
  - `profiles` (user_id references auth.users, role enum: admin|editor, created_at)
- Storage buckets: `product-images`, `portfolio-images`, `cms`
- RLS (MVP)
  - Public read: `products`/`portfolio_projects` where status = 'published'; images readable.
  - Admin write: products, images, categories, portfolio, cms, settings via `profiles.role in ('admin','editor')`.
  - Orders: inserts/updates only via server (service role). Admin can read/update status.
- Auth
  - Supabase Auth. Public signup disabled; admins seeded/invited only.
- Note: If an existing schema is present, code will conform to it without changing the DB.

### Payments (India)
- Razorpay Checkout for MVP: server route creates a Razorpay Order; client invokes Razorpay Checkout with `key_id` and order details; webhook validates signature and updates order status.

### SEO & Marketing
- next-seo defaults; sitemap via next-sitemap; social links in settings; newsletter capture (store emails to a table or integrate with a provider later).

### Analytics
- Admin dashboard aggregates from `orders` (sales by day, AOV, popular products). External advanced analytics deferred to Phase 2.

### Project Structure
- `app/*` routes only; components in `src/components`, libs in `src/lib`, server modules in `src/server`, styles in `src/styles`.
- Wrap providers (Supabase Auth, Theme) in `app/layout.tsx`.

### Phase 1 Milestones
- M1: Scaffold, theming, layout, typography, custom cursor, Indian brand motifs
- M2: Catalog + product card hover + PDP
- M3: Portfolio gallery + detail
- M4: Cart drawer + checkout + Razorpay webhook
- M5: Admin CRUD (products, portfolio, orders) + image upload
- M6: SEO (meta, sitemap), contact form, newsletter
- M7: Polish (animations, QA, A11y), readiness to deploy
- Definition of Done: dev server passes, no TS/lint errors, basic tests, no DB policy violations; then deploy to Heroku following the golden rule (run locally, ensure TypeScript and lint clean, and green dev server before deploy).

### Scaffold & Dependencies (run in Git Bash)
```bash
# from C:\Users\arsal\OneDrive\Desktop\projects\Bluebell
npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm

npm i framer-motion @supabase/supabase-js @supabase/auth-helpers-nextjs razorpay zustand zod react-hook-form next-seo next-sitemap class-variance-authority lucide-react react-wrap-balancer @vercel/analytics
npm i -D @types/node @types/react @types/react-dom tailwind-merge @tailwindcss/forms
```

### Tailwind
- Add plugin to `tailwind.config.ts`: `require('@tailwindcss/forms')`.
- Extend theme with tokens listed in Design System.

### Fonts
- Use `next/font/google` for Playfair Display and Inter in `app/layout.tsx`.

### Supabase — Proposed Schema (review before applying)
```sql
-- Enums
create type public.product_status as enum ('draft','published');
create type public.project_status as enum ('draft','published');
create type public.order_status as enum ('pending','paid','failed','fulfilled','cancelled');
create type public.user_role as enum ('admin','editor');

-- Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'INR',
  status public.product_status not null default 'draft',
  hero_image_url text,
  stock integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt text,
  sort_order integer not null default 0
);

create table if not exists public.product_categories (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (product_id, category_id)
);

-- Portfolio
create table if not exists public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  location text,
  featured boolean not null default false,
  status public.project_status not null default 'draft',
  hero_image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.portfolio_projects(id) on delete cascade,
  url text not null,
  alt text,
  sort_order integer not null default 0
);

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  email text not null,
  total_cents integer not null check (total_cents >= 0),
  currency text not null default 'INR',
  status public.order_status not null default 'pending',
  payment_provider text not null default 'razorpay',
  razorpay_order_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  subtotal_cents integer not null check (subtotal_cents >= 0)
);

-- CMS & Settings
create table if not exists public.cms_pages (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  content jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.settings_company_profile (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  address text,
  phone text,
  email text,
  gstin text,
  social jsonb not null default '{}',
  brand_accent_hex text default '#C9A227',
  brand_neutrals jsonb not null default '["#FAFAF7","#FFFFFF","#F5F5F5","#EAEAEA","#1C1C1C"]'::jsonb
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'admin',
  created_at timestamptz not null default now()
);

-- RLS
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.categories enable row level security;
alter table public.product_categories enable row level security;
alter table public.portfolio_projects enable row level security;
alter table public.portfolio_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.cms_pages enable row level security;
alter table public.settings_company_profile enable row level security;
alter table public.profiles enable row level security;

-- Helpers
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role in ('admin','editor')
  );
$$;

-- Public read of published content
create policy "Public read products" on public.products
  for select using (status = 'published');
create policy "Public read product images" on public.product_images
  for select using (exists (select 1 from public.products pr where pr.id = product_id and pr.status = 'published'));
create policy "Public read portfolio" on public.portfolio_projects
  for select using (status = 'published');
create policy "Public read portfolio images" on public.portfolio_images
  for select using (exists (select 1 from public.portfolio_projects pp where pp.id = project_id and pp.status = 'published'));
create policy "Public read categories" on public.categories for select using (true);
create policy "Public read cms" on public.cms_pages for select using (true);
create policy "Public read settings" on public.settings_company_profile for select using (true);

-- Admin write
create policy "Admin write products" on public.products
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin write product_images" on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin write categories" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin write product_categories" on public.product_categories
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin write portfolio" on public.portfolio_projects
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin write portfolio images" on public.portfolio_images
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin write cms" on public.cms_pages
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin write settings" on public.settings_company_profile
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin read profiles" on public.profiles
  for select using (public.is_admin());
create policy "Admin write profiles" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- Orders: server-only (via service role)
create policy "Orders server only" on public.orders
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Order items server only" on public.order_items
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
```

### Environment variables (`.env.local`)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Razorpay (India)
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=whsec_xxx

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Checkout & Webhooks (Razorpay)
- Server creates a Razorpay Order with amount in paise and currency INR.
- Client loads Razorpay Checkout (`https://checkout.razorpay.com/v1/checkout.js`) and opens with `order_id` and `RAZORPAY_KEY_ID`.
- Webhook route `/api/webhooks/razorpay` verifies signature (HMAC SHA256) and updates `orders.status` accordingly.

### Next steps
- Scaffold the app and install dependencies (see commands above), run `npm run dev`, and share any errors.
- Confirm existing Supabase schema (if any) so code aligns to the database as-is.

