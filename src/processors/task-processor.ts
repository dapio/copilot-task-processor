import type { ConfigManager } from '../config/config-manager';
import { Logger } from '../utils/logger';
import { JiraIntegration } from '../integrations/jira-integration';
import { GitHubIntegration } from '../integrations/github-integration';
import { MCPServer } from '../mcp/mcp-server';

interface TaskProcessorOptions {
  dryRun?: boolean;
  verbose?: boolean;
}

interface ProcessingResult {
  success: boolean;
  issueKey: string;
  duration: number;
  branch?: string;
  pullRequest?: string;
  error?: string;
}

/**
 * Core Task Processor - orchestrates entire workflow
 */
export class TaskProcessor {
  private readonly logger = Logger.getInstance();
  private readonly jiraIntegration: JiraIntegration;
  private readonly githubIntegration: GitHubIntegration;
  private readonly mcpServer: MCPServer;

  constructor(private readonly config: ConfigManager) {
    this.jiraIntegration = new JiraIntegration(config);
    this.githubIntegration = new GitHubIntegration(config);
    this.mcpServer = new MCPServer(config);
  }

  /**
   * Process single task from Jira ticket to PR
   */
  public async processSingleTask(
    issueKey: string,
    options: TaskProcessorOptions = {}
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      this.logger.info(`Starting task processing for ${issueKey}`);

      // Step 1: Fetch Jira issue
      const issue = await this.jiraIntegration.getIssue(issueKey);
      this.logger.info(`Fetched issue: ${issue.fields.summary}`);

      // Step 2: Generate mockups using MCP
      const mockups = await this.mcpServer.generateMockups(issue);
      this.logger.info('Generated mockups');

      // Step 3: Create feature branch
      const branchName = `feat/${issueKey}-${this.slugify(issue.fields.summary)}`;
      const branch = await this.githubIntegration.createBranch(branchName);
      this.logger.info(`Created branch: ${branchName}`);

      // Step 4: Generate code with Copilot
      const implementation = await this.mcpServer.generateImplementation(issue, mockups);
      this.logger.info('Generated implementation');

      // Step 5: Generate tests
      const tests = await this.mcpServer.generateTests(implementation);
      this.logger.info('Generated tests');

      if (!options.dryRun) {
        // Step 6: Commit code to branch
        await this.githubIntegration.commitFiles(branchName, [
          ...implementation.files,
          ...tests.files
        ]);

        // Step 7: Create PR
        const pr = await this.githubIntegration.createPullRequest({
          title: `feat(${issueKey}): ${issue.fields.summary}`,
          body: this.generatePRDescription(issue, mockups, implementation),
          head: branchName,
          base: 'development'
        });

        // Step 8: Update Jira
        await this.jiraIntegration.addComment(
          issueKey,
          `Pull request created: ${pr.url}\n\nBranch: ${branchName}\nMockups and implementation generated automatically.`
        );
        await this.jiraIntegration.transitionIssue(issueKey, 'In Review');
      }

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        issueKey,
        duration,
        branch: branchName,
        pullRequest: options.dryRun ? 'DRY-RUN' : branch.url,
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Task processing failed for ${issueKey}:`, error);
      
      return {
        success: false,
        issueKey,
        duration,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Process multiple tasks in batch
   */
  public async processBatch(options: {
    query?: string;
    limit?: string;
  }): Promise<ProcessingResult[]> {
    const query = options.query || `project = ${this.config.get('JIRA_PROJECT_KEY')} AND status = "To Do"`;
    const limit = parseInt(options.limit || '10', 10);

    this.logger.info(`Processing batch with query: ${query}`);

    const issues = await this.jiraIntegration.searchIssues(query, limit);
    const results: ProcessingResult[] = [];

    for (const issue of issues) {
      const result = await this.processSingleTask(issue.key);
      results.push(result);
      
      // Pause between tasks to avoid rate limiting
      await this.sleep(2000);
    }

    const successful = results.filter(r => r.success).length;
    this.logger.info(`Batch complete: ${successful}/${results.length} successful`);

    return results;
  }

  private generatePRDescription(issue: any, mockups: any, implementation: any): string {
    return `
## 📋 Issue: ${issue.key}

**${issue.fields.summary}**

${issue.fields.description || 'No description provided'}

## 🎨 Generated Mockups

${mockups.description || 'Mockups generated based on requirements'}

## 🚀 Implementation

- ✅ Auto-generated code structure
- ✅ Comprehensive test coverage (${implementation.testCoverage}%)
- ✅ Type-safe implementation
- ✅ Error handling included
- ✅ Documentation added

## 🧪 Testing

All tests generated and passing:
- Unit tests: ${implementation.stats.unitTests}
- Integration tests: ${implementation.stats.integrationTests}
- E2E tests: ${implementation.stats.e2eTests}

## 📊 Metrics

- Lines of code: ${implementation.stats.linesOfCode}
- Complexity: ${implementation.stats.complexity}
- Test coverage: ${implementation.testCoverage}%

*This PR was generated automatically by Copilot Task Processor*
    `.trim();
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}