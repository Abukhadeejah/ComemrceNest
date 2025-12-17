# Vercel Pro Deployment Guide

## Overview
This document outlines the deployment process for CommerceNest multi-tenant e-commerce SaaS on Vercel Pro.

## Prerequisites
- Vercel Pro account ($20/month) for private repository support
- Supabase project with production database
- Razorpay test/live account credentials
- Custom domains for tenants

## Deployment Steps

### 1. Repository Preparation
```bash
# Ensure all changes are committed
git add .
git commit -m "Prepare for Vercel Pro deployment"
git push origin main
```

### 2. Vercel Project Setup
1. **Connect to Vercel Pro**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub account
   - Upgrade to Pro plan for private repository access

2. **Import Repository**
   - Click "New Project"
   - Import Git repository: `https://github.com/Abukhadeejah/ComemrceNest.git`
   - Framework: Next.js (auto-detected)
   - Root Directory: `Commercenest/web`

### 3. Environment Variables Configuration

#### Required Variables (Set in Vercel Dashboard)
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Multi-tenant Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Razorpay Configuration (Test Mode)
RAZORPAY_KEY_ID=your_razorpay_test_key_id
RAZORPAY_KEY_SECRET=your_razorpay_test_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# Optional: Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_vercel_analytics_id
```

### 4. Custom Domain Configuration

#### Primary Domain
- **Domain**: `your-app.vercel.app` (default)
- **SSL**: Automatic (provided by Vercel)

#### Tenant Domains
Configure custom domains for each tenant:

1. **Senlysh**: `senlysh.com`
2. **Bluebell**: `bluebell.com` (or subdomain)
3. **Future tenants**: `tenant-name.com`

#### DNS Configuration
For each custom domain:
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

### 5. Database Setup

#### Supabase Production Database
1. **Create production project** in Supabase
2. **Run migrations** from development
3. **Seed tenant data**:
   ```sql
   -- Insert tenants
   INSERT INTO tenants (id, name, slug, created_at) VALUES 
   ('uuid-for-senlysh', 'Senlysh', 'senlysh', NOW()),
   ('uuid-for-bluebell', 'Bluebell Interiors', 'bluebell', NOW());

   -- Insert tenant domains
   INSERT INTO tenant_domains (tenant_id, hostname, is_primary) VALUES 
   ('uuid-for-senlysh', 'senlysh.com', true),
   ('uuid-for-bluebell', 'bluebell.com', true);
   ```

### 6. Build Configuration

#### Vercel Build Settings
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm ci`
- **Node.js Version**: 20.x

#### Build Optimizations
- **Package Optimization**: Enabled for `lucide-react`, `framer-motion`
- **Image Optimization**: Next.js Image component with remote patterns
- **Security Headers**: HSTS, CSP, X-Frame-Options

### 7. Deployment Verification

#### Pre-deployment Checklist
- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Tenant data seeded
- [ ] Custom domains configured
- [ ] SSL certificates provisioned

#### Post-deployment Tests
1. **Homepage Access**: Verify each tenant homepage loads
2. **Admin Access**: Test admin authentication
3. **Product Pages**: Verify PLP/PDP functionality
4. **Checkout Flow**: Test Razorpay integration
5. **SEO**: Verify canonical URLs and meta tags

### 8. Monitoring & Analytics

#### Vercel Analytics
- Enable Vercel Analytics for performance monitoring
- Track Core Web Vitals
- Monitor build performance

#### Error Monitoring
- Configure Sentry for error tracking
- Set up alerts for build failures
- Monitor API response times

## Multi-Tenant Architecture

### Tenant Resolution
- **Host-based routing**: Each domain resolves to specific tenant
- **Middleware**: `middleware.ts` handles tenant resolution
- **Context**: Tenant context available throughout application

### Data Isolation
- **RLS Policies**: Supabase Row Level Security
- **Tenant Scoping**: All queries filtered by `tenant_id`
- **Admin Access**: Role-based access control per tenant

### Custom Domains
- **Primary Domains**: Each tenant gets custom domain
- **SSL**: Automatic SSL certificates via Vercel
- **DNS**: CNAME records point to Vercel

## Security Considerations

### Environment Variables
- **Secrets**: Never commit sensitive data
- **Encryption**: Supabase encrypts sensitive fields
- **Access Control**: Service role key for admin operations

### API Security
- **Rate Limiting**: Implement rate limiting for API routes
- **CORS**: Configure CORS for tenant domains
- **Authentication**: Supabase Auth with RLS

### Data Protection
- **Tenant Isolation**: Strict data separation
- **Backup**: Regular database backups
- **Audit**: Log all admin actions

## Performance Optimization

### Build Optimization
- **Code Splitting**: Automatic with Next.js
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Monitor bundle sizes

### Runtime Optimization
- **Caching**: ISR for static pages
- **CDN**: Vercel's global CDN
- **Edge Functions**: For tenant resolution

## Troubleshooting

### Common Issues
1. **Build Failures**: Check environment variables
2. **Domain Issues**: Verify DNS configuration
3. **Database Errors**: Check Supabase connection
4. **Image Loading**: Verify remote patterns

### Debug Commands
```bash
# Local build test
npm run build

# Environment check
npm run dev

# Lint check
npm run lint

# Test suite
npm run test
```

## Cost Optimization

### Vercel Pro Features
- **Private Repositories**: $20/month
- **Unlimited Bandwidth**: No overage charges
- **Custom Domains**: Unlimited domains
- **Team Collaboration**: Multiple team members

### Resource Usage
- **Build Minutes**: Monitor build time
- **Function Execution**: API route performance
- **Bandwidth**: Monitor traffic patterns

## Future Considerations

### Scaling
- **Auto-scaling**: Vercel handles automatically
- **Edge Functions**: For global performance
- **Database**: Supabase auto-scaling

### Monitoring
- **Performance**: Core Web Vitals tracking
- **Errors**: Sentry integration
- **Analytics**: Vercel Analytics

### Maintenance
- **Updates**: Regular dependency updates
- **Security**: Security patch monitoring
- **Backups**: Database backup strategy
