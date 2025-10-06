/**
 * Workflow Engine Errors
 * Custom error classes for workflow system
 */

/**
 * Base workflow engine error
 */
export class WorkflowEngineError extends Error {
  constructor(
    message: string,
    public code: string,
    public stepId?: string,
    public workflowId?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'WorkflowEngineError';
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      stepId: this.stepId,
      workflowId: this.workflowId,
      details: this.details,
      stack: this.stack,
    };
  }
}

/**
 * Workflow validation error
 */
export class WorkflowValidationError extends WorkflowEngineError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', undefined, undefined, details);
    this.name = 'WorkflowValidationError';
  }
}

/**
 * Step execution error
 */
export class StepExecutionError extends WorkflowEngineError {
  constructor(message: string, stepId: string, details?: Record<string, any>) {
    super(message, 'STEP_EXECUTION_ERROR', stepId, undefined, details);
    this.name = 'StepExecutionError';
  }
}

/**
 * Handler not found error
 */
export class HandlerNotFoundError extends WorkflowEngineError {
  constructor(handlerName: string, stepId?: string) {
    super(
      `Handler not found: ${handlerName}`,
      'HANDLER_NOT_FOUND',
      stepId,
      undefined,
      { handlerName }
    );
    this.name = 'HandlerNotFoundError';
  }
}

/**
 * Workflow timeout error
 */
export class WorkflowTimeoutError extends WorkflowEngineError {
  constructor(workflowId: string, timeoutMs: number) {
    super(
      `Workflow timed out after ${timeoutMs}ms`,
      'WORKFLOW_TIMEOUT',
      undefined,
      workflowId,
      { timeoutMs }
    );
    this.name = 'WorkflowTimeoutError';
  }
}

/**
 * Step timeout error
 */
export class StepTimeoutError extends WorkflowEngineError {
  constructor(stepId: string, timeoutMs: number) {
    super(
      `Step timed out after ${timeoutMs}ms`,
      'STEP_TIMEOUT',
      stepId,
      undefined,
      { timeoutMs }
    );
    this.name = 'StepTimeoutError';
  }
}

/**
 * Workflow not found error
 */
export class WorkflowNotFoundError extends WorkflowEngineError {
  constructor(workflowId: string) {
    super(
      `Workflow not found: ${workflowId}`,
      'WORKFLOW_NOT_FOUND',
      undefined,
      workflowId
    );
    this.name = 'WorkflowNotFoundError';
  }
}

/**
 * Workflow run not found error
 */
export class WorkflowRunNotFoundError extends WorkflowEngineError {
  constructor(runId: string) {
    super(
      `Workflow run not found: ${runId}`,
      'WORKFLOW_RUN_NOT_FOUND',
      undefined,
      undefined,
      { runId }
    );
    this.name = 'WorkflowRunNotFoundError';
  }
}

/**
 * Circular dependency error
 */
export class CircularDependencyError extends WorkflowValidationError {
  constructor(stepIds: string[]) {
    super(`Circular dependency detected in steps: ${stepIds.join(' -> ')}`, {
      stepIds,
      cycle: stepIds,
    });
    this.name = 'CircularDependencyError';
  }
}

/**
 * Invalid input schema error
 */
export class InvalidInputError extends WorkflowValidationError {
  constructor(message: string, inputPath: string, expectedType?: string) {
    super(message, { inputPath, expectedType });
    this.name = 'InvalidInputError';
  }
}

/**
 * Handler configuration error
 */
export class HandlerConfigurationError extends WorkflowEngineError {
  constructor(handlerName: string, message: string, stepId?: string) {
    super(
      `Handler configuration error for '${handlerName}': ${message}`,
      'HANDLER_CONFIG_ERROR',
      stepId,
      undefined,
      { handlerName }
    );
    this.name = 'HandlerConfigurationError';
  }
}

/**
 * Database connection error
 */
export class WorkflowDatabaseError extends WorkflowEngineError {
  constructor(operation: string, originalError: Error) {
    super(
      `Database error during ${operation}: ${originalError.message}`,
      'DATABASE_ERROR',
      undefined,
      undefined,
      { operation, originalError: originalError.message }
    );
    this.name = 'WorkflowDatabaseError';
  }
}

/**
 * Workflow state error
 */
export class WorkflowStateError extends WorkflowEngineError {
  constructor(
    runId: string,
    currentState: string,
    expectedState: string,
    action: string
  ) {
    super(
      `Cannot ${action} workflow in state '${currentState}', expected '${expectedState}'`,
      'WORKFLOW_STATE_ERROR',
      undefined,
      undefined,
      { runId, currentState, expectedState, action }
    );
    this.name = 'WorkflowStateError';
  }
}

/**
 * Permission error
 */
export class WorkflowPermissionError extends WorkflowEngineError {
  constructor(action: string, resource: string, userId?: string) {
    super(
      `Permission denied: cannot ${action} ${resource}`,
      'PERMISSION_ERROR',
      undefined,
      undefined,
      { action, resource, userId }
    );
    this.name = 'WorkflowPermissionError';
  }
}

/**
 * Resource limit error
 */
export class ResourceLimitError extends WorkflowEngineError {
  constructor(resource: string, limit: number, current: number) {
    super(
      `Resource limit exceeded: ${resource} limit is ${limit}, current usage is ${current}`,
      'RESOURCE_LIMIT_ERROR',
      undefined,
      undefined,
      { resource, limit, current }
    );
    this.name = 'ResourceLimitError';
  }
}

/**
 * Error factory for creating standardized errors
 */
export class WorkflowErrorFactory {
  static createValidationError(
    message: string,
    details?: Record<string, any>
  ): WorkflowValidationError {
    return new WorkflowValidationError(message, details);
  }

  static createStepError(
    stepId: string,
    message: string,
    details?: Record<string, any>
  ): StepExecutionError {
    return new StepExecutionError(message, stepId, details);
  }

  static createTimeoutError(
    stepId: string,
    timeoutMs: number
  ): StepTimeoutError {
    return new StepTimeoutError(stepId, timeoutMs);
  }

  static createHandlerError(
    handlerName: string,
    message: string,
    stepId?: string
  ): HandlerNotFoundError {
    if (message.includes('not found')) {
      return new HandlerNotFoundError(handlerName, stepId);
    }
    return new HandlerConfigurationError(handlerName, message, stepId);
  }

  static createDatabaseError(
    operation: string,
    error: Error
  ): WorkflowDatabaseError {
    return new WorkflowDatabaseError(operation, error);
  }

  static createStateError(
    runId: string,
    currentState: string,
    expectedState: string,
    action: string
  ): WorkflowStateError {
    return new WorkflowStateError(runId, currentState, expectedState, action);
  }

  static fromError(
    error: Error,
    context?: { stepId?: string; workflowId?: string }
  ): WorkflowEngineError {
    if (error instanceof WorkflowEngineError) {
      return error;
    }

    return new WorkflowEngineError(
      error.message,
      'UNKNOWN_ERROR',
      context?.stepId,
      context?.workflowId,
      {
        originalError: error.message,
        stack: error.stack,
        name: error.name,
      }
    );
  }
}

/**
 * Error codes enum for consistency
 */
export enum WorkflowErrorCodes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  STEP_EXECUTION_ERROR = 'STEP_EXECUTION_ERROR',
  HANDLER_NOT_FOUND = 'HANDLER_NOT_FOUND',
  WORKFLOW_TIMEOUT = 'WORKFLOW_TIMEOUT',
  STEP_TIMEOUT = 'STEP_TIMEOUT',
  WORKFLOW_NOT_FOUND = 'WORKFLOW_NOT_FOUND',
  WORKFLOW_RUN_NOT_FOUND = 'WORKFLOW_RUN_NOT_FOUND',
  HANDLER_CONFIG_ERROR = 'HANDLER_CONFIG_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  WORKFLOW_STATE_ERROR = 'WORKFLOW_STATE_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  RESOURCE_LIMIT_ERROR = 'RESOURCE_LIMIT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Utility function to check if error is retryable
 */
export function isRetryableError(error: Error): boolean {
  if (error instanceof WorkflowEngineError) {
    const nonRetryableCodes = [
      WorkflowErrorCodes.VALIDATION_ERROR,
      WorkflowErrorCodes.HANDLER_NOT_FOUND,
      WorkflowErrorCodes.WORKFLOW_NOT_FOUND,
      WorkflowErrorCodes.WORKFLOW_RUN_NOT_FOUND,
      WorkflowErrorCodes.PERMISSION_ERROR,
    ];
    return !nonRetryableCodes.includes(error.code as WorkflowErrorCodes);
  }

  // For non-workflow errors, assume they might be retryable
  return true;
}

/**
 * Utility function to get error severity level
 */
export function getErrorSeverity(
  error: Error
): 'low' | 'medium' | 'high' | 'critical' {
  if (error instanceof WorkflowEngineError) {
    switch (error.code) {
      case WorkflowErrorCodes.DATABASE_ERROR:
      case WorkflowErrorCodes.RESOURCE_LIMIT_ERROR:
        return 'critical';
      case WorkflowErrorCodes.WORKFLOW_TIMEOUT:
      case WorkflowErrorCodes.STEP_TIMEOUT:
      case WorkflowErrorCodes.PERMISSION_ERROR:
        return 'high';
      case WorkflowErrorCodes.STEP_EXECUTION_ERROR:
      case WorkflowErrorCodes.HANDLER_CONFIG_ERROR:
        return 'medium';
      default:
        return 'low';
    }
  }
  return 'medium';
}
