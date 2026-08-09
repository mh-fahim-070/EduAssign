import { Router, Response } from 'express';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { generateToken, verifyPassword, hashPassword } from '../auth.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware.js';
import { loginSchema, createUserSchema } from '../validation.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues.map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error: Email and password are required.',
        errors: errorMessages,
      });
    }

    const { email, password, expectedRole } = parseResult.data;

    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, email.trim().toLowerCase())
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      console.warn(`[AUTH] Failed login attempt for email: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    if (expectedRole && user.role !== expectedRole) {
      console.warn(`[AUTH] Role mismatch for ${email}. Expected: ${expectedRole}, Actual: ${user.role}`);
      return res.status(403).json({
        success: false,
        message: `Access Denied: Account '${email}' has role '${user.role}', but '${expectedRole}' role tab was selected. Please click the '${user.role}' button to sign in.`,
      });
    }

    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during login', error: err });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res: Response) => {
  try {
    const parseResult = createUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues.map(e => e.message);
      return res.status(400).json({
        success: false,
        message: errorMessages[0] || 'Invalid registration data',
        errors: errorMessages,
      });
    }

    const { name, email, password, role } = parseResult.data;
    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await db.query.users.findFirst({
      where: eq(schema.users.email, cleanEmail)
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const passwordHash = hashPassword(password);
    const [newUser] = await db.insert(schema.users).values({
      id: uuidv4(),
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role,
    }).returning();

    const token = generateToken({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt.toISOString(),
      updatedAt: newUser.updatedAt.toISOString(),
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: {
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during registration', error: err });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, cleanEmail)
    });

    // For security, respond with success regardless of user existence to avoid account enumeration
    res.json({
      success: true,
      message: `If an account with ${cleanEmail} exists, a password reset link has been sent to your inbox.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during password reset request' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId)
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    res.json({
      success: true,
      message: 'Profile retrieved.',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err });
  }
});

export default router;
