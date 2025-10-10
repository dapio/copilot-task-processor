/**
 * Task Currentness Validation Service
 *
 * Handles checking if existing tasks are still current when workflow step starts.
 * Validates tasks against step configuration, project files, and requirements.
 * Updates or recreates tasks as needed.
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface TaskValidationContext {
  projectId: string;
  stepId: string;
  stepName: string;
  agentType: string;
  uploadedFiles: string[];
  stepConfiguration: any;
  projectFiles: string[];
  requirements: string[];
}

export interface TaskCurrentnessResult {
  isCurrentTasksValid: boolean;
  tasksToUpdate: string[];
  tasksToRecreate: string[];
  tasksToCreate: string[];
  validationReport: {
    totalExistingTasks: number;
    validTasks: number;
    outdatedTasks: number;
    missingTasks: number;
    reasons: string[];
  };
}

export class TaskCurrentnessService {
  /**
   * Main entry point - validates and updates tasks for a workflow step
   */
  async validateAndUpdateStepTasks(
    approvalId: string,
    context: TaskValidationContext
  ): Promise<TaskCurrentnessResult> {
    try {
      console.log(
        `🔍 Validating task currentness for step: ${context.stepName}`
      );

      // Get existing tasks for this step
      const existingTasks = await this.getExistingStepTasks(approvalId);

      // Generate expected tasks based on current context
      const expectedTasks = await this.generateExpectedTasks(context);

      // Compare existing vs expected tasks
      const validationResult = await this.compareTaskSets(
        existingTasks,
        expectedTasks,
        context
      );

      // Update/recreate tasks as needed
      await this.updateTasksBasedOnValidation(
        approvalId,
        validationResult,
        context
      );

      console.log(`✅ Task validation completed:`, {
        valid: validationResult.validationReport.validTasks,
        outdated: validationResult.validationReport.outdatedTasks,
        missing: validationResult.validationReport.missingTasks,
      });

      return validationResult;
    } catch (error) {
      console.error('❌ Error validating task currentness:', error);
      throw new Error(
        `Task validation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Get existing tasks for the workflow step
   */
  private async getExistingStepTasks(approvalId: string) {
    return await prisma.workflowStepTask.findMany({
      where: { approvalId },
      include: {
        agent: {
          include: { profile: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Generate expected tasks based on current step context
   */
  private async generateExpectedTasks(context: TaskValidationContext) {
    const taskTemplates = this.getTaskTemplatesForAgent(
      context.agentType,
      context
    );

    return taskTemplates.map(template => ({
      ...template,
      contextHash: this.generateContextHash(context, template),
      expectedForFiles: context.uploadedFiles,
      expectedForRequirements: context.requirements,
    }));
  }

  /**
   * Get task templates based on agent type and context
   */
  private getTaskTemplatesForAgent(
    agentType: string,
    context: TaskValidationContext
  ) {
    const baseTemplates = {
      'business-analyst': [
        {
          title: 'Analiza wymagań biznesowych',
          description: 'Szczegółowa analiza wymagań biznesowych i procesów',
          type: 'analysis',
          priority: 'high',
          estimatedTime: 180, // 3 hours
          requiredSkills: ['business-analysis', 'requirements-gathering'],
          deliverables: ['business-requirements-doc', 'process-flow-diagram'],
        },
        {
          title: 'Weryfikacja zgodności z celami biznesowymi',
          description: 'Sprawdzenie czy rozwiązanie spełnia cele biznesowe',
          type: 'review',
          priority: 'medium',
          estimatedTime: 120, // 2 hours
          requiredSkills: ['business-analysis', 'stakeholder-management'],
          deliverables: ['compliance-report', 'recommendations'],
        },
      ],
      'system-architect': [
        {
          title: 'Projekt architektury systemu',
          description: 'Zaprojektowanie architektury technicznej systemu',
          type: 'generation',
          priority: 'critical',
          estimatedTime: 300, // 5 hours
          requiredSkills: ['system-architecture', 'technical-design'],
          deliverables: ['architecture-diagram', 'technical-specifications'],
        },
        {
          title: 'Analiza wydajności i skalowalności',
          description: 'Ocena wydajności i możliwości skalowania',
          type: 'analysis',
          priority: 'high',
          estimatedTime: 150, // 2.5 hours
          requiredSkills: ['performance-analysis', 'scalability-planning'],
          deliverables: ['performance-analysis', 'scaling-recommendations'],
        },
      ],
      'backend-developer': [
        {
          title: 'Implementacja logiki biznesowej',
          description: 'Rozwój backendu i API zgodnie z wymaganiami',
          type: 'generation',
          priority: 'high',
          estimatedTime: 480, // 8 hours
          requiredSkills: ['backend-development', 'api-design'],
          deliverables: ['backend-code', 'api-documentation'],
        },
        {
          title: 'Implementacja testów jednostkowych',
          description: 'Tworzenie comprehensive test coverage',
          type: 'generation',
          priority: 'medium',
          estimatedTime: 240, // 4 hours
          requiredSkills: ['unit-testing', 'test-automation'],
          deliverables: ['unit-tests', 'test-coverage-report'],
        },
      ],
    };

    const templates =
      baseTemplates[agentType as keyof typeof baseTemplates] || [];

    // Adapt templates based on context
    return templates.map(template => ({
      ...template,
      description: this.adaptDescriptionToContext(
        template.description,
        context
      ),
      estimatedTime: this.adjustEstimatedTime(template.estimatedTime, context),
      fileDependent: context.uploadedFiles.length > 0,
    }));
  }

  /**
   * Adapt task description based on uploaded files and context
   */
  private adaptDescriptionToContext(
    baseDescription: string,
    context: TaskValidationContext
  ): string {
    if (context.uploadedFiles.length > 0) {
      return `${baseDescription} na podstawie ${
        context.uploadedFiles.length
      } przesłanych dokumentów: ${context.uploadedFiles.join(', ')}`;
    }
    return baseDescription;
  }

  /**
   * Adjust estimated time based on context complexity
   */
  private adjustEstimatedTime(
    baseTime: number,
    context: TaskValidationContext
  ): number {
    let adjustedTime = baseTime;

    // Add time for each uploaded file
    adjustedTime += context.uploadedFiles.length * 30; // 30 min per file

    // Add time for additional requirements
    adjustedTime += context.requirements.length * 15; // 15 min per requirement

    return adjustedTime;
  }

  /**
   * Generate hash for task context to detect changes
   */
  private generateContextHash(
    context: TaskValidationContext,
    template: any
  ): string {
    const contextData = {
      stepId: context.stepId,
      agentType: context.agentType,
      uploadedFiles: context.uploadedFiles.sort(),
      requirements: context.requirements.sort(),
      template: template.title,
      stepConfiguration: context.stepConfiguration,
    };

    return crypto
      .createHash('md5')
      .update(JSON.stringify(contextData))
      .digest('hex');
  }

  /**
   * Compare existing tasks with expected tasks
   */
  private async compareTaskSets(
    existingTasks: any[],
    expectedTasks: any[],
    context: TaskValidationContext
  ): Promise<TaskCurrentnessResult> {
    const validationReport = {
      totalExistingTasks: existingTasks.length,
      validTasks: 0,
      outdatedTasks: 0,
      missingTasks: 0,
      reasons: [] as string[],
    };

    const tasksToUpdate: string[] = [];
    const tasksToRecreate: string[] = [];
    const tasksToCreate: string[] = [];

    // Check each expected task
    for (const expectedTask of expectedTasks) {
      const matchingExistingTask = existingTasks.find(
        task =>
          task.title === expectedTask.title ||
          this.isTaskSimilar(task, expectedTask)
      );

      if (!matchingExistingTask) {
        // Task is missing - needs to be created
        tasksToCreate.push(expectedTask.title);
        validationReport.missingTasks++;
        validationReport.reasons.push(`Missing task: ${expectedTask.title}`);
      } else {
        // Task exists - check if it's current
        const isTaskCurrent = await this.isTaskCurrent(
          matchingExistingTask,
          expectedTask,
          context
        );

        if (isTaskCurrent) {
          validationReport.validTasks++;
        } else {
          // Task is outdated
          if (this.canUpdateTask(matchingExistingTask)) {
            tasksToUpdate.push(matchingExistingTask.id);
          } else {
            tasksToRecreate.push(matchingExistingTask.id);
          }
          validationReport.outdatedTasks++;
          validationReport.reasons.push(
            `Outdated task: ${matchingExistingTask.title}`
          );
        }
      }
    }

    // Check for obsolete existing tasks
    for (const existingTask of existingTasks) {
      const hasMatchingExpected = expectedTasks.some(
        expected =>
          expected.title === existingTask.title ||
          this.isTaskSimilar(existingTask, expected)
      );

      if (!hasMatchingExpected) {
        tasksToRecreate.push(existingTask.id);
        validationReport.reasons.push(`Obsolete task: ${existingTask.title}`);
      }
    }

    return {
      isCurrentTasksValid:
        validationReport.outdatedTasks === 0 &&
        validationReport.missingTasks === 0,
      tasksToUpdate,
      tasksToRecreate,
      tasksToCreate,
      validationReport,
    };
  }

  /**
   * Check if task is similar to expected task
   */
  private isTaskSimilar(existingTask: any, expectedTask: any): boolean {
    // Simple similarity check based on task type and key characteristics
    return (
      existingTask.type === expectedTask.type &&
      existingTask.priority === expectedTask.priority &&
      this.calculateStringSimilarity(existingTask.title, expectedTask.title) >
        0.7
    );
  }

  /**
   * Calculate string similarity (simple approach)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Check if existing task is still current
   */
  private async isTaskCurrent(
    existingTask: any,
    expectedTask: any,
    context: TaskValidationContext
  ): Promise<boolean> {
    // Check if task context has changed
    const expectedHash = this.generateContextHash(context, expectedTask);
    const existingHash = existingTask.metadata?.contextHash;

    if (existingHash !== expectedHash) {
      return false;
    }

    // Check if files have changed
    const expectedFiles = context.uploadedFiles.sort();
    const existingFiles = (
      existingTask.metadata?.expectedForFiles || []
    ).sort();

    if (JSON.stringify(expectedFiles) !== JSON.stringify(existingFiles)) {
      return false;
    }

    // Check if requirements have changed
    const expectedReqs = context.requirements.sort();
    const existingReqs = (
      existingTask.metadata?.expectedForRequirements || []
    ).sort();

    if (JSON.stringify(expectedReqs) !== JSON.stringify(existingReqs)) {
      return false;
    }

    // Task is current
    return true;
  }

  /**
   * Check if task can be updated (vs needs recreation)
   */
  private canUpdateTask(task: any): boolean {
    // Don't update tasks that are in progress or completed
    return task.status === 'pending' || task.status === 'blocked';
  }

  /**
   * Update tasks based on validation results
   */
  private async updateTasksBasedOnValidation(
    approvalId: string,
    validation: TaskCurrentnessResult,
    context: TaskValidationContext
  ): Promise<void> {
    // Update existing tasks that can be updated
    for (const taskId of validation.tasksToUpdate) {
      await this.updateExistingTask(taskId, context);
    }

    // Recreate tasks that need recreation
    for (const taskId of validation.tasksToRecreate) {
      await this.recreateTask(taskId, approvalId, context);
    }

    // Create missing tasks
    for (const taskTitle of validation.tasksToCreate) {
      await this.createMissingTask(taskTitle, approvalId, context);
    }
  }

  /**
   * Update existing task with new context
   */
  private async updateExistingTask(
    taskId: string,
    context: TaskValidationContext
  ): Promise<void> {
    const expectedTasks = await this.generateExpectedTasks(context);
    const existingTask = await prisma.workflowStepTask.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) return;

    const expectedTask = expectedTasks.find(
      t => t.title === existingTask.title || this.isTaskSimilar(existingTask, t)
    );

    if (!expectedTask) return;

    await prisma.workflowStepTask.update({
      where: { id: taskId },
      data: {
        description: expectedTask.description,
        estimatedTime: expectedTask.estimatedTime,
        metadata: {
          ...((existingTask.metadata as object) || {}),
          contextHash: expectedTask.contextHash,
          expectedForFiles: expectedTask.expectedForFiles,
          expectedForRequirements: expectedTask.expectedForRequirements,
          updatedAt: new Date().toISOString(),
        },
      },
    });

    console.log(`🔄 Updated task: ${existingTask.title}`);
  }

  /**
   * Recreate task with new configuration
   */
  private async recreateTask(
    taskId: string,
    approvalId: string,
    context: TaskValidationContext
  ): Promise<void> {
    const existingTask = await prisma.workflowStepTask.findUnique({
      where: { id: taskId },
    });
    if (!existingTask) return;

    // Delete old task
    await prisma.workflowStepTask.delete({ where: { id: taskId } });

    // Create new task
    await this.createMissingTask(existingTask.title, approvalId, context);

    console.log(`🔄 Recreated task: ${existingTask.title}`);
  }

  /**
   * Create missing task
   */
  private async createMissingTask(
    taskTitle: string,
    approvalId: string,
    context: TaskValidationContext
  ): Promise<void> {
    const expectedTasks = await this.generateExpectedTasks(context);
    const taskTemplate = expectedTasks.find(t => t.title === taskTitle);

    if (!taskTemplate) return;

    await prisma.workflowStepTask.create({
      data: {
        approvalId,
        title: taskTemplate.title,
        description: taskTemplate.description,
        type: taskTemplate.type,
        priority: taskTemplate.priority,
        estimatedTime: taskTemplate.estimatedTime,
        requirements: taskTemplate.deliverables || [],
        metadata: {
          contextHash: taskTemplate.contextHash,
          expectedForFiles: taskTemplate.expectedForFiles,
          expectedForRequirements: taskTemplate.expectedForRequirements,
          requiredSkills: taskTemplate.requiredSkills,
          deliverables: taskTemplate.deliverables,
          createdByValidation: true,
          createdAt: new Date().toISOString(),
        },
      },
    });

    console.log(`✨ Created new task: ${taskTemplate.title}`);
  }
}
