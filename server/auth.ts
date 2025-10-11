import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import createMemoryStore from "memorystore";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'christ-collective-secret-2024',
    resave: true, // Force session save even if unmodified
    saveUninitialized: true, // Save uninitialized sessions
    rolling: true, // Reset expiration on each request
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    cookie: {
      httpOnly: true, // Secure cookie, not accessible via JavaScript
      secure: true, // Always use secure cookies (Replit is always HTTPS)
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year - persistent until explicit logout
      sameSite: 'none', // 'none' for cross-origin (required for mobile app)
      path: '/', // Ensure cookie is available for all paths
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      if (!username) {
        return done(null, false);
      }
      
      // Try to find user by username first (exact match), then case-insensitive, then by email
      let user = await storage.getUserByUsername(username);
      if (!user) {
        // Try case-insensitive username search
        user = await storage.getUserByUsernameInsensitive(username);
      }
      if (!user) {
        user = await storage.getUserByEmail(username);
      }
      
      if (!user || !user.password || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, email, password, firstName, lastName, phone, userType } = req.body;
      
      if (!username || !password || !phone) {
        return res.status(400).json({ message: "Username, password, and phone number are required" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      if (email) {
        const existingEmail = await storage.getUserByEmail(email);
        if (existingEmail) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }

      const user = await storage.createUser({
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username,
        email: email || null,
        password: await hashPassword(password),
        firstName: firstName || null,
        lastName: lastName || null,
        phone: phone,
        userType: userType || null,
      });

      // Automatically follow Christ Collective Ministry
      await storage.autoFollowChristCollectiveMinistry(user.id);

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({ 
          id: user.id, 
          username: user.username, 
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          isAdmin: user.isAdmin 
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.get("/api/login", (req, res) => {
    // Redirect to the auth page for login
    res.redirect("/auth");
  });

  app.post("/api/login", (req, res, next) => {
    // Transform usernameOrEmail to username for passport compatibility
    if (req.body.usernameOrEmail) {
      req.body.username = req.body.usernameOrEmail;
    }
    next();
  }, (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error("Passport authentication error:", err);
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
        console.log("Authentication failed for user:", req.body.username);
        return res.status(401).json({ message: "Incorrect password" });
      }
      req.logIn(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ message: "Login failed" });
        }
        const userData = user as SelectUser;
        res.status(200).json({ 
          id: userData.id, 
          username: userData.username, 
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          isAdmin: userData.isAdmin 
        });
      });
    })(req, res, next);
  });

  // Handle both GET and POST logout requests
  app.get("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('connect.sid');
        res.redirect("/");
      });
    });
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('connect.sid');
        res.status(200).json({ message: "Logged out successfully" });
      });
    });
  });

  // Temporary password reset for debugging
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { username, newPassword } = req.body;
      
      if (!username || !newPassword) {
        return res.status(400).json({ message: "Username and new password are required" });
      }

      let user = await storage.getUserByUsername(username);
      if (!user) {
        user = await storage.getUserByEmail(username);
      }

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedPassword);

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Password reset failed" });
    }
  });

  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const sessionUser = req.user as SelectUser;
    
    // Fetch fresh user data from database to ensure we have the latest updates
    try {
      const freshUser = await storage.getUser(sessionUser.id);
      if (!freshUser) {
        return res.sendStatus(404);
      }
      
      res.json({
        id: freshUser.id,
        username: freshUser.username,
        email: freshUser.email,
        firstName: freshUser.firstName,
        lastName: freshUser.lastName,
        phone: freshUser.phone,
        location: freshUser.location,
        bio: freshUser.bio,
        profileImageUrl: freshUser.profileImageUrl,
        isAdmin: freshUser.isAdmin,
        stripeCustomerId: freshUser.stripeCustomerId,
        createdAt: freshUser.createdAt,
        updatedAt: freshUser.updatedAt
      });
    } catch (error) {
      console.error('Error fetching fresh user data:', error);
      // Fallback to session data if database fetch fails
      const user = req.user as SelectUser;
      res.json({ 
        id: user.id, 
        username: user.username, 
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        isAdmin: user.isAdmin 
      });
    }
  });
}

// Authentication middleware
export const isAuthenticated = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};