import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import cors from 'cors';
import { DocumentProcessor } from './document-processor';

import fs from 'fs/promises';

import { RealTaskService } from './services/real-task-service';
import { RealIntegrationService } from './services/real-integration-service';
import { RealWorkflowService } from './services/real-workflow-service';

// Import API routes
import { apiRoutes } from './routes/index';

const app = express();
const PORT = process.env.PORT || 3002;

// Multer configuration for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10, // max 10 files
  },
  fileFilter: (req: Request, file: any, cb: any) => {
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
  _next: NextFunction
): void => {
  console.error('Server Error:', error);

  if (error.message.includes('File type')) {
    res.status(400).json({
      success: false,
      error: 'INVALID_FILE_TYPE',
      message: error.message,
    });
    return;
  }

  if (error.message.includes('File too large')) {
    res.status(413).json({
      success: false,
      error: 'FILE_TOO_LARGE',
      message: 'File size exceeds 50MB limit',
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: 'Internal server error occurred',
  });
};

// Initialize services
const documentProcessor = new DocumentProcessor(
  process.env.OPENAI_API_KEY || ''
);

const taskService = new RealTaskService();
const integrationService = new RealIntegrationService();
const workflowService = new RealWorkflowService();

// Configure API Routes
apiRoutes.forEach(route => {
  app.use(route.path, route.router);
  console.log(`✅ Configured API route: ${route.path}`);
});

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
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const files = req.files as any[];

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
        const files = req.files as any[];
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
 * Task generation endpoint - Using Real Task Service
 */
app.post(
  '/api/generate-tasks',
  upload.array('files'),
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { projectType, complexity, timeline, team_size } = req.body;
      const files = req.files as any[];

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FILES',
          message: 'At least one file is required for task generation',
        });
      }

      // Use real task service for task generation
      const result = await taskService.generateTasks(files, {
        projectType,
        complexity,
        timeline,
        team_size: team_size ? parseInt(team_size) : undefined,
      });

      res.json({
        success: true,
        data: {
          ...result,
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
  }
);

/**
 * Task processing endpoint - Using Real Task Service
 */
app.post(
  '/api/process-task',
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { taskId, action } = req.body;

      if (!taskId) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_TASK_ID',
          message: 'Task ID is required',
        });
      }

      // Use real task service for task processing
      const result = await taskService.processTask(taskId, action || 'process');

      res.json({
        success: true,
        data: result,
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
  }
);

/**
 * Integration testing endpoint - Using Real Integration Service
 */
app.get('/api/test-integrations', async (req: Request, res: Response) => {
  try {
    // Use real integration service for comprehensive testing
    const result = await integrationService.runIntegrationTests();

    res.json({
      success: true,
      data: result,
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

/**
 * Workflow Management Endpoints
 */

// Get all workflows
app.get('/api/workflows', async (req: Request, res: Response) => {
  try {
    const { status, category, priority, sortBy, sortOrder, limit, offset } =
      req.query;

    const result = await workflowService.getWorkflows({
      status: status as any,
      category: category as any,
      priority: priority as any,
      sortBy: sortBy as any,
      sortOrder: sortOrder as 'asc' | 'desc',
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get workflows error:', error);
    res.status(500).json({
      success: false,
      error: 'WORKFLOWS_FETCH_FAILED',
      message:
        error instanceof Error ? error.message : 'Failed to fetch workflows',
    });
  }
});

// Create new workflow
app.post('/api/workflows', async (req: Request, res: Response) => {
  try {
    const workflow = await workflowService.createWorkflow(req.body);

    res.status(201).json({
      success: true,
      data: workflow,
    });
  } catch (error) {
    console.error('Create workflow error:', error);
    res.status(500).json({
      success: false,
      error: 'WORKFLOW_CREATION_FAILED',
      message:
        error instanceof Error ? error.message : 'Failed to create workflow',
    });
  }
});

// Update workflow
app.put('/api/workflows/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const workflow = await workflowService.updateWorkflow(id, req.body);

    res.json({
      success: true,
      data: workflow,
    });
  } catch (error) {
    console.error('Update workflow error:', error);
    res.status(500).json({
      success: false,
      error: 'WORKFLOW_UPDATE_FAILED',
      message:
        error instanceof Error ? error.message : 'Failed to update workflow',
    });
  }
});

// Delete workflow
app.delete(
  '/api/workflows/:id',
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { id } = req.params;
      const success = await workflowService.deleteWorkflow(id);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'WORKFLOW_NOT_FOUND',
          message: 'Workflow not found',
        });
      }

      res.json({
        success: true,
        message: 'Workflow deleted successfully',
      });
    } catch (error) {
      console.error('Delete workflow error:', error);
      res.status(500).json({
        success: false,
        error: 'WORKFLOW_DELETION_FAILED',
        message:
          error instanceof Error ? error.message : 'Failed to delete workflow',
      });
    }
  }
);

// Execute workflow
app.post('/api/workflows/:id/execute', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { variables } = req.body;

    const execution = await workflowService.executeWorkflow(id, variables);

    res.json({
      success: true,
      data: execution,
    });
  } catch (error) {
    console.error('Execute workflow error:', error);
    res.status(500).json({
      success: false,
      error: 'WORKFLOW_EXECUTION_FAILED',
      message:
        error instanceof Error ? error.message : 'Failed to execute workflow',
    });
  }
});

// Get workflow executions
app.get(
  '/api/workflows/:id/executions',
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { limit } = req.query;

      const executions = await workflowService.getExecutions(
        id,
        limit ? parseInt(limit as string) : undefined
      );

      res.json({
        success: true,
        data: executions,
      });
    } catch (error) {
      console.error('Get executions error:', error);
      res.status(500).json({
        success: false,
        error: 'EXECUTIONS_FETCH_FAILED',
        message:
          error instanceof Error ? error.message : 'Failed to fetch executions',
      });
    }
  }
);

/**
 * Communications/Messaging Endpoints
 */

// Get agent messages
app.get('/api/communications/messages', async (req: Request, res: Response) => {
  try {
    const { agentId, limit } = req.query;

    // Simulate message data for now - in production this would connect to a real messaging system
    const messages = [
      {
        id: 'msg-1',
        agentId: agentId || 'agent-1',
        type: 'info',
        priority: 'medium',
        subject: 'Task Completion Update',
        content: 'Task TASK-001 has been completed successfully.',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        read: false,
      },
      {
        id: 'msg-2',
        agentId: agentId || 'agent-2',
        type: 'alert',
        priority: 'high',
        subject: 'Integration Test Failed',
        content:
          'Integration test for OpenAI service failed. Please check configuration.',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        read: true,
      },
    ];

    res.json({
      success: true,
      data: messages.slice(0, limit ? parseInt(limit as string) : 50),
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: 'MESSAGES_FETCH_FAILED',
      message:
        error instanceof Error ? error.message : 'Failed to fetch messages',
    });
  }
});

// Send message to agent
app.post(
  '/api/communications/messages',
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { agentId, type, priority, subject, content } = req.body;

      if (!agentId || !content) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_REQUIRED_FIELDS',
          message: 'Agent ID and content are required',
        });
      }

      const message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        agentId,
        type: type || 'info',
        priority: priority || 'medium',
        subject: subject || 'New Message',
        content,
        timestamp: new Date().toISOString(),
        read: false,
      };

      // In production, this would send to a real messaging system
      console.log('Message sent to agent:', message);

      res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({
        success: false,
        error: 'MESSAGE_SEND_FAILED',
        message:
          error instanceof Error ? error.message : 'Failed to send message',
      });
    }
  }
);

// Get agent status
app.get('/api/communications/agents', async (req: Request, res: Response) => {
  try {
    // Simulate agent data for now - in production this would connect to a real agent management system
    const agents = [
      {
        id: 'agent-1',
        name: 'Document Processor',
        status: 'active',
        lastSeen: new Date(Date.now() - 30000).toISOString(),
        currentTask: 'Processing uploaded documents',
        messagesCount: 5,
        priority: 'high',
      },
      {
        id: 'agent-2',
        name: 'Integration Monitor',
        status: 'active',
        lastSeen: new Date(Date.now() - 60000).toISOString(),
        currentTask: 'Running system health checks',
        messagesCount: 2,
        priority: 'medium',
      },
      {
        id: 'agent-3',
        name: 'Task Executor',
        status: 'idle',
        lastSeen: new Date(Date.now() - 300000).toISOString(),
        currentTask: null,
        messagesCount: 0,
        priority: 'low',
      },
    ];

    res.json({
      success: true,
      data: agents,
    });
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({
      success: false,
      error: 'AGENTS_FETCH_FAILED',
      message:
        error instanceof Error ? error.message : 'Failed to fetch agents',
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
      'GET /api/workflows',
      'POST /api/workflows',
      'PUT /api/workflows/:id',
      'DELETE /api/workflows/:id',
      'POST /api/workflows/:id/execute',
      'GET /api/workflows/:id/executions',
      'GET /api/communications/messages',
      'POST /api/communications/messages',
      'GET /api/communications/agents',
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
      console.log('   GET  /api/health                     - Health check');
      console.log(
        '   POST /api/analyze-documents          - Document analysis'
      );
      console.log('   POST /api/generate-tasks             - Task generation');
      console.log('   POST /api/process-task               - Task processing');
      console.log(
        '   GET  /api/test-integrations          - Integration tests'
      );
      console.log('   GET  /api/workflows                  - Get workflows');
      console.log('   POST /api/workflows                  - Create workflow');
      console.log('   PUT  /api/workflows/:id              - Update workflow');
      console.log('   DELETE /api/workflows/:id            - Delete workflow');
      console.log('   POST /api/workflows/:id/execute      - Execute workflow');
      console.log('   GET  /api/workflows/:id/executions   - Get executions');
      console.log('   GET  /api/communications/messages    - Get messages');
      console.log('   POST /api/communications/messages    - Send message');
      console.log('   GET  /api/communications/agents      - Get agent status');
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
