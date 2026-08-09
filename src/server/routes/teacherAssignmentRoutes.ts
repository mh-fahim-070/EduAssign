import { Router, Response } from 'express';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../middleware.js';
import { assignTeacherSchema } from '../validation.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authMiddleware);

// GET /api/teacher-assignments
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { teacherId } = req.query;
    const user = req.user!;
    
    let queryArgs: any = {
      with: {
        teacher: true,
        subject: true,
        class: true,
      }
    };

    const conditions = [];

    if (user.role === 'Teacher') {
      conditions.push(eq(schema.teacherAssignments.teacherId, user.userId));
    } else if (teacherId) {
      conditions.push(eq(schema.teacherAssignments.teacherId, String(teacherId)));
    }

    if (conditions.length > 0) {
      queryArgs.where = and(...conditions);
    }

    const taList = await db.query.teacherAssignments.findMany(queryArgs);

    const enriched = taList.map(ta => ({
      ...ta,
      teacherName: ta.teacher?.name || 'Unknown Teacher',
      subjectName: ta.subject?.name || 'Unknown Subject',
      className: ta.class?.name || 'Unknown Class',
      teacher: undefined,
      subject: undefined,
      class: undefined,
    }));

    res.json({
      success: true,
      message: 'Teacher assignments retrieved.',
      data: enriched,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err });
  }
});

// POST /api/teacher-assignments - Admin only
router.post('/', requireRole(['Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = assignTeacherSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues.map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error: teacherId, subjectId, and classId are required.',
        errors: errorMessages,
      });
    }

    const { teacherId, subjectId, classId } = parseResult.data;

    const teacher = await db.query.users.findFirst({
      where: and(eq(schema.users.id, teacherId), eq(schema.users.role, 'Teacher'))
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Specified user is not a valid Teacher.',
      });
    }

    const subject = await db.query.subjects.findFirst({ where: eq(schema.subjects.id, subjectId) });
    const cls = await db.query.classes.findFirst({ where: eq(schema.classes.id, classId) });

    if (!subject || !cls) {
      return res.status(404).json({
        success: false,
        message: 'Specified Subject or Class was not found.',
      });
    }

    const exists = await db.query.teacherAssignments.findFirst({
      where: and(
        eq(schema.teacherAssignments.teacherId, teacherId),
        eq(schema.teacherAssignments.subjectId, subjectId),
        eq(schema.teacherAssignments.classId, classId)
      )
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'This teacher is already assigned to this subject and class.',
      });
    }

    const newAssignmentId = `tsc-${uuidv4()}`;

    const [newAssignment] = await db.insert(schema.teacherAssignments).values({
      id: newAssignmentId,
      teacherId,
      subjectId,
      classId,
    }).returning();

    res.status(201).json({
      success: true,
      message: 'Teacher assigned successfully.',
      data: {
        ...newAssignment,
        teacherName: teacher.name,
        subjectName: subject.name,
        className: cls.name,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err });
  }
});

// DELETE /api/teacher-assignments/:id - Admin only
router.delete('/:id', requireRole(['Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const existing = await db.query.teacherAssignments.findFirst({ where: eq(schema.teacherAssignments.id, id) });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Teacher assignment record not found.',
      });
    }

    await db.delete(schema.teacherAssignments).where(eq(schema.teacherAssignments.id, id));

    res.json({
      success: true,
      message: 'Teacher assignment removed successfully.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err });
  }
});

export default router;
