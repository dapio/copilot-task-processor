/**
 * Workflow Monitoring Module
 * Handles workflow execution monitoring and metrics
 */

import { WorkflowExecution, WorkflowStats, EventType } from './types';

/**
 * Execution status enum
 */
export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Workflow execution event
 */
export interface WorkflowExecutionEvent {
  id: string;
  runId: string;
  type: EventType;
  message: string;
  details?: any;
  timestamp: Date;
  level: EventLevel;
}

/**
 * Extended workflow execution with run metadata
 */
export interface ExtendedWorkflowExecution extends WorkflowExecution {
  runId: string;
  templateId: string;
  steps?: any[];
}

/**
 * Workflow execution monitor
 */
export class WorkflowMonitor {
  private executionMetrics = new Map<string, ExecutionMetrics>();
  private activeExecutions = new Map<string, ExtendedWorkflowExecution>();
  private events: WorkflowExecutionEvent[] = [];
  private maxEventHistory = 10000;

  /**
   * Start monitoring workflow execution
   */
  startMonitoring(execution: ExtendedWorkflowExecution): void {
    this.activeExecutions.set(execution.runId, execution);

    const metrics: ExecutionMetrics = {
      runId: execution.runId,
      startTime: new Date(),
      endTime: null,
      duration: 0,
      stepCount: execution.steps?.length || 0,
      completedSteps: 0,
      failedSteps: 0,
      retryCount: 0,
      status: ExecutionStatus.RUNNING,
      memoryUsage: this.getCurrentMemoryUsage(),
      events: [],
    };

    this.executionMetrics.set(execution.runId, metrics);
    this.recordEvent(
      execution.runId,
      EventType.STARTED,
      'Workflow execution started',
      {
        templateId: execution.templateId,
        stepCount: metrics.stepCount,
      }
    );
  }

  /**
   * Update execution status
   */
  updateExecution(runId: string, status: ExecutionStatus, details?: any): void {
    const execution = this.activeExecutions.get(runId);
    const metrics = this.executionMetrics.get(runId);

    if (!execution || !metrics) {
      return;
    }

    // Note: Cannot directly set status due to type mismatch, would need proper mapping
    metrics.status = status;

    if (
      status === ExecutionStatus.COMPLETED ||
      status === ExecutionStatus.FAILED
    ) {
      metrics.endTime = new Date();
      metrics.duration =
        metrics.endTime.getTime() - metrics.startTime.getTime();
      this.activeExecutions.delete(runId);
    }

    this.recordEvent(
      runId,
      EventType.STEP_COMPLETED,
      `Status changed to ${status}`,
      details
    );
  }

  /**
   * Record step completion
   */
  recordStepCompletion(
    runId: string,
    stepId: string,
    success: boolean,
    duration: number
  ): void {
    const metrics = this.executionMetrics.get(runId);
    if (!metrics) return;

    if (success) {
      metrics.completedSteps++;
      this.recordEvent(
        runId,
        EventType.STEP_COMPLETED,
        `Step ${stepId} completed`,
        {
          stepId,
          duration,
        }
      );
    } else {
      metrics.failedSteps++;
      this.recordEvent(runId, EventType.STEP_FAILED, `Step ${stepId} failed`, {
        stepId,
        duration,
      });
    }

    metrics.memoryUsage = this.getCurrentMemoryUsage();
  }

  /**
   * Record step retry
   */
  recordStepRetry(
    runId: string,
    stepId: string,
    retryCount: number,
    error: string
  ): void {
    const metrics = this.executionMetrics.get(runId);
    if (!metrics) return;

    metrics.retryCount++;
    this.recordEvent(
      runId,
      EventType.STEP_STARTED,
      `Step ${stepId} retry ${retryCount}`,
      {
        stepId,
        retryCount,
        error,
      }
    );
  }

  /**
   * Record workflow event
   */
  recordEvent(
    runId: string,
    type: EventType,
    message: string,
    details?: any
  ): void {
    const event: WorkflowExecutionEvent = {
      id: this.generateEventId(),
      runId,
      type,
      message,
      details,
      timestamp: new Date(),
      level: this.getEventLevel(type),
    };

    this.events.push(event);

    const metrics = this.executionMetrics.get(runId);
    if (metrics) {
      metrics.events.push(event);
    }

    // Keep event history within limits
    if (this.events.length > this.maxEventHistory) {
      this.events = this.events.slice(-this.maxEventHistory);
    }
  }

  /**
   * Get execution metrics
   */
  getExecutionMetrics(runId: string): ExecutionMetrics | null {
    return this.executionMetrics.get(runId) || null;
  }

  /**
   * Get all execution metrics
   */
  getAllExecutionMetrics(): ExecutionMetrics[] {
    return Array.from(this.executionMetrics.values());
  }

  /**
   * Get active executions
   */
  getActiveExecutions(): ExtendedWorkflowExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Get execution events
   */
  getExecutionEvents(runId: string, limit?: number): WorkflowExecutionEvent[] {
    const allEvents = this.events.filter(e => e.runId === runId);
    return limit ? allEvents.slice(-limit) : allEvents;
  }

  /**
   * Get all events with filtering
   */
  getEvents(filter?: EventFilter): WorkflowExecutionEvent[] {
    let filteredEvents = [...this.events];

    if (filter) {
      if (filter.runId) {
        filteredEvents = filteredEvents.filter(e => e.runId === filter.runId);
      }

      if (filter.type) {
        filteredEvents = filteredEvents.filter(e => e.type === filter.type);
      }

      if (filter.level) {
        filteredEvents = filteredEvents.filter(e => e.level === filter.level);
      }

      if (filter.since) {
        filteredEvents = filteredEvents.filter(
          e => e.timestamp >= filter.since!
        );
      }

      if (filter.until) {
        filteredEvents = filteredEvents.filter(
          e => e.timestamp <= filter.until!
        );
      }
    }

    return filter?.limit ? filteredEvents.slice(-filter.limit) : filteredEvents;
  }

  /**
   * Get workflow statistics
   */
  getWorkflowStats(): WorkflowStats {
    const allMetrics = this.getAllExecutionMetrics();

    const totalRuns = allMetrics.length;
    const runningWorkflows = this.activeExecutions.size;
    const completedRuns = allMetrics.filter(
      m => m.status === ExecutionStatus.COMPLETED
    ).length;
    const failedRuns = allMetrics.filter(
      m => m.status === ExecutionStatus.FAILED
    ).length;

    const completedMetrics = allMetrics.filter(m => m.endTime !== null);
    const avgExecutionTime =
      completedMetrics.length > 0
        ? completedMetrics.reduce((sum, m) => sum + m.duration, 0) /
          completedMetrics.length
        : 0;

    // Status distribution
    const statusDistribution: Record<string, number> = {};
    allMetrics.forEach(m => {
      const status = m.status.toString();
      statusDistribution[status] = (statusDistribution[status] || 0) + 1;
    });

    // Recent activity from last 10 events
    const recentActivity = this.events.slice(-10).map(event => ({
      id: event.id,
      type: event.type,
      workflowId: event.runId,
      workflowName: `Workflow ${event.runId}`,
      status: 'info' as any,
      message: event.message,
      timestamp: event.timestamp,
    }));

    return {
      totalTemplates: 1, // We don't track templates in monitor
      activeTemplates: 1,
      totalRuns,
      runningWorkflows,
      completedRuns,
      failedRuns,
      avgExecutionTime,
      statusDistribution,
      categoryDistribution: {},
      recentActivity,
    };
  }

  /**
   * Clear old metrics and events
   */
  cleanup(olderThanMs: number = 24 * 60 * 60 * 1000): void {
    const cutoffTime = new Date(Date.now() - olderThanMs);

    // Remove old metrics
    Array.from(this.executionMetrics.entries()).forEach(([runId, metrics]) => {
      if (metrics.startTime < cutoffTime && metrics.endTime) {
        this.executionMetrics.delete(runId);
      }
    });

    // Remove old events
    this.events = this.events.filter(event => event.timestamp >= cutoffTime);
  }

  /**
   * Export metrics to JSON
   */
  exportMetrics(): ExecutionMetricsExport {
    return {
      timestamp: new Date(),
      executionMetrics: this.getAllExecutionMetrics(),
      workflowStats: this.getWorkflowStats(),
      recentEvents: this.getEvents({ limit: 1000 }),
    };
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get event level based on type
   */
  private getEventLevel(type: EventType): EventLevel {
    switch (type) {
      case EventType.STARTED:
      case EventType.COMPLETED:
      case EventType.STEP_COMPLETED:
      case EventType.STEP_STARTED:
        return EventLevel.INFO;

      case EventType.PAUSED:
      case EventType.RESUMED:
        return EventLevel.WARN;

      case EventType.FAILED:
      case EventType.STEP_FAILED:
      case EventType.CANCELLED:
        return EventLevel.ERROR;

      default:
        return EventLevel.INFO;
    }
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): MemoryUsage {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
        rss: usage.rss,
      };
    }

    return {
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      rss: 0,
    };
  }
}

/**
 * Execution metrics interface
 */
export interface ExecutionMetrics {
  runId: string;
  startTime: Date;
  endTime: Date | null;
  duration: number;
  stepCount: number;
  completedSteps: number;
  failedSteps: number;
  retryCount: number;
  status: ExecutionStatus;
  memoryUsage: MemoryUsage;
  events: WorkflowExecutionEvent[];
}

/**
 * Memory usage interface
 */
export interface MemoryUsage {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

/**
 * Event filter interface
 */
export interface EventFilter {
  runId?: string;
  type?: EventType;
  level?: EventLevel;
  since?: Date;
  until?: Date;
  limit?: number;
}

/**
 * Event level enum
 */
export enum EventLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Metrics export interface
 */
export interface ExecutionMetricsExport {
  timestamp: Date;
  executionMetrics: ExecutionMetrics[];
  workflowStats: WorkflowStats;
  recentEvents: WorkflowExecutionEvent[];
}

/**
 * Real-time monitoring class
 */
export class RealTimeMonitor {
  private monitor: WorkflowMonitor;
  private subscribers = new Map<string, EventSubscriber[]>();
  private globalSubscribers: EventSubscriber[] = [];

  constructor(monitor: WorkflowMonitor) {
    this.monitor = monitor;
  }

  /**
   * Subscribe to workflow events
   */
  subscribe(runId: string, subscriber: EventSubscriber): string {
    const id = this.generateSubscriptionId();

    if (!this.subscribers.has(runId)) {
      this.subscribers.set(runId, []);
    }

    this.subscribers.get(runId)!.push({ ...subscriber, id });
    return id;
  }

  /**
   * Subscribe to all workflow events
   */
  subscribeGlobal(subscriber: EventSubscriber): string {
    const id = this.generateSubscriptionId();
    this.globalSubscribers.push({ ...subscriber, id });
    return id;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): boolean {
    // Remove from global subscribers
    const globalIndex = this.globalSubscribers.findIndex(
      s => s.id === subscriptionId
    );
    if (globalIndex !== -1) {
      this.globalSubscribers.splice(globalIndex, 1);
      return true;
    }

    // Remove from runId subscribers
    for (const [runId, subscribers] of Array.from(this.subscribers.entries())) {
      const index = subscribers.findIndex(s => s.id === subscriptionId);
      if (index !== -1) {
        subscribers.splice(index, 1);
        if (subscribers.length === 0) {
          this.subscribers.delete(runId);
        }
        return true;
      }
    }

    return false;
  }

  /**
   * Notify subscribers of new event
   */
  notifyEvent(event: WorkflowExecutionEvent): void {
    // Notify global subscribers
    for (const subscriber of this.globalSubscribers) {
      try {
        if (this.shouldNotify(subscriber, event)) {
          subscriber.onEvent(event);
        }
      } catch (error) {
        console.error('Error notifying global subscriber:', error);
      }
    }

    // Notify runId specific subscribers
    const runIdSubscribers = this.subscribers.get(event.runId);
    if (runIdSubscribers) {
      for (const subscriber of runIdSubscribers) {
        try {
          if (this.shouldNotify(subscriber, event)) {
            subscriber.onEvent(event);
          }
        } catch (error) {
          console.error('Error notifying runId subscriber:', error);
        }
      }
    }
  }

  /**
   * Check if subscriber should be notified
   */
  private shouldNotify(
    subscriber: EventSubscriber,
    event: WorkflowExecutionEvent
  ): boolean {
    if (subscriber.eventTypes && !subscriber.eventTypes.includes(event.type)) {
      return false;
    }

    if (
      subscriber.eventLevels &&
      !subscriber.eventLevels.includes(event.level)
    ) {
      return false;
    }

    return true;
  }

  /**
   * Generate subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Event subscriber interface
 */
export interface EventSubscriber {
  id?: string;
  onEvent: (event: WorkflowExecutionEvent) => void;
  eventTypes?: EventType[];
  eventLevels?: EventLevel[];
}

// Create default monitor instance
export const defaultMonitor = new WorkflowMonitor();
export const defaultRealTimeMonitor = new RealTimeMonitor(defaultMonitor);
