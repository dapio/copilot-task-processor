/**
 * Workflow Handler Registry
 * Manages workflow step handlers and execution
 */

import { WorkflowExecutionContext, ValidationResult } from './types';
import { HandlerNotFoundError } from './errors';

/**
 * Handler execution result
 */
export interface HandlerResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Step execution result with timing
 */
export interface StepExecutionResult {
  success: boolean;
  stepId: string;
  output: any;
  error?: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  retryCount: number;
}

/**
 * Handler registration error
 */
export class HandlerRegistrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HandlerRegistrationError';
  }
}

/**
 * Base handler interface
 */
export interface BaseHandler {
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  readonly timeout?: number;
  readonly retries?: number;
  readonly tags?: string[];
  validate?(input: any): ValidationResult;
  execute(
    input: any,
    context: WorkflowExecutionContext
  ): Promise<HandlerResult>;
}

/**
 * Handler registry service
 */
export class HandlerRegistry {
  private handlers = new Map<string, BaseHandler>();
  private aliases = new Map<string, string>();
  private middleware: HandlerMiddleware[] = [];

  /**
   * Register a workflow handler
   */
  register(handler: BaseHandler): void {
    if (this.handlers.has(handler.name)) {
      throw new HandlerRegistrationError(
        `Handler '${handler.name}' already registered`
      );
    }

    this.handlers.set(handler.name, handler);
  }

  /**
   * Register multiple handlers
   */
  registerBatch(handlers: BaseHandler[]): void {
    for (const handler of handlers) {
      this.register(handler);
    }
  }

  /**
   * Unregister a handler
   */
  unregister(name: string): boolean {
    // Remove aliases that point to this handler
    Array.from(this.aliases.entries()).forEach(([alias, handlerName]) => {
      if (handlerName === name) {
        this.aliases.delete(alias);
      }
    });

    return this.handlers.delete(name);
  }

  /**
   * Get handler by name
   */
  get(name: string): BaseHandler {
    // Check aliases first
    const aliasTarget = this.aliases.get(name);
    const handlerName = aliasTarget || name;

    const handler = this.handlers.get(handlerName);
    if (!handler) {
      throw new HandlerNotFoundError(`Handler '${name}' not found`);
    }

    return handler;
  }

  /**
   * Check if handler exists
   */
  has(name: string): boolean {
    return this.handlers.has(name) || this.aliases.has(name);
  }

  /**
   * List all registered handlers
   */
  list(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Get handler information
   */
  getInfo(name: string): HandlerInfo {
    const handler = this.get(name);
    return {
      name: handler.name,
      version: handler.version,
      description: handler.description,
      timeout: handler.timeout,
      retries: handler.retries,
      tags: handler.tags || [],
      hasValidator: typeof handler.validate === 'function',
    };
  }

  /**
   * List handlers with metadata
   */
  listWithInfo(): HandlerInfo[] {
    return this.list().map(name => this.getInfo(name));
  }

  /**
   * Search handlers by tags
   */
  findByTags(tags: string[]): HandlerInfo[] {
    return this.listWithInfo().filter(info =>
      tags.some(tag => info.tags.includes(tag))
    );
  }

  /**
   * Add alias for handler
   */
  addAlias(alias: string, handlerName: string): void {
    if (!this.handlers.has(handlerName)) {
      throw new HandlerNotFoundError(
        `Cannot create alias: handler '${handlerName}' not found`
      );
    }

    if (this.handlers.has(alias)) {
      throw new HandlerRegistrationError(
        `Alias '${alias}' conflicts with existing handler`
      );
    }

    this.aliases.set(alias, handlerName);
  }

  /**
   * Remove alias
   */
  removeAlias(alias: string): boolean {
    return this.aliases.delete(alias);
  }

  /**
   * Add middleware
   */
  addMiddleware(middleware: HandlerMiddleware): void {
    this.middleware.push(middleware);
  }

  /**
   * Execute handler with middleware chain
   */
  async executeHandler(
    handlerName: string,
    input: any,
    context: WorkflowExecutionContext
  ): Promise<StepExecutionResult> {
    const handler = this.get(handlerName);

    // Validate input if handler has validator
    if (handler.validate) {
      const validation = handler.validate(input);
      if (!validation.success) {
        return {
          success: false,
          stepId: context.stepId || 'unknown',
          output: null,
          error: `Validation failed: ${validation.errors.join(', ')}`,
          startTime: new Date(),
          endTime: new Date(),
          duration: 0,
          retryCount: 0,
        };
      }
    }

    // Create execution chain
    let executionFn = async () => handler.execute(input, context);

    // Apply middleware in reverse order
    for (let i = this.middleware.length - 1; i >= 0; i--) {
      const middleware = this.middleware[i];
      const nextFn = executionFn;
      executionFn = async () => middleware.execute(input, context, nextFn);
    }

    const startTime = new Date();

    try {
      const result = await executionFn();
      const endTime = new Date();

      return {
        success: result.success,
        stepId: context.stepId || 'unknown',
        output: result.data,
        error: result.error,
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        retryCount: 0,
      };
    } catch (error) {
      const endTime = new Date();

      return {
        success: false,
        stepId: context.stepId || 'unknown',
        output: null,
        error: error instanceof Error ? error.message : String(error),
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        retryCount: 0,
      };
    }
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers.clear();
    this.aliases.clear();
  }

  /**
   * Get registry statistics
   */
  getStats(): RegistryStats {
    const handlersByTag = new Map<string, number>();

    Array.from(this.handlers.values()).forEach(handler => {
      if (handler.tags) {
        for (const tag of handler.tags) {
          handlersByTag.set(tag, (handlersByTag.get(tag) || 0) + 1);
        }
      }
    });

    return {
      totalHandlers: this.handlers.size,
      totalAliases: this.aliases.size,
      totalMiddleware: this.middleware.length,
      handlersByTag: Object.fromEntries(handlersByTag),
    };
  }
}

/**
 * Handler middleware interface
 */
export interface HandlerMiddleware {
  name: string;
  execute(
    input: any,
    context: WorkflowExecutionContext,
    next: () => Promise<HandlerResult>
  ): Promise<HandlerResult>;
}

/**
 * Handler information
 */
export interface HandlerInfo {
  name: string;
  version: string;
  description?: string;
  timeout?: number;
  retries?: number;
  tags: string[];
  hasValidator: boolean;
}

/**
 * Registry statistics
 */
export interface RegistryStats {
  totalHandlers: number;
  totalAliases: number;
  totalMiddleware: number;
  handlersByTag: Record<string, number>;
}

/**
 * Built-in logging middleware
 */
export class LoggingMiddleware implements HandlerMiddleware {
  name = 'logging';

  async execute(
    input: any,
    context: WorkflowExecutionContext,
    next: () => Promise<HandlerResult>
  ): Promise<HandlerResult> {
    const startTime = Date.now();

    context.logger?.info('Handler execution started', {
      stepId: context.stepId,
      handlerName: context.stepId,
      input: typeof input === 'object' ? JSON.stringify(input) : input,
    });

    try {
      const result = await next();
      const duration = Date.now() - startTime;

      context.logger?.info('Handler execution completed', {
        stepId: context.stepId,
        success: result.success,
        duration,
        hasError: !!result.error,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      context.logger?.error('Handler execution failed', {
        stepId: context.stepId,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });

      throw error;
    }
  }
}

/**
 * Built-in metrics middleware
 */
export class MetricsMiddleware implements HandlerMiddleware {
  name = 'metrics';
  private metrics = new Map<string, HandlerMetrics>();

  async execute(
    input: any,
    context: WorkflowExecutionContext,
    next: () => Promise<HandlerResult>
  ): Promise<HandlerResult> {
    const handlerName = context.stepId || 'unknown';
    const startTime = Date.now();

    try {
      const result = await next();
      const duration = Date.now() - startTime;

      this.recordMetric(handlerName, duration, result.success);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordMetric(handlerName, duration, false);
      throw error;
    }
  }

  private recordMetric(
    handlerName: string,
    duration: number,
    success: boolean
  ): void {
    const existing = this.metrics.get(handlerName) || {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      totalDuration: 0,
      averageDuration: 0,
      minDuration: Number.MAX_SAFE_INTEGER,
      maxDuration: 0,
    };

    existing.totalExecutions++;
    if (success) {
      existing.successfulExecutions++;
    } else {
      existing.failedExecutions++;
    }

    existing.totalDuration += duration;
    existing.averageDuration =
      existing.totalDuration / existing.totalExecutions;
    existing.minDuration = Math.min(existing.minDuration, duration);
    existing.maxDuration = Math.max(existing.maxDuration, duration);

    this.metrics.set(handlerName, existing);
  }

  getMetrics(
    handlerName?: string
  ): Record<string, HandlerMetrics> | HandlerMetrics | null {
    if (handlerName) {
      return this.metrics.get(handlerName) || null;
    }

    return Object.fromEntries(this.metrics.entries());
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}

/**
 * Handler execution metrics
 */
export interface HandlerMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
}

// Create default registry instance
export const defaultRegistry = new HandlerRegistry();

// Add default middleware
defaultRegistry.addMiddleware(new LoggingMiddleware());
defaultRegistry.addMiddleware(new MetricsMiddleware());
