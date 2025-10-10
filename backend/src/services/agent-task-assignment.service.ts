/**
 * Agent Task Assignment Service
 *
 * Handles automatic task assignment and management by agents.
 * Agents can pick up tasks, change status, complete work, and hand off to next agent.
 * Includes task ownership tracking and intelligent assignment logic.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AgentTaskAssignment {
  taskId: string;
  agentId: string;
  role: 'primary' | 'secondary' | 'reviewer' | 'next-in-chain';
  assignedAt: Date;
  expectedCompletionTime?: number; // minutes
  handoffInstructions?: string;
}

export interface TaskHandoffRequest {
  taskId: string;
  fromAgentId: string;
  toAgentId: string;
  completedWork: string;
  nextSteps: string[];
  remainingTime?: number;
  handoffReason:
    | 'completed-part'
    | 'blocked'
    | 'expertise-needed'
    | 'reassignment';
}

export interface AgentCapability {
  agentId: string;
  skills: string[];
  currentWorkload: number;
  maxConcurrentTasks: number;
  experienceLevel: 'junior' | 'mid' | 'senior' | 'expert';
  availability: 'available' | 'busy' | 'offline';
}

export class AgentTaskAssignmentService {
  /**
   * Automatically assign tasks to available agents based on skills and workload
   */
  async autoAssignTasksForStep(
    approvalId: string,
    stepAgentType: string
  ): Promise<void> {
    try {
      console.log(
        `🤖 Auto-assigning tasks for step with agent type: ${stepAgentType}`
      );

      // Get all pending tasks for this step
      const pendingTasks = await this.getPendingStepTasks(approvalId);

      if (pendingTasks.length === 0) {
        console.log('ℹ️ No pending tasks to assign');
        return;
      }

      // Get available agents of the required type
      const availableAgents = await this.getAvailableAgents(stepAgentType);

      if (availableAgents.length === 0) {
        console.log(`⚠️ No available agents of type ${stepAgentType}`);
        return;
      }

      // Assign tasks to agents
      for (const task of pendingTasks) {
        const bestAgent = await this.findBestAgentForTask(
          task,
          availableAgents
        );

        if (bestAgent) {
          await this.assignTaskToAgent(task.id, bestAgent.id, 'primary');
          console.log(
            `✅ Assigned task "${task.title}" to agent ${bestAgent.name}`
          );
        }
      }
    } catch (error) {
      console.error('❌ Error in auto task assignment:', error);
      throw new Error(
        `Auto assignment failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Agent picks up a task and starts working on it
   */
  async agentPickupTask(taskId: string, agentId: string): Promise<boolean> {
    try {
      const task = await prisma.workflowStepTask.findUnique({
        where: { id: taskId },
        include: { agent: { include: { profile: true } } },
      });

      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      if (task.status !== 'pending') {
        console.log(
          `⚠️ Task ${taskId} is not available for pickup (status: ${task.status})`
        );
        return false;
      }

      // Check if agent is capable of handling this task
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        include: { profile: true },
      });

      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      const canHandle = await this.canAgentHandleTask(agent, task);
      if (!canHandle) {
        console.log(`⚠️ Agent ${agent.name} cannot handle task ${task.title}`);
        return false;
      }

      // Update task status and assign to agent
      await prisma.workflowStepTask.update({
        where: { id: taskId },
        data: {
          status: 'in_progress',
          agentId: agentId,
          assignedTo: agent.name,
          startedAt: new Date(),
          metadata: {
            ...((task.metadata as object) || {}),
            assignedBy: 'auto-assignment',
            pickupTime: new Date().toISOString(),
            estimatedCompletion: this.calculateEstimatedCompletion(
              task.estimatedTime || 120
            ),
          },
        },
      });

      console.log(`🎯 Agent ${agent.name} picked up task: ${task.title}`);
      return true;
    } catch (error) {
      console.error('❌ Error in agent task pickup:', error);
      throw new Error(
        `Task pickup failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Agent completes their part of the task
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
    }
  ): Promise<void> {
    try {
      const task = await prisma.workflowStepTask.findUnique({
        where: { id: taskId },
        include: { agent: { include: { profile: true } } },
      });

      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      if (task.agentId !== agentId) {
        throw new Error(`Agent ${agentId} is not assigned to task ${taskId}`);
      }

      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        include: { profile: true },
      });

      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      // Determine if task is fully completed or needs handoff
      if (completionData.needsHandoff && completionData.nextAgentType) {
        // Task needs handoff to another agent
        await this.initiateTaskHandoff(
          taskId,
          agentId,
          {
            taskId,
            fromAgentId: agentId,
            toAgentId: '', // Will be determined by assignment logic
            completedWork: completionData.completedWork,
            nextSteps: completionData.nextSteps || [],
            remainingTime: task.estimatedTime
              ? task.estimatedTime - (completionData.actualTimeSpent || 0)
              : undefined,
            handoffReason: 'completed-part',
          },
          completionData.nextAgentType
        );
      } else {
        // Task is fully completed
        await prisma.workflowStepTask.update({
          where: { id: taskId },
          data: {
            status: 'completed',
            progress: 100,
            completedAt: new Date(),
            actualTime: completionData.actualTimeSpent,
            metadata: {
              ...((task.metadata as object) || {}),
              completedWork: completionData.completedWork,
              deliverables: completionData.deliverables,
              completedBy: agent.name,
              completionTime: new Date().toISOString(),
            },
          },
        });

        console.log(`✅ Agent ${agent.name} completed task: ${task.title}`);
      }
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
   * Initiate task handoff to another agent
   */
  async initiateTaskHandoff(
    taskId: string,
    fromAgentId: string,
    handoffData: TaskHandoffRequest,
    targetAgentType: string
  ): Promise<void> {
    try {
      // Find best agent for handoff
      const availableAgents = await this.getAvailableAgents(targetAgentType);
      const targetAgent =
        availableAgents.length > 0 ? availableAgents[0] : null;

      if (!targetAgent) {
        // No available agent - mark task as blocked
        await prisma.workflowStepTask.update({
          where: { id: taskId },
          data: {
            status: 'blocked',
            blockedReason: `No available ${targetAgentType} agents for handoff`,
            metadata: {
              handoffPending: true,
              handoffData: JSON.stringify(handoffData),
              targetAgentType: targetAgentType,
            },
          },
        });

        console.log(
          `⚠️ Task ${taskId} blocked - no available ${targetAgentType} agents`
        );
        return;
      }

      // Update task with handoff information
      await prisma.workflowStepTask.update({
        where: { id: taskId },
        data: {
          agentId: targetAgent.id,
          assignedTo: targetAgent.name,
          status: 'pending',
          metadata: {
            ...(handoffData as any),
            handoffFrom: fromAgentId,
            handoffTo: targetAgent.id,
            handoffTime: new Date().toISOString(),
            previousWork: handoffData.completedWork,
          },
        },
      });

      // Auto-assign to new agent
      await this.agentPickupTask(taskId, targetAgent.id);

      console.log(
        `🔄 Task ${taskId} handed off from agent ${fromAgentId} to ${targetAgent.name}`
      );
    } catch (error) {
      console.error('❌ Error in task handoff:', error);
      throw new Error(
        `Task handoff failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Get pending tasks for a workflow step
   */
  private async getPendingStepTasks(approvalId: string) {
    return await prisma.workflowStepTask.findMany({
      where: {
        approvalId,
        status: 'pending',
      },
      include: {
        agent: { include: { profile: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }

  /**
   * Get available agents of specific type
   */
  private async getAvailableAgents(agentType: string): Promise<any[]> {
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

    // Filter by workload capacity
    const availableAgents = agents.filter(agent => {
      const currentTasks = agent.stepTasks.length;
      const maxTasks = this.getMaxTasksForAgent(agent);
      return currentTasks < maxTasks;
    });

    // Sort by workload and experience
    return availableAgents.sort((a, b) => {
      // Prioritize agents with less workload
      const workloadA = a.stepTasks.length;
      const workloadB = b.stepTasks.length;

      if (workloadA !== workloadB) {
        return workloadA - workloadB;
      }

      // Then by experience (if available in profile)
      const experienceA = this.getAgentExperienceScore(a);
      const experienceB = this.getAgentExperienceScore(b);

      return experienceB - experienceA;
    });
  }

  /**
   * Find best agent for specific task
   */
  private async findBestAgentForTask(
    task: any,
    availableAgents: any[]
  ): Promise<any | null> {
    if (availableAgents.length === 0) return null;

    // Score agents based on task requirements
    const scoredAgents = availableAgents.map(agent => ({
      agent,
      score: this.calculateAgentTaskScore(agent, task),
    }));

    // Sort by score and return best match
    scoredAgents.sort((a, b) => b.score - a.score);

    return scoredAgents.length > 0 ? scoredAgents[0].agent : availableAgents[0];
  }

  /**
   * Calculate how well an agent matches a task
   */
  private calculateAgentTaskScore(agent: any, task: any): number {
    let score = 100; // Base score

    // Reduce score based on current workload
    const currentTasks = agent.stepTasks.length;
    score -= currentTasks * 10;

    // Increase score for experience
    const experienceScore = this.getAgentExperienceScore(agent);
    score += experienceScore * 5;

    // Reduce score for priority mismatch
    if (task.priority === 'critical' && currentTasks > 0) {
      score -= 20;
    }

    // Check skill requirements (if available in metadata)
    const requiredSkills = task.metadata?.requiredSkills || [];
    const agentSkills = agent.profile?.specialties || [];

    if (requiredSkills.length > 0) {
      const skillMatch =
        requiredSkills.filter((skill: string) => agentSkills.includes(skill))
          .length / requiredSkills.length;
      score += skillMatch * 30;
    }

    return Math.max(0, score);
  }

  /**
   * Check if agent can handle specific task
   */
  private async canAgentHandleTask(agent: any, task: any): Promise<boolean> {
    // Check if agent type matches
    const approval = await prisma.workflowStepApproval.findUnique({
      where: { id: task.approvalId },
    });

    if (!approval) return false;

    // Basic type matching - can be enhanced with more sophisticated logic
    const canHandle =
      agent.type === approval.stepName.toLowerCase().replace(/\s+/g, '-');

    // Check workload capacity
    const currentTasks = await prisma.workflowStepTask.count({
      where: {
        agentId: agent.id,
        status: { in: ['pending', 'in_progress'] },
      },
    });

    const maxTasks = this.getMaxTasksForAgent(agent);

    return canHandle && currentTasks < maxTasks;
  }

  /**
   * Get maximum tasks an agent can handle concurrently
   */
  private getMaxTasksForAgent(agent: any): number {
    // Default capacity based on agent experience/type
    const baseCapacity = 3;

    // Increase capacity for experienced agents
    const experienceMultiplier = this.getAgentExperienceScore(agent) / 50;

    return Math.floor(baseCapacity * (1 + experienceMultiplier));
  }

  /**
   * Get agent experience score (0-100)
   */
  private getAgentExperienceScore(agent: any): number {
    // Simple scoring based on profile data
    let score = 50; // Base score

    const profile = agent.profile;
    if (!profile) return score;

    // Score based on specialties count
    const specialties = profile.specialties || [];
    score += Math.min(specialties.length * 5, 25);

    // Score based on profile completeness
    if (profile.bio) score += 10;
    if (profile.firstName && profile.lastName) score += 10;
    if (profile.avatar) score += 5;

    return Math.min(100, score);
  }

  /**
   * Calculate estimated completion time
   */
  private calculateEstimatedCompletion(estimatedMinutes: number): string {
    const now = new Date();
    const completionTime = new Date(now.getTime() + estimatedMinutes * 60000);
    return completionTime.toISOString();
  }

  /**
   * Assign task to specific agent
   */
  private async assignTaskToAgent(
    taskId: string,
    agentId: string,
    role: 'primary' | 'secondary' | 'reviewer' | 'next-in-chain'
  ): Promise<void> {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { profile: true },
    });

    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    await prisma.workflowStepTask.update({
      where: { id: taskId },
      data: {
        agentId: agentId,
        assignedTo: agent.name,
        metadata: {
          assignmentRole: role,
          assignedAt: new Date().toISOString(),
          assignedBy: 'auto-assignment-service',
        },
      },
    });
  }

  /**
   * Get task assignment statistics for monitoring
   */
  async getTaskAssignmentStats(projectId?: string): Promise<{
    totalTasks: number;
    assignedTasks: number;
    completedTasks: number;
    blockedTasks: number;
    agentWorkloads: {
      agentName: string;
      activeTasks: number;
      completedTasks: number;
    }[];
  }> {
    const whereClause = projectId ? { approval: { projectId } } : {};

    const totalTasks = await prisma.workflowStepTask.count({
      where: whereClause,
    });

    const assignedTasks = await prisma.workflowStepTask.count({
      where: { ...whereClause, agentId: { not: null } },
    });

    const completedTasks = await prisma.workflowStepTask.count({
      where: { ...whereClause, status: 'completed' },
    });

    const blockedTasks = await prisma.workflowStepTask.count({
      where: { ...whereClause, status: 'blocked' },
    });

    // Get agent workloads
    const agents = await prisma.agent.findMany({
      include: {
        profile: true,
        stepTasks: {
          where: {
            ...(projectId ? { approval: { projectId } } : {}),
          },
        },
      },
    });

    const agentWorkloads = agents
      .map(agent => ({
        agentName: agent.profile?.displayName || agent.name,
        activeTasks: agent.stepTasks.filter(t =>
          ['pending', 'in_progress'].includes(t.status)
        ).length,
        completedTasks: agent.stepTasks.filter(t => t.status === 'completed')
          .length,
      }))
      .filter(w => w.activeTasks > 0 || w.completedTasks > 0);

    return {
      totalTasks,
      assignedTasks,
      completedTasks,
      blockedTasks,
      agentWorkloads,
    };
  }
}
