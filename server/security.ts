import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request, Response } from 'express';
import { z, ZodSchema } from 'zod';

// ─── Rate Limiting ──────────────────────────────────────────────────────────
// OWASP: Protect against brute-force, credential stuffing, and DoS attacks

// Standard 429 response format
const rateLimitHandler = (req: Request, res: Response) => {
  res.status(429).json({
    message: 'Too many requests. Please try again later.',
    retryAfter: res.getHeader('Retry-After'),
  });
};

// Key generator: use userId for authenticated users, IPv6-safe IP fallback for guests
function userAwareKeyGenerator(req: Request): string {
  const user = (req as any).user;
  if (user?.id) return `user_${user.id}`;
  return ipKeyGenerator(req.ip!);
}

// Global rate limiter — applies to all /api routes
// 200 requests per 15-minute window per IP (uses default IP-based key generator)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => {
    return req.path === '/api/shop/webhook' || req.path === '/api/donations/webhook';
  },
});

// Strict limiter for authentication endpoints (login, register, password reset)
// 10 attempts per 15-minute window per IP (uses default IP-based key generator)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// Payment endpoint limiter — prevents abuse of Stripe payment intent creation
// 20 requests per 15-minute window per user/IP
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userAwareKeyGenerator,
  handler: rateLimitHandler,
});

// File upload limiter — prevents storage exhaustion
// 30 uploads per 15-minute window per user/IP
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userAwareKeyGenerator,
  handler: rateLimitHandler,
});

// Write operations limiter (POST/PUT/DELETE on general endpoints)
// 60 requests per 15-minute window per user/IP
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userAwareKeyGenerator,
  handler: rateLimitHandler,
});


// ─── Input Validation & Sanitization ────────────────────────────────────────
// OWASP: Validate all inputs server-side, reject unexpected fields

// Sanitize a string: trim whitespace, collapse internal whitespace
function sanitizeString(val: string): string {
  return val.trim().replace(/\s+/g, ' ');
}

// Reusable Zod schemas for common field types with length limits
export const safeString = (maxLen: number = 500) =>
  z.string().max(maxLen).transform(sanitizeString);

export const safeEmail = z
  .string()
  .email('Invalid email format')
  .max(254)
  .transform((v) => v.trim().toLowerCase());

export const safeUsername = z
  .string()
  .min(2, 'Username must be at least 2 characters')
  .max(50, 'Username must be at most 50 characters')
  .regex(/^[a-zA-Z0-9_.-]+$/, 'Username may only contain letters, numbers, underscores, dots, and hyphens')
  .transform((v) => v.trim());

export const safePassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters');

export const safeId = z.coerce.number().int().positive();

export const safePagination = z.object({
  page: z.coerce.number().int().min(1).max(1000).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const safeAmount = z.coerce
  .number()
  .positive('Amount must be positive')
  .max(1_000_000, 'Amount exceeds maximum');

// Validate request body against a Zod schema; returns parsed data or sends 400
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: Function) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    req.body = result.data;
    next();
  };
}

// Validate request query against a Zod schema
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: Function) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({ message: 'Invalid query parameters', errors });
    }
    (req as any).validatedQuery = result.data;
    next();
  };
}

// Validate route params
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: Function) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({ message: 'Invalid parameters' });
    }
    (req as any).validatedParams = result.data;
    next();
  };
}


// ─── Validation Schemas for Key Endpoints ───────────────────────────────────

// Auth: Login
export const loginSchema = z.object({
  username: safeString(100),
  password: z.string().min(1).max(128),
}).strict();

// Auth: Registration
export const registerSchema = z.object({
  username: safeUsername,
  password: safePassword,
  email: safeEmail,
  firstName: safeString(100).optional(),
  lastName: safeString(100).optional(),
}).strict();

// Donation payment intent
export const donationPaymentIntentSchema = z.object({
  amount: safeAmount,
  campaignId: z.coerce.number().int().positive(),
  tip: z.coerce.number().min(0).max(1_000_000).optional().default(0),
  guestInfo: z.object({
    firstName: safeString(100),
    lastName: safeString(100),
    email: safeEmail,
  }).optional(),
}).strict();

// Shop payment intent
export const shopPaymentIntentSchema = z.object({
  priceId: z.string().min(1).max(200),
  quantity: z.coerce.number().int().min(1).max(100).optional().default(1),
}).strict();

// Shop order creation
export const shopOrderSchema = z.object({
  paymentIntentId: z.string().min(1).max(200),
  priceId: z.string().min(1).max(200),
  quantity: z.coerce.number().int().min(1).max(100),
  shippingAddress: z.object({
    name: safeString(200),
    email: safeEmail,
    phone: z.string().max(20).optional(),
    line1: safeString(200),
    line2: safeString(200).optional(),
    city: safeString(100),
    state: safeString(50),
    postalCode: z.string().max(20),
    country: z.string().max(2).default('US'),
  }).strict(),
}).strict();

// Profile update
export const profileUpdateSchema = z.object({
  username: safeString(50).optional(),
  firstName: safeString(100).optional(),
  lastName: safeString(100).optional(),
  email: safeEmail.optional(),
  bio: safeString(2000).optional(),
  profileImage: safeString(500).optional(),
  profileImageUrl: safeString(500).optional(),
  bannerImage: safeString(500).optional(),
  bannerImageUrl: safeString(500).optional(),
  location: safeString(200).optional(),
  website: z.string().url().max(500).optional().or(z.literal('')),
  phone: safeString(20).optional(),
  birthday: safeString(50).optional(),
  socialLinks: z.record(z.string().max(500)).optional(),
  userType: safeString(50).optional(),
}).passthrough();

// Privacy settings update
export const privacySettingsSchema = z.object({
  isPrivate: z.boolean().optional(),
  showEmail: z.boolean().optional(),
  showPhone: z.boolean().optional(),
  showBirthday: z.boolean().optional(),
  showLocation: z.boolean().optional(),
}).strict();

// Campaign creation
export const campaignCreateSchema = z.object({
  title: safeString(200),
  description: safeString(10000),
  goal: safeAmount,
  category: safeString(100).optional(),
  mediaUrl: z.string().max(500).optional(),
  endDate: z.string().max(50).optional(),
}).passthrough();

// Platform post creation
export const platformPostSchema = z.object({
  content: safeString(5000).optional(),
  mediaUrl: z.string().max(500).optional().or(z.literal('')),
  mediaType: z.enum(['text', 'image', 'video', 'youtube_channel']).optional(),
  youtubeChannelId: z.string().max(100).optional().or(z.literal('')),
  youtubeChannelTitle: z.string().max(200).optional().or(z.literal('')),
  youtubeChannelThumbnail: z.string().max(500).optional().or(z.literal('')),
  youtubeSubscriberCount: z.string().max(50).optional().or(z.literal('')),
}).passthrough();

// Comment creation
export const commentSchema = z.object({
  content: safeString(2000),
  parentId: z.coerce.number().int().positive().optional(),
}).strict();

// Group chat queue creation
export const groupChatQueueSchema = z.object({
  intention: z.enum(['prayer', 'bible_study', 'evangelizing', 'fellowship', 'worship']),
  topic: safeString(200).optional(),
  description: safeString(1000).optional(),
  maxMembers: z.coerce.number().int().min(2).max(50).optional().default(5),
}).passthrough();

// Group chat message
export const groupChatMessageSchema = z.object({
  content: safeString(5000),
}).strict();

// Direct chat message
export const directChatMessageSchema = z.object({
  content: safeString(5000),
}).strict();

// Direct chat creation
export const directChatCreateSchema = z.object({
  otherUserId: z.string().min(1).max(100),
}).strict();

// Business profile creation
export const businessProfileCreateSchema = z.object({
  businessName: safeString(200),
  description: safeString(5000).optional(),
  industry: safeString(100).optional(),
  website: z.string().url().max(500).optional().or(z.literal('')),
  phone: safeString(20).optional(),
  email: safeEmail.optional(),
  address: safeString(500).optional(),
  city: safeString(100).optional(),
  state: safeString(50).optional(),
  zipCode: safeString(20).optional(),
  logo: z.string().max(500).optional(),
}).passthrough();

// Manual donation
export const manualDonationSchema = z.object({
  campaignId: z.coerce.number().int().positive(),
  amount: safeAmount,
  donorName: safeString(200).optional(),
  donorEmail: safeEmail.optional(),
  tip: z.coerce.number().min(0).max(1_000_000).optional().default(0),
  paymentIntentId: z.string().max(200).optional(),
}).strict();
