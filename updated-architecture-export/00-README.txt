PROJECT ARCHITECTURE EXPORT - UPDATED
======================================
Project: CommerceNest - Multi-tenant E-commerce Platform
Updated: January 21, 2026
Framework: Next.js 16 + TypeScript
Database: Supabase (PostgreSQL)
Payment: Razorpay + PhonePe

ARCHITECTURE OVERVIEW
======================================
This is a multi-tenant e-commerce platform with:
- Admin Dashboard (tenant-admin routes)
- Customer Storefronts (tenant-specific)
- Multi-payment Gateway Support (Razorpay + PhonePe)
- Product Management with Variants & Attributes
- Inventory & Order Management
- Cashback & Wallet System
- Coupon Management System
- Role-based Access Control (RBAC)
- Draft Auto-save System

KEY TECHNOLOGIES
======================================
✓ Next.js 16 (App Router)
✓ TypeScript 5.9.3
✓ React 19.1.0
✓ React Hook Form
✓ TailwindCSS 4
✓ Supabase (Auth + Database)
✓ Razorpay & PhonePe Payment Gateways
✓ Playwright (E2E Testing)
✓ Framer Motion (Animations)
✓ Zustand (State Management)
✓ Zod (Schema Validation)

FOLDER STRUCTURE
======================================
/src/app          - Next.js app directory (routes & pages)
/src/components   - Reusable React components
/src/server       - Server-side logic & config
/src/types        - TypeScript type definitions
/src/utils        - Utility functions
/src/hooks        - Custom React hooks
/src/lib          - Library integrations
/src/modules      - Feature modules
/src/tenants      - Tenant-specific configs

MULTI-TENANT ROUTES
======================================
Admin Routes: /[tenant]/admin/*
Customer Routes: /[tenant]/* (site-specific stores like /senlysh/*, /bluebell/*)

FILES IN THIS EXPORT
======================================
01-folder-structure.txt    - Main directory hierarchy
02-file-tree.txt           - Complete file tree
03-config-files.txt        - Configuration files
04-key-directories.txt     - Key Next.js directories
05-code-statistics.txt     - Code file statistics

EXCLUDED FOLDERS
======================================
node_modules, .next, .git, dist, build, .vercel, .turbo, out, coverage

NOTES
======================================
- Check Senlysh/ folder for detailed development logs
- See package.json for all dependencies
- Database schema in migrations/ folder
