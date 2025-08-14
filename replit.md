# Christ Collective - Replit Project Documentation

## Overview

Christ Collective is a full-stack web application designed to unite Christians worldwide through faith, community, and purpose-driven collaboration. The platform facilitates donations to charitable campaigns, business networking among Christian professionals, and sponsorship opportunities for content creators. Built with modern web technologies, the application provides a comprehensive solution for community building, fundraising, and professional connections within the Christian community.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with custom styling
- **Forms**: React Hook Form with Zod validation
- **Payments**: Stripe integration for secure payment processing

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and session-based auth
- **Session Storage**: Express sessions with PostgreSQL store
- **API Integration**: YouTube, TikTok, and Instagram APIs for content creator verification
- **Email Service**: Nodemailer with multiple provider support
- **File Uploads**: Multer for handling media uploads

### Data Storage
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM with schema-first approach
- **Migrations**: Drizzle Kit for database schema management
- **Connection**: Connection pooling with @neondatabase/serverless

## Key Components

### Authentication System
- Local username/password authentication with bcrypt hashing
- Session-based authentication with persistent cookies
- Admin role management for platform administration
- Profile management with user preferences and settings

### Campaign Management
- Create, edit, and manage donation campaigns
- Image and video upload support with media galleries
- Goal tracking with real-time progress updates
- Admin approval workflow for campaign publication
- Search and filtering capabilities

### Payment Processing
- Stripe integration for secure payment handling
- Support for one-time donations with optional tips
- Membership tier subscriptions for business networking
- Payment intent confirmation and success handling

### Business Networking
- Business profile creation and management
- Membership tier system with different access levels
- Industry-based filtering and search functionality
- Professional networking features

### Content Creator Platform
- Creator profile management with social media integration
- Sponsorship application system
- Multi-platform support (YouTube, TikTok, Instagram)
- Real-time social media data fetching and verification

### Administrative Dashboard
- Campaign approval and management
- User administration and role management
- Donation tracking and analytics
- Sponsorship application review

## Data Flow

### User Registration/Authentication Flow
1. User submits registration form with validation
2. Password is hashed using scrypt algorithm
3. User record is created in PostgreSQL database
4. Session is established with secure cookie
5. User is redirected to appropriate dashboard

### Campaign Creation Flow
1. Authenticated user creates campaign with media uploads
2. Campaign data is validated and stored with pending status
3. Admin receives notification for review
4. Upon approval, campaign becomes publicly visible
5. Users can search and donate to approved campaigns

### Donation Processing Flow
1. User selects campaign and enters donation amount
2. Stripe payment intent is created with campaign details
3. Payment form is rendered with Stripe Elements
4. Payment confirmation triggers donation record creation
5. Success page displays with donation receipt

### Social Media Integration Flow
1. Creator submits social media profile URLs
2. Backend services extract usernames and fetch profile data
3. API calls to respective platforms retrieve follower counts and metrics
4. Data is cached and displayed in creator profiles
5. Periodic updates refresh social media statistics

## External Dependencies

### Payment Processing
- **Stripe**: Payment processing, subscription management
- **Stripe Elements**: Secure payment form components

### Social Media APIs
- **YouTube Data API**: Channel and video information retrieval
- **Apify**: TikTok and Instagram data scraping services
- **Custom scrapers**: Fallback data collection methods

### Email Services
- **Nodemailer**: Email sending functionality
- **SendGrid**: Production email delivery service
- **Ethereal**: Development email testing

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built accessible component library
- **Radix UI**: Headless UI primitives
- **Lucide React**: Icon library

### Development Tools
- **TypeScript**: Type safety and developer experience
- **ESLint/Prettier**: Code formatting and linting
- **Vite**: Development server and build tool

## Deployment Strategy

### Development Environment
- Local development with hot module replacement
- SQLite/PostgreSQL for local database testing
- Environment variable configuration for API keys
- Vite dev server with proxy configuration

### Production Deployment
- Build process generates optimized static assets
- Express server serves both API and static files
- Database migrations run automatically on deployment
- Environment-specific configuration management

### Database Management
- Schema versioning with Drizzle migrations
- Automated backup and recovery procedures
- Connection pooling for performance optimization
- Query optimization and indexing strategies

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- July 02, 2025. Initial setup
- July 21, 2025. Consolidated mobile and desktop profile pages into single unified creator profile page at `/profile` route with creator-focused layout, social platform integration, privacy settings, and mobile-responsive design
- July 25, 2025. Added optional user type selection during signup with smart guidance system. Users can select Creator, Business Owner, or Ministry roles, which automatically directs them to appropriate onboarding flows with personalized welcome messages and feature guidance.
- July 31, 2025. Implemented role-based create capabilities with different permissions for regular users, creators, and ministry profiles. Regular users can create campaigns, profiles, and posts. Creator profiles gain exclusive access to share content from YouTube, TikTok, and Instagram via API integration. Ministry profiles have full access to all features plus exclusive event creation capabilities.
- August 02, 2025. **CRITICAL BUG IDENTIFIED**: Follow system incorrectly links all profiles from same user account - each profile type (User, Business, Ministry) should be sovereign and followed independently. Added businessFollows table to schema and began implementing separate follow systems for each profile type to ensure sovereignty.
- August 12, 2025. **AUTOMATIC FOLLOWING SYSTEM IMPLEMENTED**: All users (new and existing) now automatically follow Christ Collective Ministry profile by default. New users are automatically added to follow Christ Collective Ministry during registration. Existing users were bulk-updated via SQL to ensure 100% of community members receive ministry content updates. This ensures maximum reach for organizational announcements and community building content.
- August 14, 2025. **COMPREHENSIVE NOTIFICATION SYSTEM COMPLETED**: Implemented complete real-time notification system with database triggers for all user interactions. System creates notifications for follows, likes, comments, and chat messages. Includes smart self-notification prevention (users don't get notified for their own actions), personalized notification messages, proper icon system, and test functionality. All notifications display in unified notification center with read/unread status and bulk management capabilities.