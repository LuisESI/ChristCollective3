import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  bio: text("bio"),
  location: varchar("location"),
  phone: varchar("phone"),
  username: varchar("username", { length: 50 }),
  password: varchar("password"),
});

// Note: User relations are defined at the bottom of this file after all tables

// Membership tiers
export const membershipTiers = pgTable("membership_tiers", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  stripePriceId: varchar("stripe_price_id"),
  features: text("features").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Business profiles
export const businessProfiles = pgTable("business_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  companyName: varchar("company_name").notNull(),
  industry: varchar("industry"),
  description: text("description"),
  website: varchar("website"),
  logo: varchar("logo"),
  location: varchar("location"),
  phone: varchar("phone"),
  email: varchar("email"),
  services: text("services").array(),
  membershipTierId: integer("membership_tier_id").references(() => membershipTiers.id),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  isActive: boolean("is_active").default(true),
  networkingGoals: text("networking_goals"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const businessProfilesRelations = relations(businessProfiles, ({ one }) => ({
  user: one(users, {
    fields: [businessProfiles.userId],
    references: [users.id],
  }),
  membershipTier: one(membershipTiers, {
    fields: [businessProfiles.membershipTierId],
    references: [membershipTiers.id],
  }),
}));

// Campaigns for donations
export const campaigns = pgTable("campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  goal: decimal("goal", { precision: 10, scale: 2 }).notNull(),
  currentAmount: decimal("current_amount", { precision: 10, scale: 2 }).default("0"),
  image: varchar("image"),
  additionalImages: text("additional_images").array(),
  video: varchar("video"),
  isActive: boolean("is_active").default(true),
  status: varchar("status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  endDate: timestamp("end_date"),
  slug: varchar("slug").notNull(),
}, (table) => ({
  slugIndex: uniqueIndex("campaigns_slug_idx").on(table.slug),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  user: one(users, {
    fields: [campaigns.userId],
    references: [users.id],
  }),
  donations: many(donations),
}));

// Donations
export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  campaignId: uuid("campaign_id").references(() => campaigns.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  stripePaymentId: varchar("stripe_payment_id"),
  message: text("message"),
  isAnonymous: boolean("is_anonymous").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const donationsRelations = relations(donations, ({ one }) => ({
  user: one(users, {
    fields: [donations.userId],
    references: [users.id],
  }),
  campaign: one(campaigns, {
    fields: [donations.campaignId],
    references: [campaigns.id],
  }),
}));

// Schemas for form validation and inserts
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertCampaignSchema = createInsertSchema(campaigns)
  .omit({ id: true, userId: true, currentAmount: true, createdAt: true, updatedAt: true, slug: true })
  .extend({
    additionalImages: z.array(z.string()).optional(),
    video: z.string().optional()
  });
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

export const insertDonationSchema = createInsertSchema(donations)
  .omit({ id: true, stripePaymentId: true, createdAt: true });
export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type Donation = typeof donations.$inferSelect;

export const insertBusinessProfileSchema = createInsertSchema(businessProfiles)
  .omit({ id: true, userId: true, stripeSubscriptionId: true, isActive: true, createdAt: true, updatedAt: true });
export type InsertBusinessProfile = z.infer<typeof insertBusinessProfileSchema>;
export type BusinessProfile = typeof businessProfiles.$inferSelect;

export type MembershipTier = typeof membershipTiers.$inferSelect;

// Content creators - updated to support multiple platforms
export const contentCreators = pgTable("content_creators", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  platforms: jsonb("platforms").notNull(), // Array of platform objects: {platform, profileUrl, subscriberCount}
  content: text("content").notNull(), // Type of content they create
  audience: varchar("audience"), // Target audience
  bio: text("bio"),
  profileImage: varchar("profile_image"), // Creator's profile image
  isSponsored: boolean("is_sponsored").default(false),
  sponsorshipStartDate: timestamp("sponsorship_start_date"),
  sponsorshipEndDate: timestamp("sponsorship_end_date"),
  sponsorshipAmount: varchar("sponsorship_amount"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Social media posts from content creators
export const socialMediaPosts = pgTable("social_media_posts", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => contentCreators.id),
  postUrl: varchar("post_url").notNull(),
  postTitle: varchar("post_title"),
  postDescription: text("post_description"),
  thumbnailUrl: varchar("thumbnail_url"),
  videoUrl: varchar("video_url"),
  platform: varchar("platform").notNull(),
  viewCount: integer("view_count"),
  likeCount: integer("like_count"),
  commentCount: integer("comment_count"),
  postedAt: timestamp("posted_at"),
  isSponsored: boolean("is_sponsored").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sponsorship applications
export const sponsorshipApplications = pgTable("sponsorship_applications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  platforms: jsonb("platforms").notNull(), // Array of platform objects: {platform, profileUrl, subscriberCount}
  content: text("content").notNull(),
  audience: varchar("audience"),
  message: text("message"),
  status: varchar("status").default("pending").notNull(), // pending, approved, rejected
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ministry profiles
export const ministryProfiles = pgTable("ministry_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  denomination: varchar("denomination"),
  website: varchar("website"),
  logo: varchar("logo"),
  location: varchar("location"),
  address: text("address"),
  phone: varchar("phone"),
  email: varchar("email"),
  socialLinks: jsonb("social_links"), // {facebook, instagram, youtube, etc.}
  isActive: boolean("is_active").default(true),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ministry posts (informational posts, updates, etc.)
export const ministryPosts = pgTable("ministry_posts", {
  id: serial("id").primaryKey(),
  ministryId: integer("ministry_id").notNull().references(() => ministryProfiles.id),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  type: varchar("type").notNull().default("post"), // post, announcement, update
  mediaUrls: text("media_urls").array(), // Array of image/video URLs
  links: jsonb("links"), // Array of external links with titles
  isPublished: boolean("is_published").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ministry events (Bible studies, services, missions, community events)
export const ministryEvents = pgTable("ministry_events", {
  id: serial("id").primaryKey(),
  ministryId: integer("ministry_id").notNull().references(() => ministryProfiles.id),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  type: varchar("type").notNull(), // bible_study, service, mission, community_event, worship, prayer
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  location: varchar("location"),
  address: text("address"),
  isOnline: boolean("is_online").default(false),
  onlineLink: varchar("online_link"),
  maxAttendees: integer("max_attendees"),
  currentAttendees: integer("current_attendees").default(0),
  isPublished: boolean("is_published").default(true),
  requiresRegistration: boolean("requires_registration").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ministry followers (users who follow ministry accounts)
export const ministryFollowers = pgTable("ministry_followers", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  ministryId: integer("ministry_id").notNull().references(() => ministryProfiles.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueFollower: uniqueIndex("unique_ministry_follower").on(table.userId, table.ministryId),
}));

// Event registrations
export const eventRegistrations = pgTable("event_registrations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  eventId: integer("event_id").notNull().references(() => ministryEvents.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueRegistration: uniqueIndex("unique_event_registration").on(table.userId, table.eventId),
}));

// Relations
export const contentCreatorsRelations = relations(contentCreators, ({ one, many }) => ({
  user: one(users, {
    fields: [contentCreators.userId],
    references: [users.id],
  }),
  posts: many(socialMediaPosts),
}));

export const socialMediaPostsRelations = relations(socialMediaPosts, ({ one }) => ({
  creator: one(contentCreators, {
    fields: [socialMediaPosts.creatorId],
    references: [contentCreators.id],
  }),
}));

export const sponsorshipApplicationsRelations = relations(sponsorshipApplications, ({ one }) => ({
  user: one(users, {
    fields: [sponsorshipApplications.userId],
    references: [users.id],
  }),
}));

// Ministry relations
export const ministryProfilesRelations = relations(ministryProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [ministryProfiles.userId],
    references: [users.id],
  }),
  posts: many(ministryPosts),
  events: many(ministryEvents),
  followers: many(ministryFollowers),
}));

export const ministryPostsRelations = relations(ministryPosts, ({ one }) => ({
  ministry: one(ministryProfiles, {
    fields: [ministryPosts.ministryId],
    references: [ministryProfiles.id],
  }),
}));

export const ministryEventsRelations = relations(ministryEvents, ({ one, many }) => ({
  ministry: one(ministryProfiles, {
    fields: [ministryEvents.ministryId],
    references: [ministryProfiles.id],
  }),
  registrations: many(eventRegistrations),
}));

export const ministryFollowersRelations = relations(ministryFollowers, ({ one }) => ({
  user: one(users, {
    fields: [ministryFollowers.userId],
    references: [users.id],
  }),
  ministry: one(ministryProfiles, {
    fields: [ministryFollowers.ministryId],
    references: [ministryProfiles.id],
  }),
}));

export const eventRegistrationsRelations = relations(eventRegistrations, ({ one }) => ({
  user: one(users, {
    fields: [eventRegistrations.userId],
    references: [users.id],
  }),
  event: one(ministryEvents, {
    fields: [eventRegistrations.eventId],
    references: [ministryEvents.id],
  }),
}));

// Add relations to users
export const usersRelations = relations(users, ({ many, one }) => ({
  campaigns: many(campaigns),
  businessProfile: one(businessProfiles, {
    fields: [users.id],
    references: [businessProfiles.userId],
  }),
  contentCreator: one(contentCreators, {
    fields: [users.id],
    references: [contentCreators.userId],
  }),
  sponsorshipApplications: many(sponsorshipApplications),
  ministryProfile: one(ministryProfiles, {
    fields: [users.id],
    references: [ministryProfiles.userId],
  }),
  ministryFollowers: many(ministryFollowers),
  eventRegistrations: many(eventRegistrations),
}));

// Platform schema for sponsorship applications
const platformSchema = z.object({
  platform: z.string().min(1, "Please select a platform"),
  profileUrl: z.string().url("Please provide a valid profile URL"),
  subscriberCount: z.coerce.number().min(0, "Subscriber count must be 0 or greater").optional(),
});

// Schema for creating content creators
export const insertContentCreatorSchema = createInsertSchema(contentCreators)
  .omit({ id: true, isSponsored: true, sponsorshipStartDate: true, 
    sponsorshipEndDate: true, sponsorshipAmount: true, createdAt: true, updatedAt: true })
  .extend({
    platforms: z.array(platformSchema).min(1, "Please add at least one platform"),
  });

// Schema for creating sponsorship applications
export const insertSponsorshipApplicationSchema = createInsertSchema(sponsorshipApplications)
  .omit({ id: true, userId: true, status: true, reviewedAt: true, createdAt: true, updatedAt: true })
  .extend({
    platforms: z.array(platformSchema).min(1, "Please add at least one platform"),
  });

// Schema for creating social media posts
export const insertSocialMediaPostSchema = createInsertSchema(socialMediaPosts)
  .omit({ id: true, creatorId: true, createdAt: true });



export type InsertContentCreator = z.infer<typeof insertContentCreatorSchema>;
export type ContentCreator = typeof contentCreators.$inferSelect;

export type InsertSocialMediaPost = z.infer<typeof insertSocialMediaPostSchema>;
export type SocialMediaPost = typeof socialMediaPosts.$inferSelect;

export type InsertSponsorshipApplication = z.infer<typeof insertSponsorshipApplicationSchema>;
export type SponsorshipApplication = typeof sponsorshipApplications.$inferSelect;

// Ministry schemas
export const insertMinistryProfileSchema = createInsertSchema(ministryProfiles)
  .omit({ id: true, userId: true, isActive: true, isVerified: true, createdAt: true, updatedAt: true })
  .extend({
    socialLinks: z.record(z.string().url()).optional(),
  });

export const insertMinistryPostSchema = createInsertSchema(ministryPosts)
  .omit({ id: true, ministryId: true, createdAt: true, updatedAt: true })
  .extend({
    mediaUrls: z.array(z.string().url()).optional(),
    links: z.array(z.object({
      title: z.string(),
      url: z.string().url(),
    })).optional(),
  });

export const insertMinistryEventSchema = createInsertSchema(ministryEvents)
  .omit({ id: true, ministryId: true, currentAttendees: true, createdAt: true, updatedAt: true })
  .extend({
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
  });

export type InsertMinistryProfile = z.infer<typeof insertMinistryProfileSchema>;
export type MinistryProfile = typeof ministryProfiles.$inferSelect;

export type InsertMinistryPost = z.infer<typeof insertMinistryPostSchema>;
export type MinistryPost = typeof ministryPosts.$inferSelect;

export type InsertMinistryEvent = z.infer<typeof insertMinistryEventSchema>;
export type MinistryEvent = typeof ministryEvents.$inferSelect;

export type MinistryFollower = typeof ministryFollowers.$inferSelect;
export type EventRegistration = typeof eventRegistrations.$inferSelect;
