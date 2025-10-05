import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import cors from 'cors';
import { DocumentProcessor } from './document-processor';
import path from 'path';
import fs from 'fs/promises';

const app = express();
const PORT = process.env.PORT || 3002;

// Multer configuration for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10, // max 10 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/markdown',
      'application/json',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not supported`));
    }
  },
});

// Middleware
app.use(
  cors({
    origin: ['http://localhost:3001', 'http://127.0.0.1:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Error handling middleware
const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Server Error:', error);

  if (error.message.includes('File type')) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_FILE_TYPE',
      message: error.message,
    });
  }

  if (error.message.includes('File too large')) {
    return res.status(413).json({
      success: false,
      error: 'FILE_TOO_LARGE',
      message: 'File size exceeds 50MB limit',
    });
  }

  res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: 'Internal server error occurred',
  });
};

// Initialize document processor
const documentProcessor = new DocumentProcessor(
  process.env.OPENAI_API_KEY || 'mock-api-key'
);

/**
 * Health check endpoint
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'OK',
    message: 'ThinkCode AI Backend is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: [
      'GET /api/health',
      'POST /api/analyze-documents',
      'POST /api/generate-tasks',
      'POST /api/process-task',
      'GET /api/test-integrations',
    ],
  });
});

/**
 * Root endpoint
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'ThinkCode AI Backend - Document Processing & Task Management',
    version: '1.0.0',
    status: 'running',
    documentation: '/api/health',
  });
});

/**
 * Document analysis endpoint
 */
app.post(
  '/api/analyze-documents',
  upload.array('files', 10),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'NO_FILES',
          message: 'No files provided for analysis',
        });
      }

      console.log(
        `Processing ${files.length} files:`,
        files.map(f => f.originalname)
      );

      // Analyze documents
      const result = await documentProcessor.analyzeDocuments(files);

      // Clean up uploaded files
      await Promise.all(
        files.map(async file => {
          try {
            await fs.unlink(file.path);
          } catch (error) {
            console.warn('Failed to delete file:', file.path, error);
          }
        })
      );

      res.json({
        success: true,
        data: {
          analysis: result.analysis,
          tasks: result.tasks,
          filesProcessed: files.length,
          processedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Document analysis error:', error);

      // Clean up files on error
      if (req.files) {
        const files = req.files as Express.Multer.File[];
        await Promise.all(
          files.map(async file => {
            try {
              await fs.unlink(file.path);
            } catch (cleanupError) {
              console.warn(
                'Failed to delete file on error:',
                file.path,
                cleanupError
              );
            }
          })
        );
      }

      res.status(500).json({
        success: false,
        error: 'ANALYSIS_FAILED',
        message:
          error instanceof Error ? error.message : 'Document analysis failed',
      });
    }
  }
);

/**
 * Task generation endpoint
 */
app.post('/api/generate-tasks', async (req: Request, res: Response) => {
  try {
    const { projectDescription, requirements, complexity } = req.body;

    if (!projectDescription) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_DESCRIPTION',
        message: 'Project description is required',
      });
    }

    // Mock task generation for now
    const mockTasks = [
      {
        id: 'TASK-001',
        title: 'Project Setup and Architecture',
        description: `Set up the basic project structure for: ${projectDescription}`,
        type: 'Epic' as const,
        priority: 'High' as const,
        estimatedHours: 16,
        labels: ['setup', 'architecture'],
        acceptanceCriteria: [
          'Project repository created',
          'Basic folder structure established',
          'Initial documentation written',
        ],
      },
      {
        id: 'TASK-002',
        title: 'Core Feature Implementation',
        description: 'Implement the main functionality based on requirements',
        type: 'Story' as const,
        priority: 'High' as const,
        estimatedHours: 40,
        labels: ['feature', 'core'],
        acceptanceCriteria: [
          'Core features implemented',
          'Unit tests written',
          'Integration tests passed',
        ],
      },
    ];

    res.json({
      success: true,
      data: {
        tasks: mockTasks,
        totalTasks: mockTasks.length,
        estimatedTotalHours: mockTasks.reduce(
          (sum, task) => sum + task.estimatedHours,
          0
        ),
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Task generation error:', error);
    res.status(500).json({
      success: false,
      error: 'GENERATION_FAILED',
      message:
        error instanceof Error ? error.message : 'Task generation failed',
    });
  }
});

/**
 * Task processing endpoint
 */
app.post('/api/process-task', async (req: Request, res: Response) => {
  try {
    const { taskId, action, data } = req.body;

    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_TASK_ID',
        message: 'Task ID is required',
      });
    }

    // Mock task processing
    const mockResult = {
      taskId,
      action: action || 'process',
      status: 'completed',
      result: {
        codeGenerated: action === 'generate-code',
        testsCreated: action === 'create-tests',
        documentationUpdated: action === 'update-docs',
        message: `Task ${taskId} processed successfully with action: ${action}`,
      },
      processedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: mockResult,
    });
  } catch (error) {
    console.error('Task processing error:', error);
    res.status(500).json({
      success: false,
      error: 'PROCESSING_FAILED',
      message:
        error instanceof Error ? error.message : 'Task processing failed',
    });
  }
});

/**
 * Integration testing endpoint
 */
app.get('/api/test-integrations', async (req: Request, res: Response) => {
  try {
    // Mock integration tests
    const integrationResults = {
      database: {
        status: 'connected',
        responseTime: 45,
        lastChecked: new Date().toISOString(),
      },
      openai: {
        status: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured',
        responseTime: 120,
        lastChecked: new Date().toISOString(),
      },
      jira: {
        status: 'configured',
        responseTime: 200,
        lastChecked: new Date().toISOString(),
      },
      fileSystem: {
        status: 'accessible',
        uploadsDir: path.resolve('uploads'),
        responseTime: 10,
        lastChecked: new Date().toISOString(),
      },
    };

    const overallStatus = Object.values(integrationResults).every(
      service =>
        service.status === 'connected' ||
        service.status === 'configured' ||
        service.status === 'accessible'
    )
      ? 'healthy'
      : 'degraded';

    res.json({
      success: true,
      data: {
        overallStatus,
        integrations: integrationResults,
        testedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Integration test error:', error);
    res.status(500).json({
      success: false,
      error: 'INTEGRATION_TEST_FAILED',
      message:
        error instanceof Error ? error.message : 'Integration testing failed',
    });
  }
});

// Apply error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: [
      'GET /api/health',
      'POST /api/analyze-documents',
      'POST /api/generate-tasks',
      'POST /api/process-task',
      'GET /api/test-integrations',
    ],
  });
});

// Ensure uploads directory exists
async function ensureUploadsDir() {
  try {
    await fs.access('uploads');
  } catch {
    await fs.mkdir('uploads', { recursive: true });
    console.log('Created uploads directory');
  }
}

// Start server
async function startServer() {
  try {
    await ensureUploadsDir();

    const server = app.listen(PORT, () => {
      console.log('='.repeat(80));
      console.log('🚀 THINKCODE AI BACKEND SERVER STARTED');
      console.log('='.repeat(80));
      console.log(`📡 Server running on: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📁 Upload limit: 50MB per file, 10 files max`);
      console.log(`🔗 CORS enabled for: http://localhost:3001`);
      console.log('='.repeat(80));
      console.log('📋 Available endpoints:');
      console.log('   GET  /api/health           - Health check');
      console.log('   POST /api/analyze-documents - Document analysis');
      console.log('   POST /api/generate-tasks   - Task generation');
      console.log('   POST /api/process-task     - Task processing');
      console.log('   GET  /api/test-integrations - Integration tests');
      console.log('='.repeat(80));
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('\nSIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export { app };
