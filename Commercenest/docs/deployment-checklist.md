# Vercel Pro Deployment Checklist

## 🚀 Pre-Deployment Checklist

### 1. Account Setup
- [ ] **Vercel Pro Account**: Purchase Vercel Pro ($20/month) for private repository support
- [ ] **GitHub Integration**: Connect GitHub account to Vercel
- [ ] **Team Access**: Add team members if needed

### 2. Repository Preparation
- [ ] **All Changes Committed**: Ensure all code changes are pushed to GitHub
- [ ] **Build Test**: Run `npm run build` locally to verify build success
- [ ] **Lint Check**: Run `npm run lint` to ensure code quality
- [ ] **Test Suite**: Run `npm run test` to verify functionality

### 3. Environment Setup
- [ ] **Supabase Production**: Create production Supabase project
- [ ] **Database Migration**: Run all migrations on production database
- [ ] **Razorpay Credentials**: Get production/test Razorpay API keys
- [ ] **Custom Domains**: Prepare domain names for tenants

## 🔧 Vercel Project Setup

### Step 1: Create Vercel Project
1. **Login to Vercel**: Go to [vercel.com](https://vercel.com)
2. **New Project**: Click "New Project"
3. **Import Repository**: Select `https://github.com/Abukhadeejah/ComemrceNest.git`
4. **Framework**: Next.js (auto-detected)
5. **Root Directory**: Set to `Commercenest/web`
6. **Project Name**: `commercenest-saas`

### Step 2: Configure Build Settings
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm ci`
- **Node.js Version**: 20.x

### Step 3: Environment Variables
Add these variables in Vercel Dashboard:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Multi-tenant Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# Optional: Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_vercel_analytics_id
```

## 🌐 Domain Configuration

### Step 4: Custom Domains
1. **Primary Domain**: `your-app.vercel.app` (default)
2. **Add Custom Domains**:
   - **Senlysh**: `senlysh.com`
   - **Bluebell**: `bluebell.com`
   - **Future tenants**: `tenant-name.com`

### Step 5: DNS Configuration
For each custom domain, add CNAME record:
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
TTL: 3600
```

## 🗄️ Database Setup

### Step 6: Supabase Production
1. **Create Production Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create new project for production
   - Note down project URL and keys

2. **Run Migrations**:
   ```bash
   # Apply all migrations to production
   supabase db push --project-ref your-production-project-ref
   ```

3. **Seed Tenant Data**:
   ```sql
   -- Insert tenants
   INSERT INTO tenants (id, name, slug, created_at) VALUES 
   ('550e8400-e29b-41d4-a716-446655440001', 'Senlysh', 'senlysh', NOW()),
   ('550e8400-e29b-41d4-a716-446655440002', 'Bluebell Interiors', 'bluebell', NOW());

   -- Insert tenant domains
   INSERT INTO tenant_domains (tenant_id, hostname, is_primary) VALUES 
   ('550e8400-e29b-41d4-a716-446655440001', 'senlysh.com', true),
   ('550e8400-e29b-41d4-a716-446655440002', 'bluebell.com', true);
   ```

## 🚀 Deployment

### Step 7: Deploy to Vercel
1. **Trigger Deployment**: Click "Deploy" in Vercel dashboard
2. **Monitor Build**: Watch build logs for any errors
3. **Verify Deployment**: Check deployment URL

### Step 8: Post-Deployment Verification
- [ ] **Homepage Access**: Verify each tenant homepage loads
- [ ] **Admin Access**: Test admin authentication
- [ ] **Product Pages**: Verify PLP/PDP functionality
- [ ] **Checkout Flow**: Test Razorpay integration
- [ ] **SEO**: Verify canonical URLs and meta tags
- [ ] **Images**: Verify Unsplash images load correctly
- [ ] **Responsive**: Test on mobile and desktop

## 🔍 Troubleshooting

### Common Issues & Solutions

#### Build Failures
- **Issue**: Environment variables missing
- **Solution**: Check all required variables are set in Vercel dashboard

#### Domain Issues
- **Issue**: Custom domain not working
- **Solution**: Verify DNS records point to `cname.vercel-dns.com`

#### Database Errors
- **Issue**: Supabase connection failing
- **Solution**: Check production database URL and keys

#### Image Loading Issues
- **Issue**: Unsplash images not loading
- **Solution**: Verify `images.unsplash.com` is in `next.config.ts`

## 📊 Monitoring Setup

### Step 9: Analytics & Monitoring
1. **Vercel Analytics**: Enable in project settings
2. **Error Tracking**: Configure Sentry if needed
3. **Performance**: Monitor Core Web Vitals
4. **Uptime**: Set up uptime monitoring

## 🔐 Security Verification

### Step 10: Security Checklist
- [ ] **HTTPS**: All domains have SSL certificates
- [ ] **Headers**: Security headers are applied
- [ ] **Environment Variables**: Secrets are properly encrypted
- [ ] **RLS Policies**: Database security policies active
- [ ] **Admin Access**: Admin routes are properly protected

## 📈 Performance Optimization

### Step 11: Performance Verification
- [ ] **Core Web Vitals**: LCP, FID, CLS within budget
- [ ] **Image Optimization**: Images are optimized
- [ ] **Bundle Size**: JavaScript bundle is reasonable
- [ ] **Caching**: Static pages are cached properly

## 🎯 Client Handover

### Step 12: Client Delivery
- [ ] **Deployment URLs**: Provide client with live URLs
- [ ] **Admin Access**: Set up client admin accounts
- [ ] **Documentation**: Provide client documentation
- [ ] **Training**: Schedule client training session

## 📝 Post-Deployment Tasks

### Ongoing Maintenance
- [ ] **Regular Updates**: Keep dependencies updated
- [ ] **Security Patches**: Monitor for security updates
- [ ] **Performance Monitoring**: Track performance metrics
- [ ] **Backup Strategy**: Regular database backups
- [ ] **Support**: Provide ongoing client support

## 💰 Cost Monitoring

### Vercel Pro Usage
- **Monthly Cost**: $20/month
- **Bandwidth**: Monitor usage
- **Build Minutes**: Track build time
- **Function Calls**: Monitor API usage

### Optimization Opportunities
- **Image Optimization**: Reduce bandwidth usage
- **Caching**: Reduce function calls
- **Bundle Size**: Optimize JavaScript bundles
- **CDN**: Leverage Vercel's global CDN

---

## 📞 Support Contacts

- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Supabase Support**: [supabase.com/support](https://supabase.com/support)
- **Razorpay Support**: [razorpay.com/support](https://razorpay.com/support)

## 🔄 Rollback Plan

If deployment fails:
1. **Revert Code**: Rollback to previous working commit
2. **Redeploy**: Trigger new deployment
3. **Investigate**: Identify and fix the issue
4. **Test**: Verify fix works locally
5. **Redeploy**: Deploy fixed version
