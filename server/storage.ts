import {
  users,
  campaigns,
  donations,
  businessProfiles,
  membershipTiers,
  type User,
  type UpsertUser,
  type Campaign,
  type InsertCampaign,
  type Donation,
  type InsertDonation,
  type BusinessProfile,
  type InsertBusinessProfile,
  type MembershipTier,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, like } from "drizzle-orm";
import { generateSlug } from "./utils";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  
  // Stripe related user updates
  updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User>;
  
  // Campaign operations
  createCampaign(campaignData: InsertCampaign & { userId: string }): Promise<Campaign>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  getCampaignBySlug(slug: string): Promise<Campaign | undefined>;
  listCampaigns(limit?: number): Promise<Campaign[]>;
  searchCampaigns(query: string): Promise<Campaign[]>;
  updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign>;
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
      .where(eq(campaigns.isActive, true))
      .orderBy(desc(campaigns.createdAt))
      .limit(limit);
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
    const [profile] = await db.select().from(businessProfiles).where(eq(businessProfiles.id, id));
    return profile;
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
}

export const storage = new DatabaseStorage();
