/**
 * Agents Server - Refactored Main Class
 * Modular architecture for agents API server
 */

import express, { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  IAgentServer,
  AgentServerConfig,
  AgentServerDependencies,
  AgentServerState,
} from './types/agents-server.types';

import { AgentMiddlewareManager } from './managers/agent-middleware.manager';
import { AgentRoutesManager } from './managers/agent-routes.manager';
import { RealResearchService } from '../services/real-research.service';
import { RealIntegrationService } from '../services/real-integration-service';

// Import existing route modules
import enhancedRoutes from '../routes/enhanced-api.routes';
import assistantRoutes from '../routes/assistant.routes';
import workflowAdminRoutes from '../routes/workflow-admin.routes';

export class AgentsServer implements IAgentServer {
  private app: Express;
  private server?: any;
  private config: AgentServerConfig;
  private dependencies: AgentServerDependencies;
  private state: AgentServerState;
  private middlewareManager: AgentMiddlewareManager;
  private routesManager: AgentRoutesManager;

  constructor(config?: Partial<AgentServerConfig>) {
    this.config = {
      port: parseInt(process.env.AGENTS_PORT || '3006', 10),
      corsOrigins: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
      ],
      bodyLimit: '50mb',
      environment: process.env.NODE_ENV || 'development',
      ...config,
    };

    this.app = express();

    // Initialize dependencies
    this.dependencies = {
      prisma: new PrismaClient(),
      researchService: new RealResearchService(),
      integrationService: new RealIntegrationService(),
    };

    this.state = {
      isRunning: false,
      startTime: new Date(),
      requestCount: 0,
      errorCount: 0,
    };

    // Initialize managers
    this.middlewareManager = new AgentMiddlewareManager(this.app, this.config);
    this.routesManager = new AgentRoutesManager(this.app, this.dependencies);

    this.initializeServer();
  }

  /**
   * Initialize server with middleware and routes
   */
  private initializeServer(): void {
    try {
      // Setup middleware
      this.middlewareManager.setupAll();

      // Setup custom routes managed by our router
      this.routesManager.setupAllRoutes();

      // Setup existing legacy routes
      this.setupLegacyRoutes();

      // Setup error handling (must be last)
      this.middlewareManager.setupErrorHandling();

      console.log('Agents server initialized successfully');
    } catch (error) {
      console.error('Failed to initialize agents server:', error);
      throw error;
    }
  }

  /**
   * Setup existing legacy routes
   */
  private setupLegacyRoutes(): void {
    try {
      // Mount existing route modules
      this.app.use('/api/enhanced', enhancedRoutes);
      this.app.use('/api/assistant', assistantRoutes);
      this.app.use('/api/workflow-admin', workflowAdminRoutes);

      console.log('Legacy routes mounted successfully');
    } catch (error) {
      console.error('Failed to mount legacy routes:', error);
      // Don't throw - legacy routes are optional for now
    }
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.config.port, () => {
          this.state.isRunning = true;
          this.state.startTime = new Date();

          console.log(`
🚀 Agents Server started successfully!
📡 Port: ${this.config.port}
🌍 Environment: ${this.config.environment}
🕐 Started: ${this.state.startTime.toISOString()}
📋 Health: http://localhost:${this.config.port}/api/health
          `);

          resolve();
        });

        this.server.on('error', (error: Error) => {
          console.error('Server error:', error);
          this.state.errorCount++;
          reject(error);
        });
      } catch (error) {
        console.error('Failed to start server:', error);
        reject(error);
      }
    });
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server || !this.state.isRunning) {
        console.log('Server is not running');
        resolve();
        return;
      }

      try {
        this.server.close(async (error?: Error) => {
          if (error) {
            console.error('Error stopping server:', error);
            reject(error);
            return;
          }

          // Close database connection
          try {
            await this.dependencies.prisma.$disconnect();
            console.log('Database connection closed');
          } catch (dbError) {
            console.error('Error closing database connection:', dbError);
          }

          this.state.isRunning = false;
          console.log('Agents server stopped successfully');
          resolve();
        });
      } catch (error) {
        console.error('Failed to stop server:', error);
        reject(error);
      }
    });
  }

  /**
   * Get server status
   */
  getStatus(): AgentServerState {
    return {
      ...this.state,
      // Calculate uptime in milliseconds
      ...(this.state.isRunning && {
        uptime: Date.now() - this.state.startTime.getTime(),
      }),
    };
  }

  /**
   * Restart the server
   */
  async restart(): Promise<void> {
    console.log('Restarting agents server...');

    await this.stop();

    // Wait a moment for cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));

    await this.start();

    console.log('Agents server restarted successfully');
  }

  /**
   * Get Express app instance (for testing)
   */
  getApp(): Express {
    return this.app;
  }

  /**
   * Get server configuration
   */
  getConfig(): AgentServerConfig {
    return { ...this.config };
  }

  /**
   * Get server dependencies
   */
  getDependencies(): AgentServerDependencies {
    return this.dependencies;
  }
}

// Export singleton instance and factory
let serverInstance: AgentsServer | null = null;

export const createAgentsServer = (
  config?: Partial<AgentServerConfig>
): AgentsServer => {
  if (!serverInstance) {
    serverInstance = new AgentsServer(config);
  }
  return serverInstance;
};

export const getAgentsServer = (): AgentsServer | null => {
  return serverInstance;
};

// Auto-start server when module is loaded directly
const isMainModule = typeof require !== 'undefined' && require.main === module;
const isDirectExecution =
  process.argv[1]?.includes('agents-server.ts') ||
  process.argv[1]?.includes('agents-server.js');

if (isMainModule || isDirectExecution) {
  const server = createAgentsServer();

  server.start().catch(error => {
    console.error('Failed to start agents server:', error);
    process.exit(1);
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    console.log(
      `\n${signal} received. Shutting down agents server gracefully...`
    );

    try {
      await server.stop();
      console.log('Agents server shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart
}

export default AgentsServer;
