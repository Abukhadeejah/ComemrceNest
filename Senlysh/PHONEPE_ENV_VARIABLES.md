# PhonePe Environment Variables - Complete Setup

## ✅ **Updated .env.local**

```env
# PhonePe Payment Gateway (Standard Checkout)
PHONEPE_MERCHANT_ID=PGTESTPAYUAT86
PHONEPE_SALT_KEY=96434309-7796-489d-8924-ab56988a6076
PHONEPE_SALT_INDEX=1
PHONEPE_ENV=test

# PhonePe API URLs
PHONEPE_PAY_API_URL=https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay
PHONEPE_STATUS_API_URL=https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status
PHONEPE_BASE_URL=https://api-preprod.phonepe.com/apis/pg-sandbox
```

## 📋 **Variable Explanations**

### **Core Credentials**
- `PHONEPE_MERCHANT_ID` - Your merchant identifier from PhonePe dashboard
- `PHONEPE_SALT_KEY` - Secret key for checksum generation
- `PHONEPE_SALT_INDEX` - Version of salt key (usually "1")
- `PHONEPE_ENV` - Environment: "test" or "production"

### **API Endpoints**
- `PHONEPE_PAY_API_URL` - Direct URL for payment creation
- `PHONEPE_STATUS_API_URL` - Direct URL for payment status checks
- `PHONEPE_BASE_URL` - Base URL (fallback if specific URLs not set)

## 🔄 **Environment Switching**

### **Test/UAT Environment (Current)**
```env
PHONEPE_PAY_API_URL=https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay
PHONEPE_STATUS_API_URL=https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status
PHONEPE_BASE_URL=https://api-preprod.phonepe.com/apis/pg-sandbox
PHONEPE_ENV=test
```

### **Production Environment (When Ready)**
```env
PHONEPE_PAY_API_URL=https://api.phonepe.com/apis/hermes/pg/v1/pay
PHONEPE_STATUS_API_URL=https://api.phonepe.com/apis/hermes/pg/v1/status
PHONEPE_BASE_URL=https://api.phonepe.com/apis/hermes
PHONEPE_ENV=production
```

## 🎯 **What's New**

### **Added Functions:**
- ✅ `checkPhonePePaymentStatus()` - Check payment status using Status API
- ✅ Environment-specific API URLs
- ✅ Better error handling and logging

### **Updated Files:**
- ✅ `src/lib/payments/phonepe.ts` - Uses env URLs
- ✅ `.env.local` - Complete PhonePe configuration
- ✅ All imports updated to use single phonepe.ts file

## 🧪 **Ready for Testing**

**Restart your server:**
```bash
npm run dev
```

**Test Senlysh:**
1. Go to `/senlysh/checkout`
2. Should see purple "Pay with PhonePe" button
3. Click and check console logs for detailed API calls

The integration now has all necessary API URLs and status checking functionality! 🚀