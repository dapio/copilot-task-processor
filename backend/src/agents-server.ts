import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import knowledgeRoutes from './routes/knowledge.routes';
import executionRoutes from './routes/execution.routes';
import enhancedRoutes from './routes/enhanced-api.routes';
// Agent research functionality will be added via API endpoints

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

// ==============================================
// INTERNET RESEARCH ENDPOINTS
// ==============================================

// Search for optimal solutions
app.post('/api/research/solutions', async (req: Request, res: Response) => {
  try {
    const { query, context, agentId } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    console.log(`🔍 Agent ${agentId || 'unknown'} searching for: ${query}`);

    // For now, return mock research results
    const mockResults = {
      success: true,
      data: [
        {
          title: `Best Practices for ${query}`,
          url: `https://docs.example.com/best-practices-${query.toLowerCase().replace(/\s+/g, '-')}`,
          content: `Comprehensive guide covering best practices for ${query}. This includes industry standards, performance optimizations, and security considerations.`,
          summary: `Best practices guide for ${query} with practical implementation steps.`,
          relevanceScore: 0.95,
          source: 'docs.example.com',
          tags: query.toLowerCase().split(' '),
          codeExamples: [
            {
              language: 'typescript',
              code: `// Example implementation for ${query}\nconst solution = {\n  // Implementation details\n};`,
              description: 'Basic implementation example',
            },
          ],
          integrationInfo: context?.includes('integration')
            ? {
                complexity: 'medium' as const,
                requirements: ['Node.js 18+', 'TypeScript support'],
                benefits: ['Improved performance', 'Better maintainability'],
                drawbacks: ['Initial setup complexity'],
              }
            : undefined,
        },
        {
          title: `${query} - Complete Tutorial`,
          url: `https://github.com/example/${query}-tutorial`,
          content: `Step-by-step tutorial for implementing ${query}. Includes code examples, testing strategies, and deployment instructions.`,
          summary: `Comprehensive tutorial covering all aspects of ${query} implementation.`,
          relevanceScore: 0.88,
          source: 'github.com',
          tags: ['tutorial', 'examples', ...query.toLowerCase().split(' ')],
          codeExamples: [
            {
              language: 'javascript',
              code: `// Tutorial example for ${query}\nfunction implement${query.replace(/\s+/g, '')}() {\n  return 'implementation';\n}`,
              description: 'Tutorial implementation',
            },
          ],
        },
      ],
      total: 2,
      processingTime: Math.floor(Math.random() * 2000) + 500,
      recommendations: {
        bestSolution: {
          title: `Best Practices for ${query}`,
          quickStart: `Quick start guide for ${query}`,
          implementation: `Implementation steps for ${query}`,
        },
      },
    };

    // Log research activity
    if (agentId) {
      await prisma.agentCommunication.create({
        data: {
          fromAgentId: agentId,
          toAgentId: agentId, // Self-communication for research log
          messageType: 'research',
          content: `Conducted internet research for: ${query}`,
          priority: 'low',
          metadata: JSON.stringify({
            researchType: 'solution_search',
            query,
            context,
            resultsCount: mockResults.data.length,
            processingTime: mockResults.processingTime,
          }),
        },
      });
    }

    res.json(mockResults);
  } catch (error) {
    console.error('Error in research/solutions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform research',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Search for integrations
app.post('/api/research/integrations', async (req: Request, res: Response) => {
  try {
    const { technology, context, agentId } = req.body;

    if (!technology) {
      return res.status(400).json({
        success: false,
        error: 'Technology is required',
      });
    }

    console.log(
      `🔌 Agent ${agentId || 'unknown'} searching integrations for: ${technology}`
    );

    const mockIntegrations = {
      success: true,
      data: [
        {
          title: `${technology} Integration Guide`,
          url: `https://docs.${technology.toLowerCase()}.com/integration`,
          content: `Official integration guide for ${technology}. Covers API setup, authentication, and common integration patterns.`,
          summary: `Official ${technology} integration documentation with examples.`,
          relevanceScore: 0.92,
          source: `docs.${technology.toLowerCase()}.com`,
          tags: [technology.toLowerCase(), 'integration', 'api'],
          integrationInfo: {
            complexity: 'medium' as const,
            requirements: [
              `${technology} API key`,
              'HTTPS endpoint',
              'JSON parsing',
            ],
            benefits: [
              'Official support',
              'Comprehensive documentation',
              'Active community',
            ],
            drawbacks: [
              'Requires API key management',
              'Rate limiting considerations',
            ],
          },
        },
        {
          title: `Third-party ${technology} Libraries`,
          url: `https://github.com/awesome-${technology.toLowerCase()}`,
          content: `Curated list of ${technology} integration libraries and tools. Community-maintained with examples and use cases.`,
          summary: `Community-curated ${technology} integration resources.`,
          relevanceScore: 0.85,
          source: 'github.com',
          tags: [
            technology.toLowerCase(),
            'library',
            'community',
            'opensource',
          ],
          integrationInfo: {
            complexity: 'low' as const,
            requirements: ['Package manager', 'Basic configuration'],
            benefits: ['Quick setup', 'Community support', 'Multiple options'],
            drawbacks: ['Varying quality', 'Potential maintenance issues'],
          },
        },
      ],
      total: 2,
      processingTime: Math.floor(Math.random() * 1500) + 300,
    };

    // Log research activity
    if (agentId) {
      await prisma.agentCommunication.create({
        data: {
          fromAgentId: agentId,
          toAgentId: agentId,
          messageType: 'research',
          content: `Researched integrations for: ${technology}`,
          priority: 'medium',
          metadata: JSON.stringify({
            researchType: 'integration_search',
            technology,
            context,
            resultsCount: mockIntegrations.data.length,
            processingTime: mockIntegrations.processingTime,
          }),
        },
      });
    }

    res.json(mockIntegrations);
  } catch (error) {
    console.error('Error in research/integrations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to research integrations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Search for best practices
app.post(
  '/api/research/best-practices',
  async (req: Request, res: Response) => {
    try {
      const { domain, technology, agentId } = req.body;

      if (!domain) {
        return res.status(400).json({
          success: false,
          error: 'Domain is required',
        });
      }

      console.log(
        `📚 Agent ${agentId || 'unknown'} researching best practices for: ${domain}${technology ? ` with ${technology}` : ''}`
      );

      const mockBestPractices = {
        success: true,
        data: [
          {
            title: `${domain} Best Practices${technology ? ` with ${technology}` : ''}`,
            url: `https://best-practices.dev/${domain.toLowerCase()}${technology ? `/${technology.toLowerCase()}` : ''}`,
            content: `Industry-standard best practices for ${domain}${technology ? ` using ${technology}` : ''}. Covers architecture, security, performance, and maintainability.`,
            summary: `Comprehensive best practices guide for ${domain}${technology ? ` and ${technology}` : ''}.`,
            relevanceScore: 0.94,
            source: 'best-practices.dev',
            tags: [
              domain.toLowerCase(),
              'best-practices',
              'standards',
              ...(technology ? [technology.toLowerCase()] : []),
            ],
            codeExamples: technology
              ? [
                  {
                    language: technology.toLowerCase().includes('java')
                      ? 'java'
                      : 'typescript',
                    code: `// Best practice example for ${domain} with ${technology}\nconst bestPractice = {\n  // Implementation following standards\n};`,
                    description: `Best practice implementation for ${domain}`,
                  },
                ]
              : [],
          },
        ],
        total: 1,
        processingTime: Math.floor(Math.random() * 1000) + 200,
      };

      // Log research activity
      if (agentId) {
        await prisma.agentCommunication.create({
          data: {
            fromAgentId: agentId,
            toAgentId: agentId,
            messageType: 'research',
            content: `Researched best practices for: ${domain}${technology ? ` with ${technology}` : ''}`,
            priority: 'medium',
            metadata: JSON.stringify({
              researchType: 'best_practices_search',
              domain,
              technology,
              resultsCount: mockBestPractices.data.length,
              processingTime: mockBestPractices.processingTime,
            }),
          },
        });
      }

      res.json(mockBestPractices);
    } catch (error) {
      console.error('Error in research/best-practices:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to research best practices',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// Compare technologies
app.post('/api/research/compare', async (req: Request, res: Response) => {
  try {
    const { technologies, context, agentId } = req.body;

    if (
      !technologies ||
      !Array.isArray(technologies) ||
      technologies.length < 2
    ) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 technologies are required for comparison',
      });
    }

    console.log(
      `⚖️ Agent ${agentId || 'unknown'} comparing: ${technologies.join(' vs ')}`
    );

    const mockComparison = {
      success: true,
      data: [
        {
          title: `${technologies.join(' vs ')} Comprehensive Comparison`,
          url: `https://techcompare.dev/${technologies.join('-vs-').toLowerCase()}`,
          content: `Detailed comparison of ${technologies.join(', ')}. Covers performance, ecosystem, learning curve, and use cases.`,
          summary: `In-depth technical comparison of ${technologies.join(' and ')}.`,
          relevanceScore: 0.96,
          source: 'techcompare.dev',
          tags: [
            ...technologies.map(t => t.toLowerCase()),
            'comparison',
            'analysis',
          ],
        },
      ],
      total: 1,
      processingTime: Math.floor(Math.random() * 2500) + 1000,
      comparison: {
        summary: `Comparison of ${technologies.join(' vs ')} based on multiple criteria`,
        technologies: technologies.map((tech, index) => ({
          name: tech,
          mentions: 5 + index,
          avgScore: 0.8 + index * 0.05,
          strengths: [`${tech} strength 1`, `${tech} strength 2`],
          weaknesses: [`${tech} limitation 1`],
        })),
        recommendation: technologies[0],
      },
    };

    // Log research activity
    if (agentId) {
      await prisma.agentCommunication.create({
        data: {
          fromAgentId: agentId,
          toAgentId: agentId,
          messageType: 'research',
          content: `Compared technologies: ${technologies.join(' vs ')}`,
          priority: 'high',
          metadata: JSON.stringify({
            researchType: 'technology_comparison',
            technologies,
            context,
            processingTime: mockComparison.processingTime,
          }),
        },
      });
    }

    res.json(mockComparison);
  } catch (error) {
    console.error('Error in research/compare:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare technologies',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get research history for an agent
app.get(
  '/api/agents/:agentId/research-history',
  async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;
      const { limit = 20 } = req.query;

      const researchHistory = await prisma.agentCommunication.findMany({
        where: {
          fromAgentId: agentId,
          messageType: 'research',
        },
        orderBy: { timestamp: 'desc' },
        take: parseInt(limit as string),
      });

      const processedHistory = researchHistory.map(comm => {
        const metadata = comm.metadata ? JSON.parse(comm.metadata) : {};
        return {
          id: comm.id,
          timestamp: comm.timestamp,
          researchType: metadata.researchType || 'unknown',
          query: metadata.query || metadata.technology || metadata.domain,
          context: metadata.context,
          resultsCount: metadata.resultsCount || 0,
          processingTime: metadata.processingTime || 0,
          content: comm.content,
        };
      });

      res.json({
        success: true,
        data: processedHistory,
        count: processedHistory.length,
        agentId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching research history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch research history',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// ==============================================
// KNOWLEDGE FEED ROUTES
// ==============================================

app.use('/api/knowledge', knowledgeRoutes);

// ==============================================
// EXECUTION ROUTES
// ==============================================

app.use('/api/execution', executionRoutes);

// ==============================================
// ENHANCED MULTI-PROVIDER ROUTES
// ==============================================

app.use('/api/enhanced', enhancedRoutes);

// ==============================================
// SERVER STARTUP
// ==============================================

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
