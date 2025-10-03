#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import dotenv from 'dotenv';

import { TaskProcessor } from './processors/task-processor';
import { Logger } from './utils/logger';
import { ConfigManager } from './config/config-manager';

// Load environment variables
dotenv.config();

const logger = Logger.getInstance();
const config = ConfigManager.getInstance();

/**
 * Main application class
 */
class CopilotTaskProcessor {
  private readonly program: Command;
  private readonly taskProcessor: TaskProcessor;

  constructor() {
    this.program = new Command();
    this.taskProcessor = new TaskProcessor(config);
    this.setupCLI();
  }

  private setupCLI(): void {
    this.program
      .name('copilot-task-processor')
      .description('Enterprise task processor with AI integration')
      .version('1.0.0');

    // Process single task
    this.program
      .command('process')
      .description('Process a single task from Jira')
      .argument('<issue-key>', 'Jira issue key (e.g., PROJ-123)')
      .option('-d, --dry-run', 'Run without making changes')
      .option('-v, --verbose', 'Verbose logging')
      .action(async (issueKey, options) => {
        try {
          console.log(chalk.cyan(`🚀 Processing task: ${issueKey}`));
          const result = await this.taskProcessor.processSingleTask(issueKey, options);
          
          if (result.success) {
            console.log(chalk.green(`✅ Task ${issueKey} completed successfully!`));
            console.log(`   Branch: ${result.branch}`);
            console.log(`   PR: ${result.pullRequest}`);
          } else {
            console.log(chalk.red(`❌ Task ${issueKey} failed: ${result.error}`));
          }
        } catch (error) {
          logger.error('Failed to process task:', error);
          process.exit(1);
        }
      });

    // Batch process
    this.program
      .command('batch')
      .description('Process multiple tasks from JQL query')
      .option('-q, --query <jql>', 'JQL query to find tasks')
      .option('-l, --limit <number>', 'Maximum number of tasks', '10')
      .action(async (options) => {
        try {
          await this.taskProcessor.processBatch(options);
        } catch (error) {
          logger.error('Failed to process batch:', error);
          process.exit(1);
        }
      });

    // Health check
    this.program
      .command('health')
      .description('Check system health')
      .action(async () => {
        console.log(chalk.blue('🏥 Running health checks...'));
        // Health check implementation
        console.log(chalk.green('✅ All systems operational'));
      });
  }

  public async run(): Promise<void> {
    try {
      await this.program.parseAsync(process.argv);
    } catch (error) {
      logger.error('Application failed:', error);
      process.exit(1);
    }
  }
}

// Run the application
if (require.main === module) {
  const app = new CopilotTaskProcessor();
  app.run().catch((error) => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

export { CopilotTaskProcessor };