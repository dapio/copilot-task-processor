import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient } from '../../src/generated/prisma';

const app = express();
const PORT = process.env.AGENTS_PORT || 3003;
const prisma = new PrismaClient();

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
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
  });
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Agents API Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
  });
});

// ==============================================
// AGENTS MANAGEMENT ENDPOINTS
// ==============================================

// Get all agents
app.get('/api/agents', async (req: Request, res: Response) => {
  try {
    const agents = await prisma.agent.findMany({
      include: {
        instructionConfigs: {
          include: {
            instruction: true,
          },
        },
        _count: {
          select: {
            sentCommunications: true,
            receivedCommunications: true,
            decisions: true,
            workflowSteps: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: agents,
      count: agents.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agents',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get agent by ID
app.get('/api/agents/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        instructionConfigs: {
          include: {
            instruction: true,
          },
        },
        sentCommunications: {
          include: {
            toAgent: true,
          },
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
        receivedCommunications: {
          include: {
            fromAgent: true,
          },
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
        decisions: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
        workflowSteps: {
          include: {
            workflow: true,
          },
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }

    res.json({
      success: true,
      data: agent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Update agent workload and status
app.put('/api/agents/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive, currentWorkload } = req.body;

    const agent = await prisma.agent.update({
      where: { id },
      data: {
        isActive: isActive ?? undefined,
        currentWorkload: currentWorkload ?? undefined,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: agent,
      message: 'Agent status updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating agent status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update agent status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ==============================================
// PROJECTS MANAGEMENT ENDPOINTS
// ==============================================

// Get all projects
app.get('/api/projects', async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        workflows: {
          include: {
            steps: {
              include: {
                assignedAgent: true,
              },
            },
          },
        },
        feedback: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            workflows: true,
            feedback: true,
            ruleChecks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: projects,
      count: projects.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Create new project
app.post('/api/projects', async (req: Request, res: Response) => {
  try {
    const { name, description, type, metadata } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: 'Name and type are required',
      });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        type,
        metadata: metadata ? JSON.stringify(metadata) : null,
        status: 'planning',
      },
      include: {
        workflows: true,
        feedback: true,
      },
    });

    res.status(201).json({
      success: true,
      data: project,
      message: 'Project created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get project by ID
app.get('/api/projects/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        workflows: {
          include: {
            steps: {
              include: {
                assignedAgent: true,
                ruleChecks: true,
              },
            },
          },
        },
        feedback: {
          orderBy: { createdAt: 'desc' },
        },
        ruleChecks: {
          include: {
            agent: true,
            instruction: true,
          },
          orderBy: { checkedAt: 'desc' },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    res.json({
      success: true,
      data: project,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Update project status
app.put('/api/projects/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, startedAt, completedAt } = req.body;

    const updateData: any = { updatedAt: new Date() };

    if (status) updateData.status = status;
    if (startedAt) updateData.startedAt = new Date(startedAt);
    if (completedAt) updateData.completedAt = new Date(completedAt);

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        workflows: true,
      },
    });

    res.json({
      success: true,
      data: project,
      message: 'Project status updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating project status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ==============================================
// WORKFLOWS MANAGEMENT ENDPOINTS
// ==============================================

// Create workflow for project
app.post(
  '/api/projects/:projectId/workflows',
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const { name, description, type, steps } = req.body;

      if (!name || !type) {
        return res.status(400).json({
          success: false,
          error: 'Name and type are required',
        });
      }

      const workflow = await prisma.workflow.create({
        data: {
          name,
          description,
          type,
          projectId,
          status: 'draft',
          steps: {
            create:
              steps?.map((step: any, index: number) => ({
                stepNumber: index + 1,
                name: step.name,
                description: step.description,
                assignedAgentId: step.assignedAgentId || null,
                inputs: step.inputs ? JSON.stringify(step.inputs) : null,
              })) || [],
          },
        },
        include: {
          steps: {
            include: {
              assignedAgent: true,
            },
            orderBy: { stepNumber: 'asc' },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: workflow,
        message: 'Workflow created successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error creating workflow:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create workflow',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// Assign agent to workflow step
app.put(
  '/api/workflows/:workflowId/steps/:stepId/assign',
  async (req: Request, res: Response) => {
    try {
      const { stepId } = req.params;
      const { agentId } = req.body;

      if (!agentId) {
        return res.status(400).json({
          success: false,
          error: 'Agent ID is required',
        });
      }

      const step = await prisma.workflowStep.update({
        where: { id: stepId },
        data: {
          assignedAgentId: agentId,
          status: 'assigned',
        },
        include: {
          assignedAgent: true,
          workflow: true,
        },
      });

      // Update agent workload
      await prisma.agent.update({
        where: { id: agentId },
        data: {
          currentWorkload: {
            increment: 0.1, // Add 10% workload per task
          },
        },
      });

      res.json({
        success: true,
        data: step,
        message: 'Agent assigned to workflow step successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error assigning agent to step:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assign agent to step',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// ==============================================
// TEAM MANAGEMENT ENDPOINTS
// ==============================================

// Get recommended team for project
app.get(
  '/api/projects/:projectId/recommended-team',
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;

      // Get project details
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found',
        });
      }

      // Get available agents sorted by workload and relevance
      const agents = await prisma.agent.findMany({
        where: {
          isActive: true,
          currentWorkload: { lt: 0.8 }, // Less than 80% workload
        },
        orderBy: [{ currentWorkload: 'asc' }, { name: 'asc' }],
      });

      // Basic team composition based on project type
      const teamRoles = {
        'web-application': [
          'Business Analyst',
          'Software Architect',
          'Frontend Developer',
          'Backend Developer',
          'UI/UX Designer',
          'QA Engineer',
        ],
        'mobile-app': [
          'Business Analyst',
          'Software Architect',
          'Frontend Developer',
          'UI/UX Designer',
          'QA Engineer',
        ],
        'api-service': [
          'Systems Analyst',
          'Software Architect',
          'Backend Developer',
          'QA Engineer',
          'DevOps Engineer',
        ],
        'data-analysis': [
          'Business Analyst',
          'Backend Developer',
          'QA Engineer',
        ],
        default: [
          'Business Analyst',
          'Software Architect',
          'Frontend Developer',
          'Backend Developer',
          'QA Engineer',
        ],
      };

      const requiredRoles =
        teamRoles[project.type as keyof typeof teamRoles] || teamRoles.default;
      const recommendedTeam = [];

      for (const role of requiredRoles) {
        const agent = agents.find((a: any) => a.role === role);
        if (agent) {
          recommendedTeam.push(agent);
        }
      }

      res.json({
        success: true,
        data: {
          projectId,
          projectType: project.type,
          recommendedTeam,
          totalAgents: recommendedTeam.length,
          averageWorkload:
            recommendedTeam.reduce(
              (sum, agent) => sum + agent.currentWorkload,
              0
            ) / recommendedTeam.length,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error getting recommended team:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get recommended team',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// ==============================================
// COMMUNICATIONS ENDPOINTS
// ==============================================

// Send message between agents
app.post(
  '/api/agents/:fromAgentId/communicate',
  async (req: Request, res: Response) => {
    try {
      const { fromAgentId } = req.params;
      const { toAgentId, messageType, content, priority } = req.body;

      if (!toAgentId || !messageType || !content) {
        return res.status(400).json({
          success: false,
          error: 'toAgentId, messageType, and content are required',
        });
      }

      const communication = await prisma.agentCommunication.create({
        data: {
          fromAgentId,
          toAgentId,
          messageType,
          content,
          priority: priority || 'medium',
        },
        include: {
          fromAgent: true,
          toAgent: true,
        },
      });

      res.status(201).json({
        success: true,
        data: communication,
        message: 'Message sent successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send message',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// Get agent communications
app.get(
  '/api/agents/:agentId/communications',
  async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;
      const { type = 'all', limit = 50 } = req.query;

      let whereClause: any = {};

      if (type === 'sent') {
        whereClause.fromAgentId = agentId;
      } else if (type === 'received') {
        whereClause.toAgentId = agentId;
      } else {
        whereClause = {
          OR: [{ fromAgentId: agentId }, { toAgentId: agentId }],
        };
      }

      const communications = await prisma.agentCommunication.findMany({
        where: whereClause,
        include: {
          fromAgent: true,
          toAgent: true,
        },
        orderBy: { timestamp: 'desc' },
        take: parseInt(limit as string),
      });

      res.json({
        success: true,
        data: communications,
        count: communications.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching communications:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch communications',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🤖 Agents API Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard available at http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    prisma.$disconnect();
    process.exit(0);
  });
});

export default app;
