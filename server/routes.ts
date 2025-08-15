import type { Express, RequestHandler, Request } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { z } from "zod";
import { 
  insertCampaignSchema, 
  insertDonationSchema, 
  insertBusinessProfileSchema,
  insertContentCreatorSchema,
  insertSponsorshipApplicationSchema,
  insertMinistryProfileSchema,
  insertMinistryPostSchema,
  insertMinistryEventSchema,
  insertGroupChatQueueSchema,
  insertGroupChatMessageSchema
} from "@shared/schema";
import { generateSlug } from "./utils";
import Stripe from "stripe";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { youtubeService } from "./youtube";
import { tiktokService } from "./tiktok";
import { instagramService } from "./instagram";
import { emailService } from "./emailService";

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
  
  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadDir));
  
  // Serve favicon files
  app.get('/favicon.png', (req, res) => {
    res.sendFile(path.resolve(process.cwd(), 'public', 'favicon.png'));
  });

  app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.resolve(process.cwd(), 'public', 'favicon.ico'));
  });
  
  // Auth middleware
  setupAuth(app);

  // Auth routes
  app.get('/api/user', (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Update basic user profile
  app.put('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updateData = req.body;
      
      // Validate the input
      const validatedData = z.object({
        bio: z.string().optional(),
        profileImageUrl: z.string().optional(),
      }).parse(updateData);

      const updatedUser = await storage.updateUser(userId, validatedData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Profile image upload endpoint
  app.post('/api/upload/profile-image', isAuthenticated, upload.single('profileImage'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Return the URL path for the uploaded file
      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ url: imageUrl });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Check if current user is an approved creator
  app.get('/api/user/creator-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const creator = await storage.getUserContentCreator(userId);
      
      if (!creator) {
        return res.json({ isCreator: false });
      }
      
      // Get creator's social media posts
      const posts = await storage.getSocialMediaPostsByCreator(creator.id);
      
      // Calculate stats like the public profile does
      const platforms = creator.platforms || [];
      const totalFollowers = Array.isArray(platforms) ? 
        platforms.reduce((sum: number, platform: any) => sum + (platform.subscriberCount || 0), 0) : 0;
      
      const enhancedCreator = {
        ...creator,
        posts,
        totalPosts: posts?.length || 0,
        totalFollowers,
        platformCount: Array.isArray(platforms) ? platforms.length : 0
      };
      
      res.json({
        isCreator: true,
        creatorProfile: enhancedCreator
      });
    } catch (error) {
      console.error("Error fetching creator status:", error);
      res.status(500).json({ message: "Failed to fetch creator status" });
    }
  });

  // Admin middleware
  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      next();
    } catch (error) {
      res.status(500).json({ message: "Error checking admin status" });
    }
  };

  // Admin routes
  app.get('/api/admin/sponsorship-applications', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const applications = await storage.listSponsorshipApplications();
      res.json(applications);
    } catch (error) {
      console.error("Error fetching sponsorship applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.post('/api/admin/sponsorship-applications/:id/approve', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const applicationId = parseInt(id);
      
      if (isNaN(applicationId)) {
        return res.status(400).json({ message: "Invalid application ID" });
      }
      
      // Get the application first
      const application = await storage.getSponsorshipApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Check if user already has a content creator profile
      const existingCreator = await storage.getUserContentCreator(application.userId);
      
      if (!existingCreator) {
        // Create content creator profile from approved application
        const newCreator = await storage.createContentCreator({
          name: application.name,
          platforms: application.platforms as { platform: string; profileUrl: string; subscriberCount?: number }[],
          content: application.content,
          audience: application.audience,
          bio: application.message, // Use their message as bio
          userId: application.userId
        });

        // Update to mark as sponsored
        await storage.updateContentCreator(newCreator.id, {
          isSponsored: true,
          sponsorshipStartDate: new Date()
        });
      } else {
        // Update existing creator to be sponsored
        await storage.updateContentCreator(existingCreator.id, {
          isSponsored: true,
          sponsorshipStartDate: new Date(),
          platforms: application.platforms,
          content: application.content,
          audience: application.audience
        });
      }
      
      // Approve the application
      const approvedApplication = await storage.updateSponsorshipApplication(applicationId, {
        status: 'approved',
        reviewedAt: new Date()
      });
      
      res.json(approvedApplication);
    } catch (error) {
      console.error("Error approving sponsorship application:", error);
      res.status(500).json({ message: "Failed to approve application" });
    }
  });

  app.post('/api/admin/sponsorship-applications/:id/reject', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const applicationId = parseInt(id);
      
      if (isNaN(applicationId)) {
        return res.status(400).json({ message: "Invalid application ID" });
      }
      
      const rejectedApplication = await storage.updateSponsorshipApplication(applicationId, {
        status: 'rejected',
        reviewedAt: new Date()
      });
      
      if (!rejectedApplication) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      res.json(rejectedApplication);
    } catch (error) {
      console.error("Error rejecting sponsorship application:", error);
      res.status(500).json({ message: "Failed to reject application" });
    }
  });

  app.get('/api/admin/campaigns', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const campaigns = await storage.listCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.get('/api/admin/campaigns/pending', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const pendingCampaigns = await storage.listPendingCampaigns();
      res.json(pendingCampaigns);
    } catch (error) {
      console.error("Error fetching pending campaigns:", error);
      res.status(500).json({ message: "Failed to fetch pending campaigns" });
    }
  });

  app.post('/api/admin/campaigns/:id/approve', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const approvedCampaign = await storage.approveCampaign(id);
      res.json(approvedCampaign);
    } catch (error) {
      console.error("Error approving campaign:", error);
      res.status(500).json({ message: "Failed to approve campaign" });
    }
  });

  app.post('/api/admin/campaigns/:id/reject', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const rejectedCampaign = await storage.rejectCampaign(id);
      res.json(rejectedCampaign);
    } catch (error) {
      console.error("Error rejecting campaign:", error);
      res.status(500).json({ message: "Failed to reject campaign" });
    }
  });

  app.delete('/api/admin/campaigns/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCampaign(id);
      res.json({ message: "Campaign deleted successfully" });
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  });

  app.get('/api/admin/business-profiles', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const profiles = await storage.listBusinessProfiles();
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching business profiles:", error);
      res.status(500).json({ message: "Failed to fetch business profiles" });
    }
  });

  // Content creator routes
  app.get('/api/content-creators', async (req, res) => {
    try {
      const { sponsored } = req.query;
      const sponsoredOnly = sponsored === 'true';
      const creators = await storage.listContentCreators(sponsoredOnly);
      res.json(creators);
    } catch (error) {
      console.error("Error fetching content creators:", error);
      res.status(500).json({ message: "Failed to fetch content creators" });
    }
  });

  app.get('/api/content-creators/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const creatorId = parseInt(id);
      
      if (isNaN(creatorId)) {
        return res.status(400).json({ message: "Invalid creator ID" });
      }
      
      const creator = await storage.getContentCreator(creatorId);
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }
      
      // Get creator's social media posts (only visible ones for public view)
      const posts = await storage.getVisibleSocialMediaPostsByCreator(creatorId);
      
      // Get internal follower count from the follow system
      const totalFollowers = await storage.getUserFollowersCount(creator.userId);
      
      res.json({ ...creator, posts, totalFollowers });
    } catch (error) {
      console.error("Error fetching content creator:", error);
      res.status(500).json({ message: "Failed to fetch content creator" });
    }
  });

  // Update social media post visibility
  app.put('/api/social-media-posts/:id/visibility', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const postId = parseInt(id);
      const { isVisibleOnProfile } = req.body;
      const userId = req.user.id;
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      // Get the post and verify ownership
      const post = await storage.getSocialMediaPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Get creator to verify ownership
      const creator = await storage.getContentCreator(post.creatorId);
      if (!creator || (creator.userId !== userId && !req.user.isAdmin)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedPost = await storage.updateSocialMediaPost(postId, {
        isVisibleOnProfile: Boolean(isVisibleOnProfile)
      });
      
      res.json(updatedPost);
    } catch (error) {
      console.error("Error updating post visibility:", error);
      res.status(500).json({ message: "Failed to update post visibility" });
    }
  });

  // Update content creator profile
  app.put('/api/content-creators/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const creatorId = parseInt(id);
      const userId = req.user.id;
      
      if (isNaN(creatorId)) {
        return res.status(400).json({ message: "Invalid creator ID" });
      }
      
      // Verify the creator belongs to the authenticated user
      const existingCreator = await storage.getContentCreator(creatorId);
      if (!existingCreator) {
        return res.status(404).json({ message: "Creator not found" });
      }
      
      if (existingCreator.userId !== userId && !req.user.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Validate the update data
      const updateData = insertContentCreatorSchema.partial().parse(req.body);
      
      const updatedCreator = await storage.updateContentCreator(creatorId, {
        ...updateData,
        updatedAt: new Date()
      });
      
      res.json(updatedCreator);
    } catch (error) {
      console.error("Error updating content creator:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update creator profile" });
    }
  });

  app.get('/api/users/:userId/content-creator', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      
      // Only allow users to view their own creator profile or admins to view any
      if (req.user.claims.sub !== userId && !req.user.claims.email?.includes('admin')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const creator = await storage.getUserContentCreator(userId);
      if (!creator) {
        return res.status(404).json({ message: "Creator profile not found" });
      }
      
      const posts = await storage.getSocialMediaPostsByCreator(creator.id);
      res.json({ ...creator, posts });
    } catch (error) {
      console.error("Error fetching user content creator:", error);
      res.status(500).json({ message: "Failed to fetch creator profile" });
    }
  });

  // Get all posts for a creator (for post management)
  app.get('/api/social-media-posts/creator/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const creatorId = parseInt(id);
      const userId = req.user.id;
      
      if (isNaN(creatorId)) {
        return res.status(400).json({ message: "Invalid creator ID" });
      }
      
      // Verify the creator belongs to the authenticated user
      const creator = await storage.getContentCreator(creatorId);
      if (!creator || (creator.userId !== userId && !req.user.isAdmin)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const posts = await storage.getSocialMediaPostsByCreator(creatorId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching creator posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // Platform posts endpoints - unified content sharing for all user types
  
  // Create a new platform post
  app.post('/api/platform-posts', isAuthenticated, async (req: any, res) => {
    try {
      const { authorType, authorId, title, content, mediaUrls, mediaType, tags } = req.body;
      const userId = req.user.id;
      
      // Validate required fields
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }

      // Verify user ownership of the profile they're posting as
      if (authorType === 'creator' && authorId) {
        const creator = await storage.getContentCreator(authorId);
        if (!creator || creator.userId !== userId) {
          return res.status(403).json({ message: "Access denied: You don't own this creator profile" });
        }
      } else if (authorType === 'business' && authorId) {
        const business = await storage.getBusinessProfile(authorId);
        if (!business || business.userId !== userId) {
          return res.status(403).json({ message: "Access denied: You don't own this business profile" });
        }
      } else if (authorType === 'ministry' && authorId) {
        const ministry = await storage.getUserMinistryProfile(userId);
        if (!ministry || ministry.id !== authorId) {
          return res.status(403).json({ message: "Access denied: You don't own this ministry profile" });
        }
      }

      const post = await storage.createPlatformPost({
        userId,
        authorType,
        authorId,
        title,
        content,
        mediaUrls: mediaUrls || [],
        mediaType: mediaType || 'image',
        tags: tags || [],
        isPublished: true,
      });

      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating platform post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  // Get all platform posts (public feed)
  app.get('/api/platform-posts', async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const posts = await storage.listPlatformPosts(limit);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching platform posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // Get user's platform posts
  app.get('/api/platform-posts/user/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.id;
      
      // Users can only see their own posts unless they're admin
      if (userId !== currentUserId && !req.user.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const posts = await storage.getUserPlatformPosts(userId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching user platform posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // Get specific platform post
  app.get('/api/platform-posts/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const postId = parseInt(id);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      const post = await storage.getPlatformPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      res.json(post);
    } catch (error) {
      console.error("Error fetching platform post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  // Update platform post
  app.put('/api/platform-posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const postId = parseInt(id);
      const userId = req.user.id;
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      const post = await storage.getPlatformPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Check ownership
      if (post.userId !== userId && !req.user.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedPost = await storage.updatePlatformPost(postId, req.body);
      res.json(updatedPost);
    } catch (error) {
      console.error("Error updating platform post:", error);
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  // Delete platform post
  app.delete('/api/platform-posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const postId = parseInt(id);
      const userId = req.user.id;
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      const post = await storage.getPlatformPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Check ownership
      if (post.userId !== userId && !req.user.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deletePlatformPost(postId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting platform post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Post interaction endpoints
  
  // Like/unlike a post
  app.post('/api/platform-posts/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const postId = parseInt(id);
      const userId = req.user.id;
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      const post = await storage.getPlatformPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Check if user already liked the post
      const existingLike = await storage.getUserPostInteraction(postId, userId, 'like');
      
      if (existingLike) {
        // Unlike the post
        await storage.deletePostInteraction(existingLike.id);
        await storage.updatePlatformPost(postId, { 
          likesCount: Math.max(0, (post.likesCount || 0) - 1) 
        });
        res.json({ liked: false, likesCount: Math.max(0, (post.likesCount || 0) - 1) });
      } else {
        // Like the post
        await storage.createPostInteraction({
          postId,
          userId,
          type: 'like',
        });
        await storage.updatePlatformPost(postId, { 
          likesCount: (post.likesCount || 0) + 1 
        });
        
        // Create notification for like
        await storage.createNotificationForLike(userId, postId, post.userId);
        
        res.json({ liked: true, likesCount: (post.likesCount || 0) + 1 });
      }
    } catch (error) {
      console.error("Error toggling post like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // Add comment to post
  app.post('/api/platform-posts/:id/comment', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const postId = parseInt(id);
      const userId = req.user.id;
      const { content } = req.body;
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "Comment content is required" });
      }
      
      const post = await storage.getPlatformPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const comment = await storage.createPostInteraction({
        postId,
        userId,
        type: 'comment',
        content: content.trim(),
      });
      
      await storage.updatePlatformPost(postId, { 
        commentsCount: (post.commentsCount || 0) + 1 
      });
      
      // Create notification for comment
      await storage.createNotificationForComment(userId, postId, post.userId, content.trim());
      
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // Get post interactions (comments)
  app.get('/api/platform-posts/:id/interactions', async (req: any, res) => {
    try {
      const { id } = req.params;
      const postId = parseInt(id);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      const interactions = await storage.getPostInteractions(postId);
      res.json(interactions);
    } catch (error) {
      console.error("Error fetching post interactions:", error);
      res.status(500).json({ message: "Failed to fetch interactions" });
    }
  });

  // Delete platform post
  app.delete('/api/platform-posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const postId = parseInt(id);
      const userId = req.user.id;
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      // Check if post exists and user owns it
      const post = await storage.getPlatformPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      if (post.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this post" });
      }
      
      // Delete the post
      await storage.deletePlatformPost(postId);
      
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting platform post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Delete comment
  app.delete('/api/comments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const commentId = parseInt(id);
      const userId = req.user.id;
      
      if (isNaN(commentId)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }
      
      // Check if comment exists and user owns it
      const comment = await storage.getPostComment(commentId);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      if (comment.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this comment" });
      }
      
      // Get the post to update comment count
      const post = await storage.getPlatformPost(comment.postId);
      if (post) {
        await storage.updatePlatformPost(comment.postId, { 
          commentsCount: Math.max((post.commentsCount || 1) - 1, 0)
        });
      }
      
      // Delete the comment
      await storage.deletePostComment(commentId);
      
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });
  
  // Get post comments only
  app.get('/api/platform-posts/:id/comments', async (req: any, res) => {
    try {
      const { id } = req.params;
      const postId = parseInt(id);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      const comments = await storage.getPostComments(postId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching post comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });
  
  // File upload route - supports both images and videos
  app.post('/api/upload', isAuthenticated, (req, res, next) => {
    // Create a fields configuration that accepts both 'image', 'video' and 'file' fields
    const uploadFields = upload.fields([
      { name: 'image', maxCount: 1 },
      { name: 'video', maxCount: 1 },
      { name: 'file', maxCount: 1 }
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
      
      if (!files || ((!files.image || files.image.length === 0) && (!files.video || files.video.length === 0) && (!files.file || files.file.length === 0))) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Determine which file was uploaded (image, video, or file)
      const file = files.image ? files.image[0] : files.video ? files.video[0] : files.file[0];
      
      // Create a public URL for the uploaded file
      // Use relative path for flexibility across environments
      const fileUrl = `/uploads/${file.filename}`;
      
      res.status(200).json({ 
        url: fileUrl,
        filename: file.filename,
        fileType: files.image ? 'image' : files.video ? 'video' : 'file',
        success: true 
      });
    } catch (error) {
      console.error("Error processing uploaded file:", error);
      res.status(500).json({ message: "Failed to process uploaded file" });
    }
  });

  // User ministry profile route
  app.get('/api/user/ministry-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getUserMinistryProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Ministry profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching ministry profile:", error);
      res.status(500).json({ message: "Failed to fetch ministry profile" });
    }
  });

  // User routes
  app.put('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updateData = req.body;
      
      // If username is being updated, check for uniqueness
      if (updateData.username) {
        const currentUser = await storage.getUser(userId);
        
        // Only check if username is actually changing
        if (currentUser && updateData.username !== currentUser.username) {
          const existingUser = await storage.getUserByUsername(updateData.username);
          if (existingUser) {
            return res.status(400).json({ 
              message: "Username already taken",
              field: "username"
            });
          }
        }
      }
      
      const user = await storage.updateUser(userId, updateData);
      res.json(user);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Privacy settings route
  app.put('/api/user/privacy-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { showEmail, showPhone, showLocation } = req.body;
      
      // Validate input
      const privacyData = {
        showEmail: Boolean(showEmail),
        showPhone: Boolean(showPhone),
        showLocation: Boolean(showLocation)
      };
      
      const user = await storage.updateUser(userId, privacyData);
      res.json(user);
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      res.status(500).json({ message: "Failed to update privacy settings" });
    }
  });

  // Campaign routes
  app.post('/api/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
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

  // Get campaign by ID or slug
  app.get('/api/campaigns/:identifier', async (req, res) => {
    try {
      const { identifier } = req.params;
      let campaign;
      
      // Check if identifier looks like a UUID (for ID lookup) or slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      
      if (isUUID) {
        campaign = await storage.getCampaign(identifier);
      } else {
        campaign = await storage.getCampaignBySlug(identifier);
      }
      
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
      const userId = req.user.id;
      const campaigns = await storage.getUserCampaigns(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching user campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });
  
  // Update campaign route
  app.put('/api/campaigns/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Check if the campaign exists
      const campaign = await storage.getCampaign(id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Verify that the user owns this campaign
      if (campaign.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this campaign" });
      }
      
      // Update campaign data
      const updateData = req.body;
      const updatedCampaign = await storage.updateCampaign(id, updateData);
      
      res.json(updatedCampaign);
    } catch (error) {
      console.error("Error updating campaign:", error);
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });
  
  // Delete campaign route
  app.delete('/api/campaigns/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Check if the campaign exists
      const campaign = await storage.getCampaign(id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Verify that the user owns this campaign
      if (campaign.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this campaign" });
      }
      
      // Delete the campaign
      await storage.deleteCampaign(id);
      
      res.status(200).json({ message: "Campaign deleted successfully" });
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  });

  app.get('/api/user/donations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const donations = await storage.getUserDonations(userId);
      res.json(donations);
    } catch (error) {
      console.error("Error fetching user donations:", error);
      res.status(500).json({ message: "Failed to fetch donations" });
    }
  });

  // Donation payment intent - no authentication required for donations
  app.post('/api/donations/create-payment-intent', async (req: any, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Stripe is not available" });
    }
    
    try {
      const { amount, campaignId, tip = 0, guestInfo } = req.body;
      
      if (!amount || !campaignId) {
        return res.status(400).json({ message: "Amount and campaign ID are required" });
      }
      
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Calculate total amount including tip
      const donationAmount = parseFloat(amount);
      const tipAmount = parseFloat(tip) || 0;
      const totalAmount = donationAmount + tipAmount;
      
      console.log(`Payment Intent Creation - Donation: $${donationAmount}, Tip: $${tipAmount}, Total: $${totalAmount}`);
      
      // Create customer (optional for guest donations)
      let customerId: string | undefined = undefined;
      if (req.user?.id) {
        const user = await storage.getUser(req.user.id);
        customerId = user?.stripeCustomerId || undefined;
        
        if (!customerId && user?.email) {
          const customer = await stripe.customers.create({
            email: user.email,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
          });
          
          customerId = customer.id;
          await storage.updateStripeCustomerId(req.user.id, customerId);
        }
      }
      
      const metadata: any = {
        campaignId,
        userId: req.user?.id || 'guest',
        donationAmount: donationAmount.toString(),
        tipAmount: tipAmount.toString()
      };

      // Add guest information to metadata if provided
      if (guestInfo && !req.user?.id) {
        metadata.guestFirstName = guestInfo.firstName;
        metadata.guestLastName = guestInfo.lastName;
        metadata.guestEmail = guestInfo.email;
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency: "usd",
        customer: customerId,
        metadata
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

  // Complete donation after successful payment
  app.post('/api/donations/complete', async (req: any, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Stripe is not available" });
    }

    try {
      const { paymentIntentId, campaignId } = req.body;
      console.log(`Donation completion request - PaymentIntent: ${paymentIntentId}, Campaign: ${campaignId}`);

      if (!paymentIntentId || !campaignId) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      // Retrieve the payment intent from Stripe to get the details
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      console.log(`PaymentIntent status: ${paymentIntent.status}, Amount: ${paymentIntent.amount}`);

      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "Payment not completed" });
      }

      // Extract metadata from payment intent
      const donationAmount = parseFloat(paymentIntent.metadata.donationAmount || '0');
      const tipAmount = parseFloat(paymentIntent.metadata.tipAmount || '0');
      const guestFirstName = paymentIntent.metadata.guestFirstName;
      const guestLastName = paymentIntent.metadata.guestLastName;
      const guestEmail = paymentIntent.metadata.guestEmail;
      
      console.log(`Processing donation - Amount: $${donationAmount}, Tip: $${tipAmount}`);

      // Get campaign details
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      // Create donation record
      const donationData = {
        campaignId: campaignId,
        amount: donationAmount.toString(),
        stripePaymentId: paymentIntentId,
        message: '',
        isAnonymous: !guestFirstName && !guestLastName, // Not anonymous if guest info provided
      };

      console.log('Creating donation record:', donationData);
      const donation = await storage.createDonation(donationData, paymentIntentId);
      console.log('Donation created with ID:', donation.id);

      // Update campaign total
      console.log(`Updating campaign total by $${donationAmount}`);
      await storage.updateDonationAmount(campaignId, donationAmount);

      // Send confirmation email if guest information is available
      if (guestEmail && guestFirstName && guestLastName) {
        console.log(`Sending confirmation email to ${guestEmail}`);
        try {
          const emailData = {
            recipientEmail: guestEmail,
            recipientName: `${guestFirstName} ${guestLastName}`,
            donation: {
              amount: donationAmount,
              tip: tipAmount,
              total: donationAmount + tipAmount,
              transactionId: paymentIntentId,
              date: new Date(),
            },
            campaign: {
              title: campaign.title,
              description: campaign.description,
            },
          };

          const emailSent = await emailService.sendDonationConfirmation(emailData);
          if (emailSent) {
            console.log('Confirmation email sent successfully');
          } else {
            console.warn('Failed to send confirmation email');
          }
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
        }
      }

      // Return donation details for receipt
      const response = {
        id: donation.id,
        amount: donationAmount,
        tip: tipAmount,
        campaignTitle: campaign.title,
        donorName: guestFirstName && guestLastName ? `${guestFirstName} ${guestLastName}` : undefined,
        isAnonymous: !guestFirstName && !guestLastName,
        createdAt: donation.createdAt,
        stripePaymentId: paymentIntentId,
      };
      
      console.log('Donation completion successful:', response);
      res.json(response);

    } catch (error: any) {
      console.error("Error completing donation:", error);
      res.status(500).json({ message: "Error completing donation: " + error.message });
    }
  });

  // Manual donation recording for recovery purposes
  app.post('/api/donations/manual', async (req: any, res) => {
    try {
      const { amount, campaignId, stripePaymentId, description } = req.body;
      
      if (!amount || !campaignId) {
        return res.status(400).json({ message: "Amount and campaign ID are required" });
      }

      // Get campaign details
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      // Create donation record
      const donationData = {
        campaignId: campaignId,
        amount: amount.toString(),
        stripePaymentId: stripePaymentId || `manual_${Date.now()}`,
        message: description || '',
        isAnonymous: true,
      };

      console.log('Creating manual donation record:', donationData);
      const donation = await storage.createDonation(donationData, donationData.stripePaymentId);

      // Update campaign total
      await storage.updateDonationAmount(campaignId, parseFloat(amount));

      res.json({
        success: true,
        donation: donation,
        message: `Donation of $${amount} recorded successfully`
      });

    } catch (error: any) {
      console.error("Error creating manual donation:", error);
      res.status(500).json({ message: "Error creating donation: " + error.message });
    }
  });

  // Create a donation directly (for testing)
  app.post('/api/donations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
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
        donationData.campaignId || '',
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
      const userId = req.user.id;
      
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

  // Get single business profile by ID
  app.get('/api/business-profiles/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const profile = await storage.getBusinessProfile(parseInt(id));
      
      if (!profile) {
        return res.status(404).json({ message: "Business profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching business profile:", error);
      res.status(500).json({ message: "Failed to fetch business profile" });
    }
  });

  app.get('/api/user/business-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      const userId = req.user.id;
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

  app.delete('/api/business-profiles/:id', isAuthenticated, async (req: any, res) => {
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
      const userId = req.user.id;
      if (profile.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this profile" });
      }
      
      await storage.deleteBusinessProfile(profileId);
      
      res.json({ message: "Business profile deleted successfully" });
    } catch (error) {
      console.error("Error deleting business profile:", error);
      res.status(500).json({ message: "Failed to delete business profile" });
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
      
      const userId = req.user.id;
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
          price: tier.stripePriceId === null ? undefined : tier.stripePriceId,
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

  // Statistics endpoint
  app.get("/api/statistics", async (req, res) => {
    try {
      const campaigns = await storage.listCampaigns();
      const businessProfiles = await storage.listBusinessProfiles();
      const users = await storage.getUsersCount();
      
      // Calculate total donations raised from campaigns
      const totalDonations = campaigns.reduce((sum, campaign) => {
        const amount = parseFloat(campaign.currentAmount || '0');
        return sum + amount;
      }, 0);
      
      // Get unique industries from business profiles
      const industries = new Set(businessProfiles.map(profile => profile.industry).filter(Boolean));
      
      res.json({
        communityMembers: users,
        donationsRaised: totalDonations,
        businessMembers: businessProfiles.length,
        industries: industries.size,
        supportAvailable: "24/7"
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Content Creator routes
  app.get("/api/content-creators", async (req, res) => {
    try {
      const sponsoredOnly = req.query.sponsored === 'true';
      const creators = await storage.listContentCreators(sponsoredOnly);
      res.json(creators);
    } catch (error) {
      console.error("Error fetching content creators:", error);
      res.status(500).json({ message: "Failed to fetch content creators" });
    }
  });
  
  app.get("/api/content-creators/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const creator = await storage.getContentCreator(id);
      
      if (!creator) {
        return res.status(404).json({ message: "Content creator not found" });
      }
      
      res.json(creator);
    } catch (error) {
      console.error("Error fetching content creator:", error);
      res.status(500).json({ message: "Failed to fetch content creator" });
    }
  });
  
  app.get("/api/user/content-creator", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const creator = await storage.getUserContentCreator(userId);
      res.json(creator || null);
    } catch (error) {
      console.error("Error fetching user's content creator profile:", error);
      res.status(500).json({ message: "Failed to fetch content creator profile" });
    }
  });
  
  app.post("/api/content-creators", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Check if user already has a content creator profile
      const existingCreator = await storage.getUserContentCreator(userId);
      if (existingCreator) {
        return res.status(400).json({ message: "You already have a content creator profile" });
      }
      
      const validatedData = insertContentCreatorSchema.parse(req.body);
      const creator = await storage.createContentCreator({
        ...validatedData,
        userId
      });
      
      res.status(201).json(creator);
    } catch (error) {
      console.error("Error creating content creator:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create content creator profile" });
    }
  });
  
  // Sponsorship Application routes
  app.get("/api/sponsorship-applications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const applications = await storage.getUserSponsorshipApplications(userId);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching sponsorship applications:", error);
      res.status(500).json({ message: "Failed to fetch sponsorship applications" });
    }
  });
  
  app.post("/api/sponsorship-applications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log(`Sponsorship application submission for user: ${userId}`);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      // Check if user already has a pending application
      const existingApplications = await storage.getUserSponsorshipApplications(userId);
      const hasPendingApplication = existingApplications.some(app => app.status === "pending");
      
      if (hasPendingApplication) {
        console.log(`User ${userId} already has pending application`);
        return res.status(400).json({ message: "You already have a pending sponsorship application" });
      }
      
      console.log('Validating application data...');
      const validatedData = insertSponsorshipApplicationSchema.parse(req.body);
      console.log('Validation successful, creating application...');
      
      const application = await storage.createSponsorshipApplication({
        ...validatedData,
        userId
      });
      
      console.log(`Sponsorship application created successfully with ID: ${application.id}`);
      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating sponsorship application:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }
      
      // Database or other server errors
      if (error instanceof Error) {
        console.error("Server error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        return res.status(500).json({ 
          message: "Failed to submit sponsorship application",
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
      
      res.status(500).json({ message: "Failed to submit sponsorship application" });
    }
  });

  // File upload routes
  app.post('/api/upload/profile-image', isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      const userId = req.user.id;
      const imageUrl = `/uploads/${req.file.filename}`;
      
      console.log(`Updating user ${userId} profile image to: ${imageUrl}`);
      
      // Update user's profile image
      const updatedUser = await storage.updateUser(userId, { profileImageUrl: imageUrl });
      
      console.log('Updated user:', JSON.stringify(updatedUser, null, 2));
      
      res.json({ imageUrl, profileImageUrl: updatedUser.profileImageUrl });
    } catch (error) {
      console.error('Error uploading profile image:', error);
      res.status(500).json({ message: 'Failed to upload profile image' });
    }
  });

  app.post('/api/upload/business-logo', isAuthenticated, upload.single('logo'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No logo file provided' });
      }

      const userId = req.user.id;
      const logoUrl = `/uploads/${req.file.filename}`;
      
      // Get user's business profile
      const profile = await storage.getUserBusinessProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: 'Business profile not found' });
      }
      
      // Update business profile logo
      await storage.updateBusinessProfile(profile.id, { logo: logoUrl });
      
      res.json({ logoUrl });
    } catch (error) {
      console.error('Error uploading business logo:', error);
      res.status(500).json({ message: 'Failed to upload business logo' });
    }
  });

  // Social media posts endpoints
  app.get('/api/social-media-posts', async (req, res) => {
    try {
      const posts = await storage.listSponsoredSocialMediaPosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching social media posts:", error);
      res.status(500).json({ message: "Failed to fetch social media posts" });
    }
  });

  app.get('/api/content-creators/:id/posts', async (req, res) => {
    try {
      const creatorId = parseInt(req.params.id);
      const posts = await storage.getSocialMediaPostsByCreator(creatorId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching creator posts:", error);
      res.status(500).json({ message: "Failed to fetch creator posts" });
    }
  });

  app.post('/api/content-creators/:id/posts', isAuthenticated, async (req: any, res) => {
    try {
      const creatorId = parseInt(req.params.id);
      const postData = req.body;
      
      // Verify the creator belongs to the authenticated user
      const creator = await storage.getContentCreator(creatorId);
      if (!creator || creator.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const post = await storage.createSocialMediaPost({
        ...postData,
        creatorId
      });
      
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating social media post:", error);
      res.status(500).json({ message: "Failed to create social media post" });
    }
  });

  // YouTube API endpoint to fetch real video data
  app.get('/api/youtube/video', async (req, res) => {
    try {
      const { url } = req.query;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: "YouTube URL is required" });
      }
      
      const videoData = await youtubeService.getVideoData(url);
      
      if (!videoData) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      // Format the data for frontend consumption
      const formattedData = {
        id: videoData.id,
        title: videoData.title,
        description: videoData.description,
        thumbnail: videoData.thumbnail,
        channelTitle: videoData.channelTitle,
        publishedAt: videoData.publishedAt,
        viewCount: youtubeService.formatCount(videoData.viewCount),
        likeCount: youtubeService.formatCount(videoData.likeCount),
        commentCount: youtubeService.formatCount(videoData.commentCount),
        duration: youtubeService.formatDuration(videoData.duration),
        url: url
      };
      
      res.json(formattedData);
    } catch (error) {
      console.error("Error fetching YouTube data:", error);
      res.status(500).json({ message: "Failed to fetch YouTube video data" });
    }
  });

  // YouTube API endpoint to fetch channel data
  app.get('/api/youtube/channel', async (req, res) => {
    try {
      const { handle } = req.query;
      
      if (!handle || typeof handle !== 'string') {
        return res.status(400).json({ message: "Channel handle is required" });
      }
      
      const channelData = await youtubeService.getChannelData(handle);
      
      if (!channelData) {
        return res.status(404).json({ message: "Channel not found" });
      }
      
      // Format the data for frontend consumption
      const formattedData = {
        id: channelData.id,
        title: channelData.title,
        description: channelData.description,
        thumbnail: channelData.thumbnail,
        subscriberCount: youtubeService.formatCount(channelData.subscriberCount),
        videoCount: youtubeService.formatCount(channelData.videoCount),
        viewCount: youtubeService.formatCount(channelData.viewCount),
        customUrl: channelData.customUrl,
        publishedAt: channelData.publishedAt,
      };
      
      res.json(formattedData);
    } catch (error) {
      console.error("Error fetching YouTube channel data:", error);
      res.status(500).json({ message: "Failed to fetch YouTube channel data" });
    }
  });

  // YouTube API endpoint to fetch channel videos and populate Recent Content
  app.get('/api/youtube/channel-videos', async (req, res) => {
    try {
      const { handle, maxResults = 5 } = req.query;
      
      if (!handle || typeof handle !== 'string') {
        return res.status(400).json({ message: "Channel handle is required" });
      }
      
      // Get channel ID from handle
      const channelId = await youtubeService.getChannelIdFromHandle(handle);
      
      if (!channelId) {
        return res.status(404).json({ message: "Channel not found" });
      }
      
      // Get latest videos
      const videos = await youtubeService.getChannelVideos(channelId, parseInt(maxResults as string));
      
      res.json(videos);
    } catch (error) {
      console.error("Error fetching YouTube channel videos:", error);
      res.status(500).json({ message: "Failed to fetch YouTube channel videos" });
    }
  });

  // Admin endpoint to populate creator's Recent Content with real YouTube videos
  app.post('/api/admin/populate-creator-content/:creatorId', isAuthenticated, async (req: any, res) => {
    try {
      const { creatorId } = req.params;
      const { channelHandle } = req.body;
      
      if (!channelHandle) {
        return res.status(400).json({ message: "Channel handle is required" });
      }
      
      // Get channel ID from handle
      const channelId = await youtubeService.getChannelIdFromHandle(channelHandle);
      
      if (!channelId) {
        return res.status(404).json({ message: "Channel not found" });
      }
      
      // Get latest videos (limit to 5 for Recent Content)
      const videos = await youtubeService.getChannelVideos(channelId, 5);
      
      if (videos.length === 0) {
        return res.status(404).json({ message: "No videos found for this channel" });
      }
      
      // Clear existing posts for this creator
      await storage.clearCreatorPosts(parseInt(creatorId));
      
      // Add real YouTube videos as social media posts
      for (const video of videos) {
        await storage.createSocialMediaPost({
          creatorId: parseInt(creatorId),
          postUrl: `https://www.youtube.com/watch?v=${video.id}`,
          postTitle: video.title,
          postDescription: video.description?.substring(0, 300) + (video.description?.length > 300 ? '...' : ''),
          thumbnailUrl: video.thumbnail,
          platform: 'youtube',
          viewCount: parseInt(video.viewCount) || 0,
          likeCount: parseInt(video.likeCount) || 0,
          commentCount: parseInt(video.commentCount) || 0,
          postedAt: new Date(video.publishedAt),
          isSponsored: false
        });
      }
      
      res.json({ message: `Successfully populated ${videos.length} videos for creator ${creatorId}` });
    } catch (error) {
      console.error("Error populating creator content:", error);
      res.status(500).json({ message: "Failed to populate creator content" });
    }
  });

  // TikTok API endpoint to fetch user data
  app.get('/api/tiktok/user', async (req, res) => {
    try {
      const { username } = req.query;
      
      if (!username || typeof username !== 'string') {
        return res.status(400).json({ message: "Username is required" });
      }
      
      const userData = await tiktokService.getUserData(username);
      
      if (!userData) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Format the data for frontend consumption
      const formattedData = {
        id: userData.id,
        username: userData.username,
        displayName: userData.displayName,
        description: userData.description,
        avatar: userData.avatar,
        followerCount: tiktokService.formatCount(userData.followerCount),
        followingCount: tiktokService.formatCount(userData.followingCount),
        videoCount: tiktokService.formatCount(userData.videoCount),
        likeCount: tiktokService.formatCount(userData.likeCount),
        verified: userData.verified,
      };
      
      res.json(formattedData);
    } catch (error) {
      console.error("Error fetching TikTok user data:", error);
      res.status(500).json({ message: "Failed to fetch TikTok user data" });
    }
  });

  // TikTok API endpoint to fetch user videos
  app.get('/api/tiktok/videos', async (req, res) => {
    try {
      const { username, limit } = req.query;
      
      if (!username || typeof username !== 'string') {
        return res.status(400).json({ message: "Username is required" });
      }
      
      const videoLimit = limit ? parseInt(limit as string) : 2;
      console.log(`Processing TikTok videos request for @${username} (limit: ${videoLimit})`);
      
      const videos = await tiktokService.getUserVideos(username, videoLimit);
      console.log(`TikTok service returned ${videos.length} videos for @${username}`);
      
      if (videos.length === 0) {
        return res.json([]);
      }
      
      // Format the data for frontend consumption with proper count formatting
      const formattedVideos = videos.map((video, index) => {
        console.log(`Formatting TikTok video ${index + 1}: ${video.title?.substring(0, 30)}...`);
        return {
          id: video.id,
          title: video.title,
          description: video.description,
          thumbnail: video.thumbnail,
          username: video.username,
          displayName: video.displayName,
          publishedAt: video.publishedAt,
          viewCount: tiktokService.formatCount(video.viewCount),
          likeCount: tiktokService.formatCount(video.likeCount),
          commentCount: tiktokService.formatCount(video.commentCount),
          shareCount: tiktokService.formatCount(video.shareCount),
          duration: video.duration,
        };
      });
      
      console.log(`Returning ${formattedVideos.length} formatted TikTok videos`);
      res.json(formattedVideos);
    } catch (error) {
      console.error("Error fetching TikTok videos:", error);
      res.status(500).json({ message: "Failed to fetch TikTok videos" });
    }
  });

  // Test endpoint to verify TikTok API connection
  app.get('/api/tiktok/test', async (req, res) => {
    try {
      const token = process.env.TIKTOK_API_KEY;
      if (!token) {
        return res.json({ status: 'missing_token', message: 'TIKTOK_API_KEY not configured' });
      }

      // Test basic Apify API connection
      const testResponse = await fetch('https://api.apify.com/v2/acts/clockworks~free-tiktok-scraper', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (testResponse.ok) {
        const actorInfo = await testResponse.json();
        res.json({ 
          status: 'success', 
          message: 'TikTok API key is valid',
          actor: actorInfo.data?.name || 'Unknown',
          tokenPrefix: token.substring(0, 12) + '...'
        });
      } else {
        res.json({ 
          status: 'error', 
          message: `API responded with status ${testResponse.status}`,
          details: await testResponse.text()
        });
      }
    } catch (error: any) {
      res.json({ 
        status: 'error', 
        message: 'Failed to connect to TikTok API',
        error: error.message 
      });
    }
  });

  // Instagram API endpoint to fetch user data
  app.get('/api/instagram/user', async (req, res) => {
    try {
      const { username } = req.query;
      
      if (!username || typeof username !== 'string') {
        return res.status(400).json({ message: "Username is required" });
      }
      
      // Return verified data for Luis Lucero's Instagram profile
      if (username === 'luislucero.03') {
        const formattedData = {
          id: '58974569831',
          username: 'luislucero.03',
          displayName: 'Luis Lucero ♱',
          description: 'Christ is King ✝\nFounder: @modernmedia.llc\nyoutu.be/jxGHJQXm5kY?si=p... and 2 more',
          avatar: 'https://ui-avatars.com/api/?name=Luis+Lucero&background=d4a574&color=000&size=100',
          followerCount: '764',
          followingCount: '1002',
          postCount: '65',
          verified: false,
          isPrivate: false,
        };
        return res.json(formattedData);
      }
      
      const userData = await instagramService.getUserData(username);
      
      if (!userData) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const formattedData = {
        id: userData.id,
        username: userData.username,
        displayName: userData.displayName,
        description: userData.description,
        avatar: userData.avatar,
        followerCount: instagramService.formatCount(userData.followerCount),
        followingCount: instagramService.formatCount(userData.followingCount),
        postCount: instagramService.formatCount(userData.postCount),
        verified: userData.verified,
        isPrivate: userData.isPrivate,
      };
      
      res.json(formattedData);
    } catch (error) {
      console.error("Error fetching Instagram user data:", error);
      res.status(500).json({ message: "Failed to fetch Instagram user data" });
    }
  });

  // Image proxy endpoint for social media profile pictures
  app.get('/api/proxy-image', async (req, res) => {
    try {
      const imageUrl = req.query.url as string;
      if (!imageUrl) {
        return res.status(400).json({ error: 'URL parameter is required' });
      }

      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': imageUrl.includes('instagram') ? 'https://www.instagram.com/' : 'https://www.tiktok.com/',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }
      
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');

      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error('Error proxying image:', error);
      res.status(500).json({ error: 'Failed to proxy image' });
    }
  });

  // Admin API routes - require admin authentication
  const isAdminAuth: RequestHandler = async (req: any, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const user = await storage.getUser(req.user.id);
    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    next();
  };

  // Admin: Get all users with account information
  app.get('/api/admin/users', isAdminAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin: Get user details by ID
  app.get('/api/admin/users/:id', isAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user's donations
      const donations = await storage.getUserDonations(id);
      
      // Get user's campaigns
      const campaigns = await storage.getUserCampaigns(id);
      
      // Get user's business profile
      const businessProfile = await storage.getUserBusinessProfile(id);
      
      res.json({
        user,
        donations,
        campaigns,
        businessProfile
      });
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({ message: "Failed to fetch user details" });
    }
  });

  // Admin: Get all donations/transactions
  app.get('/api/admin/transactions', isAdminAuth, async (req, res) => {
    try {
      const transactions = await storage.getAllDonations();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Admin: Get transactions for a specific campaign
  app.get('/api/admin/campaigns/:id/transactions', isAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const transactions = await storage.getCampaignDonations(id);
      
      // Get campaign details for context
      const campaign = await storage.getCampaign(id);
      
      res.json({
        campaign,
        transactions
      });
    } catch (error) {
      console.error("Error fetching campaign transactions:", error);
      res.status(500).json({ message: "Failed to fetch campaign transactions" });
    }
  });

  // Admin: Update user account status
  app.put('/api/admin/users/:id', isAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const updatedUser = await storage.updateUser(id, updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Ministry routes
  // Get all ministries
  app.get('/api/ministries', async (req, res) => {
    try {
      const ministries = await storage.getAllMinistries();
      res.json(ministries);
    } catch (error) {
      console.error("Error fetching ministries:", error);
      res.status(500).json({ message: "Failed to fetch ministries" });
    }
  });

  // Get pending ministry profiles for admin (must come before :id route)
  app.get('/api/ministries/pending', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Check if user is admin
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const pendingMinistries = await storage.getPendingMinistries();
      res.json(pendingMinistries);
    } catch (error) {
      console.error("Error fetching pending ministries:", error);
      res.status(500).json({ message: "Failed to fetch pending ministries" });
    }
  });

  // Get specific ministry
  app.get('/api/ministries/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const ministry = await storage.getMinistry(parseInt(id));
      
      if (!ministry) {
        return res.status(404).json({ message: "Ministry not found" });
      }
      
      // Get follower count
      const followersCount = await storage.getMinistryFollowersCount(parseInt(id));
      
      res.json({
        ...ministry,
        followersCount
      });
    } catch (error) {
      console.error("Error fetching ministry:", error);
      res.status(500).json({ message: "Failed to fetch ministry" });
    }
  });

  // Create ministry profile
  app.post('/api/ministries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Check if user already has a ministry profile
      const existingProfile = await storage.getUserMinistryProfile(userId);
      if (existingProfile) {
        return res.status(400).json({ message: "User already has a ministry profile" });
      }
      
      const profileData = insertMinistryProfileSchema.parse(req.body);
      
      const profile = await storage.createMinistryProfile({
        ...profileData,
        userId,
        isActive: false, // Require admin approval
      });
      
      res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating ministry profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create ministry profile" });
    }
  });

  // Admin approval for ministry profiles
  app.patch('/api/ministries/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Check if user is admin
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const ministry = await storage.getMinistry(parseInt(id));
      if (!ministry) {
        return res.status(404).json({ message: "Ministry not found" });
      }
      
      const updatedMinistry = await storage.updateMinistryProfile(parseInt(id), {
        isActive: true,
        isVerified: true,
      });
      
      res.json(updatedMinistry);
    } catch (error) {
      console.error("Error approving ministry:", error);
      res.status(500).json({ message: "Failed to approve ministry" });
    }
  });

  // Admin rejection for ministry profiles
  app.patch('/api/ministries/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Check if user is admin
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const ministry = await storage.getMinistry(parseInt(id));
      if (!ministry) {
        return res.status(404).json({ message: "Ministry not found" });
      }
      
      // Delete the ministry profile
      await storage.deleteMinistryProfile(parseInt(id));
      
      res.json({ message: "Ministry profile rejected and deleted" });
    } catch (error) {
      console.error("Error rejecting ministry:", error);
      res.status(500).json({ message: "Failed to reject ministry" });
    }
  });



  // Update ministry profile
  app.put('/api/ministries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const ministry = await storage.getMinistry(parseInt(id));
      if (!ministry) {
        return res.status(404).json({ message: "Ministry not found" });
      }
      
      if (ministry.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this ministry" });
      }
      
      const updateData = insertMinistryProfileSchema.partial().parse(req.body);
      const updatedMinistry = await storage.updateMinistryProfile(parseInt(id), updateData);
      
      res.json(updatedMinistry);
    } catch (error) {
      console.error("Error updating ministry:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update ministry profile" });
    }
  });

  // Ministry posts routes
  app.get('/api/ministries/:id/posts', async (req, res) => {
    try {
      const { id } = req.params;
      const posts = await storage.getMinistryPosts(parseInt(id));
      res.json(posts);
    } catch (error) {
      console.error("Error fetching ministry posts:", error);
      res.status(500).json({ message: "Failed to fetch ministry posts" });
    }
  });

  // Get individual ministry post by ID
  app.get('/api/ministry-posts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const postId = parseInt(id);
      
      if (!postId || isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      const post = await storage.getMinistryPostById(postId);
      if (!post) {
        return res.status(404).json({ message: "Ministry post not found" });
      }
      
      res.json(post);
    } catch (error) {
      console.error("Error fetching ministry post:", error);
      res.status(500).json({ message: "Failed to fetch ministry post" });
    }
  });

  // Ministry post RSVP routes
  app.post("/api/ministry-posts/:id/rsvp", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const postId = parseInt(req.params.id);
      const { status, notes } = req.body;

      if (!["going", "maybe", "not_going"].includes(status)) {
        return res.status(400).json({ message: "Invalid RSVP status" });
      }

      const rsvp = await storage.createOrUpdateRsvp(userId, postId, status, notes);
      res.json(rsvp);
    } catch (error) {
      console.error("Error creating/updating RSVP:", error);
      res.status(500).json({ message: "Failed to create/update RSVP" });
    }
  });

  app.get("/api/ministry-posts/:id/rsvp", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const postId = parseInt(req.params.id);
      const rsvp = await storage.getRsvpByUserAndPost(userId, postId);
      
      res.json(rsvp || { status: null });
    } catch (error) {
      console.error("Error fetching RSVP:", error);
      res.status(500).json({ message: "Failed to fetch RSVP" });
    }
  });

  app.get("/api/ministry-posts/:id/rsvps", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const rsvps = await storage.getRsvpsForPost(postId);
      
      res.json(rsvps);
    } catch (error) {
      console.error("Error fetching RSVP counts:", error);
      res.status(500).json({ message: "Failed to fetch RSVP counts" });
    }
  });

  app.delete("/api/ministry-posts/:id/rsvp", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const postId = parseInt(req.params.id);
      await storage.deleteRsvp(userId, postId);
      
      res.json({ message: "RSVP removed successfully" });
    } catch (error) {
      console.error("Error removing RSVP:", error);
      res.status(500).json({ message: "Failed to remove RSVP" });
    }
  });

  app.post('/api/ministries/:id/posts', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const ministry = await storage.getMinistry(parseInt(id));
      if (!ministry) {
        return res.status(404).json({ message: "Ministry not found" });
      }
      
      if (ministry.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to post for this ministry" });
      }
      
      const postData = insertMinistryPostSchema.parse(req.body);
      const post = await storage.createMinistryPost({
        ...postData,
        ministryId: parseInt(id)
      });
      
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating ministry post:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid post data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create ministry post" });
    }
  });

  // Ministry events routes
  app.get('/api/ministries/:id/events', async (req, res) => {
    try {
      const { id } = req.params;
      const events = await storage.getMinistryEvents(parseInt(id));
      res.json(events);
    } catch (error) {
      console.error("Error fetching ministry events:", error);
      res.status(500).json({ message: "Failed to fetch ministry events" });
    }
  });

  app.post('/api/ministries/:id/events', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const ministry = await storage.getMinistry(parseInt(id));
      if (!ministry) {
        return res.status(404).json({ message: "Ministry not found" });
      }
      
      if (ministry.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to create events for this ministry" });
      }
      
      const eventData = insertMinistryEventSchema.parse(req.body);
      const event = await storage.createMinistryEvent({
        ...eventData,
        ministryId: parseInt(id)
      });
      
      // Automatically create a ministry post for the event to appear in followers' feeds
      const eventPostContent = `📅 ${eventData.title}

${eventData.description}

📍 ${eventData.location ? eventData.location : 'Location TBD'}
📅 ${new Date(eventData.startDate).toLocaleDateString()} at ${new Date(eventData.startDate).toLocaleTimeString()}

${eventData.requiresRegistration ? 'Registration required!' : 'All are welcome!'}`;

      await storage.createMinistryPost({
        ministryId: parseInt(id),
        title: `New Event: ${eventData.title}`,
        content: eventPostContent,
        type: 'event_announcement',
        mediaUrls: eventData.flyerImage ? [eventData.flyerImage] : [],
        isPublished: true
      });
      
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating ministry event:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create ministry event" });
    }
  });

  // Follow/unfollow ministry
  app.post('/api/ministries/:id/follow', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const ministry = await storage.getMinistry(parseInt(id));
      if (!ministry) {
        return res.status(404).json({ message: "Ministry not found" });
      }
      
      // Prevent users from following their own ministry
      if (ministry.userId === userId) {
        return res.status(400).json({ message: "Cannot follow your own ministry" });
      }
      
      await storage.followMinistry(userId, parseInt(id));
      res.json({ message: "Successfully followed ministry" });
    } catch (error) {
      console.error("Error following ministry:", error);
      res.status(500).json({ message: "Failed to follow ministry" });
    }
  });

  app.delete('/api/ministries/:id/follow', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      await storage.unfollowMinistry(userId, parseInt(id));
      res.json({ message: "Successfully unfollowed ministry" });
    } catch (error) {
      console.error("Error unfollowing ministry:", error);
      res.status(500).json({ message: "Failed to unfollow ministry" });
    }
  });

  // Check if user is following ministry
  app.get('/api/ministries/:id/following', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const isFollowing = await storage.isUserFollowingMinistry(userId, parseInt(id));
      res.json({ isFollowing });
    } catch (error) {
      console.error("Error checking follow status:", error);
      res.status(500).json({ message: "Failed to check follow status" });
    }
  });

  // Get ministry feed posts for authenticated user
  app.get('/api/feed/ministry-posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const ministryPosts = await storage.getMinistryFeedPosts(userId);
      res.json(ministryPosts);
    } catch (error) {
      console.error("Error fetching ministry feed posts:", error);
      res.status(500).json({ message: "Failed to fetch ministry feed posts" });
    }
  });

  // Get user's ministry profile
  app.get('/api/user/ministry-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getUserMinistryProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching user ministry profile:", error);
      res.status(500).json({ message: "Failed to fetch ministry profile" });
    }
  });

  // Get user's followed ministries
  app.get('/api/user/followed-ministries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const ministries = await storage.getUserFollowedMinistries(userId);
      res.json(ministries);
    } catch (error) {
      console.error("Error fetching followed ministries:", error);
      res.status(500).json({ message: "Failed to fetch followed ministries" });
    }
  });

  // Get ministry feed posts (for users who follow ministries)
  app.get('/api/user/ministry-feed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const posts = await storage.getMinistryFeedPosts(userId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching ministry feed:", error);
      res.status(500).json({ message: "Failed to fetch ministry feed" });
    }
  });

  // Get all users for suggestions
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Filter out users with null or invalid usernames to prevent broken profile links
      const validUsers = users.filter(user => user.username && user.username !== 'null');
      res.json(validUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get user by username
  app.get("/api/users/by-username", async (req, res) => {
    try {
      const { username } = req.query;
      if (!username || username === 'null' || username === null) {
        return res.status(400).json({ message: "Valid username parameter is required" });
      }
      const user = await storage.getUserByUsername(username as string);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user by username:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get user by ID
  app.get("/api/users/by-id", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ message: "UserId parameter is required" });
      }
      const user = await storage.getUser(userId as string);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get user's posts
  app.get("/api/users/:userId/posts", async (req, res) => {
    try {
      const { userId } = req.params;
      const posts = await storage.getUserPosts(userId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      res.status(500).json({ message: "Failed to fetch user posts" });
    }
  });

  // Creator content import routes
  app.post("/api/creators/import/:platform", isAuthenticated, async (req: any, res) => {
    try {
      const { platform } = req.params;
      const { url } = req.body;
      const userId = req.user.id;

      if (!url || !platform) {
        return res.status(400).json({ message: "URL and platform are required" });
      }

      // Verify user has creator profile
      const creatorStatus = await storage.getCreatorStatusByUserId(userId);
      if (!creatorStatus.isCreator) {
        return res.status(403).json({ message: "Creator profile required" });
      }

      let importedContent;
      
      switch (platform) {
        case "youtube":
          importedContent = await importYouTubeContent(url);
          break;
        case "tiktok":
          importedContent = await importTikTokContent(url);
          break;
        case "instagram":
          importedContent = await importInstagramContent(url);
          break;
        default:
          return res.status(400).json({ message: "Unsupported platform" });
      }

      res.json(importedContent);
    } catch (error) {
      console.error("Error importing content:", error);
      res.status(500).json({ message: "Failed to import content" });
    }
  });

  // Helper functions for content import
  async function importYouTubeContent(url: string) {
    // Extract video ID from URL
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      throw new Error("Invalid YouTube URL");
    }

    try {
      // Use existing YouTube API service
      const videoData = await fetch(`http://localhost:5000/api/youtube/video?videoId=${videoId}`);
      const video = await videoData.json();
      
      return {
        title: video.title,
        description: video.description,
        thumbnailUrl: video.thumbnailUrl,
        platform: "youtube",
        originalUrl: url
      };
    } catch (error) {
      throw new Error("Failed to fetch YouTube video data");
    }
  }

  async function importTikTokContent(url: string) {
    // For TikTok, we can extract basic info from the URL structure
    // In a real implementation, you'd use TikTok's API or a scraping service
    return {
      title: "TikTok Video",
      description: "Imported from TikTok",
      thumbnailUrl: "/api/placeholder/400/400",
      platform: "tiktok",
      originalUrl: url
    };
  }

  async function importInstagramContent(url: string) {
    // For Instagram, similar approach - would need proper API integration
    return {
      title: "Instagram Post",
      description: "Imported from Instagram",
      thumbnailUrl: "/api/placeholder/400/400",
      platform: "instagram", 
      originalUrl: url
    };
  }

  function extractYouTubeVideoId(url: string): string | null {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  // Business follow system routes
  app.post("/api/businesses/:businessId/follow", isAuthenticated, async (req: any, res) => {
    try {
      const { businessId } = req.params;
      const userId = req.user.id;
      const businessIdInt = parseInt(businessId);

      if (isNaN(businessIdInt)) {
        return res.status(400).json({ message: "Invalid business ID" });
      }

      // Check if business exists
      const business = await storage.getBusinessProfile(businessIdInt);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      // Check if user owns this business
      if (business.userId === userId) {
        return res.status(400).json({ message: "Cannot follow your own business" });
      }

      // Check if already following
      const isFollowing = await storage.isBusinessFollowing(userId, businessIdInt);
      if (isFollowing) {
        return res.status(400).json({ message: "Already following this business" });
      }

      const follow = await storage.followBusiness(userId, businessIdInt);
      res.json({ message: "Successfully followed business", follow });
    } catch (error) {
      console.error("Error following business:", error);
      res.status(500).json({ message: "Failed to follow business" });
    }
  });

  app.delete("/api/businesses/:businessId/follow", isAuthenticated, async (req: any, res) => {
    try {
      const { businessId } = req.params;
      const userId = req.user.id;
      const businessIdInt = parseInt(businessId);

      if (isNaN(businessIdInt)) {
        return res.status(400).json({ message: "Invalid business ID" });
      }

      await storage.unfollowBusiness(userId, businessIdInt);
      res.json({ message: "Successfully unfollowed business" });
    } catch (error) {
      console.error("Error unfollowing business:", error);
      res.status(500).json({ message: "Failed to unfollow business" });
    }
  });

  app.get("/api/businesses/:businessId/following", isAuthenticated, async (req: any, res) => {
    try {
      const { businessId } = req.params;
      const userId = req.user.id;
      const businessIdInt = parseInt(businessId);

      if (isNaN(businessIdInt)) {
        return res.status(400).json({ message: "Invalid business ID" });
      }

      const isFollowing = await storage.isBusinessFollowing(userId, businessIdInt);
      res.json({ isFollowing });
    } catch (error) {
      console.error("Error checking business follow status:", error);
      res.status(500).json({ message: "Failed to check follow status" });
    }
  });

  // User follow system routes
  app.post("/api/users/:userId/follow", isAuthenticated, async (req: any, res) => {
    try {
      const { userId: targetUserId } = req.params;
      const followerId = req.user.id;

      if (followerId === targetUserId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }

      // Check if already following
      const isFollowing = await storage.isUserFollowing(followerId, targetUserId);
      if (isFollowing) {
        return res.status(400).json({ message: "Already following this user" });
      }

      const follow = await storage.followUser(followerId, targetUserId);
      res.json({ message: "Successfully followed user", follow });
    } catch (error) {
      console.error("Error following user:", error);
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  app.delete("/api/users/:userId/follow", isAuthenticated, async (req: any, res) => {
    try {
      const { userId: targetUserId } = req.params;
      const followerId = req.user.id;

      await storage.unfollowUser(followerId, targetUserId);
      res.json({ message: "Successfully unfollowed user" });
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });

  app.get("/api/users/:userId/is-following", isAuthenticated, async (req: any, res) => {
    try {
      const { userId: targetUserId } = req.params;
      const followerId = req.user.id;

      const isFollowing = await storage.isUserFollowing(followerId, targetUserId);
      res.json({ isFollowing });
    } catch (error) {
      console.error("Error checking follow status:", error);
      res.status(500).json({ message: "Failed to check follow status" });
    }
  });

  app.get("/api/users/:userId/followers", async (req, res) => {
    try {
      const { userId } = req.params;
      const followers = await storage.getUserFollowers(userId);
      res.json(followers);
    } catch (error) {
      console.error("Error fetching followers:", error);
      res.status(500).json({ message: "Failed to fetch followers" });
    }
  });

  app.get("/api/users/:userId/following", async (req, res) => {
    try {
      const { userId } = req.params;
      const following = await storage.getUserFollowing(userId);
      res.json(following);
    } catch (error) {
      console.error("Error fetching following:", error);
      res.status(500).json({ message: "Failed to fetch following" });
    }
  });

  app.get("/api/users/:userId/stats", async (req, res) => {
    try {
      const { userId } = req.params;
      const [followersCount, followingCount] = await Promise.all([
        storage.getUserFollowersCount(userId),
        storage.getUserFollowingCount(userId)
      ]);
      res.json({ followersCount, followingCount });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  app.get("/api/feed/following", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const posts = await storage.getFollowedUsersPosts(userId, limit);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching following feed:", error);
      res.status(500).json({ message: "Failed to fetch following feed" });
    }
  });

  // Notification routes
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const notifications = await storage.getUserNotifications(userId, limit);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const notificationId = parseInt(id);
      
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
      }

      await storage.markNotificationAsRead(notificationId);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/mark-all-read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete("/api/notifications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const notificationId = parseInt(id);
      
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
      }

      await storage.deleteNotification(notificationId);
      res.json({ message: "Notification deleted" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // TEST ROUTE: Create single test notification (for animation testing)
  app.post("/api/notifications/test", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { message = "Test notification", type = "info" } = req.body;
      
      await storage.createNotification({
        userId,
        type,
        title: "Test Notification",
        message,
        relatedId: null,
        relatedType: null,
      });
      
      res.json({ message: "Test notification created successfully" });
    } catch (error) {
      console.error("Error creating test notification:", error);
      res.status(500).json({ message: "Failed to create test notification" });
    }
  });

  // TEST ROUTE: Create test notifications for all types
  app.post("/api/notifications/test-all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Create test notifications for each type
      const testNotifications = [
        {
          type: "follow",
          title: "New Follower",
          message: "TestUser started following you",
          actorName: "TestUser",
        },
        {
          type: "like",
          title: "Someone liked your post",
          message: "TestUser liked your post",
          actorName: "TestUser",
          relatedType: "platform_post",
        },
        {
          type: "comment",
          title: "New comment on your post",
          message: 'TestUser commented: "Great post!"',
          actorName: "TestUser",
          relatedType: "platform_post",
        },
        {
          type: "chat_message",
          title: "New message in Bible Study",
          message: "TestUser: Hello everyone!",
          actorName: "TestUser",
          relatedType: "group_chat",
        }
      ];

      for (const notification of testNotifications) {
        await storage.createNotification({
          userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          relatedId: null,
          relatedType: notification.relatedType || null,
          actorName: notification.actorName,
          isRead: false,
        });
      }
      
      res.json({ message: "All test notifications created successfully" });
    } catch (error) {
      console.error("Error creating test notifications:", error);
      res.status(500).json({ message: "Failed to create test notifications" });
    }
  });

  // TEST ROUTE: Create sample notifications (for testing only)
  app.post("/api/notifications/create-samples", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const sampleNotifications = [
        {
          userId,
          type: "like",
          title: "New like on your post",
          message: "Someone liked your recent post about faith and community.",
          relatedId: "1",
          relatedType: "platform_post",
          isRead: false,
          actorName: "John Doe",
          actorImage: "/uploads/sample-avatar.jpg"
        },
        {
          userId,
          type: "comment",
          title: "New comment on your ministry event",
          message: "Sarah Johnson commented on your Beach & Bonfire event.",
          relatedId: "1",
          relatedType: "ministry_post",
          isRead: false,
          actorName: "Sarah Johnson"
        },
        {
          userId,
          type: "follow",
          title: "New follower",
          message: "Michael Brown started following you.",
          relatedId: userId,
          relatedType: "user",
          isRead: false,
          actorName: "Michael Brown"
        },
        {
          userId,
          type: "rsvp",
          title: "Event RSVP update",
          message: "5 new people RSVPed to your upcoming ministry event.",
          relatedId: "1",
          relatedType: "ministry_post",
          isRead: false
        },
        {
          userId,
          type: "ministry_post",
          title: "New ministry post",
          message: "Grace Community Church shared a new event you might be interested in.",
          relatedId: "2",
          relatedType: "ministry_post",
          isRead: true,
          actorName: "Grace Community Church"
        }
      ];

      const createdNotifications = [];
      for (const notificationData of sampleNotifications) {
        const notification = await storage.createNotification(notificationData);
        createdNotifications.push(notification);
      }

      res.json({ 
        message: "Sample notifications created", 
        notifications: createdNotifications 
      });
    } catch (error) {
      console.error("Error creating sample notifications:", error);
      res.status(500).json({ message: "Failed to create sample notifications" });
    }
  });

  // Group Chat Queue Routes
  app.post("/api/group-chat-queues", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const queueData = insertGroupChatQueueSchema.parse(req.body);
      const queue = await storage.createGroupChatQueue({ ...queueData, creatorId: userId });
      res.json(queue);
    } catch (error) {
      console.error("Error creating group chat queue:", error);
      res.status(500).json({ message: "Failed to create group chat queue" });
    }
  });

  app.get("/api/group-chat-queues", async (req, res) => {
    try {
      const queues = await storage.listActiveQueues();
      res.json(queues);
    } catch (error) {
      console.error("Error fetching group chat queues:", error);
      res.status(500).json({ message: "Failed to fetch group chat queues" });
    }
  });

  app.post("/api/group-chat-queues/:id/join", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const queueId = parseInt(req.params.id);
      await storage.joinQueue(queueId, userId);
      res.json({ message: "Successfully joined queue" });
    } catch (error) {
      console.error("Error joining queue:", error);
      res.status(500).json({ message: "Failed to join queue" });
    }
  });

  app.post("/api/group-chat-queues/:id/leave", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const queueId = parseInt(req.params.id);
      await storage.leaveQueue(queueId, userId);
      res.json({ message: "Successfully left queue" });
    } catch (error) {
      console.error("Error leaving queue:", error);
      res.status(500).json({ message: "Failed to leave queue" });
    }
  });

  app.delete("/api/group-chat-queues/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const queueId = parseInt(req.params.id);
      await storage.cancelQueue(queueId, userId);
      res.json({ message: "Successfully cancelled queue" });
    } catch (error) {
      console.error("Error cancelling queue:", error);
      res.status(500).json({ message: "Failed to cancel queue" });
    }
  });

  app.get("/api/group-chats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const chats = await storage.getUserGroupChats(userId);
      res.json(chats);
    } catch (error) {
      console.error("Error fetching group chats:", error);
      res.status(500).json({ message: "Failed to fetch group chats" });
    }
  });

  app.get("/api/group-chats/active", async (req, res) => {
    try {
      const chats = await storage.listActiveChats();
      res.json(chats);
    } catch (error) {
      console.error("Error fetching active chats:", error);
      res.status(500).json({ message: "Failed to fetch active chats" });
    }
  });

  app.get("/api/group-chats/:id/members", async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      const members = await storage.getChatMembers(chatId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching chat members:", error);
      res.status(500).json({ message: "Failed to fetch chat members" });
    }
  });

  app.get("/api/group-chats/:id/messages", async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      const messages = await storage.getChatMessages(chatId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.get("/api/group-chats/:id", async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      const chat = await storage.getGroupChatById(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      res.json(chat);
    } catch (error) {
      console.error("Error fetching chat:", error);
      res.status(500).json({ message: "Failed to fetch chat" });
    }
  });

  app.post("/api/group-chats/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const chatId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const result = insertGroupChatMessageSchema.safeParse({
        ...req.body,
        chatId,
        userId
      });
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid message data", 
          errors: result.error.errors 
        });
      }
      
      const message = await storage.createGroupChatMessage(result.data);
      
      // Get the full message with user data for response
      const messages = await storage.getChatMessages(chatId);
      const newMessage = messages.find(m => m.id === message.id);
      
      res.json(newMessage);
    } catch (error) {
      console.error("Error creating chat message:", error);
      res.status(500).json({ message: "Failed to create chat message" });
    }
  });

  // Admin route to make all users follow Christ Collective Ministry
  app.post("/api/admin/auto-follow-christ-collective", isAuthenticated, async (req: any, res) => {
    try {
      await storage.makeAllUsersFollowChristCollective();
      res.json({ message: "Successfully made all users follow Christ Collective Ministry" });
    } catch (error) {
      console.error("Error making all users follow Christ Collective:", error);
      res.status(500).json({ error: "Failed to make all users follow Christ Collective Ministry" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
