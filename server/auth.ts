import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual, createHash } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import createMemoryStore from "memorystore";
import { emailService } from "./emailService";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    const parts = stored.split(".");
    if (parts.length !== 2) {
      console.error("Invalid password format in database");
      return false;
    }
    
    const [hashed, salt] = parts;
    if (!hashed || !salt) {
      console.error("Missing hash or salt in stored password");
      return false;
    }
    
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    
    // Check buffer lengths match before comparing
    if (hashedBuf.length !== suppliedBuf.length) {
      console.error("Password hash length mismatch");
      return false;
    }
    
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

// Hash reset token using SHA256 for secure storage
function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'christ-collective-secret-2024',
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    rolling: true, // Reset expiration on each request
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    cookie: {
      httpOnly: true, // Secure cookie, not accessible via JavaScript
      secure: true, // Always use secure cookies (Replit is always HTTPS)
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year - persistent until explicit logout
      sameSite: 'lax', // Changed from 'none' to 'lax' for better browser compatibility
      path: '/', // Ensure cookie is available for all paths
    },
  };

  app.set("trust proxy", 1);
  
  // Middleware to convert X-Session-ID header to cookie BEFORE session middleware runs
  // This allows Capacitor apps to maintain sessions via header instead of cookies
  app.use((req, res, next) => {
    const sessionId = req.headers['x-session-id'] as string;
    
    if (sessionId) {
      console.log("📱 Mobile app session ID detected:", sessionId);
      
      // Convert session ID header to cookie format that express-session expects
      const cookies = req.headers.cookie || '';
      const sessionCookieName = 'connect.sid';
      
      // Remove existing session cookie if present
      const cookieParts = cookies.split(';').filter(c => !c.trim().startsWith(sessionCookieName));
      
      // Add our session ID as a cookie (express-session expects it this way)
      // Note: express-session expects format 's:sessionId.signature' but we just use the ID
      cookieParts.push(`${sessionCookieName}=${sessionId}`);
      req.headers.cookie = cookieParts.join('; ');
    }
    next();
  });
  
  const sessionMiddleware = session(sessionSettings);
  app.use(sessionMiddleware);
  
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

  passport.serializeUser((user, done) => {
    console.log("🔐 Serializing user:", user.id);
    done(null, user.id);
  });
  passport.deserializeUser(async (id: string, done) => {
    console.log("🔓 Deserializing user ID:", id);
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
        
        // Force session to save to the store before responding
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ message: "Session creation failed" });
          }
          
          console.log("💾 Registration session saved for:", user.username);
          
          res.status(201).json({ 
            id: user.id, 
            username: user.username, 
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            isAdmin: user.isAdmin,
            sessionId: req.sessionID // Return session ID for mobile apps
          });
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
        
        // Force session to save to the store before responding
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ message: "Session creation failed" });
          }
          
          const userData = user as SelectUser;
          
          // Debug logging for mobile session issues
          console.log("✅ Login successful for:", userData.username);
          console.log("📝 Session ID:", req.sessionID);
          console.log("💾 Session saved to store");
          console.log("🍪 Session cookie set:", req.session.cookie);
          
          res.status(200).json({ 
            id: userData.id, 
            username: userData.username, 
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone,
            isAdmin: userData.isAdmin,
            sessionId: req.sessionID // Return session ID for mobile apps
          });
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

  // Forgot password - sends reset link via email
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      
      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({ message: "If an account with that email exists, a password reset link has been sent." });
      }

      // Generate secure random token (plaintext for email)
      const resetToken = randomBytes(32).toString('hex');
      
      // Hash token for secure storage
      const hashedToken = hashResetToken(resetToken);
      
      // Token expires in 1 hour
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      
      // Store HASHED token in database
      await storage.createPasswordResetToken(user.id, hashedToken, expiresAt);
      
      // Send reset email with plaintext token
      await emailService.sendPasswordResetEmail(
        email,
        resetToken,
        user.firstName ?? user.username ?? undefined
      );

      res.json({ message: "If an account with that email exists, a password reset link has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "An error occurred. Please try again later." });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword, confirmPassword } = req.body;
      
      if (!token || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      // Hash the incoming token to compare with stored hash
      const hashedToken = hashResetToken(token);

      // Get token from database using hashed version
      const resetToken = await storage.getPasswordResetToken(hashedToken);
      
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset link" });
      }

      // Check if token is expired
      if (new Date() > new Date(resetToken.expiresAt)) {
        return res.status(400).json({ message: "Reset link has expired" });
      }

      // Check if token was already used
      if (resetToken.used) {
        return res.status(400).json({ message: "This reset link has already been used" });
      }

      // Get user
      const user = await storage.getUser(resetToken.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Hash new password and update
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedPassword);

      // Mark token as used
      await storage.markTokenAsUsed(resetToken.id);

      // Automatically log the user in
      req.login(user, (err) => {
        if (err) {
          console.error("Auto-login after password reset failed:", err);
          return res.json({ 
            message: "Password reset successfully. Please log in with your new password.",
            autoLoginFailed: true
          });
        }
        
        // Force session to save to the store before responding
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error after password reset:", saveErr);
            return res.json({ 
              message: "Password reset successfully. Please log in with your new password.",
              autoLoginFailed: true
            });
          }
          
          console.log("💾 Password reset session saved for:", user.username);
          
          res.json({ 
            message: "Password reset successfully",
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              phone: user.phone,
              isAdmin: user.isAdmin
            }
          });
        });
      });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Password reset failed. Please try again." });
    }
  });

  app.get("/api/user", async (req, res) => {
    // Debug logging for mobile session issues
    console.log("🔍 /api/user request - Session ID:", req.sessionID);
    console.log("🔍 Authenticated:", req.isAuthenticated());
    console.log("🔍 Cookies received:", req.headers.cookie ? "Yes" : "No");
    
    if (!req.isAuthenticated()) {
      console.log("❌ User not authenticated, returning 401");
      return res.sendStatus(401);
    }
    const sessionUser = req.user as SelectUser;
    console.log("✅ Authenticated user:", sessionUser.username);
    
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