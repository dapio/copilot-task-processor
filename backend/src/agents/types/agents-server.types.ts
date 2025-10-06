/**
 * Agents Server Types
 * Type definitions for the agents server
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

export interface AgentServerConfig {
  port: number;
  corsOrigins: string[];
  bodyLimit: string;
  environment: string;
}

export interface AgentServerDependencies {
  prisma: PrismaClient;
  researchService: any;
  integrationService: any;
}

export interface AgentServerState {
  isRunning: boolean;
  startTime: Date;
  requestCount: number;
  errorCount: number;
}

export interface HealthCheckResponse {
  success: boolean;
  message: string;
  timestamp: string;
  uptime: number;
  environment: string;
  port: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
  count?: number;
}

export interface AgentEndpointHandler {
  (req: Request, res: Response): Promise<void>;
}

export interface IAgentMiddleware {
  setupCors(): void;
  setupBodyParser(): void;
  setupLogging(): void;
  setupErrorHandling(): void;
}

export interface IAgentRoutes {
  setupHealthRoutes(): void;
  setupAgentRoutes(): void;
  setupCommunicationRoutes(): void;
  setupDecisionRoutes(): void;
  setupWorkflowRoutes(): void;
  setupInstructionRoutes(): void;
}

export interface IAgentServer {
  start(): Promise<void>;
  stop(): Promise<void>;
  getStatus(): AgentServerState;
  restart(): Promise<void>;
}
