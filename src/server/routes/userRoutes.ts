import { Router, Response } from 'express';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../middleware.js';
import { hashPassword } from '../auth.js';
import { UserRole } from '../../types/index.js';
import { createUserSchema } from '../validation.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authMiddleware);

// GET /api/users - Admin or Teacher (Teachers can view students/teachers)
router.get('/', requireRole(['Admin', 'Teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role } = req.query;
    let queryArgs: any = {
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    };

    if (role) {
      queryArgs.where = eq(schema.users.role, String(role) as any);
    }

    const allUsers = await db.query.users.findMany(queryArgs);

    res.json({
      success: true,
      message: 'Users retrieved successfully.',
      data: allUsers,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err });
  }
});

// POST /api/users - Admin only
router.post('/', requireRole(['Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = createUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues.map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Invalid user creation parameters.',
        errors: errorMessages,
      });
    }

    const { name, email, password, role } = parseResult.data;

    const existing = await db.query.users.findFirst({
      where: eq(schema.users.email, email.trim().toLowerCase())
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    const newUserId = `usr-${uuidv4()}`;

    const [newUser] = await db.insert(schema.users).values({
      id: newUserId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role as any,
      passwordHash: hashPassword(password),
    }).returning();

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err });
  }
});

// DELETE /api/users/:id - Admin only
router.delete('/:id', requireRole(['Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existingUser = await db.query.users.findFirst({ where: eq(schema.users.id, id) });
    
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (existingUser.id === req.user?.userId) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
    }

    await db.transaction(async (tx) => {
      if (existingUser.role === 'Student') {
        await tx.delete(schema.submissions).where(eq(schema.submissions.studentId, id));
        await tx.delete(schema.studentClasses).where(eq(schema.studentClasses.studentId, id));
      } else if (existingUser.role === 'Teacher') {
        await tx.delete(schema.teacherAssignments).where(eq(schema.teacherAssignments.teacherId, id));
      }
      
      await tx.delete(schema.users).where(eq(schema.users.id, id));
    });

    res.json({
      success: true,
      message: `User ${existingUser.name} removed successfully.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err });
  }
});

export default router;
