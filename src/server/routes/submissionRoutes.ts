import { Router, Response } from 'express';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { eq, inArray, and } from 'drizzle-orm';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../middleware.js';
import { submitAssignmentSchema, gradeSubmissionSchema } from '../validation.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authMiddleware);

// GET /api/submissions - Filtered by assignmentId or user context
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { assignmentId, studentId } = req.query;
    const user = req.user!;

    let queryArgs: any = {
      with: {
        student: true,
        assignment: true,
      }
    };

    const conditions = [];

    if (assignmentId) {
      conditions.push(eq(schema.submissions.assignmentId, String(assignmentId)));
    }

    if (studentId) {
      conditions.push(eq(schema.submissions.studentId, String(studentId)));
    }

    if (user.role === 'Student') {
      conditions.push(eq(schema.submissions.studentId, user.userId));
    } else if (user.role === 'Teacher') {
      const teacherAssignments = await db.query.assignments.findMany({
        where: eq(schema.assignments.teacherId, user.userId)
      });
      const taIds = teacherAssignments.map(a => a.id);
      if (taIds.length > 0) {
        conditions.push(inArray(schema.submissions.assignmentId, taIds));
      } else {
        return res.json({ success: true, message: 'Submissions retrieved.', data: [] });
      }
    }

    if (conditions.length > 0) {
      queryArgs.where = and(...conditions);
    }

    const filtered = await db.query.submissions.findMany(queryArgs);

    const enriched = filtered.map(s => ({
      ...s,
      studentName: s.student?.name || 'Unknown Student',
      studentEmail: s.student?.email || '',
      assignmentTitle: s.assignment?.title || 'Unknown Assignment',
      maxMarks: s.assignment?.maxMarks || 100,
      student: undefined,
      assignment: undefined,
    }));

    res.json({
      success: true,
      message: 'Submissions retrieved.',
      data: enriched,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err });
  }
});

// POST /api/submissions - Student submits or updates work
router.post('/', requireRole(['Student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = submitAssignmentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error: assignmentId and answer content cannot be empty.',
        errors: parseResult.error.issues.map(e => e.message),
      });
    }

    const { assignmentId, content } = parseResult.data;
    const user = req.user!;

    const assignment = await db.query.assignments.findFirst({ where: eq(schema.assignments.id, assignmentId) });
    
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const isEnrolled = await db.query.studentClasses.findFirst({
      where: and(
        eq(schema.studentClasses.studentId, user.userId),
        eq(schema.studentClasses.classId, assignment.classId)
      )
    });

    if (!isEnrolled) {
      return res.status(403).json({ success: false, message: 'Forbidden. You are not enrolled in the class for this assignment.' });
    }

    if (assignment.status !== 'Published' && assignment.status !== 'Closed') {
      return res.status(400).json({ success: false, message: 'Cannot submit to an assignment that is not published.' });
    }

    const now = new Date();
    const deadlineDate = new Date(assignment.deadline);

    if (now > deadlineDate || assignment.status === 'Closed') {
      return res.status(400).json({ success: false, message: 'Submission failed. The deadline for this assignment has passed.' });
    }

    const existing = await db.query.submissions.findFirst({
      where: and(
        eq(schema.submissions.assignmentId, assignmentId),
        eq(schema.submissions.studentId, user.userId)
      )
    });

    if (existing) {
      if (existing.status === 'Reviewed') {
        return res.status(400).json({ success: false, message: 'This submission has already been graded and locked by your teacher.' });
      }

      const [updatedSubmission] = await db.update(schema.submissions).set({
        content: content.trim(),
        submittedAt: now,
        updatedAt: now,
      }).where(eq(schema.submissions.id, existing.id)).returning();

      return res.json({
        success: true,
        message: 'Submission updated successfully.',
        data: updatedSubmission,
      });
    } else {
      const newSubmissionId = `sub-${uuidv4()}`;
      const [newSubmission] = await db.insert(schema.submissions).values({
        id: newSubmissionId,
        assignmentId,
        studentId: user.userId,
        content: content.trim(),
        submittedAt: now,
        status: 'Submitted',
      }).returning();

      return res.status(201).json({
        success: true,
        message: 'Assignment submitted successfully.',
        data: newSubmission,
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err });
  }
});

// PUT /api/submissions/:id/grade - Teacher or Admin grades and provides feedback
router.put('/:id/grade', requireRole(['Teacher', 'Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const parseResult = gradeSubmissionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error: Invalid grading parameters.',
        errors: parseResult.error.issues.map(e => e.message),
      });
    }

    const { marks, feedback, status } = parseResult.data;

    const submission = await db.query.submissions.findFirst({ where: eq(schema.submissions.id, id) });
    
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    const assignment = await db.query.assignments.findFirst({ where: eq(schema.assignments.id, submission.assignmentId) });
    
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Associated assignment not found.' });
    }

    if (user.role === 'Teacher' && assignment.teacherId !== user.userId) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only grade submissions for assignments you created.' });
    }

    if (marks !== undefined && marks !== null) {
      const numMarks = Number(marks);
      if (isNaN(numMarks) || numMarks < 0) {
        return res.status(400).json({ success: false, message: 'Validation error: Marks cannot be negative.' });
      }
      if (numMarks > assignment.maxMarks) {
        return res.status(400).json({ success: false, message: `Validation error: Marks (${numMarks}) cannot exceed maximum marks (${assignment.maxMarks}).` });
      }
    }

    const validStatuses = ['Submitted', 'Late', 'Reviewed', 'Returned'];
    const newStatus = validStatuses.includes(status as any) ? status : 'Reviewed';

    const [updatedSubmission] = await db.update(schema.submissions).set({
      marks: marks !== undefined && marks !== null ? Number(marks) : submission.marks,
      feedback: feedback !== undefined ? feedback.trim() : submission.feedback,
      status: newStatus as any,
      updatedAt: new Date(),
    }).where(eq(schema.submissions.id, id)).returning();

    res.json({
      success: true,
      message: 'Submission graded successfully.',
      data: updatedSubmission,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err });
  }
});

export default router;
