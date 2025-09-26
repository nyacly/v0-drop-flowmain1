// Email-based authentication with verification for DropFlow
// Adapted from blueprint:javascript_auth

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, verificationCodes, insertUserSchema, loginSchema, verifyEmailSchema, createAdminSchema, type SelectUser } from "../shared/schema";
import { db, pool } from "./db";
import { eq, and } from "drizzle-orm";
import { fromZodError } from "zod-validation-error";
import { sendEmail } from "./replitmail";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);
const PostgresSessionStore = connectPg(session);

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

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function getUserByEmail(email: string) {
  return db.select().from(users).where(eq(users.email, email)).limit(1);
}

async function sendVerificationEmail(email: string, code: string) {
  try {
    // Send actual email using Replit Mail service
    const result = await sendEmail({
      to: email,
      subject: "DropFlow - Verify Your Email Address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">🚛 DropFlow</h2>
          <h3>Verify Your Email Address</h3>
          <p>Thank you for signing up for DropFlow! Please use the verification code below to complete your account setup:</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="font-size: 32px; color: #dc2626; margin: 0; letter-spacing: 4px;">${code}</h1>
          </div>
          
          <p>Enter this 6-digit code in the DropFlow app to verify your email address and start optimizing your delivery routes.</p>
          
          <p style="color: #6b7280; font-size: 14px;">
            This code will expire in 15 minutes. If you didn't request this verification, please ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            DropFlow - Route Optimization for Solo Drivers<br>
            This is an automated message, please do not reply.
          </p>
        </div>
      `,
      text: `
DropFlow - Verify Your Email Address

Thank you for signing up for DropFlow! Please use the verification code below to complete your account setup:

Verification Code: ${code}

Enter this 6-digit code in the DropFlow app to verify your email address and start optimizing your delivery routes.

This code will expire in 15 minutes. If you didn't request this verification, please ignore this email.

DropFlow - Route Optimization for Solo Drivers
This is an automated message, please do not reply.
      `
    });

    console.log(`✅ Verification email sent to ${email}, Message ID: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send verification email to ${email}:`, error);
    
    // Fallback to console logging for development if email fails
    console.log(`\n=== EMAIL VERIFICATION (FALLBACK) ===`);
    console.log(`To: ${email}`);
    console.log(`Verification Code: ${code}`);
    console.log(`================================\n`);
    
    throw error;
  }
}

export function setupAuth(app: Express) {
  const store = new PostgresSessionStore({ pool, createTableIfMissing: true });
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          console.log('LocalStrategy: Authenticating user:', email);
          const [user] = await getUserByEmail(email);
          
          if (!user || !(await comparePasswords(password, user.password))) {
            console.log('LocalStrategy: Invalid credentials for:', email);
            return done(null, false);
          }
          
          if (!user.isVerified) {
            console.log('LocalStrategy: User not verified:', email);
            return done(null, false, { message: 'Please verify your email first' });
          }
          
          console.log('LocalStrategy: Authentication successful for:', email);
          return done(null, user);
        } catch (error) {
          console.error('LocalStrategy error:', error);
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Register new user (sends verification email)
  app.post("/api/register", async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        const error = fromZodError(result.error);
        return res.status(400).json({ error: error.toString() });
      }

      const [existingUser] = await getUserByEmail(result.data.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Create user (unverified)
      const [user] = await db
        .insert(users)
        .values({
          ...result.data,
          password: await hashPassword(result.data.password),
          isVerified: false,
        })
        .returning();

      // Generate and store verification code
      const code = generateVerificationCode();
      await db.insert(verificationCodes).values({
        email: user.email,
        code,
        type: 'signup',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      });

      // Send verification email
      await sendVerificationEmail(user.email, code);

      res.status(201).json({ 
        message: "Account created! Please check your email for verification code.",
        email: user.email 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Verify email with code
  app.post("/api/verify-email", async (req, res) => {
    try {
      const result = verifyEmailSchema.safeParse(req.body);
      if (!result.success) {
        const error = fromZodError(result.error);
        return res.status(400).json({ error: error.toString() });
      }

      const { email, code } = result.data;

      // Find valid verification code
      const [verification] = await db
        .select()
        .from(verificationCodes)
        .where(
          and(
            eq(verificationCodes.email, email),
            eq(verificationCodes.code, code),
            eq(verificationCodes.type, 'signup')
          )
        )
        .limit(1);

      if (!verification || verification.usedAt) {
        return res.status(400).json({ error: "Invalid or expired verification code" });
      }

      if (verification.expiresAt < new Date()) {
        return res.status(400).json({ error: "Verification code has expired" });
      }

      // Mark user as verified
      const [user] = await db
        .update(users)
        .set({ isVerified: true })
        .where(eq(users.email, email))
        .returning();

      // Mark verification code as used
      await db
        .update(verificationCodes)
        .set({ usedAt: new Date() })
        .where(eq(verificationCodes.id, verification.id));

      // Auto-login the user
      req.login(user, (err) => {
        if (err) {
          console.error("Login error after verification:", err);
          return res.status(500).json({ error: "Verification successful but login failed" });
        }
        res.json({ 
          message: "Email verified successfully!", 
          user: { 
            id: user.id, 
            email: user.email, 
            firstName: user.firstName,
            lastName: user.lastName,
            isVerified: user.isVerified,
            isAdmin: user.isAdmin 
          } 
        });
      });
    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).json({ error: "Verification failed" });
    }
  });

  // Resend verification code
  app.post("/api/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      
      const [user] = await getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ error: "Email not found" });
      }

      if (user.isVerified) {
        return res.status(400).json({ error: "Email already verified" });
      }

      // Generate new verification code
      const code = generateVerificationCode();
      await db.insert(verificationCodes).values({
        email: user.email,
        code,
        type: 'signup',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      });

      await sendVerificationEmail(user.email, code);

      res.json({ message: "Verification code sent!" });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ error: "Failed to resend verification code" });
    }
  });

  // Login
  app.post("/api/login", async (req, res, next) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        const error = fromZodError(result.error);
        return res.status(400).json({ error: error.toString() });
      }

      console.log('Login attempt for:', result.data.email);

      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) {
          console.error('Passport authentication error:', err);
          return res.status(500).json({ error: "Login failed" });
        }
        if (!user) {
          console.log('Authentication failed for user:', result.data.email, 'Info:', info);
          return res.status(401).json({ error: info?.message || "Invalid email or password" });
        }

        console.log('User authenticated successfully:', user.email);

        req.login(user, (err) => {
          if (err) {
            console.error('Session creation error:', err);
            return res.status(500).json({ error: "Login failed" });
          }
          console.log('Session created for user:', user.email);
          res.json({ 
            message: "Login successful",
            user: { 
              id: user.id, 
              email: user.email, 
              firstName: user.firstName,
              lastName: user.lastName,
              isVerified: user.isVerified,
              isAdmin: user.isAdmin,
              subscriptionType: user.subscriptionType
            } 
          });
        });
      })(req, res, next);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Logout
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      console.log('User not authenticated, session:', req.session?.id);
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = req.user!;
    console.log('Returning user data for:', user.email);
    res.json({ 
      id: user.id, 
      email: user.email, 
      firstName: user.firstName,
      lastName: user.lastName,
      isVerified: user.isVerified,
      isAdmin: user.isAdmin,
      subscriptionType: user.subscriptionType
    });
  });

  // Create admin user (protected endpoint for testing)
  app.post("/api/create-admin", async (req, res) => {
    try {
      const { email, password, adminSecret } = req.body;
      
      // Simple admin secret check (in production, use proper authorization)
      if (adminSecret !== process.env.ADMIN_SECRET) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const [existingUser] = await getUserByEmail(email);
      if (existingUser) {
        // Update existing user to admin
        const [user] = await db
          .update(users)
          .set({ isAdmin: true })
          .where(eq(users.email, email))
          .returning();
        
        return res.json({ 
          message: "User updated to admin", 
          user: { email: user.email, isAdmin: user.isAdmin } 
        });
      }

      // Create new admin user
      const [user] = await db
        .insert(users)
        .values({
          email,
          password: await hashPassword(password),
          isVerified: true, // Auto-verify admin accounts
          isAdmin: true,
        })
        .returning();

      res.json({ 
        message: "Admin user created", 
        user: { email: user.email, isAdmin: user.isAdmin } 
      });
    } catch (error) {
      console.error("Create admin error:", error);
      res.status(500).json({ error: "Failed to create admin user" });
    }
  });
}

// Middleware to check if user is authenticated
export const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
};

// Middleware to check if user is admin
export const isAdmin = (req: any, res: any, next: any) => {
  if (req.isAuthenticated() && req.user?.isAdmin) {
    return next();
  }
  res.status(403).json({ error: "Admin access required" });
};
