import axios, { type AxiosInstance } from 'axios';
import type { ConfigManager } from '../config/config-manager';
import { Logger } from '../utils/logger';

/**
 * Jira Integration with enterprise-grade error handling
 */
export class JiraIntegration {
  private readonly logger = Logger.getInstance();
  private readonly client: AxiosInstance;

  constructor(private readonly config: ConfigManager) {
    this.client = axios.create({
      baseURL: `${config.get('JIRA_HOST')}/rest/api/3`,
      headers: {
        'Authorization': `Basic ${Buffer.from(
          `${config.get('JIRA_EMAIL')}:${config.get('JIRA_API_TOKEN')}`
        ).toString('base64')}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Get Jira issue by key
   */
  public async getIssue(issueKey: string): Promise<any> {
    try {
      const response = await this.client.get(`/issue/${issueKey}`, {
        params: {
          expand: 'changelog,renderedFields,names,schema,operations,editmeta',
          fields: '*all',
        },
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch issue ${issueKey}:`, error);
      throw error;
    }
  }

  /**
   * Search issues using JQL
   */
  public async searchIssues(jql: string, maxResults: number = 50): Promise<any[]> {
    try {
      const response = await this.client.post('/search', {
        jql,
        maxResults,
        fields: ['summary', 'status', 'assignee', 'created', 'priority', 'issuetype'],
      });
      return response.data.issues;
    } catch (error) {
      this.logger.error('Failed to search issues:', error);
      throw error;
    }
  }

  /**
   * Add comment to issue
   */
  public async addComment(issueKey: string, comment: string): Promise<void> {
    try {
      await this.client.post(`/issue/${issueKey}/comment`, {
        body: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: comment }],
            },
          ],
        },
      });
      this.logger.info(`Added comment to ${issueKey}`);
    } catch (error) {
      this.logger.error(`Failed to add comment to ${issueKey}:`, error);
      throw error;
    }
  }

  /**
   * Transition issue status
   */
  public async transitionIssue(issueKey: string, transitionName: string): Promise<void> {
    try {
      // Get available transitions
      const transitionsResponse = await this.client.get(`/issue/${issueKey}/transitions`);
      const transitions = transitionsResponse.data.transitions;

      const transition = transitions.find((t: any) => 
        t.name.toLowerCase() === transitionName.toLowerCase()
      );

      if (!transition) {
        throw new Error(`Transition "${transitionName}" not found for ${issueKey}`);
      }

      // Execute transition
      await this.client.post(`/issue/${issueKey}/transitions`, {
        transition: { id: transition.id },
      });

      this.logger.info(`Transitioned ${issueKey} to "${transitionName}"`);
    } catch (error) {
      this.logger.error(`Failed to transition ${issueKey}:`, error);
      throw error;
    }
  }
}