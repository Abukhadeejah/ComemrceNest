## Beginner Training Plan (Daily 30–60 min)

### Coaching Rules (system-wide)
1) Share 1–2 short resources first (docs/videos)
2) Guide step-by-step; you type the code
3) Explain simply; avoid jargon
4) Daily check-ins to evaluate understanding and progress

### Week 1
- Day 1: Next.js App Router basics
  - Read: https://nextjs.org/docs/app/building-your-application/routing
  - Practice: Add a tenant-aware link and verify route `/(site)/[tenant]/...`
- Day 2: Auth with Supabase
  - Read: https://supabase.com/docs/guides/auth/auth-helpers/nextjs
  - Practice: Inspect `AuthGate` and add a loading state variant
- Day 3: Server Actions
  - Read: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
  - Practice: Build a tiny server action to read a list
- Day 4: Multi-tenancy
  - Review: `middleware.ts`, `resolveTenantIdFromRequest`
  - Practice: Pass `tenantId` explicitly to a server read
- Day 5: Images & Storage
  - Read: https://nextjs.org/docs/app/building-your-application/optimizing/images
  - Practice: Display a Supabase image as `unoptimized`
- Day 6: TypeScript & Lint guardrails
  - Read: project ESLint rules; fix 2 warnings
  - Practice: Strengthen types in one component
- Day 7: E2E smoke & guardrails
  - Practice: Run browser MCP on 4 critical paths and log findings

### Daily Evaluation (quick)
- Can you explain (in 2 lines) what you changed and why?
- Did you follow guardrails (no breaking changes; tenant-safe; lints clean)?
- What’s one thing you found confusing? We’ll clarify next session.



