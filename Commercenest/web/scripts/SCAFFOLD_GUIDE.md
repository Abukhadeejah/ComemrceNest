# 🚀 Tenant Scaffold Guide

## Overview

The scaffold script automates tenant creation by generating all necessary files, components, and configurations. This reduces tenant onboarding from ~30 minutes to ~5 minutes.

## Quick Start

```bash
# Scaffold a new tenant
npm run scaffold:tenant

# Follow the interactive prompts:
# 1. Enter tenant key (e.g., "acme-furniture")
# 2. Enter business type (e.g., "furniture")
# 3. Enter brand colors (hex codes)
# 4. Confirm and generate
```

## What Gets Created

### Directory Structure
```
src/tenants/{tenantKey}/
├── components/
│   ├── Header.tsx          # Tenant-specific header
│   ├── Footer.tsx          # Tenant-specific footer
│   └── Layout.tsx          # Tenant-specific layout
├── {TenantKey}Home.tsx     # Homepage component
└── config.ts              # Tenant configuration
```

### Files Generated

#### Components
- **Header**: Navigation with tenant branding
- **Footer**: Contact info and links with tenant branding
- **Layout**: Wrapper component with tenant theming
- **Home**: Landing page with hero section and features

#### Configuration
- **config.ts**: Tenant settings, colors, features, contact info
- **Registry Integration**: Automatic registry updates
- **Database SQL**: Setup script for tenant data
- **Guide**: Step-by-step setup documentation

## Scaffold Process

### 1. Input Collection
```bash
Enter tenant key (lowercase, URL-safe):
Enter business type: furniture
Enter primary brand color: #8b5cf6
Enter secondary brand color: #64748b
Enter accent brand color: #f59e0b
```

### 2. Validation
- ✅ Tenant key format validation
- ✅ Required fields check
- ✅ Color format validation

### 3. Generation
```bash
🏗️  Creating directory structure...
✅ Created directory: tenants/acme-furniture/
✅ Created directory: tenants/acme-furniture/components/

📝 Generating components and files...
✅ Created file: tenants/acme-furniture/components/Header.tsx
✅ Created file: tenants/acme-furniture/components/Footer.tsx
✅ Created file: tenants/acme-furniture/components/Layout.tsx
✅ Created file: tenants/acme-furniture/AcmeFurnitureHome.tsx
✅ Created file: tenants/acme-furniture/config.ts

📋 Updating tenant registry...
✅ Updated tenant registry
```

### 4. Setup Files
```bash
📋 Generating setup documentation...
✅ Created setup files in: setup/acme-furniture-setup.sql
✅ Created guide in: setup/acme-furniture-guide.md
```

## Generated Tenant Features

### 🏠 Homepage
- **Hero Section**: Branded hero with tenant logo and messaging
- **Features**: Why choose us section with 3 key benefits
- **Call-to-Actions**: Explore products and contact buttons
- **Responsive Design**: Mobile-first approach

### 🧭 Header Component
- **Logo**: Auto-generated logo with tenant initial
- **Navigation**: Home, Products, Portfolio, Contact links
- **Mobile Menu**: Hamburger menu for mobile devices
- **Branding**: Tenant-specific colors and styling

### 🦶 Footer Component
- **Company Info**: Logo, description, social links
- **Quick Links**: Navigation shortcuts
- **Contact Info**: Email, phone, address
- **Copyright**: Auto-generated copyright notice

### 📐 Layout Component
- **Theme Integration**: CSS custom properties for colors
- **Flexible Container**: Supports any content structure
- **Performance Optimized**: Minimal wrapper overhead

### ⚙️ Configuration
```typescript
export const AcmeFurnitureConfig = {
  name: 'Acme Furniture',
  key: 'acme-furniture',
  businessType: 'furniture',
  brand: {
    primaryColor: '#8b5cf6',
    secondaryColor: '#64748b',
    accentColor: '#f59e0b',
  },
  features: {
    products: true,
    portfolio: true,
    blog: false,
    contact: true,
  },
  social: {
    facebook: 'https://facebook.com/acme-furniture',
    instagram: 'https://instagram.com/acme-furniture',
    twitter: 'https://twitter.com/acme-furniture',
  },
  contact: {
    email: 'hello@acme-furniture.com',
    phone: '(+91) 98765-43210',
    address: {
      street: '123 Business Street',
      city: 'New Delhi',
      state: 'Delhi',
      zipCode: '110001',
      country: 'India',
    },
  },
  seo: {
    title: 'Acme Furniture - Quality Furniture Solutions',
    description: 'Discover premium furniture products at Acme Furniture. Quality, innovation, and customer satisfaction guaranteed.',
    keywords: 'furniture, quality, premium, acme-furniture',
  },
}
```

## Database Setup

### Auto-Generated SQL
```sql
-- Database setup for Acme Furniture (acme-furniture)
INSERT INTO tenants (name, status, created_at, updated_at)
VALUES ('Acme Furniture', 'active', NOW(), NOW());

INSERT INTO tenant_domains (tenant_id, hostname, is_primary, created_at)
VALUES (
  (SELECT id FROM tenants WHERE name = 'Acme Furniture'),
  'localhost',
  true,
  NOW()
);

-- Sample product
INSERT INTO products (tenant_id, name, slug, description, price_cents, ...)
VALUES (...);
```

### Setup Commands
1. **Create Tenant Record**: Basic tenant information
2. **Add Domain**: Localhost for development
3. **Sample Products**: One example product
4. **Company Settings**: Branding and configuration

## Testing the New Tenant

### Development URLs
```bash
# Homepage
http://localhost:3000/acme-furniture

# Products page
http://localhost:3000/acme-furniture/products

# Portfolio page
http://localhost:3000/acme-furniture/portfolio
```

### Validation Checks
```bash
# Run all validations
npm run ci:validate

# Individual checks
npm run validate:registry    # Registry integration
npm run validate:imports     # Import paths
npm run validate:contracts   # Component contracts
```

## Customization Guide

### 1. Brand Colors
Update `src/tenants/{tenantKey}/config.ts`:
```typescript
brand: {
  primaryColor: '#your-primary-color',
  secondaryColor: '#your-secondary-color',
  accentColor: '#your-accent-color',
}
```

### 2. Content Updates
Modify homepage component:
```typescript
// Update hero title
<h1>Welcome to {Your Brand Name}</h1>

// Update description
<p>Your custom description here</p>
```

### 3. Component Styling
Customize components in `src/tenants/{tenantKey}/components/`:
```typescript
// Add custom CSS classes
className="custom-header-style"

// Modify layout structure
<div className="custom-layout-wrapper">
  {children}
</div>
```

### 4. Advanced Features
- **Custom Components**: Override default components
- **Additional Pages**: Add tenant-specific routes
- **Custom Logic**: Implement tenant-specific functionality

## Production Deployment

### 1. Domain Configuration
```sql
-- Add production domain
INSERT INTO tenant_domains (tenant_id, hostname, is_primary)
VALUES ('tenant-id', 'acme-furniture.com', true);
```

### 2. Environment Variables
```bash
NEXT_PUBLIC_ACME_FURNITURE_ENABLED=true
```

### 3. Image Assets
Upload to `/public/`:
- `acme-furniture-hero.jpg` - Hero background
- `acme-furniture-logo.png` - Company logo
- Product images in `/images/acme-furniture/`

### 4. Content Management
- Update SEO meta tags
- Add real product catalog
- Configure contact information
- Set up analytics tracking

## Troubleshooting

### Tenant Not Loading
```bash
# Check registry
npm run validate:registry

# Verify database
SELECT * FROM tenants WHERE name = 'Acme Furniture';

# Check imports
npm run validate:imports
```

### Component Errors
```bash
# Check contracts
npm run validate:contracts

# Verify component files exist
ls -la src/tenants/acme-furniture/components/
```

### Styling Issues
```bash
# Check CSS custom properties
console.log(getComputedStyle(document.documentElement).getPropertyValue('--brand-color'));

# Verify theme configuration
console.log(tenantContext.themeConfig);
```

## Best Practices

### Naming Conventions
- **Tenant Key**: `lowercase-with-hyphens` (e.g., `acme-furniture`)
- **Component Names**: `PascalCase` (e.g., `AcmeFurnitureHome`)
- **Config Keys**: `camelCase` (e.g., `primaryColor`)

### File Organization
```
src/tenants/{tenantKey}/
├── components/        # Reusable components
├── pages/            # Page-specific components (if needed)
├── hooks/            # Custom hooks (if needed)
├── utils/            # Utility functions (if needed)
└── config.ts         # Configuration
```

### Performance Considerations
- **Lazy Loading**: Components are loaded on-demand
- **Caching**: Tenant context cached for 5 minutes
- **Image Optimization**: Use WebP format for images
- **Bundle Splitting**: Each tenant loads only its components

## Examples

### Fashion Store
```bash
Tenant Key: fashion-forward
Business Type: fashion
Primary Color: #ec4899
Secondary Color: #64748b
Accent Color: #f59e0b
```

### Electronics Store
```bash
Tenant Key: tech-hub
Business Type: electronics
Primary Color: #06b6d4
Secondary Color: #64748b
Accent Color: #10b981
```

### Restaurant
```bash
Tenant Key: foodie-corner
Business Type: restaurant
Primary Color: #ef4444
Secondary Color: #64748b
Accent Color: #fbbf24
```

## Support

### Getting Help
1. **Check Logs**: Review scaffold script output
2. **Run Validation**: Use validation scripts to identify issues
3. **Check Documentation**: Review this guide and generated setup guide
4. **Debug Mode**: Enable debug logging for detailed information

### Common Issues
- **Import Errors**: Check file paths and export statements
- **Type Errors**: Verify TypeScript interfaces match contracts
- **Styling Issues**: Check CSS custom properties and theme configuration
- **Database Errors**: Verify tenant record exists and has correct data

---

*This guide was auto-generated by the scaffold script. For the latest updates, check the main documentation repository.*
