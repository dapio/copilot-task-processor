/**
 * Master Task Management Service
 *
 * Integrates all task management systems:
 * - Task Currentness Validation
 * - Agent Task Assignment
 * - Multi-Agent Collaboration
 * - Agent Personalization
 *
 * Provides main entry points for workflow integration.
 */

import { PrismaClient } from '@prisma/client';
import {
  TaskCurrentnessService,
  TaskValidationContext,
} from './task-currentness.service';
import { AgentTaskAssignmentService } from './agent-task-assignment.service';
import { MultiAgentCollaborationService } from './multi-agent-collaboration.service';
import { AgentProfileService } from './agent-profile.service';

const prisma = new PrismaClient();

export interface WorkflowStepContext {
  projectId: string;
  stepId: string;
  stepName: string;
  agentType: string;
  approvalId: string;
  uploadedFiles: string[];
  stepConfiguration: any;
  projectFiles: string[];
  requirements: string[];
  complexity: 'simple' | 'medium' | 'complex';
}

export interface TaskManagementResult {
  tasksValidated: boolean;
  tasksCreated: number;
  tasksUpdated: number;
  tasksAssigned: number;
  collaborativeTasksCreated: number;
  agentAssignments: { agentName: string; taskTitle: string }[];
  validationReport: {
    totalTasks: number;
    validTasks: number;
    outdatedTasks: number;
    newTasks: number;
  };
}

export class MasterTaskManagementService {
  private taskCurrentnessService: TaskCurrentnessService;
  private agentAssignmentService: AgentTaskAssignmentService;
  private collaborationService: MultiAgentCollaborationService;
  private agentProfileService: AgentProfileService;

  constructor() {
    this.taskCurrentnessService = new TaskCurrentnessService();
    this.agentAssignmentService = new AgentTaskAssignmentService();
    this.collaborationService = new MultiAgentCollaborationService();
    this.agentProfileService = new AgentProfileService();
  }

  /**
   * Main entry point - called when workflow step starts
   * Performs complete task management cycle
   */
  async initializeStepTasks(
    context: WorkflowStepContext
  ): Promise<TaskManagementResult> {
    try {
      console.log(
        `🚀 Initializing task management for step: ${context.stepName}`
      );

      const result = await this.processTaskManagementSteps(context);

      console.log('✅ Task management initialization completed:', {
        validated: result.tasksValidated,
        created: result.tasksCreated,
        updated: result.tasksUpdated,
        assigned: result.tasksAssigned,
        collaborative: result.collaborativeTasksCreated,
      });

      return result;
    } catch (error) {
      console.error('❌ Error in task management initialization:', error);
      throw new Error(
        `Task management initialization failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Process all task management steps
   */
  private async processTaskManagementSteps(
    context: WorkflowStepContext
  ): Promise<TaskManagementResult> {
    const result: TaskManagementResult = {
      tasksValidated: false,
      tasksCreated: 0,
      tasksUpdated: 0,
      tasksAssigned: 0,
      collaborativeTasksCreated: 0,
      agentAssignments: [],
      validationReport: {
        totalTasks: 0,
        validTasks: 0,
        outdatedTasks: 0,
        newTasks: 0,
      },
    };

    // Step 1: Validate and update existing tasks
    await this.validateTasks(context, result);

    // Step 2: Create collaborative tasks for complex scenarios
    await this.createCollaborativeTasks(context, result);

    // Step 3: Auto-assign tasks to agents
    await this.assignTasksToAgents(context, result);

    // Step 4: Ensure all agents have proper profiles
    await this.ensureAgentProfilesExist(context.agentType);

    return result;
  }

  /**
   * Validate and update existing tasks
   */
  private async validateTasks(
    context: WorkflowStepContext,
    result: TaskManagementResult
  ): Promise<void> {
    console.log('📋 Step 1: Validating task currentness...');

    const validationContext: TaskValidationContext = {
      projectId: context.projectId,
      stepId: context.stepId,
      stepName: context.stepName,
      agentType: context.agentType,
      uploadedFiles: context.uploadedFiles,
      stepConfiguration: context.stepConfiguration,
      projectFiles: context.projectFiles,
      requirements: context.requirements,
    };

    const validationResult =
      await this.taskCurrentnessService.validateAndUpdateStepTasks(
        context.approvalId,
        validationContext
      );

    result.tasksValidated = validationResult.isCurrentTasksValid;
    result.tasksUpdated = validationResult.tasksToUpdate.length;
    result.tasksCreated = validationResult.tasksToCreate.length;
    result.validationReport = {
      totalTasks: validationResult.validationReport.totalExistingTasks,
      validTasks: validationResult.validationReport.validTasks,
      outdatedTasks: validationResult.validationReport.outdatedTasks,
      newTasks: validationResult.validationReport.missingTasks,
    };
  }

  /**
   * Create collaborative tasks for complex scenarios
   */
  private async createCollaborativeTasks(
    context: WorkflowStepContext,
    result: TaskManagementResult
  ): Promise<void> {
    if (context.complexity === 'complex') {
      console.log('🤝 Step 2: Creating collaborative tasks...');
      const collaborativeTaskIds =
        await this.collaborationService.autoCreateCollaborativeTasksForStep(
          context.approvalId,
          context.agentType,
          context.complexity
        );
      result.collaborativeTasksCreated = collaborativeTaskIds.length;
    }
  }

  /**
   * Auto-assign tasks to agents
   */
  private async assignTasksToAgents(
    context: WorkflowStepContext,
    result: TaskManagementResult
  ): Promise<void> {
    console.log('🎯 Step 3: Auto-assigning tasks to agents...');

    await this.agentAssignmentService.autoAssignTasksForStep(
      context.approvalId,
      context.agentType
    );

    const assignments = await this.getStepTaskAssignments(context.approvalId);
    result.tasksAssigned = assignments.length;
    result.agentAssignments = assignments;
  }

  /**
   * Agent picks up a task (called by agent systems)
   */
  async agentPickupTask(taskId: string, agentId: string): Promise<boolean> {
    try {
      console.log(`🤖 Agent ${agentId} attempting to pickup task ${taskId}`);

      // Check if it's a collaborative task
      const collaborativeTask =
        await this.collaborationService.getCollaborationStatus(taskId);

      if (collaborativeTask) {
        // For collaborative tasks, the collaboration service handles assignment
        console.log(
          `🤝 Task ${taskId} is collaborative - handled by collaboration service`
        );
        return true;
      } else {
        // Regular task assignment
        return await this.agentAssignmentService.agentPickupTask(
          taskId,
          agentId
        );
      }
    } catch (error) {
      console.error('❌ Error in agent task pickup:', error);
      return false;
    }
  }

  /**
   * Agent completes a task
   */
  async agentCompleteTask(
    taskId: string,
    agentId: string,
    completionData: {
      completedWork: string;
      deliverables: string[];
      nextSteps?: string[];
      needsHandoff?: boolean;
      nextAgentType?: string;
      actualTimeSpent?: number;
      qualityScore?: number;
      handoffNotes?: string;
    }
  ): Promise<void> {
    try {
      console.log(`✅ Agent ${agentId} completing task ${taskId}`);

      // Check if it's a collaborative task
      const collaborativeTask =
        await this.collaborationService.getCollaborationStatus(taskId);

      if (collaborativeTask) {
        // Handle collaborative task completion
        await this.collaborationService.completeAgentPartAndHandoff(
          taskId,
          agentId,
          {
            completedWork: completionData.completedWork,
            deliverables: completionData.deliverables,
            handoffNotes: completionData.handoffNotes || '',
            actualTimeSpent: completionData.actualTimeSpent || 120,
            qualityScore: completionData.qualityScore,
            blockers: [],
          }
        );
      } else {
        // Handle regular task completion
        await this.agentAssignmentService.agentCompleteTask(
          taskId,
          agentId,
          completionData
        );
      }

      console.log(`🎉 Task ${taskId} completed by agent ${agentId}`);
    } catch (error) {
      console.error('❌ Error in agent task completion:', error);
      throw new Error(
        `Task completion failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Get comprehensive task status for a workflow step
   */
  async getStepTaskStatus(approvalId: string): Promise<{
    totalTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    completedTasks: number;
    blockedTasks: number;
    collaborativeTasks: number;
    agentAssignments: {
      agentName: string;
      taskTitle: string;
      status: string;
    }[];
    taskDetails: any[];
  }> {
    try {
      const tasks = await prisma.workflowStepTask.findMany({
        where: { approvalId },
        include: {
          agent: { include: { profile: true } },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      });

      const totalTasks = tasks.length;
      const pendingTasks = tasks.filter(t => t.status === 'pending').length;
      const inProgressTasks = tasks.filter(
        t => t.status === 'in_progress'
      ).length;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const blockedTasks = tasks.filter(t => t.status === 'blocked').length;
      const collaborativeTasks = tasks.filter(
        t => t.type === 'collaborative'
      ).length;

      const agentAssignments = tasks
        .filter(t => t.agent)
        .map(t => ({
          agentName: t.agent!.profile?.displayName || t.agent!.name,
          taskTitle: t.title,
          status: t.status,
        }));

      const taskDetails = tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        type: task.type,
        priority: task.priority,
        status: task.status,
        progress: task.progress,
        estimatedTime: task.estimatedTime,
        actualTime: task.actualTime,
        assignedAgent: task.agent
          ? {
              id: task.agent.id,
              name: task.agent.name,
              displayName: task.agent.profile?.displayName,
              avatar: task.agent.profile?.avatar,
              color: task.agent.profile?.color,
            }
          : null,
        isCollaborative: task.type === 'collaborative',
        createdAt: task.createdAt,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
      }));

      return {
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        blockedTasks,
        collaborativeTasks,
        agentAssignments,
        taskDetails,
      };
    } catch (error) {
      console.error('❌ Error getting step task status:', error);
      throw new Error(
        `Failed to get task status: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Force task reassignment (for blocked or failed tasks)
   */
  async reassignTask(taskId: string, newAgentType?: string): Promise<boolean> {
    try {
      console.log(`🔄 Reassigning task ${taskId}`);

      const task = await prisma.workflowStepTask.findUnique({
        where: { id: taskId },
        include: { approval: true },
      });

      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      // Reset task to pending
      await prisma.workflowStepTask.update({
        where: { id: taskId },
        data: {
          status: 'pending',
          agentId: null,
          assignedTo: null,
          startedAt: null,
          blockedReason: null,
          metadata: {
            ...((task.metadata as object) || {}),
            reassignedAt: new Date().toISOString(),
            previousAssignments:
              (task.metadata as any)?.previousAssignments || [],
          },
        },
      });

      // Auto-assign to new agent
      const targetAgentType =
        newAgentType ||
        task.approval.stepName.toLowerCase().replace(/\s+/g, '-');
      await this.agentAssignmentService.autoAssignTasksForStep(
        task.approvalId,
        targetAgentType
      );

      console.log(`✅ Task ${taskId} reassigned successfully`);
      return true;
    } catch (error) {
      console.error('❌ Error reassigning task:', error);
      return false;
    }
  }

  /**
   * Get comprehensive analytics for task management
   */
  async getTaskManagementAnalytics(projectId?: string): Promise<{
    taskValidationStats: {
      totalValidations: number;
      averageValidationTime: number;
      tasksUpdatedByValidation: number;
    };
    agentAssignmentStats: any;
    collaborationStats: any;
    overallEfficiency: {
      averageTaskCompletionTime: number;
      taskCompletionRate: number;
      agentUtilization: number;
    };
  }> {
    try {
      const agentAssignmentStats =
        await this.agentAssignmentService.getTaskAssignmentStats(projectId);
      const collaborationStats =
        await this.collaborationService.getCollaborationAnalytics(projectId);

      // Calculate overall efficiency metrics
      const whereClause = projectId ? { approval: { projectId } } : {};

      const completedTasks = await prisma.workflowStepTask.findMany({
        where: {
          ...whereClause,
          status: 'completed',
          actualTime: { not: null },
        },
      });

      const averageTaskCompletionTime =
        completedTasks.length > 0
          ? completedTasks.reduce(
              (sum, task) => sum + (task.actualTime || 0),
              0
            ) / completedTasks.length
          : 0;

      const totalTasks = await prisma.workflowStepTask.count({
        where: whereClause,
      });
      const taskCompletionRate =
        totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

      const activeAgents = await prisma.agent.count({
        where: { status: { in: ['active', 'idle'] } },
      });
      const busyAgents = await prisma.agent.count({
        where: {
          stepTasks: { some: { status: { in: ['pending', 'in_progress'] } } },
        },
      });
      const agentUtilization =
        activeAgents > 0 ? (busyAgents / activeAgents) * 100 : 0;

      return {
        taskValidationStats: {
          totalValidations: 0, // Would need to track this in validation service
          averageValidationTime: 0, // Would need to track this
          tasksUpdatedByValidation: 0, // Would need to track this
        },
        agentAssignmentStats,
        collaborationStats,
        overallEfficiency: {
          averageTaskCompletionTime,
          taskCompletionRate,
          agentUtilization,
        },
      };
    } catch (error) {
      console.error('❌ Error getting task management analytics:', error);
      throw new Error(
        `Analytics failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Get task assignments for a step
   */
  private async getStepTaskAssignments(
    approvalId: string
  ): Promise<{ agentName: string; taskTitle: string }[]> {
    const tasks = await prisma.workflowStepTask.findMany({
      where: {
        approvalId,
        agentId: { not: null },
      },
      include: {
        agent: { include: { profile: true } },
      },
    });

    return tasks.map(task => ({
      agentName: task.agent!.profile?.displayName || task.agent!.name,
      taskTitle: task.title,
    }));
  }

  /**
   * Ensure agents have proper profile setup
   */
  private async ensureAgentProfilesExist(agentType: string): Promise<void> {
    const agents = await prisma.agent.findMany({
      where: { type: agentType },
      include: { profile: true },
    });

    for (const agent of agents) {
      if (!agent.profile) {
        // Create default profile for agent
        await this.agentProfileService.createAgentProfile({
          agentId: agent.id,
          displayName: this.generateDisplayName(agent.name, agent.type),
          firstName: this.extractFirstName(agent.name),
          lastName: this.extractLastName(agent.name),
          color: this.getColorForAgentType(agent.type),
          icon: this.getIconForAgentType(agent.type),
          bio: this.generateDefaultBio(agent.type),
          specialties: this.getDefaultSpecialties(agent.type),
        });

        console.log(`👤 Created profile for agent: ${agent.name}`);
      }
    }
  }

  /**
   * Helper methods for agent profile generation
   */
  private generateDisplayName(name: string, type: string): string {
    const typeNames = {
      'business-analyst': 'Business Analyst',
      'system-architect': 'System Architect',
      'backend-developer': 'Backend Developer',
      'frontend-developer': 'Frontend Developer',
      'qa-engineer': 'QA Engineer',
    };

    const typeName = typeNames[type as keyof typeof typeNames] || type;
    return `${name} - ${typeName}`;
  }

  private extractFirstName(fullName: string): string {
    return fullName.split(' ')[0] || fullName;
  }

  private extractLastName(fullName: string): string {
    const parts = fullName.split(' ');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  private getColorForAgentType(type: string): string {
    const colorMap = {
      'business-analyst': '#3B82F6',
      'system-architect': '#10B981',
      'backend-developer': '#F59E0B',
      'frontend-developer': '#EF4444',
      'qa-engineer': '#8B5CF6',
    };

    return colorMap[type as keyof typeof colorMap] || '#6366F1';
  }

  private getIconForAgentType(type: string): string {
    const iconMap = {
      'business-analyst': 'chart-line',
      'system-architect': 'sitemap',
      'backend-developer': 'server',
      'frontend-developer': 'desktop',
      'qa-engineer': 'bug',
    };

    return iconMap[type as keyof typeof iconMap] || 'user';
  }

  private generateDefaultBio(type: string): string {
    const bioMap = {
      'business-analyst':
        'Specjalizuję się w analizie wymagań biznesowych i optymalizacji procesów.',
      'system-architect':
        'Projektuję skalowalne architektury systemów i rozwiązania techniczne.',
      'backend-developer': 'Rozwijam wydajne systemy backendowe i API.',
      'frontend-developer':
        'Tworzę intuicyjne interfejsy użytkownika i aplikacje webowe.',
      'qa-engineer':
        'Zapewniam jakość oprogramowania poprzez kompleksowe testowanie.',
    };

    return (
      bioMap[type as keyof typeof bioMap] ||
      'Profesjonalny agent AI specjalizujący się w swoich obszarach kompetencji.'
    );
  }

  private getDefaultSpecialties(type: string): string[] {
    const specialtiesMap = {
      'business-analyst': [
        'requirements-analysis',
        'process-optimization',
        'stakeholder-management',
      ],
      'system-architect': [
        'system-design',
        'architecture-patterns',
        'scalability-planning',
      ],
      'backend-developer': [
        'api-development',
        'database-design',
        'system-integration',
      ],
      'frontend-developer': [
        'ui-development',
        'user-experience',
        'responsive-design',
      ],
      'qa-engineer': ['test-automation', 'quality-assurance', 'bug-tracking'],
    };

    return (
      specialtiesMap[type as keyof typeof specialtiesMap] || [
        'general-expertise',
      ]
    );
  }
}
