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
-   **Email Service**: Nodemailer
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
-   Reusable AuthForm component with white/gold design for authentication pages.

### Key Features
-   **Authentication System**: Local username/password, session-based, admin roles, profile management.
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
-   **Email Services**: Nodemailer, SendGrid (production), Ethereal (development)
-   **UI and Styling**: Tailwind CSS, shadcn/ui, Radix UI, Lucide React (icons)
-   **Development Tools**: TypeScript, ESLint, Prettier, Vite