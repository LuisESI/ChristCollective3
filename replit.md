# Christ Collective - Replit Project Documentation

## Overview
Christ Collective is a full-stack web application aimed at uniting Christians globally. It facilitates charitable donations, professional networking among Christian professionals, and sponsorship for Christian content creators. The platform integrates community building, fundraising, and professional connections, featuring a unified authentication system, campaign management, Stripe payment processing, business networking, a content creator platform with social media integration, and an administrative dashboard. The project seeks to create a comprehensive digital ecosystem for the Christian community.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### UI/UX Decisions
The platform offers a tailored user experience for both mobile apps (iOS/Android) and web browsers, including platform-specific authentication flows and navigation patterns. A consistent black and gold (`#D4AF37`) color scheme is used throughout, emphasizing a dark theme with gold accents for primary actions and highlights. Key navigation elements include a bottom navigation bar for mobile with Feed, Explore, Create, Connect, and Profile sections. Design elements like the Profile page feature cover photo gradients, overlapping avatars with gold rings, and gold-colored statistics.

### Technical Implementations
**Frontend:** Developed with React 18 and TypeScript, using Vite for building. Styling is handled with Tailwind CSS, shadcn/ui, and Radix UI. Wouter manages routing, TanStack Query (React Query) for state, and React Hook Form with Zod for form validation. Capacitor is used for mobile optimization, including platform detection and helper functions for image URLs and API calls.

**Backend:** Built with Node.js and Express.js in TypeScript. Passport.js handles session-based authentication, with session data stored in PostgreSQL. File uploads are processed via Multer to Replit Object Storage (Google Cloud Storage). Secure, email-based password reset functionality is implemented with token verification and hashing. Security measures include robust rate limiting, Zod-based input validation, and secure handling of API keys and secrets.

**Data Storage:** Utilizes PostgreSQL (Neon serverless hosting) with Drizzle ORM and Drizzle Kit for migrations. Connection pooling is managed by `@neondatabase/serverless`.

### Feature Specifications
-   **Unified Authentication System**: Centralized user management with admin roles and password recovery.
-   **Campaign Management**: Tools for creating, managing, and tracking charitable campaigns with media uploads and admin approval.
-   **Payment Processing**: Integration with Stripe for donations and subscriptions.
-   **Business Networking**: Business profiles, membership tiers, and industry-based filtering.
-   **Content Creator Platform**: Profiles for creators, social media integration (YouTube, TikTok, Instagram), and sponsorship opportunities.
-   **Platform Posts**: Users can create multi-media posts (image, video, text, YouTube links).
-   **Administrative Dashboard**: Comprehensive tools for managing users, campaigns, donations, and sponsorships.
-   **Notification System**: Real-time notifications with read/unread status.
-   **E-commerce Shop**: Product management, image uploads, variants, and Stripe integration for secure checkout. Includes featured product functionality. The e-commerce system implements robust payment safety practices including no raw card data storage, idempotency, server-side verification, webhook deduplication, signature verification, and a comprehensive audit trail.
-   **Word of the Day Feature**: Displays a daily Bible verse on the FeedPage, selected deterministically from a curated list.
-   **Settings Page Overhaul**: A comprehensive settings interface with sections for Account, Notifications, Privacy, App preferences, and Support.
-   **AI Content Moderation**: Automated content moderation using OpenAI Moderation API (text) and GPT-4o-mini Vision (images). Posts and comments are checked before publishing. Rejected content returns 400, flagged content returns 202 (posts hidden until admin approval). Admin moderation dashboard at `/admin/moderation` with approve/reject actions. Moderation logs stored in `moderation_logs` table.

### System Design Choices
Deployment strategies include a local development environment with HMR and a Vite dev server, and a production environment with optimized static assets, an Express server, and automated database migrations. Database management emphasizes Drizzle migrations, automated backups, connection pooling, and query optimization.

## External Dependencies
-   **Payment Processing**: Stripe, Stripe Elements
-   **Social Media APIs**: YouTube Data API, Apify (for TikTok/Instagram data)
-   **Email Services**: Resend (production), Ethereal (development)
-   **UI and Styling**: Tailwind CSS, shadcn/ui, Radix UI, Lucide React (icons)
-   **Development Tools**: TypeScript, ESLint, Prettier, Vite