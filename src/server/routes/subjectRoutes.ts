import { Router, Response } from 'express';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../middleware.js';
import { createSubjectSchema } from '../validation.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authMiddleware);

// GET /api/subjects
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const allSubjects = await db.query.subjects.findMany();
    res.json({
      success: true,
      message: 'Subjects retrieved.',
      data: allSubjects,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err });
  }
});

// POST /api/subjects - Admin only
router.post('/', requireRole(['Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = createSubjectSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues.map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error: Subject name and code are required.',
        errors: errorMessages,
      });
    }

    const { name, code, description } = parseResult.data;

    const existing = await db.query.subjects.findFirst({
      where: eq(schema.subjects.code, code.trim().toUpperCase())
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A subject with this code already exists.',
      });
    }

    const newSubjectId = `sbj-${uuidv4()}`;

    const [newSubject] = await db.insert(schema.subjects).values({
      id: newSubjectId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description?.trim(),
    }).returning();

    res.status(201).json({
      success: true,
      message: 'Subject created successfully.',
      data: newSubject,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err });
  }
});

// DELETE /api/subjects/:id - Admin only
router.delete('/:id', requireRole(['Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const subjectToRemove = await db.query.subjects.findFirst({
      where: eq(schema.subjects.id, id)
    });

    if (!subjectToRemove) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found.',
      });
    }

    // Relationship cleanup
    const assignmentsToDelete = await db.query.assignments.findMany({
      where: eq(schema.assignments.subjectId, id),
      columns: { id: true }
    });

    const assignmentIds = assignmentsToDelete.map(a => a.id);

    // Step-by-step cascade deletion of related records
    if (assignmentIds.length > 0) {
      await db.delete(schema.submissions).where(inArray(schema.submissions.assignmentId, assignmentIds));
    }
    await db.delete(schema.assignments).where(eq(schema.assignments.subjectId, id));
    await db.delete(schema.teacherAssignments).where(eq(schema.teacherAssignments.subjectId, id));
    await db.delete(schema.subjects).where(eq(schema.subjects.id, id));

    res.json({
      success: true,
      message: `Subject ${subjectToRemove.name} deleted successfully.`,
    });
  } catch (err: any) {
    console.error('[Subject Delete Error]:', err);
    res.status(500).json({ success: false, message: 'Server error deleting subject', error: err?.message || err });
  }
});

export default router;
