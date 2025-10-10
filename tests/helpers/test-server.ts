/**
 * Test Server Helper
 * Creates Express app instance for integration testing
 */

import express, { Application } from 'express';
import cors from 'cors';
import { projectsRouter } from '../../backend/src/routes/projects.routes';

export function createTestServer(): Application {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/api/projects', projectsRouter);

  // Error handling
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Test server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
