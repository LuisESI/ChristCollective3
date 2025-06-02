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

// Content creators
export const contentCreators = pgTable("content_creators", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  platform: varchar("platform").notNull(), // YouTube, Instagram, TikTok, etc.
  profileUrl: varchar("profile_url").notNull(),
  content: text("content").notNull(), // Type of content they create
  audience: varchar("audience"), // Target audience
  subscriberCount: integer("subscriber_count"),
  bio: text("bio"),
  isSponsored: boolean("is_sponsored").default(false),
  sponsorshipStartDate: timestamp("sponsorship_start_date"),
  sponsorshipEndDate: timestamp("sponsorship_end_date"),
  sponsorshipAmount: varchar("sponsorship_amount"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sponsorship applications
export const sponsorshipApplications = pgTable("sponsorship_applications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  platform: varchar("platform").notNull(),
  profileUrl: varchar("profile_url").notNull(),
  content: text("content").notNull(),
  audience: varchar("audience"),
  subscriberCount: integer("subscriber_count"),
  message: text("message"),
  status: varchar("status").default("pending").notNull(), // pending, approved, rejected
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const contentCreatorsRelations = relations(contentCreators, ({ one }) => ({
  user: one(users, {
    fields: [contentCreators.userId],
    references: [users.id],
  }),
}));

export const sponsorshipApplicationsRelations = relations(sponsorshipApplications, ({ one }) => ({
  user: one(users, {
    fields: [sponsorshipApplications.userId],
    references: [users.id],
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
}));

// Schema for creating content creators
export const insertContentCreatorSchema = createInsertSchema(contentCreators)
  .omit({ id: true, userId: true, isSponsored: true, sponsorshipStartDate: true, 
    sponsorshipEndDate: true, sponsorshipAmount: true, createdAt: true, updatedAt: true });

// Schema for creating sponsorship applications
export const insertSponsorshipApplicationSchema = createInsertSchema(sponsorshipApplications)
  .omit({ id: true, userId: true, status: true, reviewedAt: true, createdAt: true, updatedAt: true });

// Types
export type InsertContentCreator = z.infer<typeof insertContentCreatorSchema>;
export type ContentCreator = typeof contentCreators.$inferSelect;

export type InsertSponsorshipApplication = z.infer<typeof insertSponsorshipApplicationSchema>;
export type SponsorshipApplication = typeof sponsorshipApplications.$inferSelect;
