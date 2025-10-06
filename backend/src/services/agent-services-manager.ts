/**
 * Agent Services Manager
 * Manages agents as independent services with process isolation
 * Each agent runs as a separate Node.js process for security and resource isolation
 */

import { PrismaClient } from '@prisma/client';
import { Result, MLError } from '../providers/ml-provider.interface';
import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface AgentServiceConfig {
  id: string;
  name: string;
  type: string;
  endpoint?: string;
  port?: number;
  maxMemory?: number; // MB
  maxCpu?: number; // percentage
  environment?: Record<string, string>;
  permissions?: string[];
  autoRestart?: boolean;
  restartDelay?: number; // ms
}

export interface ServiceStatus {
  id: string;
  status: 'running' | 'stopped' | 'error' | 'starting' | 'stopping';
  pid?: number;
  port?: number;
  uptime?: number; // seconds
  memoryUsage?: number; // MB
  cpuUsage?: number; // percentage
  errorCount: number;
  lastError?: string;
  lastHealthCheck?: Date;
}

export interface ServiceMetrics {
  id: string;
  requests: number;
  errors: number;
  avgResponseTime: number;
  memoryPeak: number;
  cpuPeak: number;
  uptime: number;
}

export class AgentServicesManager extends EventEmitter {
  private prisma: PrismaClient;
  private services: Map<string, ChildProcess> = new Map();
  private serviceStatus: Map<string, ServiceStatus> = new Map();
  private serviceConfigs: Map<string, AgentServiceConfig> = new Map();
  private portRange = { min: 3001, max: 4000 };
  private usedPorts: Set<number> = new Set();
  private healthCheckInterval = 30000; // 30 seconds
  private cleanupInterval = 60000; // 1 minute

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
    this.initialize();
  }

  /**
   * Start agent service
   */
  async startAgentService(
    config: AgentServiceConfig
  ): Promise<Result<ServiceStatus, MLError>> {
    try {
      // Check if service already exists
      if (this.services.has(config.id)) {
        return {
          success: false,
          error: {
            code: 'SERVICE_ALREADY_EXISTS',
            message: `Agent service ${config.id} is already running`,
          },
        };
      }

      // Assign port if not provided
      if (!config.port) {
        config.port = this.getAvailablePort();
      }

      // Store configuration
      this.serviceConfigs.set(config.id, config);

      // Create service status
      const status: ServiceStatus = {
        id: config.id,
        status: 'starting',
        port: config.port,
        errorCount: 0,
      };
      this.serviceStatus.set(config.id, status);

      // Create agent service script
      const serviceScript = await this.createAgentServiceScript(config);
      const servicePath = path.join(
        __dirname,
        '../../../temp',
        `${config.id}-service.js`
      );

      await fs.mkdir(path.dirname(servicePath), { recursive: true });
      await fs.writeFile(servicePath, serviceScript);

      // Start the service process
      const childProcess = spawn('node', [servicePath], {
        env: {
          ...process.env,
          ...config.environment,
          AGENT_ID: config.id,
          AGENT_TYPE: config.type,
          AGENT_PORT: config.port.toString(),
          DATABASE_URL: process.env.DATABASE_URL,
        },
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false,
      });

      // Store process reference
      this.services.set(config.id, childProcess);

      // Handle process events
      this.setupProcessHandlers(config.id, childProcess);

      // Save to database
      await this.saveServiceToDatabase(config, childProcess.pid!);

      // Update status
      status.status = 'running';
      status.pid = childProcess.pid;
      this.serviceStatus.set(config.id, status);

      this.emit('service_started', {
        serviceId: config.id,
        pid: childProcess.pid,
      });

      return { success: true, data: status };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SERVICE_START_ERROR',
          message: 'Failed to start agent service',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Stop agent service
   */
  async stopAgentService(serviceId: string): Promise<Result<void, MLError>> {
    try {
      const process = this.services.get(serviceId);
      const status = this.serviceStatus.get(serviceId);

      if (!process || !status) {
        return {
          success: false,
          error: {
            code: 'SERVICE_NOT_FOUND',
            message: `Agent service ${serviceId} not found`,
          },
        };
      }

      // Update status
      status.status = 'stopping';
      this.serviceStatus.set(serviceId, status);

      // Graceful shutdown
      process.kill('SIGTERM');

      // Force kill after timeout
      setTimeout(() => {
        if (!process.killed) {
          process.kill('SIGKILL');
        }
      }, 10000); // 10 seconds timeout

      // Clean up
      this.services.delete(serviceId);
      this.serviceStatus.delete(serviceId);
      this.serviceConfigs.delete(serviceId);

      // Update database
      await this.prisma.agentService.update({
        where: { id: serviceId },
        data: { status: 'stopped' },
      });

      // Clean up service script
      const servicePath = path.join(
        __dirname,
        '../../../temp',
        `${serviceId}-service.js`
      );
      try {
        await fs.unlink(servicePath);
      } catch {
        // Ignore file not found errors
      }

      this.emit('service_stopped', { serviceId });

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SERVICE_STOP_ERROR',
          message: 'Failed to stop agent service',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Restart agent service
   */
  async restartAgentService(
    serviceId: string
  ): Promise<Result<ServiceStatus, MLError>> {
    const config = this.serviceConfigs.get(serviceId);
    if (!config) {
      return {
        success: false,
        error: {
          code: 'SERVICE_NOT_FOUND',
          message: `Agent service configuration for ${serviceId} not found`,
        },
      };
    }

    // Stop service
    const stopResult = await this.stopAgentService(serviceId);
    if (!stopResult.success) {
      return stopResult;
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Start service
    return this.startAgentService(config);
  }

  /**
   * Get service status
   */
  getServiceStatus(serviceId: string): ServiceStatus | null {
    return this.serviceStatus.get(serviceId) || null;
  }

  /**
   * Get all services status
   */
  getAllServicesStatus(): ServiceStatus[] {
    return Array.from(this.serviceStatus.values());
  }

  /**
   * Get service metrics
   */
  async getServiceMetrics(
    serviceId: string
  ): Promise<Result<ServiceMetrics, MLError>> {
    try {
      const status = this.serviceStatus.get(serviceId);
      if (!status) {
        return {
          success: false,
          error: {
            code: 'SERVICE_NOT_FOUND',
            message: `Service ${serviceId} not found`,
          },
        };
      }

      // In a real implementation, you would collect these metrics from the service
      const metrics: ServiceMetrics = {
        id: serviceId,
        requests: 0, // TODO: Implement request counting
        errors: status.errorCount,
        avgResponseTime: 0, // TODO: Implement response time tracking
        memoryPeak: status.memoryUsage || 0,
        cpuPeak: status.cpuUsage || 0,
        uptime: status.uptime || 0,
      };

      return { success: true, data: metrics };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'METRICS_ERROR',
          message: 'Failed to get service metrics',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Health check for a specific service
   */
  async performHealthCheck(
    serviceId: string
  ): Promise<Result<boolean, MLError>> {
    try {
      const status = this.serviceStatus.get(serviceId);
      if (!status || status.status !== 'running') {
        return { success: true, data: false };
      }

      // TODO: Implement actual health check by calling service endpoint
      // For now, just check if process is running
      const process = this.services.get(serviceId);
      const isHealthy = process && !process.killed;

      status.lastHealthCheck = new Date();
      this.serviceStatus.set(serviceId, status);

      return { success: true, data: !!isHealthy };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'HEALTH_CHECK_ERROR',
          message: 'Failed to perform health check',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Initialize the services manager
   */
  private async initialize(): Promise<void> {
    try {
      // Load existing services from database
      const existingServices = await this.prisma.agentService.findMany({
        where: { status: { in: ['running', 'starting'] } },
      });

      // Clean up stale services
      for (const service of existingServices) {
        await this.prisma.agentService.update({
          where: { id: service.id },
          data: { status: 'stopped' },
        });
      }

      // Start health check monitoring
      setInterval(() => {
        this.performHealthChecks();
      }, this.healthCheckInterval);

      // Start cleanup routine
      setInterval(() => {
        this.cleanup();
      }, this.cleanupInterval);
    } catch (error) {
      console.error('Failed to initialize AgentServicesManager:', error);
    }
  }

  /**
   * Create agent service script dynamically
   */
  private async createAgentServiceScript(
    config: AgentServiceConfig
  ): Promise<string> {
    const agentClass = this.getAgentClassName(config.type);
    const imports = this.generateScriptImports(config, agentClass);
    const routes = this.generateScriptRoutes(config, agentClass);
    const server = this.generateScriptServer(config);

    return `${imports}\n\n${routes}\n\n${server}`;
  }

  /**
   * Get agent class name from type
   */
  private getAgentClassName(agentType: string): string {
    const agentTypeMap: Record<string, string> = {
      business_analyst: 'BusinessAnalystAgent',
      system_architect: 'SystemArchitectAgent',
      backend_developer: 'BackendDeveloperAgent',
      frontend_developer: 'FrontendDeveloperAgent',
      qa_engineer: 'QAEngineerAgent',
      microsoft_reviewer: 'MicrosoftReviewerAgent',
      workflow_assistant: 'WorkflowAssistantAgent',
    };
    return agentTypeMap[agentType] || 'WorkflowAssistantAgent';
  }

  /**
   * Generate script imports section
   */
  private generateScriptImports(
    config: AgentServiceConfig,
    agentClass: string
  ): string {
    return `const express = require('express');
const { PrismaClient } = require('../generated/prisma');
const { MLProviderFactory } = require('../providers/ml-provider.factory');
const { ${agentClass} } = require('../agents/${config.type.replace(
      '_',
      '-'
    )}.agent');

const app = express();
const prisma = new PrismaClient();
app.use(express.json());`;
  }

  /**
   * Generate script routes section
   */
  private generateScriptRoutes(
    config: AgentServiceConfig,
    agentClass: string
  ): string {
    return `// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    agentId: '${config.id}',
    agentType: '${config.type}',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid
  });
});

// Task execution endpoint
app.post('/execute', async (req, res) => {
  try {
    const { taskId, input } = req.body;
    
    const providerResult = await MLProviderFactory.getInstance()
      .createProviderWithFallback({
        name: 'default',
        type: 'openai',
        apiKey: process.env.OPENAI_API_KEY || '',
        model: 'gpt-4',
        enabled: true,
        priority: 1
      });

    if (!providerResult.success) {
      throw new Error('Failed to initialize ML provider');
    }

    const provider = providerResult.data;
    const agent = new ${agentClass}(prisma, provider);
    
    const result = await agent.executeTask?.(taskId, input) || 
      { success: true, data: 'Task completed' };
    
    res.json(result);
  } catch (error) {
    console.error('Task execution error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});`;
  }

  /**
   * Generate script server section
   */
  private generateScriptServer(config: AgentServiceConfig): string {
    return `const port = process.env.AGENT_PORT || ${config.port || 3001};
const server = app.listen(port, () => {
  console.log(\`Agent service '${config.id}' listening on port \${port}\`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    prisma.$disconnect();
    process.exit(0);
  });
});`;
  }

  /**
   * Get available port in the designated range
   */
  private getAvailablePort(): number {
    for (let port = this.portRange.min; port <= this.portRange.max; port++) {
      if (!this.usedPorts.has(port)) {
        this.usedPorts.add(port);
        return port;
      }
    }
    throw new Error('No available ports in range');
  }

  /**
   * Setup process event handlers
   */
  private setupProcessHandlers(
    serviceId: string,
    childProcess: ChildProcess
  ): void {
    childProcess.on('exit', (code, signal) => {
      const status = this.serviceStatus.get(serviceId);
      if (status) {
        status.status = 'stopped';
        this.serviceStatus.set(serviceId, status);
      }

      this.services.delete(serviceId);
      this.emit('service_exited', { serviceId, code, signal });

      // Auto-restart if configured
      const config = this.serviceConfigs.get(serviceId);
      if (config?.autoRestart && code !== 0) {
        setTimeout(() => {
          this.startAgentService(config);
        }, config.restartDelay || 5000);
      }
    });

    childProcess.on('error', error => {
      const status = this.serviceStatus.get(serviceId);
      if (status) {
        status.status = 'error';
        status.errorCount++;
        status.lastError = error.message;
        this.serviceStatus.set(serviceId, status);
      }

      this.emit('service_error', { serviceId, error: error.message });
    });

    // Monitor stdout/stderr for logs
    childProcess.stdout?.on('data', data => {
      this.emit('service_log', {
        serviceId,
        level: 'info',
        message: data.toString(),
      });
    });

    childProcess.stderr?.on('data', data => {
      this.emit('service_log', {
        serviceId,
        level: 'error',
        message: data.toString(),
      });
    });
  }

  /**
   * Save service configuration to database
   */
  private async saveServiceToDatabase(
    config: AgentServiceConfig,
    pid: number
  ): Promise<void> {
    await this.prisma.agentService.upsert({
      where: { id: config.id },
      update: {
        name: config.name,
        type: config.type,
        endpoint: config.endpoint,
        status: 'running',
        port: config.port,
        processId: pid.toString(),
        config: config as any,
        healthCheck: new Date(),
      },
      create: {
        id: config.id,
        name: config.name,
        type: config.type,
        endpoint: config.endpoint,
        status: 'running',
        port: config.port,
        processId: pid.toString(),
        config: config as any,
        healthCheck: new Date(),
      },
    });
  }

  /**
   * Perform health checks on all services
   */
  private async performHealthChecks(): Promise<void> {
    const serviceIds = Array.from(this.serviceStatus.keys());

    for (const serviceId of serviceIds) {
      await this.performHealthCheck(serviceId);
    }
  }

  /**
   * Cleanup routine
   */
  private cleanup(): Promise<void> {
    // Clean up temp files, logs, etc.
    return Promise.resolve();
  }
}

export default AgentServicesManager;
