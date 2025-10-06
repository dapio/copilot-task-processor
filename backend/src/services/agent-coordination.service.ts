/**
 * Agent Coordination Service
 * Manages agent communication, task assignment, and workflow synchronization
 */

import { PrismaClient } from '@prisma/client';
import {
  IMLProvider,
  Result,
  MLError,
} from '../providers/ml-provider.interface';

export interface AgentInfo {
  id: string;
  name: string;
  type: string;
  status: 'idle' | 'busy' | 'error' | 'offline';
  capabilities: string[];
  currentTask?: string;
  workload: number;
  lastSeen?: Date;
}

export interface TaskAssignmentRequest {
  taskId: string;
  preferredAgentType?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requirements?: string[];
  context?: any;
}

export interface AgentMessage {
  id: string;
  fromAgent: string;
  toAgent?: string;
  type: 'task_assignment' | 'status_update' | 'collaboration' | 'escalation';
  content: string;
  metadata?: any;
  timestamp: Date;
}

export interface CoordinationEvent {
  type:
    | 'agent_started'
    | 'agent_stopped'
    | 'task_assigned'
    | 'task_completed'
    | 'escalation';
  agentId?: string;
  taskId?: string;
  details: any;
  timestamp: Date;
}

export class AgentCoordinationService {
  private prisma: PrismaClient;
  private mlProvider: IMLProvider;
  private activeAgents: Map<string, AgentInfo> = new Map();
  private coordinationQueue: CoordinationEvent[] = [];

  constructor(prisma: PrismaClient, mlProvider: IMLProvider) {
    this.prisma = prisma;
    this.mlProvider = mlProvider;
    this.initializeCoordination();
  }

  /**
   * Register agent with coordination service
   */
  async registerAgent(
    agentInfo: Omit<AgentInfo, 'lastSeen'>
  ): Promise<Result<void, MLError>> {
    try {
      const agent = {
        ...agentInfo,
        lastSeen: new Date(),
      };

      this.activeAgents.set(agent.id, agent);

      // Update database
      await this.prisma.agent.upsert({
        where: { id: agent.id },
        update: {
          name: agent.name,
          type: agent.type,
          status: agent.status,
          capabilities: JSON.stringify(agent.capabilities),
          lastSeen: agent.lastSeen,
        },
        create: {
          id: agent.id,
          name: agent.name,
          type: agent.type,
          status: agent.status,
          capabilities: JSON.stringify(agent.capabilities),
          lastSeen: agent.lastSeen,
        },
      });

      this.addCoordinationEvent({
        type: 'agent_started',
        agentId: agent.id,
        details: { agentType: agent.type, capabilities: agent.capabilities },
        timestamp: new Date(),
      });

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'AGENT_REGISTRATION_ERROR',
          message: 'Failed to register agent',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Assign task to best available agent
   */
  async assignTask(
    request: TaskAssignmentRequest
  ): Promise<Result<string, MLError>> {
    try {
      const task = await this.prisma.task.findUnique({
        where: { id: request.taskId },
      });

      if (!task) {
        return {
          success: false,
          error: {
            code: 'TASK_NOT_FOUND',
            message: 'Task not found',
            details: `Task with id ${request.taskId} does not exist`,
          },
        };
      }

      // Find best agent for the task
      const bestAgent = await this.findBestAgent(request);

      if (!bestAgent) {
        return {
          success: false,
          error: {
            code: 'NO_AVAILABLE_AGENT',
            message: 'No suitable agent available',
            details: 'All agents are busy or no agent matches requirements',
          },
        };
      }

      // Create task assignment
      await this.prisma.taskAssignment.create({
        data: {
          taskId: request.taskId,
          toAgentId: bestAgent.id,
          type: 'assignment',
          priority: request.priority,
          message: `Task assigned: ${task.title}`,
          metadata: request.context,
        },
      });

      // Update task
      await this.prisma.task.update({
        where: { id: request.taskId },
        data: {
          assignedAgentId: bestAgent.id,
          status: 'assigned',
        },
      });

      // Update agent workload
      this.updateAgentWorkload(bestAgent.id, 1);

      this.addCoordinationEvent({
        type: 'task_assigned',
        agentId: bestAgent.id,
        taskId: request.taskId,
        details: { priority: request.priority },
        timestamp: new Date(),
      });

      return {
        success: true,
        data: bestAgent.id,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TASK_ASSIGNMENT_ERROR',
          message: 'Failed to assign task',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Handle task completion
   */
  async completeTask(
    taskId: string,
    agentId: string,
    result?: any
  ): Promise<Result<void, MLError>> {
    try {
      // Update task status
      await this.prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          metadata: result ? { result } : undefined,
        },
      });

      // Update agent workload
      this.updateAgentWorkload(agentId, -1);

      // Check for dependent tasks
      await this.checkDependentTasks(taskId);

      this.addCoordinationEvent({
        type: 'task_completed',
        agentId,
        taskId,
        details: { result },
        timestamp: new Date(),
      });

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TASK_COMPLETION_ERROR',
          message: 'Failed to complete task',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Escalate task to human or different agent
   */
  async escalateTask(
    taskId: string,
    fromAgentId: string,
    reason: string,
    toUserId?: string
  ): Promise<Result<void, MLError>> {
    try {
      await this.prisma.taskAssignment.create({
        data: {
          taskId,
          fromAgentId,
          toUserId,
          type: 'escalation',
          message: reason,
          priority: 'high',
        },
      });

      // Update task status
      await this.prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'escalated',
        },
      });

      this.addCoordinationEvent({
        type: 'escalation',
        agentId: fromAgentId,
        taskId,
        details: { reason, escalatedTo: toUserId || 'human' },
        timestamp: new Date(),
      });

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ESCALATION_ERROR',
          message: 'Failed to escalate task',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Get all active agents
   */
  async getActiveAgents(): Promise<Result<AgentInfo[], MLError>> {
    try {
      const agents = Array.from(this.activeAgents.values());
      return {
        success: true,
        data: agents,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'GET_AGENTS_ERROR',
          message: 'Failed to get active agents',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Get coordination events (for monitoring)
   */
  getCoordinationEvents(limit: number = 50): CoordinationEvent[] {
    return this.coordinationQueue.slice(-limit);
  }

  /**
   * Update agent status
   */
  async updateAgentStatus(
    agentId: string,
    status: 'idle' | 'busy' | 'error' | 'offline'
  ): Promise<Result<void, MLError>> {
    try {
      const agent = this.activeAgents.get(agentId);
      if (agent) {
        agent.status = status;
        agent.lastSeen = new Date();
        this.activeAgents.set(agentId, agent);
      }

      await this.prisma.agent.update({
        where: { id: agentId },
        data: { status, lastSeen: new Date() },
      });

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_STATUS_ERROR',
          message: 'Failed to update agent status',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Find best agent for a task
   */
  private async findBestAgent(
    request: TaskAssignmentRequest
  ): Promise<AgentInfo | null> {
    const availableAgents = Array.from(this.activeAgents.values()).filter(
      agent => agent.status === 'idle' || agent.workload < 3
    );

    if (availableAgents.length === 0) {
      return null;
    }

    // Filter by preferred agent type
    let candidates = availableAgents;
    if (request.preferredAgentType) {
      const typeFiltered = availableAgents.filter(
        agent => agent.type === request.preferredAgentType
      );
      if (typeFiltered.length > 0) {
        candidates = typeFiltered;
      }
    }

    // Filter by requirements/capabilities
    if (request.requirements?.length) {
      candidates = candidates.filter(agent =>
        request.requirements!.some(req => agent.capabilities.includes(req))
      );
    }

    if (candidates.length === 0) {
      return availableAgents[0]; // Fallback to any available agent
    }

    // Sort by workload (prefer less busy agents)
    candidates.sort((a, b) => a.workload - b.workload);

    return candidates[0];
  }

  /**
   * Update agent workload
   */
  private updateAgentWorkload(agentId: string, delta: number): void {
    const agent = this.activeAgents.get(agentId);
    if (agent) {
      agent.workload = Math.max(0, agent.workload + delta);
      agent.status = agent.workload === 0 ? 'idle' : 'busy';
      this.activeAgents.set(agentId, agent);
    }
  }

  /**
   * Check for dependent tasks that can now be started
   */
  private async checkDependentTasks(completedTaskId: string): Promise<void> {
    const dependentTasks = await this.prisma.task.findMany({
      where: {
        status: 'pending',
        dependencies: {
          contains: completedTaskId,
        },
      },
    });

    for (const task of dependentTasks) {
      const dependencies = JSON.parse(task.dependencies || '[]');

      // Check if all dependencies are completed
      const completedDeps = await this.prisma.task.count({
        where: {
          id: { in: dependencies },
          status: 'completed',
        },
      });

      if (completedDeps === dependencies.length) {
        // All dependencies completed, task can be assigned
        await this.assignTask({
          taskId: task.id,
          priority: task.priority as 'low' | 'medium' | 'high' | 'critical',
        });
      }
    }
  }

  /**
   * Add coordination event to queue
   */
  private addCoordinationEvent(event: CoordinationEvent): void {
    this.coordinationQueue.push(event);

    // Keep only last 1000 events
    if (this.coordinationQueue.length > 1000) {
      this.coordinationQueue = this.coordinationQueue.slice(-1000);
    }
  }

  /**
   * Initialize coordination system
   */
  private async initializeCoordination(): Promise<void> {
    try {
      // Load existing agents from database
      const existingAgents = await this.prisma.agent.findMany({
        where: { status: { not: 'offline' } },
      });

      for (const agent of existingAgents) {
        const capabilities = JSON.parse(agent.capabilities || '[]');
        this.activeAgents.set(agent.id, {
          id: agent.id,
          name: agent.name,
          type: agent.type,
          status: agent.status as 'idle' | 'busy' | 'error' | 'offline',
          capabilities,
          workload: 0,
          lastSeen: agent.lastSeen || undefined,
        });
      }

      // Start periodic cleanup
      setInterval(() => {
        this.cleanupInactiveAgents();
      }, 60000); // Every minute
    } catch (error) {
      console.error('Failed to initialize coordination:', error);
    }
  }

  /**
   * Clean up inactive agents
   */
  private cleanupInactiveAgents(): void {
    const now = new Date();
    const timeout = 5 * 60 * 1000; // 5 minutes

    for (const [agentId, agent] of this.activeAgents.entries()) {
      if (
        agent.lastSeen &&
        now.getTime() - agent.lastSeen.getTime() > timeout
      ) {
        agent.status = 'offline';
        this.activeAgents.delete(agentId);

        // Update database
        this.prisma.agent.update({
          where: { id: agentId },
          data: { status: 'offline' },
        });

        this.addCoordinationEvent({
          type: 'agent_stopped',
          agentId,
          details: { reason: 'timeout' },
          timestamp: now,
        });
      }
    }
  }
}

export default AgentCoordinationService;
