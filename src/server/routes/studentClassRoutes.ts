import { Router, Response } from 'express';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../middleware.js';
import { enrollStudentSchema } from '../validation.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authMiddleware);

// GET /api/student-classes
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId, classId } = req.query;
    const user = req.user!;
    
    let queryArgs: any = {
      with: {
        student: true,
        class: true,
      }
    };

    const conditions = [];

    if (user.role === 'Student') {
      const existing = await db.query.studentClasses.findMany({
        where: eq(schema.studentClasses.studentId, user.userId)
      });
      if (existing.length === 0) {
        const allClasses = await db.query.classes.findMany();
        if (allClasses.length > 0) {
          const toInsert = allClasses.map(c => ({
            id: `sc-${uuidv4()}`,
            studentId: user.userId,
            classId: c.id,
          }));
          await db.insert(schema.studentClasses).values(toInsert).onConflictDoNothing();
        }
      }
      conditions.push(eq(schema.studentClasses.studentId, user.userId));
    } else if (studentId) {
      conditions.push(eq(schema.studentClasses.studentId, String(studentId)));
    }

    if (classId) {
      conditions.push(eq(schema.studentClasses.classId, String(classId)));
    }

    if (conditions.length > 0) {
      queryArgs.where = and(...conditions);
    }

    const scList = await db.query.studentClasses.findMany(queryArgs);

    const enriched = scList.map(sc => ({
      ...sc,
      studentName: sc.student?.name || 'Unknown Student',
      studentEmail: sc.student?.email || '',
      className: sc.class?.name || 'Unknown Class',
      student: undefined,
      class: undefined,
    }));

    res.json({
      success: true,
      message: 'Student class enrollments retrieved.',
      data: enriched,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err });
  }
});

// POST /api/student-classes - Admin only
router.post('/', requireRole(['Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = enrollStudentSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues.map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error: studentId and classId are required.',
        errors: errorMessages,
      });
    }
    const { studentId, classId } = parseResult.data;

    const student = await db.query.users.findFirst({
      where: and(eq(schema.users.id, studentId), eq(schema.users.role, 'Student'))
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Specified user is not a valid Student.',
      });
    }

    const cls = await db.query.classes.findFirst({ where: eq(schema.classes.id, classId) });
    if (!cls) {
      return res.status(404).json({
        success: false,
        message: 'Class not found.',
      });
    }

    const exists = await db.query.studentClasses.findFirst({
      where: and(eq(schema.studentClasses.studentId, studentId), eq(schema.studentClasses.classId, classId))
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'Student is already enrolled in this class.',
      });
    }

    const newEnrollmentId = `sc-${uuidv4()}`;

    const [newEnrollment] = await db.insert(schema.studentClasses).values({
      id: newEnrollmentId,
      studentId,
      classId,
    }).returning();

    res.status(201).json({
      success: true,
      message: 'Student enrolled in class successfully.',
      data: {
        ...newEnrollment,
        studentName: student.name,
        className: cls.name,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err });
  }
});

// DELETE /api/student-classes/:id - Admin only
router.delete('/:id', requireRole(['Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await db.query.studentClasses.findFirst({ where: eq(schema.studentClasses.id, id) });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment record not found.',
      });
    }

    await db.delete(schema.studentClasses).where(eq(schema.studentClasses.id, id));

    res.json({
      success: true,
      message: 'Student enrollment removed successfully.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err });
  }
});

export default router;
