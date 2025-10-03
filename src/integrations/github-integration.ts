import { Octokit } from '@octokit/rest';
import type { ConfigManager } from '../config/config-manager';
import { Logger } from '../utils/logger';

/**
 * GitHub Integration with enterprise features
 */
export class GitHubIntegration {
  private readonly logger = Logger.getInstance();
  private readonly client: Octokit;
  private readonly owner: string;
  private readonly repo: string;

  constructor(private readonly config: ConfigManager) {
    this.owner = config.get('GITHUB_OWNER');
    this.repo = config.get('GITHUB_REPO');
    
    this.client = new Octokit({
      auth: config.get('GITHUB_TOKEN'),
      userAgent: 'copilot-task-processor/1.0.0',
    });
  }

  /**
   * Create new branch
   */
  public async createBranch(branchName: string, from: string = 'main'): Promise<{ name: string; url: string }> {
    try {
      // Get reference SHA
      const { data: ref } = await this.client.git.getRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${from}`,
      });

      // Create new branch
      await this.client.git.createRef({
        owner: this.owner,
        repo: this.repo,
        ref: `refs/heads/${branchName}`,
        sha: ref.object.sha,
      });

      this.logger.info(`Created branch ${branchName}`);

      return {
        name: branchName,
        url: `https://github.com/${this.owner}/${this.repo}/tree/${branchName}`,
      };
    } catch (error) {
      this.logger.error(`Failed to create branch ${branchName}:`, error);
      throw error;
    }
  }

  /**
   * Create pull request
   */
  public async createPullRequest(options: {
    title: string;
    body: string;
    head: string;
    base: string;
  }): Promise<{ url: string; number: number }> {
    try {
      const { data: pr } = await this.client.pulls.create({
        owner: this.owner,
        repo: this.repo,
        ...options,
      });

      this.logger.info(`Created PR #${pr.number}: ${pr.title}`);

      return {
        url: pr.html_url,
        number: pr.number,
      };
    } catch (error) {
      this.logger.error('Failed to create PR:', error);
      throw error;
    }
  }

  /**
   * Commit files to branch
   */
  public async commitFiles(branchName: string, files: Array<{ path: string; content: string }>): Promise<void> {
    try {
      for (const file of files) {
        await this.client.repos.createOrUpdateFileContents({
          owner: this.owner,
          repo: this.repo,
          path: file.path,
          message: `feat: add ${file.path}`,
          content: Buffer.from(file.content).toString('base64'),
          branch: branchName,
        });
      }

      this.logger.info(`Committed ${files.length} files to ${branchName}`);
    } catch (error) {
      this.logger.error(`Failed to commit files to ${branchName}:`, error);
      throw error;
    }
  }
}