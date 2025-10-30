# Christ Collective - Replit Project Documentation

## Overview
Christ Collective is a full-stack web application aimed at uniting Christians globally through faith, community, and collaborative purpose. The platform enables donations to charitable campaigns, fosters business networking among Christian professionals, and provides sponsorship opportunities for Christian content creators. It is designed to be a comprehensive solution for community building, fundraising, and professional connections within the Christian community.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### Frontend
-   **Framework**: React 18 with TypeScript
-   **Build Tool**: Vite
-   **Styling**: Tailwind CSS with shadcn/ui and Radix UI
-   **Routing**: Wouter
-   **State Management**: TanStack Query (React Query)
-   **Forms**: React Hook Form with Zod validation

### Backend
-   **Runtime**: Node.js with Express.js
-   **Language**: TypeScript
-   **Authentication**: Passport.js (local strategy, session-based)
-   **Session Storage**: Express sessions with PostgreSQL store
-   **API Integration**: YouTube, TikTok, Instagram APIs
-   **Email Service**: Resend (production), Ethereal (development) for transactional emails
-   **File Uploads**: Multer

### Data Storage
-   **Database**: PostgreSQL (Neon serverless hosting)
-   **ORM**: Drizzle ORM
-   **Migrations**: Drizzle Kit
-   **Connection**: @neondatabase/serverless for connection pooling

### UI/UX Decisions
-   Platform detects environment (iOS/Android app vs. web browser) for tailored UX.
-   Mobile app features a dedicated mobile authentication flow, hidden footer, and bottom navigation.
-   Consistent black/gold color scheme (`#D4AF37`) for branding across the application.
-   Unified authentication system using AuthExperience component with platform-specific layouts (desktop and mobile variants).

### Key Features
-   **Unified Authentication System**: Single consolidated auth flow for all entry points. Local username/password, session-based, admin roles, profile management, password reset via email with secure token-based flow. All unauthenticated pages redirect to `/auth` (web) or `/auth/mobile` (native app) with query parameter support for post-login redirect.
-   **Campaign Management**: Creation, editing, media uploads, goal tracking, admin approval, search/filtering.
-   **Payment Processing**: Stripe integration for donations and membership subscriptions.
-   **Business Networking**: Business profiles, membership tiers, industry-based filtering.
-   **Content Creator Platform**: Creator profiles, social media integration (YouTube, TikTok, Instagram verification), sponsorship applications.
-   **Platform Posts**: Users can create posts with multiple media types (image, video, text, YouTube channel links). YouTube channel posts display as clickable cards that open the channel in a new tab, perfect for sharing exclusive or unlisted channels with the community.
-   **Administrative Dashboard**: Campaign/user management, donation tracking, sponsorship review.
-   **Notification System**: Real-time notifications for user interactions (follows, likes, comments, chat), with read/unread status and smart self-notification prevention.
-   **Mobile Optimization**: Capacitor platform detection, mobile-optimized authentication flow, safe area padding, and specific UI adjustments for mobile devices.

### Deployment Strategy
-   **Development**: Local environment with HMR, SQLite/PostgreSQL, Vite dev server.
-   **Production**: Optimized static assets, Express server, automatic database migrations, environment-specific configuration.
-   **Database Management**: Drizzle migrations, automated backups, connection pooling, query optimization.

## External Dependencies
-   **Payment Processing**: Stripe, Stripe Elements
-   **Social Media APIs**: YouTube Data API, Apify (TikTok/Instagram scraping), custom scrapers
-   **Email Services**: Resend (production & development), Ethereal (development fallback)
-   **UI and Styling**: Tailwind CSS, shadcn/ui, Radix UI, Lucide React (icons)
-   **Development Tools**: TypeScript, ESLint, Prettier, Vite

## Password Reset Feature
### Overview
Secure password reset functionality with email-based token verification. Users can request a password reset link from the login page, receive an email with a secure token, and set a new password which automatically logs them in.

### Security Implementation
-   **Token Generation**: 32-byte cryptographically secure random tokens using `crypto.randomBytes`
-   **Token Storage**: Tokens are hashed with SHA256 before database storage to prevent compromise if database is accessed
-   **Token Expiry**: Reset tokens expire after 1 hour
-   **One-Time Use**: Tokens are marked as used after successful password reset
-   **URL Safety**: Tokens are URL-encoded in email links to prevent truncation issues
-   **Email Verification**: Password reset only works for registered email addresses (with anti-enumeration protection)

### Database Schema
`passwordResetTokens` table:
-   `id`: Serial primary key
-   `userId`: Reference to users table
-   `email`: User's email address
-   `token`: SHA256-hashed reset token
-   `expiresAt`: Token expiration timestamp (1 hour from creation)
-   `used`: Boolean flag to prevent token reuse

### User Flow
1. User clicks "Forgot Password?" on login page
2. User enters email address in modal dialog
3. System generates secure token, hashes it, stores it in database
4. Email sent with reset link containing plaintext token
5. User clicks link, navigated to `/reset-password?token=xxx`
6. User enters new password (6+ characters) twice
7. System validates token (hashes incoming token, checks database)
8. Password updated, token marked as used, user automatically logged in
9. User redirected to feed page

### API Endpoints
-   `POST /api/auth/forgot-password`: Accepts email, generates token, sends reset email
-   `POST /api/auth/reset-password`: Validates token, updates password, creates session

### Frontend Components
-   **AuthExperience**: Shared authentication component with desktop and mobile variants, contains login/register forms and "Forgot Password?" modal
-   **AuthPage**: Desktop authentication page at `/auth` route
-   **MobileAuthPage**: Mobile authentication page at `/auth/mobile` route  
-   **ResetPassword**: Dedicated page for password reset with dual password fields

### Known Limitations
-   Old sessions are not automatically invalidated when password is reset (MemoryStore limitation)
-   New login session is created after reset, but existing sessions remain valid until expiry

## Mobile Session Management (Capacitor WebView Fix)
### Overview
Capacitor's WebView doesn't reliably persist HTTP-only cookies, which broke session management for the mobile app. Implemented a custom session header solution that works across both web and mobile platforms.

### Implementation
**Backend Changes:**
- Modified `/api/login` and `/api/register` endpoints to return `sessionId` in response
- Added middleware to accept `X-Session-ID` custom header and restore sessions from session store
- Updated CORS to allow `X-Session-ID` header from mobile origins

**Frontend Changes:**
- Store `sessionId` in `localStorage` when login/register succeeds
- Send `X-Session-ID` header with all API requests (GET and POST)
- Clear `sessionId` from `localStorage` on logout

### Authentication Flow
1. **Login/Register**: Backend creates session using `req.session.save()` to ensure persistence, returns `sessionId` in response body
2. **Client Storage**: Frontend stores `sessionId` in `localStorage` (for mobile apps)
3. **Subsequent Requests**: 
   - Mobile apps: Send `X-Session-ID` header with stored sessionId
   - Web browsers: Send standard session cookies automatically
4. **Session Restoration**: 
   - Backend middleware converts X-Session-ID header to cookie format for mobile
   - Standard cookie sessions work for web browsers
5. **Logout**: Frontend clears `localStorage`, backend destroys session

### Critical Auth Fixes (Oct 30, 2025)
**Problem:** Users logging in for 2-3 seconds then immediately logged out
**Root Cause:** Race condition - after login, frontend was calling `refetch()` with 300ms-1000ms delay, which created a NEW session instead of using the logged-in session
**Solution:** 
- Removed unnecessary `refetch()` call after login - immediately use user data from login response
- Added `req.session.save()` callback to ensure session is persisted before responding
- Improved session debugging with detailed logs

### Session Configuration
- **saveUninitialized: false** - Prevents creating empty sessions on every request (critical for preventing immediate logout)
- **resave: false** - Only saves sessions when they change
- **rolling: true** - Refreshes session expiration on each authenticated request
- **maxAge: 1 year** - Sessions persist for 1 year or until explicit logout
- **httpOnly: true** - Prevents XSS attacks by blocking JavaScript access to session cookies
- **secure: production only** - Enforces HTTPS cookies in production, allows HTTP in development
- **sameSite: 'lax'** - Allows cookies for same-site requests (frontend/backend on same domain)
- **domain: undefined** - Let browser determine correct domain for maximum compatibility

### Authentication Flow Consolidation
All login entry points now use a unified authentication system:
- **Single Auth Surface**: All pages redirect unauthenticated users to `/auth` (web) or `/auth/mobile` (native)
- **Redirect Query Parameters**: Pages pass `?redirect=/path` to return users to their intended destination after login (e.g., `/auth?redirect=/create-campaign`)
- **Consistent Login Flow**: AuthPage and MobileAuthPage both use AuthExperience component, ensuring identical authentication logic
- **Platform Detection**: System automatically routes to appropriate auth page based on `isNativeApp()` detection
- **Loading Guards**: All protected pages check `isLoading` before redirecting to prevent spurious redirects during auth query loading
- **Post-Login Navigation**: After successful login, users are redirected to the `redirect` query parameter or "/" (home page) by default
- **Session Propagation**: 400ms delay after login ensures session is set before navigation

**Protected Pages with Auth Guards**:
- ExplorePage → `/auth?redirect=/explore`
- ProfilePage (own profile) → `/auth?redirect=/profile`
- CreateCampaignPage → `/auth?redirect=/donate/create`
- ConnectPage → `/auth?redirect=/connect`

### Debugging
Server logs show session flow:
- `✅ Login successful for: [username]` - Login succeeded
- `📝 Session ID: [id]` - Session created  
- `📱 Mobile app session ID detected: [id]` - Session ID received via header
- `✅ Session restored from header for user: [username]` - Session successfully restored
- `❌ User not authenticated` - Session not found or invalid
