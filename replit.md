# Christ Collective - Replit Project Documentation

## Overview
Christ Collective is a full-stack web application designed to unite Christians globally through faith, community, and collaborative purpose. The platform facilitates donations to charitable campaigns, fosters business networking among Christian professionals, and provides sponsorship opportunities for Christian content creators. It aims to be a comprehensive solution for community building, fundraising, and professional connections within the Christian community, featuring a unified authentication system, campaign management, payment processing via Stripe, business networking, a content creator platform with social media integration, and an administrative dashboard.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### UI/UX Decisions
The platform detects the environment (iOS/Android app vs. web browser) for tailored user experience. Mobile apps feature a dedicated authentication flow, hidden footer, and bottom navigation. A consistent black/gold color scheme (`#D4AF37`) is used for branding. A unified authentication system leverages an `AuthExperience` component with platform-specific layouts.

### Technical Implementations
**Frontend:**
-   **Framework**: React 18 with TypeScript
-   **Build Tool**: Vite
-   **Styling**: Tailwind CSS with shadcn/ui and Radix UI
-   **Routing**: Wouter
-   **State Management**: TanStack Query (React Query)
-   **Forms**: React Hook Form with Zod validation
-   **Mobile Optimization**: Capacitor for platform detection and UI adjustments. `getImageUrl()` helper function for correct media loading on mobile. `buildApiUrl()` and `credentials: 'include'` for API calls on mobile profile pages.

**Backend:**
-   **Runtime**: Node.js with Express.js
-   **Language**: TypeScript
-   **Authentication**: Passport.js (local strategy, session-based)
-   **Session Storage**: Express sessions with PostgreSQL store, enhanced for Capacitor WebView by returning `sessionId` in login/register responses and using a custom `X-Session-ID` header for mobile. Session configuration includes `saveUninitialized: false`, `resave: false`, `rolling: true`, `maxAge: 1 year`, `httpOnly: true`, and `secure: production only`.
-   **File Uploads**: Multer, with files served from `public/uploads` via Express static middleware.
-   **Password Reset**: Secure, email-based token verification using 32-byte cryptographically secure tokens, SHA256 hashing for storage, 1-hour expiry, and one-time use.

**Data Storage:**
-   **Database**: PostgreSQL (Neon serverless hosting)
-   **ORM**: Drizzle ORM
-   **Migrations**: Drizzle Kit
-   **Connection**: @neondatabase/serverless for connection pooling

### Feature Specifications
-   **Unified Authentication System**: Centralized login/registration, session-based, admin roles, profile management, password reset. Unauthenticated pages redirect to `/auth` (web) or `/auth/mobile` (native app) with query parameter support for post-login redirect.
-   **Campaign Management**: Creation, editing, media uploads, goal tracking, admin approval, search/filtering.
-   **Payment Processing**: Stripe integration for donations and membership subscriptions.
-   **Business Networking**: Business profiles, membership tiers, industry-based filtering.
-   **Content Creator Platform**: Creator profiles, social media integration (YouTube, TikTok, Instagram verification), sponsorship applications.
-   **Platform Posts**: Users can create posts with multiple media types (image, video, text, YouTube channel links).
-   **Administrative Dashboard**: Campaign/user management, donation tracking, sponsorship review.
-   **Notification System**: Real-time notifications with read/unread status.

### System Design Choices
-   **Deployment**: Development uses local environment with HMR, Vite dev server. Production uses optimized static assets, Express server, automatic database migrations, and environment-specific configuration.
-   **Database Management**: Drizzle migrations, automated backups, connection pooling, query optimization.

## External Dependencies
-   **Payment Processing**: Stripe, Stripe Elements
-   **Social Media APIs**: YouTube Data API, Apify (TikTok/Instagram scraping), custom scrapers
-   **Email Services**: Resend (production & development), Ethereal (development fallback)
-   **UI and Styling**: Tailwind CSS, shadcn/ui, Radix UI, Lucide React (icons)
-   **Development Tools**: TypeScript, ESLint, Prettier, Vite

## Recent Fixes (Oct 31, 2025)

### Profile Pages API Fix
**Problem:** Business, ministry, and creator profiles showed "not found" errors when clicked from explore page in mobile apps.

**Root Cause:** Profile pages used relative URLs (`/api/ministries/${id}`) which don't work on `capacitor://` protocol.

**Solution:** Updated all profile page API calls to use `buildApiUrl()` and `credentials: 'include'`:
- MinistryProfileViewPage
- CreatorProfilePage  
- BusinessProfilePage

**Benefits:**
- ✅ Profiles load correctly in both web and mobile apps
- ✅ Explore page links work properly
- ✅ Follow/unfollow functionality works on mobile

### Connect Page Black Screen Fix (FINAL FIX)
**Problem:** After logging in through the Connect section in mobile app, users saw a black screen instead of the Connect page content.

**Root Cause:** Race condition between login navigation and React Query cache propagation:
1. User logs in successfully
2. MobileAuthPage immediately navigates to `/connect` (400ms timeout)
3. Navigation happens BEFORE React Query propagates user data to all components
4. ConnectPage sees `user = null` and redirects back to login
5. Creates redirect loop or infinite loading state

**Solution:** Two-part fix to ensure React Query data is available before navigation:

**Part 1 - MobileAuthPage:** Wait for actual user data before navigating
```typescript
// In MobileAuthPage.tsx
useEffect(() => {
  if (!isLoading && user) {
    // Only navigate when user data is actually available
    setLocation(redirectTo);
  }
}, [isLoading, user, setLocation, redirectTo]);

const handleLoginSuccess = () => {
  // Don't navigate here - let useEffect handle it when user data is ready
  // The useEffect will trigger when React Query updates the user data
};
```

**Part 2 - ConnectPage:** Show loading state while checking authentication
```typescript
// In ConnectPage.tsx
useEffect(() => {
  if (!isLoading) {
    if (user) {
      setAuthCheckComplete(true); // User authenticated - show content
    } else {
      navigate(`/auth/mobile?redirect=/connect`); // Redirect to login
    }
  }
}, [isLoading, user, navigate]);

// Show loading spinner until auth is confirmed
if (!authCheckComplete || isLoading) {
  return <LoadingSpinner />;
}
```

**How It Works:**
1. Login succeeds → React Query cache updates with user data
2. MobileAuthPage's useEffect detects user is now available
3. MobileAuthPage navigates to `/connect`
4. ConnectPage shows loading spinner
5. ConnectPage's useEffect confirms user exists
6. ConnectPage renders content

**Benefits:**
- ✅ No more black screen or redirect loops
- ✅ Navigation only happens when user data is actually available
- ✅ Loading spinner provides visual feedback during auth check
- ✅ Works reliably across all environments (dev/prod/mobile)
- ✅ Reactive approach - waits for actual data instead of arbitrary delays

### Logout 404 Error Fix
**Problem:** Users couldn't sign out - clicking "Log Out" led to a 404 error in mobile apps.

**Root Cause:** Header component used `<a href="/api/logout">` which tries to navigate to `capacitor://localhost/api/logout` on mobile instead of the actual server.

**Solution:** Updated Header component to use the `logoutMutation` from `useAuth()` instead of direct links:
```typescript
// Desktop dropdown
<DropdownMenuItem onClick={() => logoutMutation.mutate()}>
  Log Out
</DropdownMenuItem>

// Mobile menu
<button onClick={() => logoutMutation.mutate()}>
  Log Out
</button>
```

**Benefits:**
- ✅ Logout works correctly in both web and mobile apps
- ✅ Uses proper API calls with credentials and session management
- ✅ No more 404 errors when signing out