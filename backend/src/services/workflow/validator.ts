/**
 * Workflow Validation Module
 * Handles template and input validation
 */

import {
  WorkflowTemplate,
  WorkflowStep,
  ValidationResult,
  WorkflowCondition,
  StepType,
} from './types';

/**
 * Workflow validation service
 */
export class WorkflowValidator {
  /**
   * Validate complete workflow template
   */
  static validateTemplate(template: WorkflowTemplate): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!template.name || template.name.trim().length === 0) {
      errors.push('Template name is required');
    }

    if (!template.version || template.version.trim().length === 0) {
      errors.push('Template version is required');
    }

    if (!template.type || template.type.trim().length === 0) {
      errors.push('Template type is required');
    }

    // Steps validation
    if (!template.steps || template.steps.length === 0) {
      errors.push('Template must have at least one step');
    } else {
      const stepValidation = this.validateSteps(template.steps);
      errors.push(...stepValidation.errors);
      warnings.push(...stepValidation.warnings);
    }

    // Variables validation
    if (template.variables) {
      const variableValidation = this.validateVariables(template.variables);
      errors.push(...variableValidation.errors);
      warnings.push(...variableValidation.warnings);
    }

    // Schema validation
    if (template.inputSchema) {
      const schemaValidation = this.validateJsonSchema(
        template.inputSchema,
        'input'
      );
      errors.push(...schemaValidation.errors);
      warnings.push(...schemaValidation.warnings);
    }

    if (template.outputSchema) {
      const schemaValidation = this.validateJsonSchema(
        template.outputSchema,
        'output'
      );
      errors.push(...schemaValidation.errors);
      warnings.push(...schemaValidation.warnings);
    }

    // Timeout validation
    if (template.timeout && template.timeout <= 0) {
      errors.push('Template timeout must be positive');
    }

    // Retry policy validation
    if (template.retryPolicy) {
      const retryValidation = this.validateRetryPolicy(template.retryPolicy);
      errors.push(...retryValidation.errors);
      warnings.push(...retryValidation.warnings);
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate workflow steps
   */
  static validateSteps(steps: WorkflowStep[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const stepIds = new Set<string>();
    const stepOrders = new Set<number>();

    steps.forEach((step, index) => {
      const stepValidation = this.validateSingleStep(
        step,
        index,
        stepIds,
        stepOrders,
        steps
      );
      errors.push(...stepValidation.errors);
      warnings.push(...stepValidation.warnings);
    });

    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(steps);
    if (circularDeps.length > 0) {
      errors.push(`Circular dependencies detected: ${circularDeps.join(', ')}`);
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate single workflow step
   */
  private static validateSingleStep(
    step: WorkflowStep,
    index: number,
    stepIds: Set<string>,
    stepOrders: Set<number>,
    allSteps: WorkflowStep[]
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validations
    const basicValidation = this.validateStepBasics(step, index, stepIds);
    errors.push(...basicValidation.errors);
    warnings.push(...basicValidation.warnings);

    // Order validation
    const orderValidation = this.validateStepOrder(step, stepOrders);
    errors.push(...orderValidation.errors);
    warnings.push(...orderValidation.warnings);

    // Timing and retry validation
    const timingValidation = this.validateStepTiming(step);
    errors.push(...timingValidation.errors);
    warnings.push(...timingValidation.warnings);

    // Dependencies validation
    const depsValidation = this.validateStepDependencies(
      step,
      stepIds,
      allSteps
    );
    errors.push(...depsValidation.errors);
    warnings.push(...depsValidation.warnings);

    // Conditions validation
    if (step.conditions) {
      const conditionValidation = this.validateConditions(
        step.conditions,
        step.stepId
      );
      errors.push(...conditionValidation.errors);
      warnings.push(...conditionValidation.warnings);
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate basic step properties
   */
  private static validateStepBasics(
    step: WorkflowStep,
    index: number,
    stepIds: Set<string>
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Step ID validation
    if (!step.stepId || step.stepId.trim().length === 0) {
      errors.push(`Step ${index + 1}: stepId is required`);
    } else if (stepIds.has(step.stepId)) {
      errors.push(`Step ${index + 1}: Duplicate stepId '${step.stepId}'`);
    } else {
      stepIds.add(step.stepId);
    }

    // Name validation
    if (!step.name || step.name.trim().length === 0) {
      errors.push(`Step ${step.stepId}: name is required`);
    }

    // Handler validation
    if (!step.handler || step.handler.trim().length === 0) {
      errors.push(`Step ${step.stepId}: handler is required`);
    }

    // Type validation
    if (!Object.values(StepType).includes(step.type)) {
      errors.push(`Step ${step.stepId}: invalid step type '${step.type}'`);
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate step order
   */
  private static validateStepOrder(
    step: WorkflowStep,
    stepOrders: Set<number>
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (step.order < 0) {
      errors.push(`Step ${step.stepId}: order must be non-negative`);
    } else if (stepOrders.has(step.order)) {
      warnings.push(`Step ${step.stepId}: duplicate order ${step.order}`);
    } else {
      stepOrders.add(step.order);
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate step timing and retries
   */
  private static validateStepTiming(step: WorkflowStep): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Timeout validation
    if (step.timeout && step.timeout <= 0) {
      errors.push(`Step ${step.stepId}: timeout must be positive`);
    }

    // Retries validation
    if (step.retries && step.retries < 0) {
      errors.push(`Step ${step.stepId}: retries must be non-negative`);
    }

    // Retry delay validation
    if (step.retryDelay && step.retryDelay <= 0) {
      errors.push(`Step ${step.stepId}: retryDelay must be positive`);
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate step dependencies
   */
  private static validateStepDependencies(
    step: WorkflowStep,
    stepIds: Set<string>,
    allSteps: WorkflowStep[]
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (step.dependencies) {
      step.dependencies.forEach(depId => {
        if (!stepIds.has(depId) && !allSteps.find(s => s.stepId === depId)) {
          errors.push(`Step ${step.stepId}: dependency '${depId}' not found`);
        }
      });
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate workflow conditions
   */
  static validateConditions(
    conditions: WorkflowCondition[],
    context: string
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    conditions.forEach((condition, index) => {
      if (!condition.field || condition.field.trim().length === 0) {
        errors.push(`${context} condition ${index + 1}: field is required`);
      }

      const validOperators = [
        'equals',
        'not_equals',
        'contains',
        'greater_than',
        'less_than',
        'exists',
        'not_exists',
      ];

      if (!validOperators.includes(condition.operator)) {
        errors.push(
          `${context} condition ${index + 1}: invalid operator '${
            condition.operator
          }'`
        );
      }

      if (
        condition.value === undefined &&
        !['exists', 'not_exists'].includes(condition.operator)
      ) {
        warnings.push(`${context} condition ${index + 1}: value is undefined`);
      }

      if (
        condition.logicalOperator &&
        !['AND', 'OR'].includes(condition.logicalOperator)
      ) {
        errors.push(
          `${context} condition ${index + 1}: invalid logical operator '${
            condition.logicalOperator
          }'`
        );
      }
    });

    return {
      success: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate variables
   */
  static validateVariables(variables: Record<string, any>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    Object.entries(variables).forEach(([key, value]) => {
      if (!key || key.trim().length === 0) {
        errors.push('Variable name cannot be empty');
      }

      if (key.includes(' ') || key.includes('.') || key.includes('-')) {
        warnings.push(
          `Variable '${key}' contains special characters that may cause issues`
        );
      }

      if (typeof value === 'function') {
        errors.push(`Variable '${key}' cannot be a function`);
      }
    });

    return {
      success: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate JSON schema
   */
  static validateJsonSchema(
    schema: Record<string, any>,
    type: string
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      if (!schema.type && !schema.properties && !schema.$ref) {
        warnings.push(`${type} schema lacks type or properties definition`);
      }

      if (
        schema.type &&
        !['object', 'array', 'string', 'number', 'boolean', 'null'].includes(
          schema.type
        )
      ) {
        errors.push(`${type} schema has invalid type: ${schema.type}`);
      }

      if (schema.properties) {
        Object.entries(schema.properties).forEach(
          ([prop, propSchema]: [string, any]) => {
            if (!propSchema.type && !propSchema.$ref) {
              warnings.push(
                `${type} schema property '${prop}' lacks type definition`
              );
            }
          }
        );
      }
    } catch (error) {
      errors.push(`${type} schema is invalid JSON: ${error}`);
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate retry policy
   */
  static validateRetryPolicy(policy: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!policy.maxAttempts || policy.maxAttempts < 1) {
      errors.push('Retry policy maxAttempts must be at least 1');
    }

    if (!policy.delay || policy.delay < 0) {
      errors.push('Retry policy delay must be non-negative');
    }

    if (policy.backoffMultiplier && policy.backoffMultiplier <= 0) {
      errors.push('Retry policy backoffMultiplier must be positive');
    }

    if (policy.maxDelay && policy.maxDelay < policy.delay) {
      errors.push(
        'Retry policy maxDelay must be greater than or equal to delay'
      );
    }

    if (policy.maxAttempts > 10) {
      warnings.push(
        'Retry policy maxAttempts is very high (>10), this may cause performance issues'
      );
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Detect circular dependencies in workflow steps
   */
  static detectCircularDependencies(steps: WorkflowStep[]): string[] {
    const stepMap = new Map<string, WorkflowStep>();
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[] = [];

    // Build step map
    steps.forEach(step => {
      stepMap.set(step.stepId, step);
    });

    const dfs = (stepId: string, path: string[] = []): void => {
      if (recursionStack.has(stepId)) {
        // Found a cycle
        const cycleStart = path.indexOf(stepId);
        const cycle = path.slice(cycleStart).join(' -> ') + ' -> ' + stepId;
        cycles.push(cycle);
        return;
      }

      if (visited.has(stepId)) {
        return;
      }

      visited.add(stepId);
      recursionStack.add(stepId);
      path.push(stepId);

      const step = stepMap.get(stepId);
      if (step?.dependencies) {
        step.dependencies.forEach(depId => {
          dfs(depId, [...path]);
        });
      }

      recursionStack.delete(stepId);
      path.pop();
    };

    // Check each step for cycles
    steps.forEach(step => {
      if (!visited.has(step.stepId)) {
        dfs(step.stepId);
      }
    });

    return cycles;
  }

  /**
   * Validate workflow input against schema
   */
  static validateInput(
    input: any,
    schema: Record<string, any>
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const validation = this.validateValueAgainstSchema(input, schema, '');
      errors.push(...validation.errors);
      warnings.push(...validation.warnings);
    } catch (error) {
      errors.push(`Input validation failed: ${error}`);
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate value against JSON schema
   */
  private static validateValueAgainstSchema(
    value: any,
    schema: Record<string, any>,
    path: string
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (schema.type) {
      const expectedType = schema.type;
      const actualType = Array.isArray(value) ? 'array' : typeof value;

      if (actualType !== expectedType) {
        errors.push(
          `${path || 'root'}: expected ${expectedType}, got ${actualType}`
        );
      }
    }

    if (schema.required && Array.isArray(schema.required)) {
      schema.required.forEach((requiredField: string) => {
        if (value == null || value[requiredField] === undefined) {
          errors.push(`${path ? path + '.' : ''}${requiredField} is required`);
        }
      });
    }

    if (schema.properties && typeof value === 'object' && value !== null) {
      Object.entries(schema.properties).forEach(
        ([prop, propSchema]: [string, any]) => {
          const propPath = path ? `${path}.${prop}` : prop;
          const propValue = value[prop];

          if (propValue !== undefined) {
            const propValidation = this.validateValueAgainstSchema(
              propValue,
              propSchema,
              propPath
            );
            errors.push(...propValidation.errors);
            warnings.push(...propValidation.warnings);
          }
        }
      );
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Quick validation for step execution
   */
  static validateStepForExecution(
    step: WorkflowStep,
    availableHandlers: Set<string>
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!availableHandlers.has(step.handler)) {
      errors.push(
        `Handler '${step.handler}' is not available for step '${step.stepId}'`
      );
    }

    if (step.timeout && step.timeout < 1000) {
      warnings.push(
        `Step '${step.stepId}' has very short timeout (${step.timeout}ms)`
      );
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
    };
  }
}
