import { Router, Response } from 'express';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../middleware.js';

const router = Router();
router.use(authMiddleware);

// GET /api/settings - Fetch system settings (Admin only)
router.get('/', requireRole(['Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const settingsList = await db.select().from(schema.systemSettings).where(eq(schema.systemSettings.id, 'default'));
    let settings = settingsList[0];

    if (!settings) {
      // Create default if missing
      const newSettings = {
        id: 'default',
        portalName: 'EduAssign Portal',
        academicYear: '2026-2027',
        allowStudentRegistration: true,
        requireTeacherApproval: false,
        maxFileUploadMB: 25,
        defaultPassingGrade: 50,
      };
      await db.insert(schema.systemSettings).values(newSettings);
      settings = newSettings as any;
    }

    res.json({
      success: true,
      message: 'System settings retrieved.',
      data: settings,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching settings', error: err });
  }
});

// PUT /api/settings - Update system settings (Admin only)
router.put('/', requireRole(['Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      portalName,
      academicYear,
      allowStudentRegistration,
      requireTeacherApproval,
      maxFileUploadMB,
      defaultPassingGrade,
    } = req.body;

    const existing = await db.select().from(schema.systemSettings).where(eq(schema.systemSettings.id, 'default'));

    if (existing.length === 0) {
      await db.insert(schema.systemSettings).values({
        id: 'default',
        portalName: portalName ?? 'EduAssign Portal',
        academicYear: academicYear ?? '2026-2027',
        allowStudentRegistration: allowStudentRegistration ?? true,
        requireTeacherApproval: requireTeacherApproval ?? false,
        maxFileUploadMB: Number(maxFileUploadMB) || 25,
        defaultPassingGrade: Number(defaultPassingGrade) || 50,
        updatedAt: new Date(),
      });
    } else {
      await db.update(schema.systemSettings)
        .set({
          portalName: portalName !== undefined ? portalName : existing[0].portalName,
          academicYear: academicYear !== undefined ? academicYear : existing[0].academicYear,
          allowStudentRegistration: allowStudentRegistration !== undefined ? Boolean(allowStudentRegistration) : existing[0].allowStudentRegistration,
          requireTeacherApproval: requireTeacherApproval !== undefined ? Boolean(requireTeacherApproval) : existing[0].requireTeacherApproval,
          maxFileUploadMB: maxFileUploadMB !== undefined ? Number(maxFileUploadMB) : existing[0].maxFileUploadMB,
          defaultPassingGrade: defaultPassingGrade !== undefined ? Number(defaultPassingGrade) : existing[0].defaultPassingGrade,
          updatedAt: new Date(),
        })
        .where(eq(schema.systemSettings.id, 'default'));
    }

    const updated = await db.select().from(schema.systemSettings).where(eq(schema.systemSettings.id, 'default'));

    res.json({
      success: true,
      message: 'System settings updated successfully in database.',
      data: updated[0],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update system settings', error: err });
  }
});

export default router;
