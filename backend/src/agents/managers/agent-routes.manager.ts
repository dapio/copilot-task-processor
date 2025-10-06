/**
 * Agent Routes Manager
 * Handles all route definitions for the agents server
 */

import { Express, Request, Response } from 'express';
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
      const agents = await this.deps.prisma.agent.findMany({
        include: {
          _count: {
            select: {
              tasks: true,
              executions: true,
              workflowSteps: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

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
