import { Router, Response } from 'express';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../middleware.js';
import { createClassSchema } from '../validation.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authMiddleware);

// GET /api/classes
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const allClasses = await db.query.classes.findMany();
    res.json({
      success: true,
      message: 'Classes retrieved.',
      data: allClasses,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err });
  }
});

// POST /api/classes - Admin only
router.post('/', requireRole(['Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = createClassSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues.map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error: name, gradeLevel, and code are required.',
        errors: errorMessages,
      });
    }

    const { name, gradeLevel, code, description } = parseResult.data;

    const existing = await db.query.classes.findFirst({
      where: eq(schema.classes.code, code.trim().toUpperCase()) // Drizzle case sensitivity might need sql`lower(${schema.classes.code}) = lower(${code})` but let's just use exact match since we store as upper.
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A class with this code already exists.',
      });
    }

    const newClassId = `cls-${uuidv4()}`;

    const [newClass] = await db.insert(schema.classes).values({
      id: newClassId,
      name: name.trim(),
      gradeLevel: gradeLevel.trim(),
      code: code.trim().toUpperCase(),
      description: description?.trim(),
    }).returning();

    res.status(201).json({
      success: true,
      message: 'Class created successfully.',
      data: newClass,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err });
  }
});

// DELETE /api/classes/:id - Admin only
router.delete('/:id', requireRole(['Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const classToRemove = await db.query.classes.findFirst({
      where: eq(schema.classes.id, id)
    });

    if (!classToRemove) {
      return res.status(404).json({
        success: false,
        message: 'Class not found.',
      });
    }

    // Relationship cleanup - Find related assignments
    const assignmentsToDelete = await db.query.assignments.findMany({
      where: eq(schema.assignments.classId, id),
      columns: { id: true }
    });

    const assignmentIds = assignmentsToDelete.map(a => a.id);
    
    // Step-by-step cascade deletion of related records
    if (assignmentIds.length > 0) {
      await db.delete(schema.submissions).where(inArray(schema.submissions.assignmentId, assignmentIds));
    }
    await db.delete(schema.assignments).where(eq(schema.assignments.classId, id));
    await db.delete(schema.teacherAssignments).where(eq(schema.teacherAssignments.classId, id));
    await db.delete(schema.studentClasses).where(eq(schema.studentClasses.classId, id));
    await db.delete(schema.classes).where(eq(schema.classes.id, id));

    res.json({
      success: true,
      message: `Class ${classToRemove.name} deleted successfully.`,
    });
  } catch (err: any) {
    console.error('[Class Delete Error]:', err);
    res.status(500).json({ success: false, message: 'Server error deleting class', error: err?.message || err });
  }
});

export default router;
