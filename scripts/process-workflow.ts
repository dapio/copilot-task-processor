#!/usr/bin/env tsx

/**
 * Main workflow processing script
 * Usage: npm run workflow:process -- --issue PROJ-123
 */

import { program } from 'commander';
import { CopilotTaskProcessor } from '../src/index';

program
  .option('--issue <issue-key>', 'Jira issue key to process')
  .option('--dry-run', 'Run without making changes')
  .parse();

const options = program.opts();

async function main(): Promise<void> {
  if (!options.issue) {
    console.error('Please provide --issue parameter');
    process.exit(1);
  }

  const processor = new CopilotTaskProcessor();
  // Execute processing logic here
  console.log(`Processing issue: ${options.issue}`);
}

main().catch(console.error);