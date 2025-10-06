/**
 * Mock Health Monitor
 *
 * Provides health checking and statistics for mock workflow engine
 */

import {
  MockHealthCheck,
  MockStatistics,
  MockWorkflowExecution,
  MockWorkflowTemplate,
  IMockHealthMonitor,
} from './mock-types';

export class MockHealthMonitor implements IMockHealthMonitor {
  private startTime: Date = new Date();
  private lastRestart?: Date;

  constructor(
    private templates: Map<string, MockWorkflowTemplate>,
    private executions: Map<string, MockWorkflowExecution>
  ) {}

  /**
   * Perform comprehensive health check
   */
  checkHealth(): MockHealthCheck {
    const now = new Date();
    const templatesCount = this.templates.size;
    const executionsCount = this.executions.size;
    const activeExecutions = this.getActiveExecutionsCount();
    const lastExecutionTime = this.getLastExecutionTime();
    const memoryUsage = this.getMemoryUsage();

    // Determine health status
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    if (memoryUsage.percentage > 90) {
      status = 'unhealthy';
    } else if (memoryUsage.percentage > 75 || activeExecutions > 100) {
      status = 'degraded';
    }

    return {
      status,
      timestamp: now,
      details: {
        templatesCount,
        executionsCount,
        activeExecutions,
        lastExecutionTime,
        memoryUsage,
      },
    };
  }

  /**
   * Get comprehensive statistics
   */
  getStatistics(): MockStatistics {
    const executions = Array.from(this.executions.values());
    const templates = Array.from(this.templates.values());

    const totalExecutions = executions.length;
    const runningExecutions = executions.filter(
      e => e.status === 'running'
    ).length;
    const completedExecutions = executions.filter(
      e => e.status === 'completed'
    ).length;
    const failedExecutions = executions.filter(
      e => e.status === 'failed'
    ).length;
    const cancelledExecutions = executions.filter(
      e => e.status === 'cancelled'
    ).length;

    const completedExecutionTimes = executions
      .filter(e => e.status === 'completed' && e.startedAt && e.completedAt)
      .map(e => e.completedAt!.getTime() - e.startedAt.getTime());

    const averageExecutionTime =
      completedExecutionTimes.length > 0
        ? completedExecutionTimes.reduce((sum, time) => sum + time, 0) /
          completedExecutionTimes.length
        : 0;

    const successRate =
      totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0;

    const totalStepsExecuted = executions.reduce((total, execution) => {
      return (
        total +
        execution.stepExecutions.filter(s => s.status === 'completed').length
      );
    }, 0);

    const uptime = Date.now() - this.startTime.getTime();
    const memoryUsage = this.getMemoryUsage().percentage;

    return {
      templates: {
        total: templates.length,
        active: templates.filter(t => t.isActive).length,
        inactive: templates.filter(t => !t.isActive).length,
      },
      executions: {
        total: totalExecutions,
        running: runningExecutions,
        completed: completedExecutions,
        failed: failedExecutions,
        cancelled: cancelledExecutions,
      },
      performance: {
        averageExecutionTime,
        successRate,
        totalStepsExecuted,
      },
      system: {
        uptime,
        memoryUsage,
        lastRestart: this.lastRestart,
      },
    };
  }

  /**
   * Get count of active executions
   */
  private getActiveExecutionsCount(): number {
    return Array.from(this.executions.values()).filter(
      e => e.status === 'running' || e.status === 'pending'
    ).length;
  }

  /**
   * Get timestamp of last execution
   */
  private getLastExecutionTime(): Date | undefined {
    const executions = Array.from(this.executions.values());
    if (executions.length === 0) return undefined;

    return executions.reduce((latest, execution) => {
      return execution.startedAt > latest ? execution.startedAt : latest;
    }, executions[0].startedAt);
  }

  /**
   * Get mock memory usage statistics
   */
  private getMemoryUsage(): {
    used: number;
    total: number;
    percentage: number;
  } {
    // Mock memory usage calculation
    const templatesMemory = this.templates.size * 1024; // ~1KB per template
    const executionsMemory = this.executions.size * 2048; // ~2KB per execution
    const baseMemory = 10 * 1024 * 1024; // 10MB base

    const used = baseMemory + templatesMemory + executionsMemory;
    const total = 100 * 1024 * 1024; // Mock 100MB total
    const percentage = Math.round((used / total) * 100);

    return { used, total, percentage };
  }

  /**
   * Record system restart
   */
  recordRestart(): void {
    this.lastRestart = new Date();
    this.startTime = new Date();
  }

  /**
   * Get system uptime in milliseconds
   */
  getUptime(): number {
    return Date.now() - this.startTime.getTime();
  }

  /**
   * Get health summary
   */
  getHealthSummary(): {
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const health = this.checkHealth();
    const stats = this.getStatistics();

    const issues: string[] = [];
    const recommendations: string[] = [];

    if (health.status === 'unhealthy') {
      issues.push('System is in unhealthy state');
      recommendations.push('Investigate system resources and performance');
    }

    if (health.details.memoryUsage.percentage > 75) {
      issues.push(
        `High memory usage: ${health.details.memoryUsage.percentage}%`
      );
      recommendations.push(
        'Consider cleaning up old executions or optimizing memory usage'
      );
    }

    if (health.details.activeExecutions > 50) {
      issues.push(
        `High number of active executions: ${health.details.activeExecutions}`
      );
      recommendations.push(
        'Monitor execution queue and consider scaling resources'
      );
    }

    if (stats.performance.successRate < 90) {
      issues.push(
        `Low success rate: ${stats.performance.successRate.toFixed(1)}%`
      );
      recommendations.push(
        'Review failed executions and improve error handling'
      );
    }

    return {
      isHealthy: health.status === 'healthy',
      issues,
      recommendations,
    };
  }
}
