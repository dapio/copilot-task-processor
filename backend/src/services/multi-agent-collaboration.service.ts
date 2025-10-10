/**
 * Multi-Agent Task Collaboration Service
 *
 * Manages collaborative tasks between multiple agents with sophisticated handoff mechanisms.
 * Tracks task progression through agent chains and coordinates complex multi-step workflows.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CollaborativeTask {
  taskId: string;
  agentChain: AgentChainLink[];
  currentAgentIndex: number;
  overallProgress: number;
  collaborationStatus:
    | 'pending'
    | 'in-progress'
    | 'completed'
    | 'blocked'
    | 'failed';
}

export interface AgentChainLink {
  agentId: string;
  agentType: string;
  role: string;
  sequence: number;
  estimatedTime: number;
  requiredSkills: string[];
  dependencies: string[]; // Task IDs or deliverables from previous agents
  deliverables: string[];
  status:
    | 'pending'
    | 'assigned'
    | 'in-progress'
    | 'completed'
    | 'blocked'
    | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  actualTime?: number;
  handoffNotes?: string;
}

export interface TaskCollaborationPlan {
  taskTitle: string;
  totalEstimatedTime: number;
  agentSequence: {
    agentType: string;
    role: string;
    description: string;
    estimatedTime: number;
    requiredSkills: string[];
    inputRequirements: string[];
    outputDeliverables: string[];
  }[];
}

export class MultiAgentCollaborationService {
  /**
   * Create a collaborative task with multiple agents
   */
  async createCollaborativeTask(
    approvalId: string,
    taskTitle: string,
    description: string,
    collaborationPlan: TaskCollaborationPlan
  ): Promise<string> {
    try {
      console.log(`🤝 Creating collaborative task: ${taskTitle}`);

      // Create the main task
      const task = await prisma.workflowStepTask.create({
        data: {
          approvalId,
          title: taskTitle,
          description,
          type: 'collaborative',
          priority: 'high',
          status: 'pending',
          estimatedTime: collaborationPlan.totalEstimatedTime,
          metadata: {
            isCollaborative: true,
            collaborationPlan: JSON.stringify(collaborationPlan),
            agentChain: collaborationPlan.agentSequence.map((agent, index) => ({
              sequence: index,
              agentType: agent.agentType,
              role: agent.role,
              estimatedTime: agent.estimatedTime,
              requiredSkills: agent.requiredSkills,
              dependencies: agent.inputRequirements,
              deliverables: agent.outputDeliverables,
              status: index === 0 ? 'pending' : 'pending',
            })),
            currentAgentIndex: 0,
            overallProgress: 0,
            collaborationStatus: 'pending',
          },
        },
      });

      console.log(
        `✅ Created collaborative task ${task.id} with ${collaborationPlan.agentSequence.length} agents`
      );

      // Auto-assign first agent
      await this.assignNextAgentInChain(task.id);

      return task.id;
    } catch (error) {
      console.error('❌ Error creating collaborative task:', error);
      throw new Error(
        `Collaborative task creation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Assign next agent in the collaboration chain
   */
  async assignNextAgentInChain(taskId: string): Promise<boolean> {
    try {
      const task = await prisma.workflowStepTask.findUnique({
        where: { id: taskId },
      });

      if (!task || !task.metadata) {
        throw new Error(`Task ${taskId} not found or missing metadata`);
      }

      const metadata = task.metadata as any;
      const agentChain = metadata.agentChain as AgentChainLink[];
      const currentIndex = metadata.currentAgentIndex as number;

      if (currentIndex >= agentChain.length) {
        // All agents completed - mark task as completed
        await this.completeCollaborativeTask(taskId);
        return true;
      }

      const currentAgentSpec = agentChain[currentIndex];

      // Find available agent of required type
      const availableAgent = await this.findAvailableAgentForCollaboration(
        currentAgentSpec.agentType,
        currentAgentSpec.requiredSkills
      );

      if (!availableAgent) {
        // No available agent - mark chain link as blocked
        agentChain[currentIndex].status = 'blocked';

        await this.updateTaskMetadata(taskId, {
          ...metadata,
          agentChain,
          collaborationStatus: 'blocked',
        });

        console.log(
          `⚠️ No available agent for ${currentAgentSpec.agentType} in task ${taskId}`
        );
        return false;
      }

      // Assign agent and update chain
      agentChain[currentIndex] = {
        ...currentAgentSpec,
        agentId: availableAgent.id,
        status: 'assigned',
        startedAt: new Date(),
      };

      await prisma.workflowStepTask.update({
        where: { id: taskId },
        data: {
          agentId: availableAgent.id,
          assignedTo: availableAgent.name,
          status: 'in_progress',
          metadata: {
            ...metadata,
            agentChain,
            collaborationStatus: 'in-progress',
          },
        },
      });

      console.log(
        `🎯 Assigned ${
          availableAgent.name
        } to collaborative task ${taskId} (step ${currentIndex + 1})`
      );
      return true;
    } catch (error) {
      console.error('❌ Error assigning next agent in chain:', error);
      throw new Error(
        `Agent assignment failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Agent completes their part and hands off to next agent
   */
  async completeAgentPartAndHandoff(
    taskId: string,
    agentId: string,
    completionData: {
      completedWork: string;
      deliverables: string[];
      handoffNotes: string;
      actualTimeSpent: number;
      qualityScore?: number;
      blockers?: string[];
    }
  ): Promise<void> {
    try {
      const task = await prisma.workflowStepTask.findUnique({
        where: { id: taskId },
      });

      if (!task || !task.metadata) {
        throw new Error(`Task ${taskId} not found or missing metadata`);
      }

      if (task.agentId !== agentId) {
        throw new Error(
          `Agent ${agentId} is not currently assigned to task ${taskId}`
        );
      }

      const metadata = task.metadata as any;
      const agentChain = metadata.agentChain as AgentChainLink[];
      const currentIndex = metadata.currentAgentIndex as number;

      // Update current agent's status
      agentChain[currentIndex] = {
        ...agentChain[currentIndex],
        status: 'completed',
        completedAt: new Date(),
        actualTime: completionData.actualTimeSpent,
        handoffNotes: completionData.handoffNotes,
      };

      // Calculate overall progress
      const completedAgents = agentChain.filter(
        a => a.status === 'completed'
      ).length;
      const overallProgress = Math.round(
        (completedAgents / agentChain.length) * 100
      );

      // Update task with progress
      const updatedMetadata = {
        ...metadata,
        agentChain,
        currentAgentIndex: currentIndex + 1,
        overallProgress,
        lastHandoff: {
          fromAgentId: agentId,
          completedWork: completionData.completedWork,
          deliverables: completionData.deliverables,
          handoffNotes: completionData.handoffNotes,
          handoffTime: new Date().toISOString(),
          qualityScore: completionData.qualityScore,
        },
      };

      await this.updateTaskMetadata(taskId, updatedMetadata);

      console.log(
        `✅ Agent ${agentId} completed part ${
          currentIndex + 1
        } of collaborative task ${taskId}`
      );

      // Assign next agent in chain
      await this.assignNextAgentInChain(taskId);
    } catch (error) {
      console.error('❌ Error in agent handoff:', error);
      throw new Error(
        `Agent handoff failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Get collaboration status for a task
   */
  async getCollaborationStatus(
    taskId: string
  ): Promise<CollaborativeTask | null> {
    try {
      const task = await prisma.workflowStepTask.findUnique({
        where: { id: taskId },
        include: {
          agent: { include: { profile: true } },
        },
      });

      if (!task || !task.metadata) {
        return null;
      }

      const metadata = task.metadata as any;

      if (!metadata.isCollaborative) {
        return null;
      }

      return {
        taskId: task.id,
        agentChain: metadata.agentChain,
        currentAgentIndex: metadata.currentAgentIndex,
        overallProgress: metadata.overallProgress,
        collaborationStatus: metadata.collaborationStatus,
      };
    } catch (error) {
      console.error('❌ Error getting collaboration status:', error);
      return null;
    }
  }

  /**
   * Create collaboration plans for different types of complex tasks
   */
  getCollaborationPlanTemplates(): { [key: string]: TaskCollaborationPlan } {
    return {
      'full-stack-development': {
        taskTitle: 'Full-Stack Application Development',
        totalEstimatedTime: 960, // 16 hours
        agentSequence: [
          {
            agentType: 'business-analyst',
            role: 'Requirements Analyst',
            description:
              'Analyze requirements and create detailed specifications',
            estimatedTime: 120,
            requiredSkills: ['business-analysis', 'requirements-gathering'],
            inputRequirements: ['project-brief', 'stakeholder-input'],
            outputDeliverables: [
              'detailed-requirements',
              'user-stories',
              'acceptance-criteria',
            ],
          },
          {
            agentType: 'system-architect',
            role: 'Technical Architect',
            description:
              'Design system architecture and technical specifications',
            estimatedTime: 180,
            requiredSkills: [
              'system-architecture',
              'database-design',
              'api-design',
            ],
            inputRequirements: ['detailed-requirements', 'user-stories'],
            outputDeliverables: [
              'architecture-diagram',
              'database-schema',
              'api-specifications',
            ],
          },
          {
            agentType: 'backend-developer',
            role: 'Backend Developer',
            description: 'Implement backend services and APIs',
            estimatedTime: 360,
            requiredSkills: [
              'backend-development',
              'database-programming',
              'api-implementation',
            ],
            inputRequirements: [
              'architecture-diagram',
              'database-schema',
              'api-specifications',
            ],
            outputDeliverables: [
              'backend-code',
              'api-endpoints',
              'database-implementation',
            ],
          },
          {
            agentType: 'frontend-developer',
            role: 'Frontend Developer',
            description: 'Develop user interface and frontend logic',
            estimatedTime: 300,
            requiredSkills: [
              'frontend-development',
              'ui-development',
              'api-integration',
            ],
            inputRequirements: [
              'api-endpoints',
              'user-stories',
              'acceptance-criteria',
            ],
            outputDeliverables: [
              'frontend-code',
              'user-interface',
              'integrated-application',
            ],
          },
        ],
      },
      'comprehensive-analysis': {
        taskTitle: 'Comprehensive Business & Technical Analysis',
        totalEstimatedTime: 480, // 8 hours
        agentSequence: [
          {
            agentType: 'business-analyst',
            role: 'Business Process Analyst',
            description:
              'Analyze current business processes and identify improvements',
            estimatedTime: 180,
            requiredSkills: ['process-analysis', 'business-modeling'],
            inputRequirements: [
              'business-documentation',
              'stakeholder-interviews',
            ],
            outputDeliverables: [
              'process-analysis',
              'improvement-recommendations',
            ],
          },
          {
            agentType: 'system-architect',
            role: 'Technical Feasibility Analyst',
            description:
              'Assess technical feasibility and provide architectural recommendations',
            estimatedTime: 150,
            requiredSkills: ['technical-analysis', 'feasibility-assessment'],
            inputRequirements: [
              'process-analysis',
              'improvement-recommendations',
            ],
            outputDeliverables: [
              'feasibility-report',
              'technical-recommendations',
            ],
          },
          {
            agentType: 'business-analyst',
            role: 'Integration Specialist',
            description:
              'Create integrated solution plan combining business and technical aspects',
            estimatedTime: 150,
            requiredSkills: ['solution-integration', 'strategic-planning'],
            inputRequirements: [
              'feasibility-report',
              'technical-recommendations',
            ],
            outputDeliverables: [
              'integrated-solution-plan',
              'implementation-roadmap',
            ],
          },
        ],
      },
    };
  }

  /**
   * Auto-create collaborative tasks based on step complexity
   */
  async autoCreateCollaborativeTasksForStep(
    approvalId: string,
    stepType: string,
    complexity: 'simple' | 'medium' | 'complex'
  ): Promise<string[]> {
    try {
      const taskIds: string[] = [];
      const templates = this.getCollaborationPlanTemplates();

      if (complexity === 'complex' && stepType === 'development') {
        // Create full-stack development collaboration
        const taskId = await this.createCollaborativeTask(
          approvalId,
          'Full-Stack Development',
          'Comprehensive development of the application with multiple specialized agents',
          templates['full-stack-development']
        );
        taskIds.push(taskId);
      } else if (complexity === 'medium' && stepType === 'analysis') {
        // Create comprehensive analysis collaboration
        const taskId = await this.createCollaborativeTask(
          approvalId,
          'Comprehensive Analysis',
          'Multi-perspective analysis combining business and technical viewpoints',
          templates['comprehensive-analysis']
        );
        taskIds.push(taskId);
      }

      return taskIds;
    } catch (error) {
      console.error('❌ Error auto-creating collaborative tasks:', error);
      return [];
    }
  }

  /**
   * Find available agent for collaboration based on skills and workload
   */
  private async findAvailableAgentForCollaboration(
    agentType: string,
    requiredSkills: string[]
  ): Promise<any | null> {
    const agents = await prisma.agent.findMany({
      where: {
        type: agentType,
        status: { in: ['idle', 'active'] },
      },
      include: {
        profile: true,
        stepTasks: {
          where: {
            status: { in: ['pending', 'in_progress'] },
          },
        },
      },
    });

    // Filter by skill requirements and workload
    const suitableAgents = agents.filter(agent => {
      // Check workload
      const currentTasks = agent.stepTasks.length;
      if (currentTasks >= 2) return false; // Max 2 concurrent tasks for collaboration

      // Check skills (if agent has profile with specialties)
      if (requiredSkills.length > 0 && agent.profile?.specialties) {
        const agentSkills = agent.profile.specialties as string[];
        const hasRequiredSkills = requiredSkills.some(skill =>
          agentSkills.includes(skill)
        );
        if (!hasRequiredSkills) return false;
      }

      return true;
    });

    // Return agent with least workload
    if (suitableAgents.length === 0) return null;

    return suitableAgents.sort(
      (a, b) => a.stepTasks.length - b.stepTasks.length
    )[0];
  }

  /**
   * Complete collaborative task when all agents finish
   */
  private async completeCollaborativeTask(taskId: string): Promise<void> {
    const task = await prisma.workflowStepTask.findUnique({
      where: { id: taskId },
    });

    if (!task) return;

    const metadata = task.metadata as any;
    const agentChain = metadata.agentChain as AgentChainLink[];

    // Collect all deliverables from the chain
    const allDeliverables = agentChain.reduce((acc, agent) => {
      return acc.concat(agent.deliverables);
    }, [] as string[]);

    // Calculate total actual time
    const totalActualTime = agentChain.reduce((sum, agent) => {
      return sum + (agent.actualTime || agent.estimatedTime);
    }, 0);

    await prisma.workflowStepTask.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        progress: 100,
        completedAt: new Date(),
        actualTime: totalActualTime,
        metadata: {
          ...metadata,
          collaborationStatus: 'completed',
          overallProgress: 100,
          finalDeliverables: allDeliverables,
          completionSummary: {
            totalAgents: agentChain.length,
            totalTime: totalActualTime,
            completedAt: new Date().toISOString(),
          },
        },
      },
    });

    console.log(
      `🎉 Collaborative task ${taskId} completed with ${agentChain.length} agents`
    );
  }

  /**
   * Update task metadata helper
   */
  private async updateTaskMetadata(
    taskId: string,
    metadata: any
  ): Promise<void> {
    await prisma.workflowStepTask.update({
      where: { id: taskId },
      data: { metadata },
    });
  }

  /**
   * Get collaboration analytics
   */
  async getCollaborationAnalytics(projectId?: string): Promise<{
    totalCollaborativeTasks: number;
    activeCollaborations: number;
    completedCollaborations: number;
    averageCollaborationTime: number;
    agentParticipationStats: {
      agentName: string;
      participations: number;
      completionRate: number;
    }[];
  }> {
    const whereClause = projectId ? { approval: { projectId } } : {};

    const collaborativeTasks = await prisma.workflowStepTask.findMany({
      where: {
        ...whereClause,
        type: 'collaborative',
      },
      include: {
        agent: { include: { profile: true } },
      },
    });

    const totalCollaborativeTasks = collaborativeTasks.length;
    const activeCollaborations = collaborativeTasks.filter(t =>
      ['pending', 'in_progress'].includes(t.status)
    ).length;
    const completedCollaborations = collaborativeTasks.filter(
      t => t.status === 'completed'
    ).length;

    const completedTasks = collaborativeTasks.filter(
      t => t.status === 'completed'
    );
    const averageCollaborationTime =
      completedTasks.length > 0
        ? completedTasks.reduce(
            (sum, task) => sum + (task.actualTime || 0),
            0
          ) / completedTasks.length
        : 0;

    // Agent participation statistics would require more complex queries
    // This is a simplified version
    const agentParticipationStats: {
      agentName: string;
      participations: number;
      completionRate: number;
    }[] = [];

    return {
      totalCollaborativeTasks,
      activeCollaborations,
      completedCollaborations,
      averageCollaborationTime,
      agentParticipationStats,
    };
  }
}
