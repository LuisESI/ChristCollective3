import {
  users,
  campaigns,
  donations,
  businessProfiles,
  membershipTiers,
  contentCreators,
  sponsorshipApplications,
  socialMediaPosts,
  ministryProfiles,
  ministryPosts,
  ministryEvents,
  ministryFollowers,
  eventRegistrations,
  type User,
  type UpsertUser,
  type Campaign,
  type InsertCampaign,
  type Donation,
  type InsertDonation,
  type BusinessProfile,
  type InsertBusinessProfile,
  type MembershipTier,
  type ContentCreator,
  type InsertContentCreator,
  type SponsorshipApplication,
  type InsertSponsorshipApplication,
  type SocialMediaPost,
  type InsertSocialMediaPost,
  type MinistryProfile,
  type InsertMinistryProfile,
  type MinistryPost,
  type InsertMinistryPost,
  type MinistryEvent,
  type InsertMinistryEvent,
  type MinistryFollower,
  type EventRegistration,
  platformPosts,
  postInteractions,
  type PlatformPost,
  type InsertPlatformPost,
  type PostInteraction,
  type InsertPostInteraction,
  userFollows,
  type UserFollow,
  type InsertUserFollow,
  businessFollows,
  type BusinessFollow,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, like, sql } from "drizzle-orm";
import { generateSlug } from "./utils";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByUsernameInsensitive(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  getUsersCount(): Promise<number>;
  getAllUsers(): Promise<User[]>;
  
  // Stripe related user updates
  updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User>;
  
  // Campaign operations
  createCampaign(campaignData: InsertCampaign & { userId: string }): Promise<Campaign>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  getCampaignBySlug(slug: string): Promise<Campaign | undefined>;
  listCampaigns(limit?: number): Promise<Campaign[]>;
  listPendingCampaigns(): Promise<Campaign[]>;
  searchCampaigns(query: string): Promise<Campaign[]>;
  updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign>;
  approveCampaign(id: string): Promise<Campaign>;
  rejectCampaign(id: string): Promise<Campaign>;
  deleteCampaign(id: string): Promise<void>;
  getUserCampaigns(userId: string): Promise<Campaign[]>;
  
  // Donation operations
  createDonation(donationData: InsertDonation, stripePaymentId: string): Promise<Donation>;
  updateDonationAmount(campaignId: string, amount: number): Promise<Campaign>;
  getCampaignDonations(campaignId: string): Promise<Donation[]>;
  getUserDonations(userId: string): Promise<Donation[]>;
  getAllDonations(): Promise<Donation[]>;
  
  // Business profile operations
  createBusinessProfile(profileData: InsertBusinessProfile & { userId: string }): Promise<BusinessProfile>;
  getBusinessProfile(id: number): Promise<BusinessProfile | undefined>;
  getUserBusinessProfile(userId: string): Promise<BusinessProfile | undefined>;
  updateBusinessProfile(id: number, data: Partial<BusinessProfile>): Promise<BusinessProfile>;
  listBusinessProfiles(): Promise<BusinessProfile[]>;
  
  // Membership tier operations
  getMembershipTier(id: number): Promise<MembershipTier | undefined>;
  listMembershipTiers(): Promise<MembershipTier[]>;
  updateBusinessProfileSubscription(id: number, subscriptionId: string): Promise<BusinessProfile>;
  
  // Content creator operations
  createContentCreator(creatorData: InsertContentCreator & { userId: string }): Promise<ContentCreator>;
  getContentCreator(id: number): Promise<ContentCreator | undefined>;
  getUserContentCreator(userId: string): Promise<ContentCreator | undefined>;
  updateContentCreator(id: number, data: Partial<ContentCreator>): Promise<ContentCreator>;
  listContentCreators(sponsoredOnly?: boolean): Promise<ContentCreator[]>;
  
  // Sponsorship application operations
  createSponsorshipApplication(applicationData: InsertSponsorshipApplication & { userId: string }): Promise<SponsorshipApplication>;
  getSponsorshipApplication(id: number): Promise<SponsorshipApplication | undefined>;
  getUserSponsorshipApplications(userId: string): Promise<SponsorshipApplication[]>;
  listSponsorshipApplications(status?: string): Promise<SponsorshipApplication[]>;
  updateSponsorshipApplication(id: number, data: Partial<SponsorshipApplication>): Promise<SponsorshipApplication>;
  
  // Social media post operations
  createSocialMediaPost(postData: InsertSocialMediaPost & { creatorId: number }): Promise<SocialMediaPost>;
  getSocialMediaPost(id: number): Promise<SocialMediaPost | undefined>;
  getSocialMediaPostsByCreator(creatorId: number): Promise<SocialMediaPost[]>;
  getVisibleSocialMediaPostsByCreator(creatorId: number): Promise<SocialMediaPost[]>;
  clearCreatorPosts(creatorId: number): Promise<void>;
  listSponsoredSocialMediaPosts(): Promise<SocialMediaPost[]>;
  updateSocialMediaPost(id: number, data: Partial<SocialMediaPost>): Promise<SocialMediaPost>;

  // Ministry operations
  createMinistryProfile(profileData: InsertMinistryProfile & { userId: string }): Promise<MinistryProfile>;
  getMinistry(id: number): Promise<MinistryProfile | undefined>;
  getUserMinistryProfile(userId: string): Promise<MinistryProfile | undefined>;
  updateMinistryProfile(id: number, data: Partial<MinistryProfile>): Promise<MinistryProfile>;
  getAllMinistries(): Promise<MinistryProfile[]>;
  getPendingMinistries(): Promise<MinistryProfile[]>;
  deleteMinistryProfile(id: number): Promise<void>;
  
  // Ministry posts operations
  createMinistryPost(postData: InsertMinistryPost & { ministryId: number }): Promise<MinistryPost>;
  getMinistryPosts(ministryId: number): Promise<MinistryPost[]>;
  
  // Ministry events operations
  createMinistryEvent(eventData: InsertMinistryEvent & { ministryId: number }): Promise<MinistryEvent>;
  getMinistryEvents(ministryId: number): Promise<MinistryEvent[]>;
  
  // Ministry followers operations
  followMinistry(userId: string, ministryId: number): Promise<void>;
  unfollowMinistry(userId: string, ministryId: number): Promise<void>;
  isUserFollowingMinistry(userId: string, ministryId: number): Promise<boolean>;
  getUserFollowedMinistries(userId: string): Promise<MinistryProfile[]>;
  getMinistryFeedPosts(userId: string): Promise<MinistryPost[]>;

  // Platform posts operations
  createPlatformPost(postData: InsertPlatformPost & { userId: string }): Promise<PlatformPost>;
  getPlatformPost(id: number): Promise<PlatformPost | undefined>;
  listPlatformPosts(limit?: number): Promise<PlatformPost[]>;
  getUserPlatformPosts(userId: string): Promise<PlatformPost[]>;
  getUserPosts(userId: string): Promise<PlatformPost[]>; // Alias for getUserPlatformPosts
  updatePlatformPost(id: number, data: Partial<PlatformPost>): Promise<PlatformPost>;
  deletePlatformPost(id: number): Promise<void>;

  // Post interaction operations
  createPostInteraction(interactionData: InsertPostInteraction): Promise<PostInteraction>;
  getPostInteractions(postId: number): Promise<PostInteraction[]>;
  getPostComments(postId: number): Promise<PostInteraction[]>;
  getUserPostInteraction(postId: number, userId: string, type: string): Promise<PostInteraction | undefined>;
  deletePostInteraction(id: number): Promise<void>;

  // User follow operations
  followUser(followerId: string, followingId: string): Promise<UserFollow>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  isUserFollowing(followerId: string, followingId: string): Promise<boolean>;
  getUserFollowers(userId: string): Promise<User[]>;
  getUserFollowing(userId: string): Promise<User[]>;
  getUserFollowersCount(userId: string): Promise<number>;
  getUserFollowingCount(userId: string): Promise<number>;
  getFollowedUsersPosts(userId: string, limit?: number): Promise<PlatformPost[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByUsernameInsensitive(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(ilike(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getUsersCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return Number(result[0].count);
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        stripeCustomerId,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  // Campaign operations
  async createCampaign(campaignData: InsertCampaign & { userId: string }): Promise<Campaign> {
    const slug = await generateSlug(campaignData.title);
    
    const [campaign] = await db
      .insert(campaigns)
      .values({
        ...campaignData,
        slug,
        currentAmount: "0",
        isActive: true,
        status: "pending",
      })
      .returning();
    return campaign;
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign;
  }

  async getCampaignBySlug(slug: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.slug, slug));
    return campaign;
  }

  async listCampaigns(limit = 100): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.isActive, true), eq(campaigns.status, "approved")))
      .orderBy(desc(campaigns.createdAt))
      .limit(limit);
  }

  async listPendingCampaigns(): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.status, "pending"))
      .orderBy(desc(campaigns.createdAt));
  }

  async searchCampaigns(query: string): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.isActive, true),
          ilike(campaigns.title, `%${query}%`)
        )
      )
      .orderBy(desc(campaigns.createdAt));
  }

  async updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign> {
    const [updatedCampaign] = await db
      .update(campaigns)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(campaigns.id, id))
      .returning();
    return updatedCampaign;
  }

  async getUserCampaigns(userId: string): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.userId, userId))
      .orderBy(desc(campaigns.createdAt));
  }
  
  async approveCampaign(id: string): Promise<Campaign> {
    const [approvedCampaign] = await db
      .update(campaigns)
      .set({ status: "approved", updatedAt: new Date() })
      .where(eq(campaigns.id, id))
      .returning();
    return approvedCampaign;
  }

  async rejectCampaign(id: string): Promise<Campaign> {
    const [rejectedCampaign] = await db
      .update(campaigns)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(campaigns.id, id))
      .returning();
    return rejectedCampaign;
  }

  async deleteCampaign(id: string): Promise<void> {
    await db
      .delete(campaigns)
      .where(eq(campaigns.id, id));
  }

  // Donation operations
  async createDonation(donationData: InsertDonation, stripePaymentId: string): Promise<Donation> {
    const [donation] = await db
      .insert(donations)
      .values({
        ...donationData,
        stripePaymentId,
      })
      .returning();
    return donation;
  }

  async updateDonationAmount(campaignId: string, amount: number): Promise<Campaign> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));
    
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    
    const currentAmount = Number(campaign.currentAmount) || 0;
    const newAmount = currentAmount + amount;
    
    const [updatedCampaign] = await db
      .update(campaigns)
      .set({ 
        currentAmount: newAmount.toString(),
        updatedAt: new Date()
      })
      .where(eq(campaigns.id, campaignId))
      .returning();
      
    return updatedCampaign;
  }

  async getCampaignDonations(campaignId: string): Promise<Donation[]> {
    return await db
      .select()
      .from(donations)
      .where(eq(donations.campaignId, campaignId))
      .orderBy(desc(donations.createdAt));
  }

  async getUserDonations(userId: string): Promise<Donation[]> {
    return await db
      .select()
      .from(donations)
      .where(eq(donations.userId, userId))
      .orderBy(desc(donations.createdAt));
  }

  async getAllDonations(): Promise<Donation[]> {
    return await db
      .select()
      .from(donations)
      .orderBy(desc(donations.createdAt));
  }

  // Business profile operations
  async createBusinessProfile(profileData: InsertBusinessProfile & { userId: string }): Promise<BusinessProfile> {
    const [profile] = await db
      .insert(businessProfiles)
      .values(profileData)
      .returning();
    return profile;
  }

  async getBusinessProfile(id: number): Promise<BusinessProfile | undefined> {
    const [profile] = await db
      .select()
      .from(businessProfiles)
      .leftJoin(membershipTiers, eq(businessProfiles.membershipTierId, membershipTiers.id))
      .where(eq(businessProfiles.id, id));
    
    if (!profile) return undefined;
    
    return {
      ...profile.business_profiles,
      membershipTier: profile.membership_tiers || null,
    } as any;
  }

  async getUserBusinessProfile(userId: string): Promise<BusinessProfile | undefined> {
    const [profile] = await db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.userId, userId));
    return profile;
  }

  async updateBusinessProfile(id: number, data: Partial<BusinessProfile>): Promise<BusinessProfile> {
    const [updatedProfile] = await db
      .update(businessProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(businessProfiles.id, id))
      .returning();
    return updatedProfile;
  }

  async deleteBusinessProfile(id: number): Promise<void> {
    await db
      .delete(businessProfiles)
      .where(eq(businessProfiles.id, id));
  }

  async listBusinessProfiles(): Promise<BusinessProfile[]> {
    return await db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.isActive, true))
      .orderBy(desc(businessProfiles.createdAt));
  }

  // Membership tier operations
  async getMembershipTier(id: number): Promise<MembershipTier | undefined> {
    const [tier] = await db.select().from(membershipTiers).where(eq(membershipTiers.id, id));
    return tier;
  }

  async listMembershipTiers(): Promise<MembershipTier[]> {
    return await db.select().from(membershipTiers);
  }

  async updateBusinessProfileSubscription(id: number, subscriptionId: string): Promise<BusinessProfile> {
    const [updatedProfile] = await db
      .update(businessProfiles)
      .set({ 
        stripeSubscriptionId: subscriptionId,
        isActive: true,
        updatedAt: new Date()
      })
      .where(eq(businessProfiles.id, id))
      .returning();
    return updatedProfile;
  }
  
  // Content creator operations
  async createContentCreator(creatorData: InsertContentCreator & { userId: string }): Promise<ContentCreator> {
    const [creator] = await db
      .insert(contentCreators)
      .values(creatorData)
      .returning();
    return creator;
  }

  async getContentCreator(id: number): Promise<ContentCreator | undefined> {
    const [creator] = await db
      .select()
      .from(contentCreators)
      .where(eq(contentCreators.id, id));
    return creator;
  }

  async getUserContentCreator(userId: string): Promise<ContentCreator | undefined> {
    const [creator] = await db
      .select()
      .from(contentCreators)
      .where(eq(contentCreators.userId, userId));
    return creator;
  }

  async updateContentCreator(id: number, data: Partial<ContentCreator>): Promise<ContentCreator> {
    const [creator] = await db
      .update(contentCreators)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(contentCreators.id, id))
      .returning();
    return creator;
  }

  async listContentCreators(sponsoredOnly = false): Promise<ContentCreator[]> {
    if (sponsoredOnly) {
      return await db
        .select()
        .from(contentCreators)
        .where(eq(contentCreators.isSponsored, true))
        .orderBy(desc(contentCreators.createdAt));
    }
    
    return await db
      .select()
      .from(contentCreators)
      .orderBy(desc(contentCreators.createdAt));
  }

  // Sponsorship application operations
  async createSponsorshipApplication(applicationData: InsertSponsorshipApplication & { userId: string }): Promise<SponsorshipApplication> {
    const [application] = await db
      .insert(sponsorshipApplications)
      .values(applicationData)
      .returning();
    return application;
  }

  async getSponsorshipApplication(id: number): Promise<SponsorshipApplication | undefined> {
    const [application] = await db
      .select()
      .from(sponsorshipApplications)
      .where(eq(sponsorshipApplications.id, id));
    return application;
  }

  async getUserSponsorshipApplications(userId: string): Promise<SponsorshipApplication[]> {
    return await db
      .select()
      .from(sponsorshipApplications)
      .where(eq(sponsorshipApplications.userId, userId));
  }

  async listSponsorshipApplications(status?: string): Promise<SponsorshipApplication[]> {
    if (status) {
      return await db
        .select()
        .from(sponsorshipApplications)
        .where(eq(sponsorshipApplications.status, status))
        .orderBy(desc(sponsorshipApplications.createdAt));
    }
    
    return await db
      .select()
      .from(sponsorshipApplications)
      .orderBy(desc(sponsorshipApplications.createdAt));
  }

  async updateSponsorshipApplication(id: number, data: Partial<SponsorshipApplication>): Promise<SponsorshipApplication> {
    const [application] = await db
      .update(sponsorshipApplications)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(sponsorshipApplications.id, id))
      .returning();
    return application;
  }

  // Social media post operations
  async createSocialMediaPost(postData: InsertSocialMediaPost & { creatorId: number }): Promise<SocialMediaPost> {
    const [post] = await db
      .insert(socialMediaPosts)
      .values(postData)
      .returning();
    return post;
  }

  async getSocialMediaPost(id: number): Promise<SocialMediaPost | undefined> {
    const [post] = await db
      .select()
      .from(socialMediaPosts)
      .where(eq(socialMediaPosts.id, id));
    return post;
  }

  async getSocialMediaPostsByCreator(creatorId: number): Promise<SocialMediaPost[]> {
    return await db
      .select()
      .from(socialMediaPosts)
      .where(eq(socialMediaPosts.creatorId, creatorId))
      .orderBy(desc(socialMediaPosts.postedAt));
  }

  async getVisibleSocialMediaPostsByCreator(creatorId: number): Promise<SocialMediaPost[]> {
    return await db
      .select()
      .from(socialMediaPosts)
      .where(and(
        eq(socialMediaPosts.creatorId, creatorId),
        eq(socialMediaPosts.isVisibleOnProfile, true)
      ))
      .orderBy(desc(socialMediaPosts.postedAt));
  }

  async clearCreatorPosts(creatorId: number): Promise<void> {
    await db
      .delete(socialMediaPosts)
      .where(eq(socialMediaPosts.creatorId, creatorId));
  }

  async listSponsoredSocialMediaPosts(): Promise<SocialMediaPost[]> {
    return await db
      .select()
      .from(socialMediaPosts)
      .where(eq(socialMediaPosts.isSponsored, true))
      .orderBy(desc(socialMediaPosts.postedAt));
  }

  async updateSocialMediaPost(id: number, data: Partial<SocialMediaPost>): Promise<SocialMediaPost> {
    const [post] = await db
      .update(socialMediaPosts)
      .set(data)
      .where(eq(socialMediaPosts.id, id))
      .returning();
    return post;
  }

  // Ministry operations
  async createMinistryProfile(profileData: InsertMinistryProfile & { userId: string }): Promise<MinistryProfile> {
    const [profile] = await db
      .insert(ministryProfiles)
      .values(profileData)
      .returning();
    return profile;
  }

  async getMinistry(id: number): Promise<MinistryProfile | undefined> {
    const [ministry] = await db
      .select()
      .from(ministryProfiles)
      .where(eq(ministryProfiles.id, id));
    return ministry;
  }

  async getUserMinistryProfile(userId: string): Promise<MinistryProfile | undefined> {
    const [profile] = await db
      .select()
      .from(ministryProfiles)
      .where(eq(ministryProfiles.userId, userId));
    return profile;
  }

  async updateMinistryProfile(id: number, data: Partial<MinistryProfile>): Promise<MinistryProfile> {
    const [profile] = await db
      .update(ministryProfiles)
      .set(data)
      .where(eq(ministryProfiles.id, id))
      .returning();
    return profile;
  }

  async getAllMinistries(): Promise<MinistryProfile[]> {
    return await db
      .select()
      .from(ministryProfiles)
      .where(eq(ministryProfiles.isActive, true))
      .orderBy(desc(ministryProfiles.createdAt));
  }

  async getPendingMinistries(): Promise<MinistryProfile[]> {
    return await db
      .select()
      .from(ministryProfiles)
      .where(eq(ministryProfiles.isActive, false))
      .orderBy(desc(ministryProfiles.createdAt));
  }

  async deleteMinistryProfile(id: number): Promise<void> {
    await db
      .delete(ministryProfiles)
      .where(eq(ministryProfiles.id, id));
  }

  // Ministry posts operations
  async createMinistryPost(postData: InsertMinistryPost & { ministryId: number }): Promise<MinistryPost> {
    const [post] = await db
      .insert(ministryPosts)
      .values(postData)
      .returning();
    return post;
  }

  async getMinistryPosts(ministryId: number): Promise<MinistryPost[]> {
    return await db
      .select()
      .from(ministryPosts)
      .where(and(eq(ministryPosts.ministryId, ministryId), eq(ministryPosts.isPublished, true)))
      .orderBy(desc(ministryPosts.createdAt));
  }

  async getMinistryPostById(postId: number): Promise<any> {
    const [result] = await db
      .select({
        id: ministryPosts.id,
        ministryId: ministryPosts.ministryId,
        title: ministryPosts.title,
        content: ministryPosts.content,
        type: ministryPosts.type,
        mediaUrls: ministryPosts.mediaUrls,
        links: ministryPosts.links,
        isPublished: ministryPosts.isPublished,
        createdAt: ministryPosts.createdAt,
        updatedAt: ministryPosts.updatedAt,
        ministry: {
          id: ministryProfiles.id,
          name: ministryProfiles.name,
          logo: ministryProfiles.logo,
          denomination: ministryProfiles.denomination,
        }
      })
      .from(ministryPosts)
      .leftJoin(ministryProfiles, eq(ministryPosts.ministryId, ministryProfiles.id))
      .where(and(eq(ministryPosts.id, postId), eq(ministryPosts.isPublished, true)));
    
    return result || undefined;
  }

  // Ministry events operations
  async createMinistryEvent(eventData: InsertMinistryEvent & { ministryId: number }): Promise<MinistryEvent> {
    const [event] = await db
      .insert(ministryEvents)
      .values(eventData)
      .returning();
    return event;
  }

  async getMinistryEvents(ministryId: number): Promise<MinistryEvent[]> {
    return await db
      .select()
      .from(ministryEvents)
      .where(and(eq(ministryEvents.ministryId, ministryId), eq(ministryEvents.isPublished, true)))
      .orderBy(ministryEvents.startDate);
  }

  // Ministry followers operations
  async followMinistry(userId: string, ministryId: number): Promise<void> {
    await db
      .insert(ministryFollowers)
      .values({ userId, ministryId })
      .onConflictDoNothing();
  }

  async unfollowMinistry(userId: string, ministryId: number): Promise<void> {
    await db
      .delete(ministryFollowers)
      .where(and(eq(ministryFollowers.userId, userId), eq(ministryFollowers.ministryId, ministryId)));
  }

  async isUserFollowingMinistry(userId: string, ministryId: number): Promise<boolean> {
    const [result] = await db
      .select()
      .from(ministryFollowers)
      .where(and(eq(ministryFollowers.userId, userId), eq(ministryFollowers.ministryId, ministryId)));
    return !!result;
  }

  async getUserFollowedMinistries(userId: string): Promise<MinistryProfile[]> {
    return await db
      .select({
        id: ministryProfiles.id,
        userId: ministryProfiles.userId,
        name: ministryProfiles.name,
        description: ministryProfiles.description,
        denomination: ministryProfiles.denomination,
        website: ministryProfiles.website,
        logo: ministryProfiles.logo,
        location: ministryProfiles.location,
        address: ministryProfiles.address,
        phone: ministryProfiles.phone,
        email: ministryProfiles.email,
        socialLinks: ministryProfiles.socialLinks,
        isActive: ministryProfiles.isActive,
        isVerified: ministryProfiles.isVerified,
        createdAt: ministryProfiles.createdAt,
        updatedAt: ministryProfiles.updatedAt,
      })
      .from(ministryProfiles)
      .innerJoin(ministryFollowers, eq(ministryFollowers.ministryId, ministryProfiles.id))
      .where(eq(ministryFollowers.userId, userId))
      .orderBy(desc(ministryFollowers.createdAt));
  }

  async getMinistryFeedPosts(userId: string): Promise<MinistryPost[]> {
    return await db
      .select({
        id: ministryPosts.id,
        ministryId: ministryPosts.ministryId,
        title: ministryPosts.title,
        content: ministryPosts.content,
        type: ministryPosts.type,
        mediaUrls: ministryPosts.mediaUrls,
        links: ministryPosts.links,
        isPublished: ministryPosts.isPublished,
        createdAt: ministryPosts.createdAt,
        updatedAt: ministryPosts.updatedAt,
        ministry: {
          id: ministryProfiles.id,
          name: ministryProfiles.name,
          logo: ministryProfiles.logo,
          denomination: ministryProfiles.denomination,
        }
      })
      .from(ministryPosts)
      .innerJoin(ministryFollowers, eq(ministryFollowers.ministryId, ministryPosts.ministryId))
      .innerJoin(ministryProfiles, eq(ministryProfiles.id, ministryPosts.ministryId))
      .where(and(
        eq(ministryFollowers.userId, userId),
        eq(ministryPosts.isPublished, true)
      ))
      .orderBy(desc(ministryPosts.createdAt));
  }

  // Platform posts operations
  async createPlatformPost(postData: InsertPlatformPost & { userId: string }): Promise<PlatformPost> {
    const [post] = await db
      .insert(platformPosts)
      .values(postData)
      .returning();
    return post;
  }

  async getPlatformPost(id: number): Promise<PlatformPost | undefined> {
    const [post] = await db
      .select()
      .from(platformPosts)
      .where(eq(platformPosts.id, id));
    return post;
  }

  async listPlatformPosts(limit = 50): Promise<PlatformPost[]> {
    return await db
      .select()
      .from(platformPosts)
      .where(eq(platformPosts.isPublished, true))
      .orderBy(desc(platformPosts.createdAt))
      .limit(limit);
  }

  async getUserPlatformPosts(userId: string): Promise<PlatformPost[]> {
    return await db
      .select()
      .from(platformPosts)
      .where(eq(platformPosts.userId, userId))
      .orderBy(desc(platformPosts.createdAt));
  }

  // Alias method for getUserPlatformPosts
  async getUserPosts(userId: string): Promise<PlatformPost[]> {
    return this.getUserPlatformPosts(userId);
  }

  async updatePlatformPost(id: number, data: Partial<PlatformPost>): Promise<PlatformPost> {
    const [post] = await db
      .update(platformPosts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(platformPosts.id, id))
      .returning();
    return post;
  }

  async deletePlatformPost(id: number): Promise<void> {
    await db
      .delete(platformPosts)
      .where(eq(platformPosts.id, id));
  }

  // Post interaction operations
  async createPostInteraction(interactionData: InsertPostInteraction): Promise<PostInteraction> {
    const [interaction] = await db
      .insert(postInteractions)
      .values(interactionData)
      .returning();
    return interaction;
  }

  async getPostInteractions(postId: number): Promise<PostInteraction[]> {
    return await db
      .select()
      .from(postInteractions)
      .where(eq(postInteractions.postId, postId))
      .orderBy(desc(postInteractions.createdAt));
  }

  async getPostComments(postId: number): Promise<PostInteraction[]> {
    return await db
      .select({
        id: postInteractions.id,
        postId: postInteractions.postId,
        userId: postInteractions.userId,
        type: postInteractions.type,
        content: postInteractions.content,
        createdAt: postInteractions.createdAt,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        }
      })
      .from(postInteractions)
      .leftJoin(users, eq(postInteractions.userId, users.id))
      .where(and(
        eq(postInteractions.postId, postId),
        eq(postInteractions.type, 'comment')
      ))
      .orderBy(desc(postInteractions.createdAt));
  }

  async getUserPostInteraction(postId: number, userId: string, type: string): Promise<PostInteraction | undefined> {
    const [interaction] = await db
      .select()
      .from(postInteractions)
      .where(and(
        eq(postInteractions.postId, postId),
        eq(postInteractions.userId, userId),
        eq(postInteractions.type, type)
      ));
    return interaction;
  }

  async deletePostInteraction(id: number): Promise<void> {
    await db
      .delete(postInteractions)
      .where(eq(postInteractions.id, id));
  }

  // User follow operations
  async followUser(followerId: string, followingId: string): Promise<UserFollow> {
    const [follow] = await db
      .insert(userFollows)
      .values({ followerId, followingId })
      .onConflictDoNothing()
      .returning();
    return follow;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await db
      .delete(userFollows)
      .where(and(eq(userFollows.followerId, followerId), eq(userFollows.followingId, followingId)));
  }

  async isUserFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(userFollows)
      .where(and(eq(userFollows.followerId, followerId), eq(userFollows.followingId, followingId)));
    return !!follow;
  }

  async getUserFollowers(userId: string): Promise<User[]> {
    return await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        stripeCustomerId: users.stripeCustomerId,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        bio: users.bio,
        location: users.location,
        phone: users.phone,
        username: users.username,
        password: users.password,
        userType: users.userType,
        showEmail: users.showEmail,
        showPhone: users.showPhone,
        showLocation: users.showLocation,
      })
      .from(users)
      .innerJoin(userFollows, eq(userFollows.followerId, users.id))
      .where(eq(userFollows.followingId, userId))
      .orderBy(desc(userFollows.createdAt));
  }

  async getUserFollowing(userId: string): Promise<User[]> {
    return await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        stripeCustomerId: users.stripeCustomerId,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        bio: users.bio,
        location: users.location,
        phone: users.phone,
        username: users.username,
        password: users.password,
        userType: users.userType,
        showEmail: users.showEmail,
        showPhone: users.showPhone,
        showLocation: users.showLocation,
      })
      .from(users)
      .innerJoin(userFollows, eq(userFollows.followingId, users.id))
      .where(eq(userFollows.followerId, userId))
      .orderBy(desc(userFollows.createdAt));
  }

  async getUserFollowersCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(userFollows)
      .where(eq(userFollows.followingId, userId));
    return Number(result[0].count);
  }

  async getUserFollowingCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(userFollows)
      .where(eq(userFollows.followerId, userId));
    return Number(result[0].count);
  }

  async getFollowedUsersPosts(userId: string, limit = 50): Promise<PlatformPost[]> {
    return await db
      .select()
      .from(platformPosts)
      .innerJoin(userFollows, eq(userFollows.followingId, platformPosts.userId))
      .where(and(eq(userFollows.followerId, userId), eq(platformPosts.isPublished, true)))
      .orderBy(desc(platformPosts.createdAt))
      .limit(limit);
  }
  // Business follow operations
  async followBusiness(userId: string, businessId: number): Promise<BusinessFollow> {
    const [follow] = await db
      .insert(businessFollows)
      .values({ userId, businessId })
      .onConflictDoNothing()
      .returning();
    return follow;
  }

  async unfollowBusiness(userId: string, businessId: number): Promise<void> {
    await db
      .delete(businessFollows)
      .where(and(
        eq(businessFollows.userId, userId), 
        eq(businessFollows.businessId, businessId)
      ));
  }

  async isBusinessFollowing(userId: string, businessId: number): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(businessFollows)
      .where(and(
        eq(businessFollows.userId, userId), 
        eq(businessFollows.businessId, businessId)
      ));
    return !!follow;
  }
}

export const storage = new DatabaseStorage();
