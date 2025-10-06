/**
 * Jira Integration Service
 *
 * Comprehensive Jira integration for task management and workflow automation.
 * Features:
 * - Task synchronization between platform and Jira
 * - Automated issue creation and updates
 * - Webhook handling for real-time sync
 * - Sprint and board management
 * - Comment and attachment sync
 * - Status mapping and workflow automation
 *
 * @author ThinkCode AI Platform
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import axios, { AxiosInstance } from 'axios';

// Jira API Types
interface JiraConfig {
  host: string;
  email: string;
  apiToken: string;
  projectKey: string;
}

interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: string;
    status: {
      name: string;
      id: string;
    };
    priority: {
      name: string;
      id: string;
    };
    assignee?: {
      accountId: string;
      displayName: string;
    };
    labels: string[];
    components: Array<{
      id: string;
      name: string;
    }>;
    created: string;
    updated: string;
  };
}

interface JiraBoard {
  id: number;
  name: string;
  type: string;
  location: {
    projectId: number;
    projectKey: string;
  };
}

interface JiraSprint {
  id: number;
  name: string;
  state: 'FUTURE' | 'ACTIVE' | 'CLOSED';
  startDate?: string;
  endDate?: string;
  goal?: string;
}

interface JiraComment {
  id: string;
  body: string;
  author: {
    accountId: string;
    displayName: string;
  };
  created: string;
  updated: string;
}

interface JiraTransition {
  id: string;
  name: string;
  to: {
    id: string;
    name: string;
  };
}

interface TaskSyncResult {
  taskId: string;
  jiraKey?: string;
  action: 'created' | 'updated' | 'synced' | 'error';
  message: string;
  timestamp: Date;
}

// Service Errors
class JiraServiceError extends Error {
  constructor(public code: string, message: string, public details?: any) {
    super(message);
    this.name = 'JiraServiceError';
  }
}

/**
 * Jira Integration Service
 *
 * Provides comprehensive integration with Atlassian Jira for task management
 * and workflow automation. Handles bidirectional sync, webhook processing,
 * and real-time updates.
 */
export class JiraIntegrationService extends EventEmitter {
  private prisma: PrismaClient;
  private jiraClient: AxiosInstance;
  private config: JiraConfig;
  private syncInProgress = false;
  private statusMapping: Map<string, string> = new Map();
  private priorityMapping: Map<string, string> = new Map();

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;

    // Load Jira configuration
    this.config = {
      host: process.env.JIRA_HOST || '',
      email: process.env.JIRA_EMAIL || '',
      apiToken: process.env.JIRA_API_TOKEN || '',
      projectKey: process.env.JIRA_PROJECT_KEY || 'PROJ',
    };

    // Initialize Jira API client
    this.jiraClient = axios.create({
      baseURL: `${this.config.host}/rest/api/3`,
      auth: {
        username: this.config.email,
        password: this.config.apiToken,
      },
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    this.initializeStatusMappings();
    this.initializePriorityMappings();
  }

  /**
   * Initialize status mappings between platform and Jira
   */
  private initializeStatusMappings(): void {
    this.statusMapping.set('pending', 'To Do');
    this.statusMapping.set('in_progress', 'In Progress');
    this.statusMapping.set('completed', 'Done');
    this.statusMapping.set('failed', 'To Do');
    this.statusMapping.set('blocked', 'Blocked');
    this.statusMapping.set('review', 'In Review');
    this.statusMapping.set('testing', 'In Testing');
  }

  /**
   * Initialize priority mappings between platform and Jira
   */
  private initializePriorityMappings(): void {
    this.priorityMapping.set('low', 'Low');
    this.priorityMapping.set('medium', 'Medium');
    this.priorityMapping.set('high', 'High');
    this.priorityMapping.set('critical', 'Highest');
  }

  /**
   * Test Jira connection and configuration
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.config.host || !this.config.email || !this.config.apiToken) {
        return {
          success: false,
          message:
            'Jira configuration incomplete. Check JIRA_HOST, JIRA_EMAIL, and JIRA_API_TOKEN environment variables.',
        };
      }

      const response = await this.jiraClient.get('/myself');

      return {
        success: true,
        message: `Connected to Jira as ${response.data.displayName} (${response.data.emailAddress})`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Jira connection failed: ${
          error.response?.data?.message || error.message
        }`,
      };
    }
  }

  /**
   * Create a new Jira issue from a platform task
   */
  async createJiraIssue(taskId: string): Promise<TaskSyncResult> {
    try {
      const task = await this.prisma.task.findUnique({
        where: { id: taskId },
        include: { project: true },
      });

      if (!task) {
        throw new JiraServiceError(
          'TASK_NOT_FOUND',
          `Task ${taskId} not found`
        );
      }

      const issueData = {
        fields: {
          project: {
            key: this.config.projectKey,
          },
          summary: task.title,
          description: this.formatDescription(task.description, task),
          issuetype: {
            name: this.getIssueType(task.category),
          },
          priority: {
            name: this.priorityMapping.get(task.priority) || 'Medium',
          },
          labels: this.parseLabels(task.tags),
        },
      };

      const response = await this.jiraClient.post('/issue', issueData);
      const jiraKey = response.data.key;

      // Update task with Jira key
      await this.prisma.task.update({
        where: { id: taskId },
        data: {
          metadata: {
            ...((task.metadata as any) || {}),
            jiraKey,
            jiraId: response.data.id,
            syncedAt: new Date().toISOString(),
          },
        },
      });

      this.emit('issueCreated', { taskId, jiraKey });

      return {
        taskId,
        jiraKey,
        action: 'created',
        message: `Created Jira issue ${jiraKey}`,
        timestamp: new Date(),
      };
    } catch (error: any) {
      const message = `Failed to create Jira issue: ${
        error.response?.data?.errors
          ? JSON.stringify(error.response.data.errors)
          : error.message
      }`;

      return {
        taskId,
        action: 'error',
        message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Update a Jira issue from platform task changes
   */
  async updateJiraIssue(taskId: string): Promise<TaskSyncResult> {
    try {
      const task = await this.prisma.task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new JiraServiceError(
          'TASK_NOT_FOUND',
          `Task ${taskId} not found`
        );
      }

      const metadata = (task.metadata as any) || {};
      const jiraKey = metadata.jiraKey;

      if (!jiraKey) {
        // Create new issue if no Jira key exists
        return this.createJiraIssue(taskId);
      }

      const updateData: any = {
        fields: {
          summary: task.title,
          description: this.formatDescription(task.description, task),
          priority: {
            name: this.priorityMapping.get(task.priority) || 'Medium',
          },
          labels: this.parseLabels(task.tags),
        },
      };

      await this.jiraClient.put(`/issue/${jiraKey}`, updateData);

      // Handle status transitions
      if (task.status) {
        await this.transitionIssue(jiraKey, task.status);
      }

      // Update sync timestamp
      await this.prisma.task.update({
        where: { id: taskId },
        data: {
          metadata: {
            ...metadata,
            syncedAt: new Date().toISOString(),
          },
        },
      });

      this.emit('issueUpdated', { taskId, jiraKey });

      return {
        taskId,
        jiraKey,
        action: 'updated',
        message: `Updated Jira issue ${jiraKey}`,
        timestamp: new Date(),
      };
    } catch (error: any) {
      const message = `Failed to update Jira issue: ${
        error.response?.data?.errors
          ? JSON.stringify(error.response.data.errors)
          : error.message
      }`;

      return {
        taskId,
        action: 'error',
        message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Sync all platform tasks with Jira
   */
  async syncAllTasks(): Promise<TaskSyncResult[]> {
    if (this.syncInProgress) {
      throw new JiraServiceError(
        'SYNC_IN_PROGRESS',
        'Sync already in progress'
      );
    }

    this.syncInProgress = true;
    const results: TaskSyncResult[] = [];

    try {
      const tasks = await this.prisma.task.findMany({
        where: {
          status: {
            not: 'completed',
          },
        },
      });

      for (const task of tasks) {
        const result = await this.updateJiraIssue(task.id);
        results.push(result);

        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      this.emit('syncCompleted', { results, totalTasks: tasks.length });

      return results;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Import Jira issues to platform tasks
   */
  async importJiraIssues(jql?: string): Promise<TaskSyncResult[]> {
    try {
      const searchJql =
        jql ||
        `project = ${this.config.projectKey} AND status != Done ORDER BY created DESC`;

      const response = await this.jiraClient.post('/search', {
        jql: searchJql,
        maxResults: 100,
        fields: [
          'summary',
          'description',
          'status',
          'priority',
          'assignee',
          'labels',
          'components',
          'created',
          'updated',
        ],
      });

      const results: TaskSyncResult[] = [];

      for (const issue of response.data.issues) {
        try {
          const result = await this.importJiraIssue(issue);
          results.push(result);
        } catch (error: any) {
          results.push({
            taskId: '',
            jiraKey: issue.key,
            action: 'error',
            message: `Failed to import ${issue.key}: ${error.message}`,
            timestamp: new Date(),
          });
        }
      }

      this.emit('importCompleted', {
        results,
        totalIssues: response.data.issues.length,
      });

      return results;
    } catch (error: any) {
      throw new JiraServiceError(
        'IMPORT_FAILED',
        `Failed to import Jira issues: ${error.message}`
      );
    }
  }

  /**
   * Import a single Jira issue to platform task
   */
  private async importJiraIssue(issue: JiraIssue): Promise<TaskSyncResult> {
    // Check if task already exists
    const existingTask = await this.prisma.task.findFirst({
      where: {
        metadata: {
          string_contains: `"jiraKey":"${issue.key}"`,
        },
      },
    });

    if (existingTask) {
      // Update existing task
      await this.prisma.task.update({
        where: { id: existingTask.id },
        data: {
          title: issue.fields.summary,
          description: issue.fields.description || '',
          status: this.mapJiraStatusToPlatform(issue.fields.status.name),
          priority: this.mapJiraPriorityToPlatform(issue.fields.priority.name),
          tags: JSON.stringify(issue.fields.labels),
          updatedAt: new Date(),
        },
      });

      return {
        taskId: existingTask.id,
        jiraKey: issue.key,
        action: 'updated',
        message: `Updated task from Jira issue ${issue.key}`,
        timestamp: new Date(),
      };
    } else {
      // Create new task
      const newTask = await this.prisma.task.create({
        data: {
          title: issue.fields.summary,
          description: issue.fields.description || '',
          status: this.mapJiraStatusToPlatform(issue.fields.status.name),
          priority: this.mapJiraPriorityToPlatform(issue.fields.priority.name),
          tags: JSON.stringify(issue.fields.labels),
          metadata: {
            jiraKey: issue.key,
            jiraId: issue.id,
            importedAt: new Date().toISOString(),
          },
        },
      });

      return {
        taskId: newTask.id,
        jiraKey: issue.key,
        action: 'created',
        message: `Created task from Jira issue ${issue.key}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Handle Jira webhook events
   */
  async handleWebhook(
    payload: any
  ): Promise<{ processed: boolean; message: string }> {
    try {
      const eventType = payload.webhookEvent;
      const issue = payload.issue;

      if (!issue) {
        return {
          processed: false,
          message: 'No issue data in webhook payload',
        };
      }

      switch (eventType) {
        case 'jira:issue_created':
          await this.handleIssueCreated(issue);
          break;
        case 'jira:issue_updated':
          await this.handleIssueUpdated(issue);
          break;
        case 'jira:issue_deleted':
          await this.handleIssueDeleted(issue);
          break;
        default:
          return {
            processed: false,
            message: `Unhandled webhook event: ${eventType}`,
          };
      }

      return {
        processed: true,
        message: `Processed ${eventType} for issue ${issue.key}`,
      };
    } catch (error: any) {
      return {
        processed: false,
        message: `Webhook processing failed: ${error.message}`,
      };
    }
  }

  /**
   * Get available Jira boards
   */
  async getBoards(): Promise<JiraBoard[]> {
    try {
      const response = await this.jiraClient.get('/board', {
        params: {
          projectKeyOrId: this.config.projectKey,
        },
      });

      return response.data.values;
    } catch (error: any) {
      throw new JiraServiceError(
        'BOARDS_FETCH_FAILED',
        `Failed to fetch boards: ${error.message}`
      );
    }
  }

  /**
   * Get sprints for a board
   */
  async getSprints(boardId: number): Promise<JiraSprint[]> {
    try {
      const response = await this.jiraClient.get(`/board/${boardId}/sprint`);
      return response.data.values;
    } catch (error: any) {
      throw new JiraServiceError(
        'SPRINTS_FETCH_FAILED',
        `Failed to fetch sprints: ${error.message}`
      );
    }
  }

  /**
   * Add comment to Jira issue
   */
  async addComment(jiraKey: string, comment: string): Promise<JiraComment> {
    try {
      const response = await this.jiraClient.post(`/issue/${jiraKey}/comment`, {
        body: comment,
      });

      return response.data;
    } catch (error: any) {
      throw new JiraServiceError(
        'COMMENT_ADD_FAILED',
        `Failed to add comment: ${error.message}`
      );
    }
  }

  /**
   * Get comments for Jira issue
   */
  async getComments(jiraKey: string): Promise<JiraComment[]> {
    try {
      const response = await this.jiraClient.get(`/issue/${jiraKey}/comment`);
      return response.data.comments;
    } catch (error: any) {
      throw new JiraServiceError(
        'COMMENTS_FETCH_FAILED',
        `Failed to fetch comments: ${error.message}`
      );
    }
  }

  // Private helper methods

  private formatDescription(description: string | null, task: any): string {
    let formatted = description || '';

    if (task.estimatedHours) {
      formatted += `\n\n**Estimated Hours:** ${task.estimatedHours}h`;
    }

    if (task.dependencies) {
      try {
        const deps = JSON.parse(task.dependencies);
        if (deps.length > 0) {
          formatted += `\n\n**Dependencies:** ${deps.join(', ')}`;
        }
      } catch {
        // Ignore JSON parse errors
      }
    }

    formatted += `\n\n---\n*Synced from ThinkCode AI Platform (Task ID: ${task.id})*`;

    return formatted;
  }

  private getIssueType(category: string | null): string {
    const typeMapping: { [key: string]: string } = {
      setup: 'Task',
      development: 'Story',
      testing: 'Test',
      deployment: 'Task',
      bug: 'Bug',
      feature: 'Story',
    };

    return typeMapping[category || 'development'] || 'Task';
  }

  private parseLabels(tags: string | null): string[] {
    if (!tags) return [];

    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private async transitionIssue(
    jiraKey: string,
    status: string
  ): Promise<void> {
    try {
      const targetStatus = this.statusMapping.get(status);
      if (!targetStatus) return;

      // Get available transitions
      const transitionsResponse = await this.jiraClient.get(
        `/issue/${jiraKey}/transitions`
      );
      const transitions: JiraTransition[] =
        transitionsResponse.data.transitions;

      // Find matching transition
      const transition = transitions.find(t => t.to.name === targetStatus);
      if (!transition) return;

      // Execute transition
      await this.jiraClient.post(`/issue/${jiraKey}/transitions`, {
        transition: {
          id: transition.id,
        },
      });
    } catch (error: any) {
      // Log but don't throw - transitions might not be available
      console.warn(
        `Failed to transition issue ${jiraKey} to ${status}:`,
        error.message
      );
    }
  }

  private mapJiraStatusToPlatform(jiraStatus: string): string {
    const reverseMapping: { [key: string]: string } = {
      'To Do': 'pending',
      'In Progress': 'in_progress',
      Done: 'completed',
      Blocked: 'blocked',
      'In Review': 'review',
      'In Testing': 'testing',
    };

    return reverseMapping[jiraStatus] || 'pending';
  }

  private mapJiraPriorityToPlatform(jiraPriority: string): string {
    const reverseMapping: { [key: string]: string } = {
      Lowest: 'low',
      Low: 'low',
      Medium: 'medium',
      High: 'high',
      Highest: 'critical',
    };

    return reverseMapping[jiraPriority] || 'medium';
  }

  private async handleIssueCreated(issue: JiraIssue): Promise<void> {
    await this.importJiraIssue(issue);
    this.emit('webhookIssueCreated', { jiraKey: issue.key });
  }

  private async handleIssueUpdated(issue: JiraIssue): Promise<void> {
    await this.importJiraIssue(issue);
    this.emit('webhookIssueUpdated', { jiraKey: issue.key });
  }

  private async handleIssueDeleted(issue: JiraIssue): Promise<void> {
    // Find and archive the corresponding task
    const task = await this.prisma.task.findFirst({
      where: {
        metadata: {
          string_contains: `"jiraKey":"${issue.key}"`,
        },
      },
    });

    if (task) {
      await this.prisma.task.update({
        where: { id: task.id },
        data: {
          status: 'completed', // or create an 'archived' status
          metadata: {
            ...(task.metadata as any),
            deletedFromJira: new Date().toISOString(),
          },
        },
      });
    }

    this.emit('webhookIssueDeleted', { jiraKey: issue.key, taskId: task?.id });
  }
}

export default JiraIntegrationService;
