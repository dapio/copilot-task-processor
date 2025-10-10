/**
 * Agent Routes Manager
 * Handles all route definitions for the agents server
 */

import { Express, Request, Response } from 'express';
import { unifiedAIChatService } from '../../services/unified-ai-chat.service';
import {
  IAgentRoutes,
  AgentServerDependencies,
  ApiResponse,
  HealthCheckResponse,
} from '../types/agents-server.types';

export class AgentRoutesManager implements IAgentRoutes {
  private app: Express;
  private deps: AgentServerDependencies;
  private startTime: Date;

  constructor(app: Express, dependencies: AgentServerDependencies) {
    this.app = app;
    this.deps = dependencies;
    this.startTime = new Date();
  }

  /**
   * Setup health check routes
   */
  setupHealthRoutes(): void {
    this.app.get('/api/health', (req: Request, res: Response) => {
      const healthResponse: HealthCheckResponse = {
        success: true,
        message: 'Agents API Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.AGENTS_PORT || '3006', 10),
      };

      res.json(healthResponse);
    });

    this.app.get('/api/status', (req: Request, res: Response) => {
      res.json({
        success: true,
        data: {
          status: 'running',
          startTime: this.startTime.toISOString(),
          uptime: Date.now() - this.startTime.getTime(),
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
        },
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Setup agent management routes
   */
  setupAgentRoutes(): void {
    // Get all agents
    this.app.get('/api/agents', this.handleGetAgents.bind(this));

    // Get specific agent
    this.app.get('/api/agents/:id', this.handleGetAgent.bind(this));

    // Create new agent
    this.app.post('/api/agents', this.handleCreateAgent.bind(this));

    // Update agent
    this.app.put('/api/agents/:id', this.handleUpdateAgent.bind(this));

    // Delete agent
    this.app.delete('/api/agents/:id', this.handleDeleteAgent.bind(this));

    // Get agent statistics
    this.app.get('/api/agents/:id/stats', this.handleGetAgentStats.bind(this));

    // Project workflow progress endpoints
    this.app.get(
      '/api/projects/:projectId/workflow',
      this.handleGetProjectWorkflow.bind(this)
    );
    this.app.post(
      '/api/projects/:projectId/workflow/start',
      this.handleStartWorkflow.bind(this)
    );
    this.app.get(
      '/api/projects/:projectId/chat',
      this.handleGetChatHistory.bind(this)
    );
    this.app.post(
      '/api/projects/:projectId/chat',
      this.handleSendMessage.bind(this)
    );
  }

  /**
   * Setup communication routes
   */
  setupCommunicationRoutes(): void {
    // Get communications for agent
    this.app.get(
      '/api/agents/:id/communications',
      this.handleGetCommunications.bind(this)
    );

    // Create new communication
    this.app.post(
      '/api/communications',
      this.handleCreateCommunication.bind(this)
    );

    // Get all communications
    this.app.get(
      '/api/communications',
      this.handleGetAllCommunications.bind(this)
    );

    // Get communication by ID
    this.app.get(
      '/api/communications/:id',
      this.handleGetCommunication.bind(this)
    );

    // Update communication status
    this.app.put(
      '/api/communications/:id/status',
      this.handleUpdateCommunicationStatus.bind(this)
    );
  }

  /**
   * Setup decision routes
   */
  setupDecisionRoutes(): void {
    // Get decisions for agent
    this.app.get(
      '/api/agents/:id/decisions',
      this.handleGetDecisions.bind(this)
    );

    // Create new decision
    this.app.post('/api/decisions', this.handleCreateDecision.bind(this));

    // Get all decisions
    this.app.get('/api/decisions', this.handleGetAllDecisions.bind(this));

    // Get decision by ID
    this.app.get('/api/decisions/:id', this.handleGetDecision.bind(this));

    // Update decision
    this.app.put('/api/decisions/:id', this.handleUpdateDecision.bind(this));
  }

  /**
   * Setup workflow routes
   */
  setupWorkflowRoutes(): void {
    // Get workflow steps for agent
    this.app.get(
      '/api/agents/:id/workflow-steps',
      this.handleGetWorkflowSteps.bind(this)
    );

    // Create workflow step
    this.app.post(
      '/api/workflow-steps',
      this.handleCreateWorkflowStep.bind(this)
    );

    // Get all workflow steps
    this.app.get(
      '/api/workflow-steps',
      this.handleGetAllWorkflowSteps.bind(this)
    );

    // Get workflow step by ID
    this.app.get(
      '/api/workflow-steps/:id',
      this.handleGetWorkflowStep.bind(this)
    );

    // Update workflow step
    this.app.put(
      '/api/workflow-steps/:id',
      this.handleUpdateWorkflowStep.bind(this)
    );
  }

  /**
   * Setup instruction routes
   */
  setupInstructionRoutes(): void {
    // Get instructions for agent
    this.app.get(
      '/api/agents/:id/instructions',
      this.handleGetInstructions.bind(this)
    );

    // Create new instruction
    this.app.post('/api/instructions', this.handleCreateInstruction.bind(this));

    // Get all instructions
    this.app.get('/api/instructions', this.handleGetAllInstructions.bind(this));

    // Get instruction by ID
    this.app.get('/api/instructions/:id', this.handleGetInstruction.bind(this));

    // Update instruction
    this.app.put(
      '/api/instructions/:id',
      this.handleUpdateInstruction.bind(this)
    );

    // Delete instruction
    this.app.delete(
      '/api/instructions/:id',
      this.handleDeleteInstruction.bind(this)
    );
  }

  // Agent handlers
  private async handleGetAgents(req: Request, res: Response): Promise<void> {
    try {
      // Import all real agents
      const { default: BackendDeveloperAgent } = await import(
        '../backend-developer.agent'
      );
      const { default: FrontendDeveloperAgent } = await import(
        '../frontend-developer.agent'
      );
      const { default: BusinessAnalystAgent } = await import(
        '../business-analyst.agent'
      );
      const { default: QAEngineerAgent } = await import('../qa-engineer.agent');
      const { SystemArchitectAgent } = await import(
        '../system-architect.agent'
      );
      const { MicrosoftReviewerAgent } = await import(
        '../microsoft-reviewer.agent'
      );
      const { default: WorkflowAssistantAgent } = await import(
        '../workflow-assistant.agent'
      );
      const { ProjectManagerAgent } = await import('../project-manager.agent');

      // Create instances and get their info
      const backendAgent = new BackendDeveloperAgent(
        this.deps.prisma,
        this.deps.researchService as any
      );
      const frontendAgent = new FrontendDeveloperAgent(
        this.deps.prisma,
        this.deps.researchService as any
      );
      const businessAgent = new BusinessAnalystAgent(
        this.deps.prisma,
        this.deps.researchService as any
      );
      const qaAgent = new QAEngineerAgent(
        this.deps.prisma,
        this.deps.researchService as any
      );
      const architectAgent = new SystemArchitectAgent();
      const reviewerAgent = new MicrosoftReviewerAgent(
        this.deps.researchService as any
      );
      const workflowAgent = new WorkflowAssistantAgent(
        this.deps.prisma,
        this.deps.researchService as any
      );
      const projectManagerAgent = new ProjectManagerAgent(
        this.deps.prisma,
        this.deps.researchService as any
      );

      const agents = [
        projectManagerAgent.getAgentInfo(), // Project Manager at the top - manages all others
        backendAgent.getAgentInfo(),
        frontendAgent.getAgentInfo(),
        businessAgent.getAgentInfo(),
        qaAgent.getAgentInfo(),
        architectAgent.getAgentInfo(),
        reviewerAgent.getAgentInfo(),
        workflowAgent.getAgentInfo(),
      ];

      const response: ApiResponse = {
        success: true,
        data: agents,
        count: agents.length,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching agents:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch agents',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(response);
    }
  }

  private async handleGetAgent(req: Request, res: Response): Promise<void> {
    try {
      const agentId = req.params.id;

      if (!agentId) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid agent ID',
          message: 'Agent ID is required',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const agent = await this.deps.prisma.agent.findUnique({
        where: { id: agentId },
        include: {
          tasks: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
          executions: {
            take: 10,
            orderBy: { startedAt: 'desc' },
          },
          workflowSteps: {
            take: 10,
            orderBy: { stepNumber: 'asc' },
          },
        },
      });

      if (!agent) {
        const response: ApiResponse = {
          success: false,
          error: 'Nie znaleziono agenta',
          message: `Agent o ID ${agentId} nie został znaleziony`,
          timestamp: new Date().toISOString(),
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: agent,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching agent:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch agent',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(response);
    }
  }

  // Placeholder handlers - implement based on original file
  private async handleCreateAgent(req: Request, res: Response): Promise<void> {
    res.status(501).json({ success: false, error: 'Not implemented yet' });
  }

  private async handleUpdateAgent(req: Request, res: Response): Promise<void> {
    res.status(501).json({ success: false, error: 'Not implemented yet' });
  }

  private async handleDeleteAgent(req: Request, res: Response): Promise<void> {
    res.status(501).json({ success: false, error: 'Not implemented yet' });
  }

  private async handleGetAgentStats(
    req: Request,
    res: Response
  ): Promise<void> {
    res.status(501).json({ success: false, error: 'Not implemented yet' });
  }

  private async handleGetCommunications(
    req: Request,
    res: Response
  ): Promise<void> {
    res.status(501).json({ success: false, error: 'Not implemented yet' });
  }

  private async handleCreateCommunication(
    req: Request,
    res: Response
  ): Promise<void> {
    res.status(501).json({ success: false, error: 'Not implemented yet' });
  }

  private async handleGetAllCommunications(
    req: Request,
    res: Response
  ): Promise<void> {
    res.status(501).json({ success: false, error: 'Not implemented yet' });
  }

  private async handleGetCommunication(
    req: Request,
    res: Response
  ): Promise<void> {
    res.status(501).json({ success: false, error: 'Not implemented yet' });
  }

  private async handleUpdateCommunicationStatus(
    req: Request,
    res: Response
  ): Promise<void> {
    res.status(501).json({ success: false, error: 'Not implemented yet' });
  }

  private async handleGetDecisions(req: Request, res: Response): Promise<void> {
    res.status(501).json({ success: false, error: 'Not implemented yet' });
  }

  private async handleCreateDecision(
    req: Request,
    res: Response
  ): Promise<void> {
    res.status(501).json({ success: false, error: 'Not implemented yet' });
  }

  private async handleGetAllDecisions(
    req: Request,
    res: Response
  ): Promise<void> {
    res.status(501).json({ success: false, error: 'Not implemented yet' });
  }

  private async handleGetDecision(req: Request, res: Response): Promise<void> {
    res.status(501).json({ success: false, error: 'Not implemented yet' });
  }

  private async handleUpdateDecision(
    req: Request,
    res: Response
  ): Promise<void> {
    res.status(501).json({ success: false, error: 'Not implemented yet' });
  }

  private async handleGetWorkflowSteps(
    req: Request,
    res: Response
  ): Promise<void> {
    res.status(501).json({ success: false, error: 'Not implemented yet' });
  }

  private async handleCreateWorkflowStep(
    req: Request,
    res: Response
  ): Promise<void> {
    res.status(501).json({ success: false, error: 'Not implemented yet' });
  }

  private async handleGetAllWorkflowSteps(
    req: Request,
    res: Response
  ): Promise<void> {
    res.status(501).json({ success: false, error: 'Not implemented yet' });
  }

  private async handleGetWorkflowStep(
    req: Request,
    res: Response
  ): Promise<void> {
    res.status(501).json({ success: false, error: 'Not implemented yet' });
  }

  private async handleUpdateWorkflowStep(
    req: Request,
    res: Response
  ): Promise<void> {
    res.status(501).json({ success: false, error: 'Not implemented yet' });
  }

  private async handleGetInstructions(
    req: Request,
    res: Response
  ): Promise<void> {
    res.status(501).json({ success: false, error: 'Not implemented yet' });
  }

  private async handleCreateInstruction(
    req: Request,
    res: Response
  ): Promise<void> {
    res.status(501).json({ success: false, error: 'Not implemented yet' });
  }

  private async handleGetAllInstructions(
    req: Request,
    res: Response
  ): Promise<void> {
    res.status(501).json({ success: false, error: 'Not implemented yet' });
  }

  private async handleGetInstruction(
    req: Request,
    res: Response
  ): Promise<void> {
    res.status(501).json({ success: false, error: 'Not implemented yet' });
  }

  private async handleUpdateInstruction(
    req: Request,
    res: Response
  ): Promise<void> {
    res.status(501).json({ success: false, error: 'Not implemented yet' });
  }

  private async handleDeleteInstruction(
    req: Request,
    res: Response
  ): Promise<void> {
    res.status(501).json({ success: false, error: 'Not implemented yet' });
  }

  // Project Workflow Progress handlers
  private async handleGetProjectWorkflow(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { projectId } = req.params;

      // TODO: Use projectId to get specific project workflow from database
      const mockWorkflow = this.createMockWorkflow();

      const response: ApiResponse = {
        success: true,
        data: mockWorkflow,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching project workflow:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch project workflow',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(response);
    }
  }

  private createMockWorkflow() {
    return {
      id: 'workflow-1',
      name: 'Workflow Rozwoju Nowego Projektu',
      description:
        'Kompletny workflow dla rozwoju nowych aplikacji od wymagań do wdrożenia',
      type: 'new_project',
      currentStepIndex: 1,
      status: 'in_progress',
      progress: 25,
      startedAt: new Date().toISOString(),
      estimatedCompletion: new Date(
        Date.now() + 2 * 60 * 60 * 1000
      ).toISOString(),
      steps: this.createMockWorkflowSteps(),
    };
  }

  private createMockWorkflowSteps() {
    return [
      {
        id: 'step-1',
        name: 'Walidacja Wymagań',
        description: 'Analiza i walidacja wymagań projektowych',
        status: 'completed',
        order: 1,
        estimatedDuration: 30,
        actualDuration: 25,
        agentResponsible: 'Business Analyst',
        completedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: 'step-2',
        name: 'Generowanie Mockupów',
        description: 'Tworzenie prototypów interfejsu użytkownika',
        status: 'in_progress',
        order: 2,
        estimatedDuration: 45,
        agentResponsible: 'Frontend Developer',
        startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        approvalRequired: true,
      },
      {
        id: 'step-3',
        name: 'Projektowanie Architektury',
        description: 'Projektowanie architektury systemu',
        status: 'pending',
        order: 3,
        estimatedDuration: 60,
        agentResponsible: 'System Architect',
        approvalRequired: true,
      },
      {
        id: 'step-4',
        name: 'Implementacja Backend',
        description: 'Rozwój logiki biznesowej i API',
        status: 'pending',
        order: 4,
        estimatedDuration: 90,
        agentResponsible: 'Backend Developer',
      },
      {
        id: 'step-5',
        name: 'Implementacja Frontend',
        description: 'Implementacja interfejsu użytkownika',
        status: 'pending',
        order: 5,
        estimatedDuration: 75,
        agentResponsible: 'Frontend Developer',
      },
      {
        id: 'step-6',
        name: 'Testy i Walidacja',
        description: 'Testowanie funkcjonalności i wydajności',
        status: 'pending',
        order: 6,
        estimatedDuration: 45,
        agentResponsible: 'QA Engineer',
      },
    ];
  }

  private async handleStartWorkflow(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { projectId } = req.params;
      const { workflowType } = req.body;

      // TODO: Use projectId and workflowType to start specific workflow
      const response: ApiResponse = {
        success: true,
        data: {
          message: `Workflow ${workflowType} started for project ${projectId}`,
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error starting workflow:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start workflow',
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async handleGetChatHistory(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { projectId } = req.params;

      // TODO: Use projectId to get project-specific chat history from database
      // For now, return empty array - frontend will manage conversation state
      const chatHistory: any[] = [];
      const { limit = 50, offset = 0 } = req.query;

      const response: ApiResponse = {
        success: true,
        data: {
          messages: chatHistory,
          pagination: {
            total: 0,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            hasMore: false,
          },
          projectId,
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch chat history',
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async handleSendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const { message, agentType = 'project-manager' } = req.body;

      if (!message?.trim()) {
        res.status(400).json({
          success: false,
          error: 'Message content is required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Send message using unified AI chat service with intelligent provider selection
      const chatResult = await unifiedAIChatService.chatForAgent(
        agentType,
        [{ role: 'user', content: message }],
        {
          taskType: 'general',
          temperature: 0.7,
          maxTokens: 2000,
        }
      );

      if (chatResult.success) {
        const aiResponse = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: chatResult.data.content,
          provider: chatResult.data.provider,
          model: chatResult.data.model,
          timestamp: new Date().toISOString(),
          projectId,
          agentType,
          usage: chatResult.data.usage,
        };

        const response: ApiResponse = {
          success: true,
          data: aiResponse,
          timestamp: new Date().toISOString(),
        };

        res.json(response);
      } else {
        console.error('Chat service error:', chatResult.error);
        res.status(500).json({
          success: false,
          error: `AI service unavailable: ${chatResult.error.message}`,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send message',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Setup all routes
   */
  setupAllRoutes(): void {
    this.setupHealthRoutes();
    this.setupAgentRoutes();
    this.setupCommunicationRoutes();
    this.setupDecisionRoutes();
    this.setupWorkflowRoutes();
    this.setupInstructionRoutes();
  }
}
