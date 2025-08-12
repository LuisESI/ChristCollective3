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
  displayName: varchar("display_name"),
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
  userType: varchar("user_type", { enum: ["creator", "business_owner", "ministry"] }),
  // Privacy settings
  showEmail: boolean("show_email").default(false),
  showPhone: boolean("show_phone").default(false),
  showLocation: boolean("show_location").default(false),
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
  isVisibleOnProfile: boolean("is_visible_on_profile").default(true),
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

// Platform content posts - unified content sharing for all user types
export const platformPosts = pgTable("platform_posts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  authorType: varchar("author_type").notNull(), // creator, business, ministry, user
  authorId: integer("author_id"), // reference to specific profile (creator_id, business_id, ministry_id)
  title: varchar("title"),
  content: text("content").notNull(),
  mediaUrls: text("media_urls").array(), // Array of image/video URLs
  mediaType: varchar("media_type").notNull().default("image"), // image, video, text
  tags: text("tags").array(), // Array of hashtags
  isPublished: boolean("is_published").default(true),
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  sharesCount: integer("shares_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Post interactions (likes, comments, shares)
export const postInteractions = pgTable("post_interactions", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => platformPosts.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // like, comment, share
  content: text("content"), // For comments
  createdAt: timestamp("created_at").defaultNow(),
});

// User follows (users following other users)
export const userFollows = pgTable("user_follows", {
  id: serial("id").primaryKey(),
  followerId: varchar("follower_id").notNull().references(() => users.id),
  followingId: varchar("following_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueFollow: uniqueIndex("unique_user_follow").on(table.followerId, table.followingId),
}));

// Business profile follows (users following business profiles)
export const businessFollows = pgTable("business_follows", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  businessId: integer("business_id").notNull().references(() => businessProfiles.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueFollow: uniqueIndex("unique_business_follow").on(table.userId, table.businessId),
}));

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
  flyerImage: varchar("flyer_image"), // URL to uploaded flyer image
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

// Ministry post RSVPs (for event announcements)
export const ministryPostRsvps = pgTable("ministry_post_rsvps", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  postId: integer("post_id").notNull().references(() => ministryPosts.id),
  status: varchar("status").notNull().default("going"), // going, maybe, not_going
  notes: text("notes"), // Optional notes from user
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueRsvp: uniqueIndex("unique_ministry_post_rsvp").on(table.userId, table.postId),
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
  businessFollows: many(businessFollows),
  notifications: many(notifications),
}));

export const businessFollowsRelations = relations(businessFollows, ({ one }) => ({
  user: one(users, {
    fields: [businessFollows.userId],
    references: [users.id],
  }),
  business: one(businessProfiles, {
    fields: [businessFollows.businessId],
    references: [businessProfiles.id],
  }),
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

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: varchar("type", { 
    enum: ["like", "comment", "follow", "post", "rsvp", "campaign_update", "ministry_post"] 
  }).notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  relatedId: varchar("related_id"), // ID of the related entity (post, comment, etc.)
  relatedType: varchar("related_type", { 
    enum: ["platform_post", "ministry_post", "comment", "campaign", "user", "ministry"] 
  }),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  // Optional metadata for rich notifications
  actorId: varchar("actor_id").references(() => users.id), // Who performed the action
  actorName: varchar("actor_name"),
  actorImage: varchar("actor_image"),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  actor: one(users, {
    fields: [notifications.actorId],
    references: [users.id],
  }),
}));

// Notification insert schema
export const insertNotificationSchema = createInsertSchema(notifications)
  .omit({ id: true, createdAt: true });

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Ministry post RSVP schemas
export const insertMinistryPostRsvpSchema = createInsertSchema(ministryPostRsvps)
  .omit({ id: true, userId: true, createdAt: true, updatedAt: true });

export type InsertMinistryPostRsvp = z.infer<typeof insertMinistryPostRsvpSchema>;
export type MinistryPostRsvp = typeof ministryPostRsvps.$inferSelect;

export type MinistryFollower = typeof ministryFollowers.$inferSelect;
export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type BusinessFollow = typeof businessFollows.$inferSelect;

// Platform posts schemas
export const insertPlatformPostSchema = createInsertSchema(platformPosts).omit({
  id: true,
  likesCount: true,
  commentsCount: true,
  sharesCount: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tags: z.array(z.string()).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
});

export type InsertPlatformPost = z.infer<typeof insertPlatformPostSchema>;
export type PlatformPost = typeof platformPosts.$inferSelect;

export const insertPostInteractionSchema = createInsertSchema(postInteractions).omit({
  id: true,
  createdAt: true,
});
export type InsertPostInteraction = z.infer<typeof insertPostInteractionSchema>;
export type PostInteraction = typeof postInteractions.$inferSelect;

export type UserFollow = typeof userFollows.$inferSelect;
export type InsertUserFollow = typeof userFollows.$inferInsert;

// Group chat queues and chats
export const groupChatQueues = pgTable("group_chat_queues", {
  id: serial("id").primaryKey(),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description"),
  intention: varchar("intention").notNull(), // prayer, bible_study, evangelizing, fellowship, etc.
  minPeople: integer("min_people").notNull().default(4),
  maxPeople: integer("max_people").notNull().default(12),
  currentCount: integer("current_count").notNull().default(1), // starts with creator
  status: varchar("status").notNull().default("waiting"), // waiting, active, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const groupChats = pgTable("group_chats", {
  id: serial("id").primaryKey(),
  queueId: integer("queue_id").notNull().references(() => groupChatQueues.id),
  title: varchar("title").notNull(),
  description: text("description"),
  intention: varchar("intention").notNull(),
  memberCount: integer("member_count").notNull(),
  status: varchar("status").notNull().default("active"), // active, completed, archived
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const groupChatMembers = pgTable("group_chat_members", {
  id: serial("id").primaryKey(),
  queueId: integer("queue_id").references(() => groupChatQueues.id),
  chatId: integer("chat_id").references(() => groupChats.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: varchar("role").notNull().default("member"), // creator, member
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Group chat relations
export const groupChatQueuesRelations = relations(groupChatQueues, ({ one, many }) => ({
  creator: one(users, {
    fields: [groupChatQueues.creatorId],
    references: [users.id],
  }),
  members: many(groupChatMembers),
  chat: one(groupChats),
}));

export const groupChatsRelations = relations(groupChats, ({ one, many }) => ({
  queue: one(groupChatQueues, {
    fields: [groupChats.queueId],
    references: [groupChatQueues.id],
  }),
  members: many(groupChatMembers),
  messages: many(groupChatMessages),
}));

export const groupChatMembersRelations = relations(groupChatMembers, ({ one }) => ({
  user: one(users, {
    fields: [groupChatMembers.userId],
    references: [users.id],
  }),
  queue: one(groupChatQueues, {
    fields: [groupChatMembers.queueId],
    references: [groupChatQueues.id],
  }),
  chat: one(groupChats, {
    fields: [groupChatMembers.chatId],
    references: [groupChats.id],
  }),
}));

// Group chat messages
export const groupChatMessages = pgTable("group_chat_messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull().references(() => groupChats.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  type: varchar("type").notNull().default("message"), // message, prayer_request, system
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupChatMessagesRelations = relations(groupChatMessages, ({ one }) => ({
  chat: one(groupChats, {
    fields: [groupChatMessages.chatId],
    references: [groupChats.id],
  }),
  user: one(users, {
    fields: [groupChatMessages.userId],
    references: [users.id],
  }),
}));

// Insert schemas for group chats
export const insertGroupChatQueueSchema = createInsertSchema(groupChatQueues)
  .omit({ id: true, creatorId: true, currentCount: true, status: true, createdAt: true, updatedAt: true })
  .extend({
    minPeople: z.coerce.number().min(2).max(12),
    maxPeople: z.coerce.number().min(4).max(12),
  });

export const insertGroupChatMemberSchema = createInsertSchema(groupChatMembers)
  .omit({ id: true, joinedAt: true });

export const insertGroupChatMessageSchema = createInsertSchema(groupChatMessages)
  .omit({ id: true, createdAt: true });

export type InsertGroupChatQueue = z.infer<typeof insertGroupChatQueueSchema>;
export type GroupChatQueue = typeof groupChatQueues.$inferSelect;
export type GroupChat = typeof groupChats.$inferSelect;
export type GroupChatMember = typeof groupChatMembers.$inferSelect;
export type GroupChatMessage = typeof groupChatMessages.$inferSelect;
export type InsertGroupChatMember = z.infer<typeof insertGroupChatMemberSchema>;
export type InsertGroupChatMessage = z.infer<typeof insertGroupChatMessageSchema>;
