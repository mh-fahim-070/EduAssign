
import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { createProxyMiddleware } from 'http-proxy-middleware';

import { errorHandler } from './src/server/middleware.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  const useDotnetBackend =
    process.env.USE_DOTNET_BACKEND === 'true';

  const dotnetBackendUrl =
    process.env.DOTNET_BACKEND_URL || 'http://localhost:5005';

  // --------------------------------------------------
  // Basic middleware
  // --------------------------------------------------

  app.use(cors());

  // Log incoming API calls
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API CALL] ${req.method} ${req.path}`);
    }

    next();
  });

  // --------------------------------------------------
  // Backend selection
  // --------------------------------------------------

  if (useDotnetBackend) {
    // ================================================
    // .NET BACKEND MODE
    // ================================================

    console.log(
      `[BACKEND] Using .NET backend: ${dotnetBackendUrl}`
    );

    /*
     * IMPORTANT:
     *
     * Do NOT use express.json() before this proxy.
     *
     * The request body must remain a raw stream so that
     * http-proxy-middleware can forward it to ASP.NET Core.
     *
     * The /api path is intentionally NOT stripped or rewritten.
     *
     * Request:
     *   POST /api/auth/login
     *
     * Forwarded to:
     *   http://localhost:5005/api/auth/login
     */

    app.use(
      createProxyMiddleware({
        target: dotnetBackendUrl,
        changeOrigin: true,

        // Only proxy API requests.
        pathFilter: ['/api/**'],

        // Keep the original URL/path.
        // No pathRewrite is needed.
      })
    );

  } else {
    // ================================================
    // NODE / DRIZZLE BACKEND MODE
    // ================================================

    console.log(
      '[BACKEND] Using Node/Drizzle backend'
    );

    // JSON parsing is only needed when Node handles
    // the API requests itself.
    app.use(express.json());

    // Load Node backend modules only in Node mode.
    const { initializeDatabase } =
      await import('./src/db/index.js');

    const { default: authRoutes } =
      await import('./src/server/routes/authRoutes.js');

    const { default: userRoutes } =
      await import('./src/server/routes/userRoutes.js');

    const { default: classRoutes } =
      await import('./src/server/routes/classRoutes.js');

    const { default: subjectRoutes } =
      await import('./src/server/routes/subjectRoutes.js');

    const { default: teacherAssignmentRoutes } =
      await import(
        './src/server/routes/teacherAssignmentRoutes.js'
      );

    const { default: studentClassRoutes } =
      await import(
        './src/server/routes/studentClassRoutes.js'
      );

    const { default: assignmentRoutes } =
      await import(
        './src/server/routes/assignmentRoutes.js'
      );

    const { default: submissionRoutes } =
      await import(
        './src/server/routes/submissionRoutes.js'
      );

    const { default: statsRoutes } =
      await import('./src/server/routes/statsRoutes.js');

    const { default: settingsRoutes } =
      await import('./src/server/routes/settingsRoutes.js');

    const { default: docsRoutes } =
      await import('./src/server/routes/docsRoutes.js');

    // Initialize Node/Drizzle database.
    await initializeDatabase();

    // Mount Node API endpoints.
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/classes', classRoutes);
    app.use('/api/subjects', subjectRoutes);
    app.use(
      '/api/teacher-assignments',
      teacherAssignmentRoutes
    );
    app.use(
      '/api/student-classes',
      studentClassRoutes
    );
    app.use('/api/assignments', assignmentRoutes);
    app.use('/api/submissions', submissionRoutes);
    app.use('/api/stats', statsRoutes);
    app.use('/api/settings', settingsRoutes);
    app.use('/api/docs', docsRoutes);

    // Health check.
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'ok',
        service:
          'Assignment & Submission Management System API',
        timestamp: new Date().toISOString(),
      });
    });
  }

  // --------------------------------------------------
  // Global Exception Middleware
  // --------------------------------------------------

  app.use(errorHandler);

  // --------------------------------------------------
  // Vite development middleware / production static
  // --------------------------------------------------

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');

    app.use(express.static(distPath));

    app.get('*', (req, res) => {
      res.sendFile(
        path.join(distPath, 'index.html')
      );
    });
  }

  // --------------------------------------------------
  // Start server
  // --------------------------------------------------

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[SERVER RUNNING] Assignment System frontend live on http://0.0.0.0:${PORT}`
    );

    if (useDotnetBackend) {
      console.log(
        `[BACKEND] API requests are proxied to ${dotnetBackendUrl}`
      );
    } else {
      console.log(
        '[BACKEND] API requests are handled by Node/Drizzle'
      );
    }
  });
}

startServer().catch((err) => {
  console.error('[SERVER BOOT ERROR]', err);
  process.exit(1);
});
