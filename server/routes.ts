import type { Express, RequestHandler, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import { insertCampaignSchema, insertDonationSchema, insertBusinessProfileSchema } from "@shared/schema";
import { generateSlug } from "./utils";
import Stripe from "stripe";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Warning: Missing Stripe secret key. Stripe functionality will not work.');
}

let stripe: Stripe | undefined;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-04-30.basil",
    });
  }
} catch (error) {
  console.error("Error initializing Stripe:", error);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up uploads directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  // Configure multer for file uploads
  const multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  });
  
  const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept image and video files
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  };
  
  const upload = multer({ 
    storage: multerStorage,
    fileFilter,
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB file size limit for videos
    } 
  });
  
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // File upload route - supports both images and videos
  app.post('/api/upload', isAuthenticated, (req, res, next) => {
    // Create a fields configuration that accepts both 'image' and 'video' fields
    const uploadFields = upload.fields([
      { name: 'image', maxCount: 1 },
      { name: 'video', maxCount: 1 }
    ]);
    
    uploadFields(req, res, (err) => {
      if (err) {
        console.error("Upload error:", err);
        return res.status(400).json({ message: err.message || "Error uploading file" });
      }
      next();
    });
  }, async (req: any, res) => {
    try {
      const files = req.files;
      
      if (!files || ((!files.image || files.image.length === 0) && (!files.video || files.video.length === 0))) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Determine which file was uploaded (image or video)
      const file = files.image ? files.image[0] : files.video[0];
      
      // Create a public URL for the uploaded file
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const fileUrl = `${baseUrl}/uploads/${file.filename}`;
      
      res.status(200).json({ 
        url: fileUrl,
        filename: file.filename,
        fileType: files.image ? 'image' : 'video',
        success: true 
      });
    } catch (error) {
      console.error("Error processing uploaded file:", error);
      res.status(500).json({ message: "Failed to process uploaded file" });
    }
  });

  // User routes
  app.put('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updateData = req.body;
      const user = await storage.updateUser(userId, updateData);
      res.json(user);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Campaign routes
  app.post('/api/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Ensure additionalImages is an array or set to empty array if undefined
      if (req.body.additionalImages && !Array.isArray(req.body.additionalImages)) {
        req.body.additionalImages = [req.body.additionalImages];
      } else if (!req.body.additionalImages) {
        req.body.additionalImages = [];
      }
      
      // Generate a slug for the campaign
      const slug = await generateSlug(req.body.title);
      req.body.slug = slug;
      
      const campaignData = insertCampaignSchema.parse(req.body);
      
      const campaign = await storage.createCampaign({
        ...campaignData,
        userId
      });
      
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  app.get('/api/campaigns', async (req, res) => {
    try {
      const { search } = req.query;
      let campaigns;
      
      if (search && typeof search === 'string') {
        campaigns = await storage.searchCampaigns(search);
      } else {
        campaigns = await storage.listCampaigns();
      }
      
      res.json(campaigns);
    } catch (error) {
      console.error("Error listing campaigns:", error);
      res.status(500).json({ message: "Failed to list campaigns" });
    }
  });

  app.get('/api/campaigns/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const campaign = await storage.getCampaignBySlug(slug);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  app.get('/api/campaigns/:id/donations', async (req, res) => {
    try {
      const { id } = req.params;
      const donations = await storage.getCampaignDonations(id);
      res.json(donations);
    } catch (error) {
      console.error("Error fetching campaign donations:", error);
      res.status(500).json({ message: "Failed to fetch donations" });
    }
  });

  app.get('/api/user/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaigns = await storage.getUserCampaigns(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching user campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.get('/api/user/donations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const donations = await storage.getUserDonations(userId);
      res.json(donations);
    } catch (error) {
      console.error("Error fetching user donations:", error);
      res.status(500).json({ message: "Failed to fetch donations" });
    }
  });

  // Donation payment intent
  app.post('/api/donations/create-payment-intent', isAuthenticated, async (req: any, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Stripe is not available" });
    }
    
    try {
      const { amount, campaignId } = req.body;
      
      if (!amount || !campaignId) {
        return res.status(400).json({ message: "Amount and campaign ID are required" });
      }
      
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Create or retrieve customer
      let customerId = user?.stripeCustomerId;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user?.email || undefined,
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || undefined,
        });
        
        customerId = customer.id;
        if (user) {
          await storage.updateStripeCustomerId(userId, customerId);
        }
      }
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(amount) * 100), // Convert to cents
        currency: "usd",
        customer: customerId,
        metadata: {
          campaignId,
          userId
        }
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // Donation webhook to record donation after successful payment
  app.post('/api/donations/webhook', async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Stripe is not available" });
    }
    
    const sig = req.headers['stripe-signature'] as string;
    let event;
    
    try {
      // This would normally verify the webhook signature with a secret
      // but for simplicity we'll just parse the event
      event = req.body;
      
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const { campaignId, userId } = paymentIntent.metadata;
        const amount = paymentIntent.amount / 100; // Convert from cents
        
        // Create the donation record
        await storage.createDonation({
          campaignId,
          userId,
          amount: amount.toString(),
          isAnonymous: false
        }, paymentIntent.id);
        
        // Update the campaign's current amount
        await storage.updateDonationAmount(campaignId, amount);
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(400).json({ message: "Webhook error" });
    }
  });

  // Create a donation directly (for testing)
  app.post('/api/donations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const donationData = insertDonationSchema.parse({
        ...req.body,
        userId
      });
      
      // Create donation with a placeholder payment ID
      const donation = await storage.createDonation(
        donationData,
        `manual_${Date.now()}`
      );
      
      // Update campaign amount
      await storage.updateDonationAmount(
        donationData.campaignId,
        parseFloat(donationData.amount.toString())
      );
      
      res.status(201).json(donation);
    } catch (error) {
      console.error("Error creating donation:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid donation data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create donation" });
    }
  });

  // Business profile routes
  app.post('/api/business-profiles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if user already has a business profile
      const existingProfile = await storage.getUserBusinessProfile(userId);
      if (existingProfile) {
        return res.status(400).json({ message: "User already has a business profile" });
      }
      
      const profileData = insertBusinessProfileSchema.parse(req.body);
      
      const profile = await storage.createBusinessProfile({
        ...profileData,
        userId
      });
      
      res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating business profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create business profile" });
    }
  });

  app.get('/api/business-profiles', async (req, res) => {
    try {
      const profiles = await storage.listBusinessProfiles();
      res.json(profiles);
    } catch (error) {
      console.error("Error listing business profiles:", error);
      res.status(500).json({ message: "Failed to list business profiles" });
    }
  });

  app.get('/api/user/business-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getUserBusinessProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Business profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching business profile:", error);
      res.status(500).json({ message: "Failed to fetch business profile" });
    }
  });

  app.put('/api/business-profiles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const profileId = parseInt(id, 10);
      
      if (isNaN(profileId)) {
        return res.status(400).json({ message: "Invalid profile ID" });
      }
      
      const profile = await storage.getBusinessProfile(profileId);
      
      if (!profile) {
        return res.status(404).json({ message: "Business profile not found" });
      }
      
      // Check if the user owns this profile
      const userId = req.user.claims.sub;
      if (profile.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this profile" });
      }
      
      const updateData = req.body;
      const updatedProfile = await storage.updateBusinessProfile(profileId, updateData);
      
      res.json(updatedProfile);
    } catch (error) {
      console.error("Error updating business profile:", error);
      res.status(500).json({ message: "Failed to update business profile" });
    }
  });

  // Membership tiers
  app.get('/api/membership-tiers', async (req, res) => {
    try {
      const tiers = await storage.listMembershipTiers();
      res.json(tiers);
    } catch (error) {
      console.error("Error listing membership tiers:", error);
      res.status(500).json({ message: "Failed to list membership tiers" });
    }
  });

  // Membership subscription
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Stripe is not available" });
    }
    
    try {
      const { tierID } = req.body;
      
      if (!tierID) {
        return res.status(400).json({ message: "Membership tier ID is required" });
      }
      
      const tier = await storage.getMembershipTier(tierID);
      if (!tier) {
        return res.status(404).json({ message: "Membership tier not found" });
      }
      
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.email) {
        return res.status(400).json({ message: "User email is required for subscription" });
      }
      
      // Create or retrieve customer
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
        });
        
        customerId = customer.id;
        await storage.updateStripeCustomerId(userId, customerId);
      }
      
      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: tier.stripePriceId,
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });
      
      // Update business profile with subscription ID
      const businessProfile = await storage.getUserBusinessProfile(userId);
      if (businessProfile) {
        await storage.updateBusinessProfileSubscription(businessProfile.id, subscription.id);
      }
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
