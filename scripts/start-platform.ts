#!/usr/bin/env node

import chalk from 'chalk';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Service {
  name: string;
  command: string;
  args: string[];
  cwd: string;
  port: number;
  color: string;
}

const services: Service[] = [
  {
    name: 'Backend API',
    command: 'npx',
    args: ['tsx', 'src/server.ts'],
    cwd: path.join(__dirname, '../backend'),
    port: 3002,
    color: 'blue',
  },
  {
    name: 'Agents API',
    command: 'npx',
    args: ['tsx', 'src/agents-server.ts'],
    cwd: path.join(__dirname, '../backend'),
    port: 3003,
    color: 'green',
  },
  {
    name: 'Frontend',
    command: 'npx',
    args: ['next', 'dev', '-p', '3001'],
    cwd: path.join(__dirname, '../'),
    port: 3001,
    color: 'cyan',
  },
];

const processes: Map<string, ChildProcess> = new Map();

function logWithColor(service: string, message: string, color: string) {
  const timestamp = new Date().toLocaleTimeString();
  const colorFn = (chalk as any)[color] || chalk.white;
  console.log(`${chalk.gray(timestamp)} ${colorFn(`[${service}]`)} ${message}`);
}

function startService(service: Service): Promise<void> {
  return new Promise((resolve, reject) => {
    logWithColor(
      service.name,
      `Starting on port ${service.port}...`,
      service.color
    );

    const child = spawn(service.command, service.args, {
      cwd: service.cwd,
      stdio: 'pipe',
      shell: process.platform === 'win32',
    });

    processes.set(service.name, child);

    child.stdout?.on('data', data => {
      const message = data.toString().trim();
      if (message) {
        logWithColor(service.name, message, service.color);

        // Check if service is ready
        if (
          message.includes(`running on`) ||
          message.includes(`localhost:${service.port}`) ||
          message.includes(`Ready on`) ||
          message.includes(`Server running`)
        ) {
          resolve();
        }
      }
    });

    child.stderr?.on('data', data => {
      const message = data.toString().trim();
      if (message && !message.includes('ExperimentalWarning')) {
        logWithColor(service.name, `Error: ${message}`, 'red');
      }
    });

    child.on('error', error => {
      logWithColor(service.name, `Failed to start: ${error.message}`, 'red');
      reject(error);
    });

    child.on('exit', (code, signal) => {
      if (code !== null && code !== 0) {
        logWithColor(service.name, `Exited with code ${code}`, 'red');
      } else if (signal) {
        logWithColor(service.name, `Killed by signal ${signal}`, 'yellow');
      }
      processes.delete(service.name);
    });

    // Timeout after 30 seconds if not started
    setTimeout(() => {
      if (processes.has(service.name)) {
        resolve(); // Continue anyway
      }
    }, 30000);
  });
}

async function startAllServices() {
  console.log(chalk.bold.magenta('🚀 Starting ThinkCode AI Platform...'));
  console.log(chalk.gray('═'.repeat(60)));

  try {
    // Start services in sequence with delay
    for (const service of services) {
      await startService(service);
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    }

    console.log(chalk.gray('═'.repeat(60)));
    console.log(chalk.bold.green('✅ All services started successfully!'));
    console.log('');
    console.log(chalk.bold('🌐 Access your application:'));
    console.log(`   Frontend:    ${chalk.cyan('http://localhost:3001')}`);
    console.log(
      `   Enterprise:  ${chalk.cyan('http://localhost:3001/enterprise-dashboard')}`
    );
    console.log(
      `   Backend API: ${chalk.blue('http://localhost:3002/api/health')}`
    );
    console.log(
      `   Agents API:  ${chalk.green('http://localhost:3003/api/health')}`
    );
    console.log('');
    console.log(chalk.yellow('Press Ctrl+C to stop all services'));
    console.log(chalk.gray('═'.repeat(60)));
  } catch (error) {
    console.error(chalk.red('❌ Failed to start services:'), error);
    await stopAllServices();
    process.exit(1);
  }
}

async function stopAllServices() {
  console.log(chalk.yellow('\n🛑 Stopping all services...'));

  for (const [name, process] of processes) {
    logWithColor(name, 'Shutting down...', 'yellow');

    if (process.pid) {
      try {
        if (process.platform === 'win32') {
          spawn('taskkill', ['/PID', process.pid.toString(), '/F', '/T']);
        } else {
          process.kill(-process.pid);
        }
      } catch (error) {
        // Process might already be dead
      }
    }
  }

  // Give processes time to shutdown gracefully
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log(chalk.green('✅ All services stopped'));
  process.exit(0);
}

// Handle graceful shutdown
process.on('SIGINT', stopAllServices);
process.on('SIGTERM', stopAllServices);

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  console.error(chalk.red('Uncaught Exception:'), error);
  stopAllServices();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(
    chalk.red('Unhandled Rejection at:'),
    promise,
    chalk.red('reason:'),
    reason
  );
  stopAllServices();
});

// Start the platform
startAllServices().catch(error => {
  console.error(chalk.red('Failed to start platform:'), error);
  process.exit(1);
});
