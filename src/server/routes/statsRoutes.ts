import { Router, Response } from 'express';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { eq, or } from 'drizzle-orm';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../middleware.js';

const router = Router();
router.use(authMiddleware);

// GET /api/stats - Admin or Teacher summary stats
router.get('/', requireRole(['Admin', 'Teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await db.query.users.findMany();
    const classes = await db.query.classes.findMany();
    const subjects = await db.query.subjects.findMany();
    const assignments = await db.query.assignments.findMany();
    const submissions = await db.query.submissions.findMany();

    const stats = {
      totalUsers: users.length,
      totalStudents: users.filter(u => u.role === 'Student').length,
      totalTeachers: users.filter(u => u.role === 'Teacher').length,
      totalClasses: classes.length,
      totalSubjects: subjects.length,
      totalAssignments: assignments.length,
      totalSubmissions: submissions.length,
      pendingGradingCount: submissions.filter(s => s.status === 'Submitted' || s.status === 'Late').length,
    };

    res.json({
      success: true,
      message: 'System statistics retrieved.',
      data: stats,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err });
  }
});

export default router;
