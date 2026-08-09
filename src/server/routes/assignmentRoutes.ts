import { Router, Response } from 'express';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { eq, inArray, and } from 'drizzle-orm';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../middleware.js';
import { createAssignmentSchema, updateAssignmentSchema, updateAssignmentStatusSchema } from '../validation.js';
import { AssignmentStatus } from '../../types/index.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authMiddleware);

// GET /api/assignments
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    let query = db.select({
      id: schema.assignments.id,
      title: schema.assignments.title,
      description: schema.assignments.description,
      classId: schema.assignments.classId,
      subjectId: schema.assignments.subjectId,
      teacherId: schema.assignments.teacherId,
      deadline: schema.assignments.deadline,
      maxMarks: schema.assignments.maxMarks,
      status: schema.assignments.status,
      createdAt: schema.assignments.createdAt,
      updatedAt: schema.assignments.updatedAt,
      className: schema.classes.name,
      subjectName: schema.subjects.name,
      teacherName: schema.users.name,
    })
    .from(schema.assignments)
    .leftJoin(schema.classes, eq(schema.assignments.classId, schema.classes.id))
    .leftJoin(schema.subjects, eq(schema.assignments.subjectId, schema.subjects.id))
    .leftJoin(schema.users, eq(schema.assignments.teacherId, schema.users.id));

    const allAssignments = await query;

    let filteredAssignments = allAssignments;

    if (user.role === 'Student') {
      let studentEnrolledClasses = await db.query.studentClasses.findMany({
        where: eq(schema.studentClasses.studentId, user.userId)
      });

      // Auto-enroll student into all existing classes if they have no class enrollments yet
      if (studentEnrolledClasses.length === 0) {
        const allClasses = await db.query.classes.findMany();
        if (allClasses.length > 0) {
          const enrollmentsToInsert = allClasses.map(c => ({
            id: `sc-${uuidv4()}`,
            studentId: user.userId,
            classId: c.id,
          }));
          await db.insert(schema.studentClasses).values(enrollmentsToInsert).onConflictDoNothing();
          studentEnrolledClasses = await db.query.studentClasses.findMany({
            where: eq(schema.studentClasses.studentId, user.userId)
          });
        }
      }

      const enrolledClassIds = studentEnrolledClasses.map(sc => sc.classId);
      
      const studentSubmissions = await db.query.submissions.findMany({
        where: eq(schema.submissions.studentId, user.userId)
      });
      const submissionMap = new Map(studentSubmissions.map(s => [s.assignmentId, s]));

      filteredAssignments = allAssignments
        .filter(a => (enrolledClassIds.length === 0 || enrolledClassIds.includes(a.classId)) && a.status === 'Published')
        .map(a => ({
          ...a,
          mySubmission: submissionMap.get(a.id) || null,
        }));
    } else if (user.role === 'Teacher') {
      filteredAssignments = allAssignments.filter(a => a.teacherId === user.userId);
    }

    res.json({
      success: true,
      message: 'Assignments retrieved.',
      data: filteredAssignments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err });
  }
});

// GET /api/assignments/:id
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    
    const assignmentRows = await db.select({
      id: schema.assignments.id,
      title: schema.assignments.title,
      description: schema.assignments.description,
      classId: schema.assignments.classId,
      subjectId: schema.assignments.subjectId,
      teacherId: schema.assignments.teacherId,
      deadline: schema.assignments.deadline,
      maxMarks: schema.assignments.maxMarks,
      status: schema.assignments.status,
      createdAt: schema.assignments.createdAt,
      updatedAt: schema.assignments.updatedAt,
      className: schema.classes.name,
      subjectName: schema.subjects.name,
      teacherName: schema.users.name,
    })
    .from(schema.assignments)
    .leftJoin(schema.classes, eq(schema.assignments.classId, schema.classes.id))
    .leftJoin(schema.subjects, eq(schema.assignments.subjectId, schema.subjects.id))
    .leftJoin(schema.users, eq(schema.assignments.teacherId, schema.users.id))
    .where(eq(schema.assignments.id, id));

    const assignment = assignmentRows[0];

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    if (user.role === 'Student') {
      if (assignment.status === 'Draft') {
        return res.status(403).json({ success: false, message: 'Forbidden. You do not have permission to view this assignment.' });
      }
    }

    if (user.role === 'Teacher' && assignment.teacherId !== user.userId) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only view assignments you created.' });
    }

    const assignmentSubmissions = await db.query.submissions.findMany({
      where: eq(schema.submissions.assignmentId, assignment.id)
    });

    let mySubmission;
    if (user.role === 'Student') {
      mySubmission = assignmentSubmissions.find(s => s.studentId === user.userId);
    }

    res.json({
      success: true,
      message: 'Assignment details retrieved.',
      data: {
        ...assignment,
        submissionCount: assignmentSubmissions.length,
        mySubmission,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err });
  }
});

// POST /api/assignments - Teacher or Admin
router.post('/', requireRole(['Teacher', 'Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = createAssignmentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error: Missing or invalid required fields for assignment creation.',
        errors: parseResult.error.issues.map(e => e.message),
      });
    }

    const { title, description, classId, subjectId, deadline, maxMarks, status } = parseResult.data;
    const user = req.user!;

    const cls = await db.query.classes.findFirst({ where: eq(schema.classes.id, classId) });
    const sbj = await db.query.subjects.findFirst({ where: eq(schema.subjects.id, subjectId) });

    if (!cls || !sbj) {
      return res.status(400).json({
        success: false,
        message: 'Validation error: Specified class or subject does not exist.',
      });
    }

    if (user.role === 'Teacher') {
      const authorized = await db.query.teacherAssignments.findFirst({
        where: and(
          eq(schema.teacherAssignments.teacherId, user.userId),
          eq(schema.teacherAssignments.classId, classId),
          eq(schema.teacherAssignments.subjectId, subjectId)
        )
      });
      if (!authorized) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. You are not assigned to teach this class and subject combination.',
        });
      }
    }

    const newAssignmentId = `asg-${uuidv4()}`;
    const validStatuses = ['Draft', 'Published', 'Closed'];
    const assignmentStatus = status && validStatuses.includes(status) ? status as any : 'Published';

    const [newAssignment] = await db.insert(schema.assignments).values({
      id: newAssignmentId,
      title: title.trim(),
      description: description.trim(),
      classId,
      subjectId,
      teacherId: user.userId,
      deadline: new Date(deadline),
      maxMarks: Number(maxMarks),
      status: assignmentStatus,
    }).returning();

    res.status(201).json({
      success: true,
      message: `Assignment '${newAssignment.title}' created successfully.`,
      data: {
        ...newAssignment,
        className: cls.name,
        subjectName: sbj.name,
        teacherName: user.name,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err });
  }
});

// PUT /api/assignments/:id - Teacher (owner) or Admin
router.put('/:id', requireRole(['Teacher', 'Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const parseResult = updateAssignmentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error: Invalid update parameters.',
        errors: parseResult.error.issues.map(e => e.message),
      });
    }

    const existingAssignment = await db.query.assignments.findFirst({ where: eq(schema.assignments.id, id) });
    if (!existingAssignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    if (user.role === 'Teacher' && existingAssignment.teacherId !== user.userId) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only modify assignments that you created.' });
    }

    const { title, description, deadline, maxMarks, status } = parseResult.data;

    const [updatedAssignment] = await db.update(schema.assignments).set({
      title: title ? title.trim() : existingAssignment.title,
      description: description ? description.trim() : existingAssignment.description,
      deadline: deadline ? new Date(deadline) : existingAssignment.deadline,
      maxMarks: maxMarks !== undefined ? Number(maxMarks) : existingAssignment.maxMarks,
      status: (status as any) || existingAssignment.status,
      updatedAt: new Date(),
    }).where(eq(schema.assignments.id, id)).returning();

    res.json({
      success: true,
      message: 'Assignment updated successfully.',
      data: updatedAssignment,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err });
  }
});

// PATCH /api/assignments/:id/status - Teacher (owner) or Admin
router.patch('/:id/status', requireRole(['Teacher', 'Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const parseResult = updateAssignmentStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error: Invalid status value.',
        errors: parseResult.error.issues.map(e => e.message),
      });
    }

    const existingAssignment = await db.query.assignments.findFirst({ where: eq(schema.assignments.id, id) });
    if (!existingAssignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    if (user.role === 'Teacher' && existingAssignment.teacherId !== user.userId) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only update status for assignments that you created.' });
    }

    const { status } = parseResult.data;

    const [updatedAssignment] = await db.update(schema.assignments).set({
      status: status as any,
      updatedAt: new Date(),
    }).where(eq(schema.assignments.id, id)).returning();

    res.json({
      success: true,
      message: `Assignment status updated to ${status}.`,
      data: updatedAssignment,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err });
  }
});

// DELETE /api/assignments/:id - Teacher (owner) or Admin
router.delete('/:id', requireRole(['Teacher', 'Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const existingAssignment = await db.query.assignments.findFirst({ where: eq(schema.assignments.id, id) });
    if (!existingAssignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    if (user.role === 'Teacher' && existingAssignment.teacherId !== user.userId) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only delete assignments that you created.' });
    }

    await db.transaction(async (tx) => {
      await tx.delete(schema.submissions).where(eq(schema.submissions.assignmentId, id));
      await tx.delete(schema.assignments).where(eq(schema.assignments.id, id));
    });

    res.json({
      success: true,
      message: 'Assignment deleted successfully.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err });
  }
});

export default router;
