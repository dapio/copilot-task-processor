/**
 * Workflow Engine Mappers
 * Handles mapping between Prisma models and workflow types
 */

import { WorkflowTemplate, WorkflowExecution } from './types';

/**
 * Map Prisma WorkflowTemplate to WorkflowTemplate type
 */
export function mapPrismaToTemplate(prismaTemplate: any): WorkflowTemplate {
  return {
    id: prismaTemplate.id,
    name: prismaTemplate.name,
    description: prismaTemplate.description,
    version: prismaTemplate.version,
    type: prismaTemplate.type,
    category: prismaTemplate.category,
    variables: prismaTemplate.variables || {},
    inputSchema: prismaTemplate.inputSchema || {},
    outputSchema: prismaTemplate.outputSchema || {},
    steps:
      prismaTemplate.stepTemplates?.map((step: any) => ({
        id: step.id,
        stepId: step.stepId,
        name: step.name,
        description: step.description,
        type: step.type,
        handler: step.handler,
        conditions: step.conditions || [],
        dependencies: step.dependencies || [],
        order: step.order,
        timeout: step.timeout,
        retries: step.retries || 0,
        retryDelay: step.retryDelay || 1000,
      })) || [],
    tags: prismaTemplate.tags || [],
    timeout: prismaTemplate.timeout,
    retryPolicy: prismaTemplate.retryPolicy || {},
    conditions: prismaTemplate.conditions || [],
    metadata: prismaTemplate.metadata || {},
    active: prismaTemplate.active,
  };
}

/**
 * Map Prisma WorkflowRun to WorkflowExecution type
 */
export function mapPrismaToExecution(prismaExecution: any): WorkflowExecution {
  return {
    id: prismaExecution.id,
    workflowId: prismaExecution.workflowId,
    projectId: prismaExecution.projectId,
    status: prismaExecution.status,
    currentStep: prismaExecution.currentStep,
    currentStepId: prismaExecution.currentStepId,
    input: prismaExecution.input,
    output: prismaExecution.output,
    context: prismaExecution.context,
    variables: prismaExecution.variables,
    startTime: prismaExecution.startTime,
    endTime: prismaExecution.endTime,
    totalSteps: prismaExecution.totalSteps,
    completedSteps: prismaExecution.completedSteps,
    failedSteps: prismaExecution.failedSteps,
    skippedSteps: prismaExecution.skippedSteps,
    error: prismaExecution.error,
    errorCode: prismaExecution.errorCode,
    errorDetails: prismaExecution.errorDetails,
    priority: prismaExecution.priority || 'medium',
    executor: prismaExecution.executor,
    executorType: prismaExecution.executorType,
  };
}

/**
 * Convert WorkflowTemplate to Prisma create data
 */
export function templateToCreateData(
  template: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt'>
) {
  return {
    name: template.name,
    description: template.description,
    version: template.version,
    type: template.type,
    category: template.category || 'general',
    variables: template.variables || {},
    inputSchema: template.inputSchema || {},
    outputSchema: template.outputSchema || {},
    timeout: template.timeout,
    retryPolicy: (template.retryPolicy as any) || {},
    conditions: (template.conditions as any) || [],
    metadata: template.metadata || {},
    active: template.active ?? true,
    tags: (template.tags as any) || [],
    // Note: Steps would be created separately via stepTemplates relation
    steps: (template.steps as any) || [],
  };
}

/**
 * Convert template steps to Prisma step template create data
 */
export function stepsToCreateData(
  steps: any[] | undefined,
  templateId: string
) {
  if (!steps || steps.length === 0) {
    return [];
  }

  return steps.map(step => ({
    stepId: step.stepId,
    name: step.name,
    description: step.description,
    type: step.type,
    handler: step.handler,
    conditions: (step.conditions as any) || [],
    dependencies: step.dependencies || [],
    order: step.order,
    timeout: step.timeout,
    retries: step.retries || 0,
    retryDelay: step.retryDelay || 1000,
    templateId,
  }));
}

/**
 * Convert execution input to Prisma WorkflowRun create data
 */
export function executionToCreateData(
  templateId: string,
  input?: Record<string, any>,
  context?: Record<string, any>,
  variables?: Record<string, any>,
  totalSteps: number = 0
) {
  return {
    workflowId: templateId,
    status: 'pending',
    input: input || {},
    context: context || {},
    variables: variables || {},
    totalSteps,
  };
}

/**
 * Convert template steps to step execution create data
 */
export function stepsToExecutionData(steps: any[] | undefined, runId: string) {
  if (!steps || steps.length === 0) {
    return [];
  }

  return steps.map(step => ({
    workflowRunId: runId,
    stepTemplateId: step.id || '',
    stepId: step.stepId,
    status: 'pending',
    order: step.order,
    input: step.input || {},
    retries: 0,
  }));
}
