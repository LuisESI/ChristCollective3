import {
  users,
  campaigns,
  donations,
  businessProfiles,
  membershipTiers,
  contentCreators,
  sponsorshipApplications,
  socialMediaPosts,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, like, sql } from "drizzle-orm";
import { generateSlug } from "./utils";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  getUsersCount(): Promise<number>;
  
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
  listSponsoredSocialMediaPosts(): Promise<SocialMediaPost[]>;
  updateSocialMediaPost(id: number, data: Partial<SocialMediaPost>): Promise<SocialMediaPost>;
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
    let query = db.select().from(contentCreators);
    
    if (sponsoredOnly) {
      query = query.where(eq(contentCreators.isSponsored, true));
    }
    
    return await query.orderBy(desc(contentCreators.createdAt));
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
    let query = db.select().from(sponsorshipApplications);
    
    if (status) {
      query = query.where(eq(sponsorshipApplications.status, status));
    }
    
    return await query.orderBy(desc(sponsorshipApplications.createdAt));
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
}

export const storage = new DatabaseStorage();
