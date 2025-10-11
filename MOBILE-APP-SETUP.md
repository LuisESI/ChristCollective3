# Mobile App Setup Guide

## 🔧 Backend API Configuration (CRITICAL!)

The mobile app needs to connect to your backend API. Here's how to set it up:

### Step 1: Deploy Your Backend

Your backend must be accessible from the mobile app. Options:

#### Option A: Replit Deployment (Recommended)
1. Click "Deploy" in Replit
2. Your backend will be at: `https://[your-repl-name].[username].replit.dev`
3. Use this URL as your API endpoint

#### Option B: Other Hosting
- Deploy to any hosting service (Heroku, Railway, Render, etc.)
- Use the deployed URL

### Step 2: Configure API URL in CodeMagic

In your `codemagic.yaml`, update the `VITE_API_URL`:

```yaml
environment:
  vars:
    NODE_VERSION: 18
    VITE_API_URL: https://[your-actual-backend-url]  # <-- UPDATE THIS!
```

**Example:**
```yaml
VITE_API_URL: https://christcollective-app.replit.dev
```

### Step 3: Add to CodeMagic Environment Variables

1. Go to CodeMagic → Your App → Environment variables
2. Add: `VITE_API_URL` = `https://your-backend-url`
3. Add other required variables:
   - `VITE_STRIPE_PUBLIC_KEY`
   - `STRIPE_SECRET_KEY`
   - `DATABASE_URL`

## 📱 Mobile App Features Fixed

### ✅ Navigation
- **Bottom Navigation:** Now visible for all users (authenticated and unauthenticated)
- **Default Page:** Mobile users start at `/feed` instead of homepage
- **Icons:** Feed, Explore, Create, Connect, Profile

### ✅ Authentication
- **Sign In/Sign Up:** Works at `/auth/mobile`
- **Auth Guards:** Interactive features require login
- **Browse Mode:** Users can view feed without logging in

### ✅ Platform Detection
- Automatically detects iOS/Android vs Web
- Shows mobile-optimized UI on native apps
- Shows traditional UI on web

## 🚀 Testing Checklist

After configuring the API URL and rebuilding:

- [ ] App loads feed page by default
- [ ] Bottom navigation is visible
- [ ] Can view posts without logging in
- [ ] Sign in/Sign up works
- [ ] Can like, comment, share (after login)
- [ ] Data loads from backend
- [ ] Images display correctly

## ⚠️ Common Issues

### Issue: No Data Loading
**Cause:** `VITE_API_URL` not set or incorrect
**Fix:** 
1. Deploy your backend
2. Update `VITE_API_URL` in CodeMagic
3. Rebuild the app

### Issue: Authentication Fails
**Cause:** CORS or session cookies not working
**Fix:** Ensure backend allows requests from mobile app origin

### Issue: Bottom Nav Missing
**Cause:** Platform detection not working
**Fix:** Verify Capacitor is properly configured

## 🔄 Build Process

After updating the API URL:

```bash
# 1. Update code
git add .
git commit -m "Configure mobile API URL"
git push origin main

# 2. CodeMagic will automatically:
#    - Pull latest code
#    - Use VITE_API_URL from environment
#    - Build iOS Simulator app
#    - Build Android APK
#    - Email you the artifacts
```

## 📝 Environment Variables Summary

Set these in CodeMagic Environment Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://christcollective.replit.dev` |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe public key | `pk_test_...` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://...` |
| `APIFY_API_TOKEN` | Social media API (optional) | `apify_api_...` |

## 🎯 Next Steps

1. ✅ Deploy your backend (Replit or other hosting)
2. ✅ Get the backend URL
3. ✅ Update `VITE_API_URL` in CodeMagic environment variables
4. ✅ Update `codemagic.yaml` with the URL
5. ✅ Push to GitHub
6. ✅ Build in CodeMagic
7. ✅ Test the mobile app!

---

**Important:** The mobile app WILL NOT work without a proper backend URL configured!
