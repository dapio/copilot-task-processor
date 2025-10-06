/**
 * Simple Task Sync Provider for Jira
 * Focused implementation using existing JiraIntegrationService
 */

import { PrismaClient } from '@prisma/client';
import { Result, MLError } from '../providers/ml-provider.interface';
import { JiraIntegrationService } from './jira-integration.service';

export interface SyncResult {
  taskId: string;
  externalId?: string;
  action: 'created' | 'updated' | 'synced' | 'error';
  success: boolean;
  message?: string;
}

export interface SyncStats {
  synced: number;
  pending: number;
  failed: number;
  total: number;
}

export class TaskJiraProvider {
  private prisma: PrismaClient;
  private jiraService: JiraIntegrationService;

  constructor() {
    this.prisma = new PrismaClient();
    this.jiraService = new JiraIntegrationService(this.prisma);
  }

  /**
   * Sync single task to Jira
   */
  async syncTask(taskId: string): Promise<Result<SyncResult, MLError>> {
    try {
      const task = await this.prisma.task.findUnique({
        where: { id: taskId },
        include: { jiraIntegration: true }
      });

      if (!task) {
        return {
          success: false,
          error: { code: 'TASK_NOT_FOUND', message: 'Task not found' }
        };
      }

      let jiraResult;
      
      if (task.jiraIntegration) {
        // Update existing Jira issue
        jiraResult = await this.jiraService.updateJiraIssue(taskId);
      } else {
        // Create new Jira issue
        jiraResult = await this.jiraService.createJiraIssue(taskId);
      }

      return {
        success: true,
        data: {
          taskId: taskId,
          externalId: jiraResult.jiraKey,
          action: jiraResult.action,
          success: jiraResult.action !== 'error',
          message: jiraResult.message
        }
      };

    } catch (error) {
      return {
        success: false,
        error: { code: 'SYNC_ERROR', message: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Sync all tasks for a project
   */
  async syncProjectTasks(projectId: string): Promise<Result<SyncResult[], MLError>> {
    try {
      const tasks = await this.prisma.task.findMany({
        where: { projectId },
        include: { jiraIntegration: true }
      });

      const results: SyncResult[] = [];

      for (const task of tasks) {
        const syncResult = await this.syncTask(task.id);
        if (syncResult.success) {
          results.push(syncResult.data);
        } else {
          results.push({
            taskId: task.id,
            action: 'error',
            success: false,
            message: syncResult.error?.message
          });
        }
      }

      return { success: true, data: results };

    } catch (error) {
      return {
        success: false,
        error: { code: 'PROJECT_SYNC_ERROR', message: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Get sync statistics for project
   */
  async getSyncStats(projectId: string): Promise<Result<SyncStats, MLError>> {
    try {
      const total = await this.prisma.task.count({
        where: { projectId }
      });

      const synced = await this.prisma.jiraIntegration.count({
        where: {
          task: { projectId },
          syncStatus: 'active'
        }
      });

      const failed = await this.prisma.jiraIntegration.count({
        where: {
          task: { projectId },
          syncStatus: 'error'
        }
      });

      const pending = total - synced - failed;

      return {
        success: true,
        data: { synced, pending, failed, total }
      };

    } catch (error) {
      return {
        success: false,
        error: { code: 'STATS_ERROR', message: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Force sync all tasks using existing service
   */
  async forceSync(): Promise<Result<SyncResult[], MLError>> {
    try {
      const jiraResults = await this.jiraService.syncAllTasks();
      
      const results: SyncResult[] = jiraResults.map(result => ({
        taskId: result.taskId,
        externalId: result.jiraKey,
        action: result.action,
        success: result.action !== 'error',
        message: result.message
      }));

      return { success: true, data: results };

    } catch (error) {
      return {
        success: false,
        error: { code: 'FORCE_SYNC_ERROR', message: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Import Jira issues as tasks
   */
  async importJiraIssues(jql?: string): Promise<Result<SyncResult[], MLError>> {
    try {
      const jiraResults = await this.jiraService.importJiraIssues(jql);
      
      const results: SyncResult[] = jiraResults.map(result => ({
        taskId: result.taskId,
        externalId: result.jiraKey,
        action: result.action,
        success: result.action !== 'error',
        message: result.message
      }));

      return { success: true, data: results };

    } catch (error) {
      return {
        success: false,
        error: { code: 'IMPORT_ERROR', message: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Check sync health
   */
  async checkSyncHealth(): Promise<Result<boolean, MLError>> {
    try {
      // Simple health check - verify we can connect to database
      await this.prisma.$queryRaw`SELECT 1`;
      return { success: true, data: true };

    } catch (error) {
      return {
        success: false,
        error: { code: 'HEALTH_CHECK_ERROR', message: error instanceof Error ? error.message : 'Health check failed' }
      };
    }
  }

  /**
   * Get recent sync logs
   */
  async getSyncLogs(limit: number = 50): Promise<Result<any[], MLError>> {
    try {
      const logs = await this.prisma.jiraSyncLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return { success: true, data: logs };

    } catch (error) {
      return {
        success: false,
        error: { code: 'LOGS_ERROR', message: error instanceof Error ? error.message : 'Failed to get logs' }
      };
    }
  }
}

export default TaskJiraProvider;