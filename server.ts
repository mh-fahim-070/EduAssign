import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import authRoutes from './src/server/routes/authRoutes.js';
import userRoutes from './src/server/routes/userRoutes.js';
import classRoutes from './src/server/routes/classRoutes.js';
import subjectRoutes from './src/server/routes/subjectRoutes.js';
import teacherAssignmentRoutes from './src/server/routes/teacherAssignmentRoutes.js';
import studentClassRoutes from './src/server/routes/studentClassRoutes.js';
import assignmentRoutes from './src/server/routes/assignmentRoutes.js';
import submissionRoutes from './src/server/routes/submissionRoutes.js';
import statsRoutes from './src/server/routes/statsRoutes.js';
import settingsRoutes from './src/server/routes/settingsRoutes.js';
import docsRoutes from './src/server/routes/docsRoutes.js';
import { errorHandler } from './src/server/middleware.js';
import { initializeDatabase } from './src/db/index.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize database tables and seed sample data if empty
  await initializeDatabase();

  app.use(cors());
  app.use(express.json());

  // Log incoming API calls
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API CALL] ${req.method} ${req.path}`);
    }
    next();
  });

  // Mount API endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/classes', classRoutes);
  app.use('/api/subjects', subjectRoutes);
  app.use('/api/teacher-assignments', teacherAssignmentRoutes);
  app.use('/api/student-classes', studentClassRoutes);
  app.use('/api/assignments', assignmentRoutes);
  app.use('/api/submissions', submissionRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/docs', docsRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Assignment & Submission Management System API',
      timestamp: new Date().toISOString(),
    });
  });

  // Global Exception Middleware
  app.use(errorHandler);

  // Vite development middleware or production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER RUNNING] Assignment System backend live on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[SERVER BOOT ERROR]', err);
});
