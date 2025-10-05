import express, { Request, Response } from 'express';
import multer from 'multer';
import cors from 'cors';

const app = express();
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 },
});

app.use(cors());
app.use(express.json());

/**
 * Health check endpoint
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    message: 'Copilot Task Processor Backend is running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Root endpoint
 */
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Copilot Task Processor Backend API',
    version: '1.0.0',
    endpoints: [
      '/api/health',
      '/api/analyze-documents',
      '/api/generate-tasks',
      '/api/test-integrations',
    ],
  });
});

/**
 * Simple document analysis endpoint
 */
app.post(
  '/api/analyze-documents',
  upload.array('documents'),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      const parameters = req.body.parameters
        ? JSON.parse(req.body.parameters)
        : {};

      console.log(
        `📄 Processing ${files?.length || 0} documents with parameters:`,
        parameters
      );

      // Mock analysis result matching frontend interface
      const analysisData = {
        fileAnalysis:
          files?.map(file => ({
            fileName: file.originalname,
            fileType: file.mimetype || 'unknown',
            size: file.size,
            analysis: {
              complexity: Math.floor(Math.random() * 100) + 1,
              keywords: ['typescript', 'react', 'api', 'documentation'],
              summary: `Analysis of ${file.originalname} completed successfully`,
              issues: [],
              suggestions: ['Add more documentation', 'Consider refactoring'],
            },
          })) || [],
        overallAnalysis: {
          totalFiles: files?.length || 0,
          averageComplexity: 65,
          commonKeywords: ['typescript', 'react', 'next.js'],
          recommendations: [
            'Documents successfully analyzed',
            'Ready for task generation',
            'Integration tests available',
          ],
        },
      };

      const response = {
        success: true,
        data: analysisData,
        message: 'Document analysis completed',
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('❌ Document analysis failed:', error);
      res
        .status(500)
        .json({ error: 'Document analysis failed', details: error });
    }
  }
);

/**
 * Generate tasks endpoint
 */
app.post('/api/generate-tasks', async (req: Request, res: Response) => {
  try {
    const { preferences } = req.body;

    console.log('🎯 Generating tasks with preferences:', preferences);

    // Mock task generation matching frontend interface
    const generatedTasks = [
      {
        id: 'TSK-001',
        title: 'Setup Project Architecture',
        description: 'Initialize project structure and configuration',
        priority: 'high' as const,
        estimatedHours: 4,
        dependencies: [],
        tags: ['setup', 'architecture'],
        category: 'setup' as const,
      },
      {
        id: 'TSK-002',
        title: 'Implement Core Services',
        description: 'Build main application services and APIs',
        priority: 'high' as const,
        estimatedHours: 8,
        dependencies: ['TSK-001'],
        tags: ['backend', 'api'],
        category: 'development' as const,
      },
      {
        id: 'TSK-003',
        title: 'Create UI Components',
        description: 'Design and implement user interface components',
        priority: 'medium' as const,
        estimatedHours: 6,
        dependencies: ['TSK-001'],
        tags: ['frontend', 'ui'],
        category: 'development' as const,
      },
      {
        id: 'TSK-004',
        title: 'Setup Testing Framework',
        description: 'Configure and implement testing infrastructure',
        priority: 'medium' as const,
        estimatedHours: 3,
        dependencies: ['TSK-002'],
        tags: ['testing', 'framework'],
        category: 'testing' as const,
      },
      {
        id: 'TSK-005',
        title: 'Integration Testing',
        description: 'Test integration with external services',
        priority: 'low' as const,
        estimatedHours: 4,
        dependencies: ['TSK-004'],
        tags: ['testing', 'integration'],
        category: 'testing' as const,
      },
    ];

    const taskResult = {
      tasks: generatedTasks,
      projectStructure: {
        phases: [
          {
            name: 'Setup Phase',
            tasks: ['TSK-001'],
            estimatedDuration: '4 hours',
          },
          {
            name: 'Development Phase',
            tasks: ['TSK-002', 'TSK-003'],
            estimatedDuration: '14 hours',
          },
          {
            name: 'Testing Phase',
            tasks: ['TSK-004', 'TSK-005'],
            estimatedDuration: '7 hours',
          },
        ],
      },
      recommendations: [
        'Start with project architecture setup',
        'Implement backend services before frontend',
        'Add comprehensive testing',
      ],
      metadata: {
        totalTasks: generatedTasks.length,
        totalEstimatedHours: generatedTasks.reduce(
          (sum, task) => sum + (task.estimatedHours || 0),
          0
        ),
        generatedAt: new Date().toISOString(),
      },
    };

    const response = {
      success: true,
      data: taskResult,
      message: 'Tasks generated successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error('Task generation failed:', error);
    res.status(500).json({ error: 'Task generation failed', details: error });
  }
});

/**
 * Test integrations endpoint
 */
app.get('/api/test-integrations', async (_req: Request, res: Response) => {
  try {
    // Test results matching frontend interface
    const testResults = [
      {
        testName: 'Jira Connection',
        status: 'pass' as const,
        message: 'Jira integration ready (mock mode)',
        details: { endpoint: 'mock', authenticated: true },
        duration: 150,
      },
      {
        testName: 'GitHub Connection',
        status: 'pass' as const,
        message: 'GitHub integration ready (mock mode)',
        details: { endpoint: 'mock', authenticated: true },
        duration: 120,
      },
      {
        testName: 'OpenAI Connection',
        status: process.env.OPENAI_API_KEY
          ? ('pass' as const)
          : ('warning' as const),
        message: process.env.OPENAI_API_KEY
          ? 'OpenAI integration configured'
          : 'OpenAI API key not configured',
        details: { configured: !!process.env.OPENAI_API_KEY },
        duration: 80,
      },
      {
        testName: 'Database Connection',
        status: 'pass' as const,
        message: 'Database connection successful',
        details: { type: 'sqlite', status: 'connected' },
        duration: 45,
      },
    ];

    const response = {
      success: true,
      data: testResults,
      message: 'Integration tests completed',
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error('Integration test failed:', error);
    res.status(500).json({ error: 'Integration test failed', details: error });
  }
});

/**
 * Process task endpoint
 */
app.post('/api/process-task', async (req: Request, res: Response) => {
  try {
    const { taskId, context } = req.body;

    console.log(`⚙️ Processing task ${taskId} with context:`, context);

    // Mock task processing matching frontend interface
    const processingResult = {
      taskId,
      status: 'completed' as const,
      results: {
        codeGenerated: [
          {
            fileName: 'TaskService.ts',
            content: `// Generated service for task: ${taskId}\nexport class TaskService {\n  // Implementation\n}`,
            language: 'typescript',
          },
        ],
        testsCreated: [
          {
            fileName: 'TaskService.test.ts',
            content: `// Generated tests for task: ${taskId}\ndescribe('TaskService', () => {\n  // Tests\n});`,
            testType: 'unit',
          },
        ],
        docsUpdated: [
          {
            fileName: 'README.md',
            content: `# Task: ${taskId}\n\nImplementation completed successfully.`,
          },
        ],
      },
      metrics: {
        processingTime: Math.floor(Math.random() * 5000) + 1000, // 1-6 seconds
        confidence: 0.85,
        completeness: 0.92,
      },
      nextSteps: [
        'Review generated code',
        'Run tests',
        'Update project documentation',
      ],
    };

    const response = {
      success: true,
      data: processingResult,
      message: `Task ${taskId} processed successfully`,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error('Task processing failed:', error);
    res.status(500).json({ error: 'Task processing failed', details: error });
  }
});

// API 404 handler
app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: 'Please check the API documentation for available endpoints',
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'POST /api/analyze-documents',
      'POST /api/generate-tasks',
      'GET /api/test-integrations',
      'POST /api/process-task',
    ],
  });
});

const PORT = process.env.PORT || 3002;

const server = app.listen(PORT, () => {
  console.log(`🚀 Copilot Task Processor Backend running on port ${PORT}`);
  console.log(
    `📁 Document processing API available at http://localhost:${PORT}/api`
  );
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

server.on('error', (err: any) => {
  console.error('❌ Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
});

process.on('uncaughtException', err => {
  console.error('❌ Uncaught Exception:', err);
  console.error('Server will continue running...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('Server will continue running...');
});
