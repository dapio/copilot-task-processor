/**
 * Template Manager Module
 * Handles workflow template creation, validation and management
 * Max 500 lines - STRICT COMPLIANCE
 */
import { PrismaClient } from '@prisma/client';
import { Result } from '../../providers/ml-provider.interface';
import { WorkflowTemplate, WorkflowEngineError } from './types';
import { WorkflowValidator } from './validator';
import { mapPrismaToTemplate, templateToCreateData } from './mappers';
export class TemplateManager {
  private prisma: PrismaClient;
  private validator: WorkflowValidator;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.validator = new WorkflowValidator();
  }

  /**
   * Create and store workflow template with full validation
   */
  async createWorkflowTemplate(
    template: WorkflowTemplate
  ): Promise<Result<WorkflowTemplate, WorkflowEngineError>> {
    try {
      // Validate template structure
      const validation = WorkflowValidator.validateTemplate(template);
      if (!validation.success) {
        return {
          success: false,
          error: new WorkflowEngineError(
            'VALIDATION_ERROR',
            validation.errors.join(', ')
          ),
        };
      }

      // Create template in database
      const prismaData = templateToCreateData(template);
      const created = await this.prisma.workflowTemplate.create({
        data: prismaData,
        include: {
          stepTemplates: true,
        },
      });

      // Create step templates
      if (template.steps && template.steps.length > 0) {
        await Promise.all(
          template.steps.map((step, index) =>
            this.prisma.workflowStepTemplate.create({
              data: {
                workflowId: created.id,
                stepId: step.stepId,
                name: step.name,
                description: step.description,
                type: step.type,
                handler: step.handler,
                handlerConfig: step.handlerConfig,
                dependencies: step.dependencies as any,
                timeout: step.timeout,
                retries: step.retries || 0,
                conditions: step.conditions as any,
                order: index,
              },
            })
          )
        );
      }

      // Fetch complete template with steps
      const completeTemplate = await this.prisma.workflowTemplate.findUnique({
        where: { id: created.id },
        include: {
          stepTemplates: {
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!completeTemplate) {
        throw new Error('Failed to retrieve created template');
      }

      const result = mapPrismaToTemplate(completeTemplate);

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: new WorkflowEngineError(
          `Failed to create workflow template: ${error.message}`,
          'CREATE_TEMPLATE_ERROR'
        ),
      };
    }
  }

  /**
   * Update existing workflow template
   */
  async updateWorkflowTemplate(
    templateId: string,
    updates: Partial<WorkflowTemplate>
  ): Promise<Result<WorkflowTemplate, WorkflowEngineError>> {
    try {
      // Get existing template
      const existing = await this.prisma.workflowTemplate.findUnique({
        where: { id: templateId },
        include: {
          stepTemplates: {
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!existing) {
        return {
          success: false,
          error: new WorkflowEngineError(
            'Workflow template not found',
            'TEMPLATE_NOT_FOUND'
          ),
        };
      }

      // Merge updates with existing template
      const existingTemplate = mapPrismaToTemplate(existing);
      const mergedTemplate: WorkflowTemplate = {
        ...existingTemplate,
        ...updates,
        id: templateId, // Ensure ID is preserved
      };

      // Validate merged template
      const validation = WorkflowValidator.validateTemplate(mergedTemplate);
      if (!validation.success) {
        return {
          success: false,
          error: new WorkflowEngineError(
            'VALIDATION_ERROR',
            validation.errors.join(', ')
          ),
        };
      }

      // Update template in database
      const prismaData = templateToCreateData(mergedTemplate);
      const updated = await this.prisma.workflowTemplate.update({
        where: { id: templateId },
        data: {
          name: prismaData.name,
          description: prismaData.description,
          type: prismaData.type,
          metadata: prismaData.metadata,
          active: prismaData.active,
        },
        include: {
          stepTemplates: {
            orderBy: { order: 'asc' },
          },
        },
      });

      // Update step templates if provided
      if (updates.steps) {
        // Delete existing step templates
        await this.prisma.workflowStepTemplate.deleteMany({
          where: { workflowId: templateId },
        });

        // Create new step templates
        await Promise.all(
          updates.steps.map((step, index) =>
            this.prisma.workflowStepTemplate.create({
              data: {
                workflowId: templateId,
                stepId: step.stepId,
                name: step.name,
                description: step.description,
                type: step.type,
                handler: step.handler,
                handlerConfig: step.handlerConfig,
                dependencies: step.dependencies as any,
                timeout: step.timeout,
                retries: step.retries || 0,
                conditions: step.conditions as any,
                order: index,
              },
            })
          )
        );
      }

      // Fetch updated template with steps
      const finalTemplate = await this.prisma.workflowTemplate.findUnique({
        where: { id: templateId },
        include: {
          stepTemplates: {
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!finalTemplate) {
        throw new Error('Failed to retrieve updated template');
      }

      const result = mapPrismaToTemplate(finalTemplate);

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: new WorkflowEngineError(
          `Failed to update workflow template: ${error.message}`,
          'UPDATE_TEMPLATE_ERROR'
        ),
      };
    }
  }

  /**
   * Delete workflow template and all associated data
   */
  async deleteWorkflowTemplate(
    templateId: string
  ): Promise<Result<void, WorkflowEngineError>> {
    try {
      // Check if template has any running executions
      const runningExecutions = await this.prisma.workflowExecution.count({
        where: {
          workflowId: templateId,
          status: {
            in: ['PENDING', 'RUNNING', 'PAUSED'],
          },
        },
      });

      if (runningExecutions > 0) {
        return {
          success: false,
          error: new WorkflowEngineError(
            `Cannot delete template with ${runningExecutions} running executions`,
            'TEMPLATE_IN_USE'
          ),
        };
      }

      // Delete step templates first (due to foreign key constraints)
      await this.prisma.workflowStepTemplate.deleteMany({
        where: { workflowId: templateId },
      });

      // Delete template
      await this.prisma.workflowTemplate.delete({
        where: { id: templateId },
      });

      return {
        success: true,
        data: undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        error: new WorkflowEngineError(
          `Failed to delete workflow template: ${error.message}`,
          'DELETE_TEMPLATE_ERROR'
        ),
      };
    }
  }

  /**
   * Get workflow template by ID with full details
   */
  async getWorkflowTemplate(
    templateId: string
  ): Promise<Result<WorkflowTemplate, WorkflowEngineError>> {
    try {
      const template = await this.prisma.workflowTemplate.findUnique({
        where: { id: templateId },
        include: {
          stepTemplates: {
            where: {},
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!template) {
        return {
          success: false,
          error: new WorkflowEngineError(
            'Workflow template not found',
            'TEMPLATE_NOT_FOUND'
          ),
        };
      }

      const result = mapPrismaToTemplate(template);

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: new WorkflowEngineError(
          `Failed to get workflow template: ${error.message}`,
          'GET_TEMPLATE_ERROR'
        ),
      };
    }
  }

  /**
   * Get all workflow templates with pagination and filtering
   */
  async getWorkflowTemplates(options?: {
    limit?: number;
    offset?: number;
    active?: boolean;
    type?: string;
    search?: string;
  }): Promise<
    Result<
      { templates: WorkflowTemplate[]; total: number },
      WorkflowEngineError
    >
  > {
    try {
      const { limit = 50, offset = 0, active, type, search } = options || {};

      const where: any = {};

      if (active !== undefined) {
        where.active = active;
      }

      if (type) {
        where.type = type;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [templates, total] = await Promise.all([
        this.prisma.workflowTemplate.findMany({
          where,
          include: {
            stepTemplates: {
              where: {},
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        this.prisma.workflowTemplate.count({ where }),
      ]);

      const result = templates.map(template => mapPrismaToTemplate(template));

      return {
        success: true,
        data: { templates: result, total },
      };
    } catch (error: any) {
      return {
        success: false,
        error: new WorkflowEngineError(
          `Failed to get workflow templates: ${error.message}`,
          'GET_TEMPLATES_ERROR'
        ),
      };
    }
  }

  /**
   * Clone existing template with new name and optional modifications
   */
  async cloneWorkflowTemplate(
    templateId: string,
    newName: string,
    modifications?: Partial<WorkflowTemplate>
  ): Promise<Result<WorkflowTemplate, WorkflowEngineError>> {
    try {
      // Get source template
      const sourceResult = await this.getWorkflowTemplate(templateId);
      if (!sourceResult.success) {
        return sourceResult;
      }

      const sourceTemplate = sourceResult.data;

      // Create cloned template
      const clonedTemplate: WorkflowTemplate = {
        ...sourceTemplate,
        ...modifications,
        id: undefined, // Remove ID to create new
        name: newName,
        version: modifications?.version || `${sourceTemplate.version}-clone`,
        createdBy:
          modifications?.createdBy || `clone-of-${sourceTemplate.createdBy}`,
      };

      // Create the cloned template
      return await this.createWorkflowTemplate(clonedTemplate);
    } catch (error: any) {
      return {
        success: false,
        error: new WorkflowEngineError(
          `Failed to clone workflow template: ${error.message}`,
          'CLONE_TEMPLATE_ERROR'
        ),
      };
    }
  }

  /**
   * Validate template without creating it
   */
  async validateWorkflowTemplate(
    template: WorkflowTemplate
  ): Promise<
    Result<{ success: boolean; errors: string[] }, WorkflowEngineError>
  > {
    try {
      const validation = WorkflowValidator.validateTemplate(template);

      return {
        success: true,
        data: validation,
      };
    } catch (error: any) {
      return {
        success: false,
        error: new WorkflowEngineError(
          `Failed to validate workflow template: ${error.message}`,
          'VALIDATE_TEMPLATE_ERROR'
        ),
      };
    }
  }

  /**
   * Get template usage statistics
   */
  async getTemplateStats(
    templateId: string
  ): Promise<Result<Record<string, any>, WorkflowEngineError>> {
    try {
      const [
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        runningExecutions,
        avgDuration,
      ] = await Promise.all([
        this.prisma.workflowExecution.count({
          where: { workflowId: templateId },
        }),
        this.prisma.workflowExecution.count({
          where: { workflowId: templateId, status: 'completed' },
        }),
        this.prisma.workflowExecution.count({
          where: { workflowId: templateId, status: 'failed' },
        }),
        this.prisma.workflowExecution.count({
          where: {
            workflowId: templateId,
            status: { in: ['pending', 'running', 'paused'] },
          },
        }),
        this.prisma.workflowRun.aggregate({
          where: {
            workflowId: templateId,
            status: 'completed',
            startTime: { not: null },
            endTime: { not: null },
          },
          _avg: {
            actualDuration: true,
          },
        }),
      ]);

      const stats = {
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        runningExecutions,
        successRate:
          totalExecutions > 0
            ? (successfulExecutions / totalExecutions) * 100
            : 0,
        failureRate:
          totalExecutions > 0 ? (failedExecutions / totalExecutions) * 100 : 0,
        avgDuration: avgDuration._avg.actualDuration || 0,
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error: any) {
      return {
        success: false,
        error: new WorkflowEngineError(
          `Failed to get template stats: ${error.message}`,
          'GET_TEMPLATE_STATS_ERROR'
        ),
      };
    }
  }
}
