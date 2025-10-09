## CommerceNest Backlog (Prioritized, Living)

Scoring uses RICE (Reach, Impact, Confidence, Effort). Higher RICE = higher priority. Scores are indicative to guide order within the same phase.

### P1 (Bluebell Launch) — High Priority
1) PLP/PDP visual polish (tokens, spacing, empty/error states) — RICE 640
   - Frontend: refine `ProductCard`, PDP layout, states; motion.
   - Backend: none.

2) Admin image upload UI with Storage RLS — RICE 560
   - Frontend: admin forms for products/projects with image picker.
   - Backend: confirm Storage policies; signed URL generation if private.

3) Checkout UX + A11y — RICE 480
   - Frontend: forms, validation, error surfaces, skeletons; motion.
   - Backend: none.

4) Razorpay live mode E2E — RICE 420
   - Frontend: messaging for success/failure.
   - Backend: live keys per tenant; webhook safety; idempotency audit.

5) SEO/ISR per-tenant — RICE 360
   - Frontend: per-domain canonical/meta, sitemaps, robots.
   - Backend: tag-based ISR, cache cadences.

### P1 (Bluebell) — Medium Priority
6) Portfolio detail page polish — RICE 240
7) A11y pass across admin UI — RICE 220
8) Super-light theme tokens for Bluebell brand — RICE 210

### P0.8 (Media Polish sub-phase)
9) Blur/fallback placeholders for images — RICE 300
10) Signed URLs for private buckets — RICE 280
11) CSP update for `img-src` — RICE 180

### Later Phases
12) Superadmin UI MVP (P2) — RICE 500
13) Feature flags + tenant overrides (P2) — RICE 480
14) Plugin registry/contracts (P2.5) — RICE 420
15) Monitoring dashboards & alerts (P3) — RICE 380

Notes
- UI/UX tasks are first-class citizens; phases don’t close until UI acceptance criteria pass.
- Re-score as we learn; if backend work blocks UI, split and parallelize.


