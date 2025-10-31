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

### Connect Page Black Screen Fix
**Problem:** After logging in through the Connect section in mobile app, users saw a black screen.

**Root Cause:** Race condition - ConnectPage's auth check ran before React Query finished propagating user data after login, causing redirect loop.

**Solution:** Implemented sessionStorage-based login detection with staged authentication:
1. AuthExperience sets `justLoggedIn` flag in sessionStorage on successful login
2. ConnectPage checks for this flag on mount
3. If flag exists (fresh login): wait 1000ms before checking auth to allow React Query to propagate
4. If flag doesn't exist (normal navigation): check auth immediately

**Implementation:**
```typescript
// In AuthExperience.tsx - on login success
sessionStorage.setItem('justLoggedIn', 'true');

// In ConnectPage.tsx - staged auth check
const justLoggedIn = sessionStorage.getItem('justLoggedIn') === 'true';
if (justLoggedIn) {
  sessionStorage.removeItem('justLoggedIn');
  setTimeout(() => setAuthCheckComplete(true), 1000);
} else {
  setAuthCheckComplete(true);
}
```

**Benefits:**
- ✅ No more black screen after login through Connect section
- ✅ Smooth transition from login to Connect page
- ✅ Prevents race condition between login and auth check
- ✅ Only delays auth check after fresh login (no delay for normal navigation)
- ✅ Generous 1-second delay ensures React Query has time to update