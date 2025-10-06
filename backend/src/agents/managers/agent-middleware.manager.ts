/**
 * Agents Server Middleware Manager
 * Handles middleware configuration for the agents server
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import {
  IAgentMiddleware,
  AgentServerConfig,
} from '../types/agents-server.types';

export class AgentMiddlewareManager implements IAgentMiddleware {
  private app: Express;
  private config: AgentServerConfig;

  constructor(app: Express, config: AgentServerConfig) {
    this.app = app;
    this.config = config;
  }

  /**
   * Setup CORS middleware
   */
  setupCors(): void {
    this.app.use(
      cors({
        origin: this.config.corsOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
      })
    );
  }

  /**
   * Setup body parser middleware
   */
  setupBodyParser(): void {
    this.app.use(express.json({ limit: this.config.bodyLimit }));
    this.app.use(
      express.urlencoded({ extended: true, limit: this.config.bodyLimit })
    );
  }

  /**
   * Setup request logging middleware
   */
  setupLogging(): void {
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

      // Add request start time for performance tracking
      (req as any).startTime = Date.now();

      // Track response completion
      res.on('finish', () => {
        const duration = Date.now() - (req as any).startTime;
        console.log(
          `[${new Date().toISOString()}] ${req.method} ${req.url} - ` +
            `${res.statusCode} (${duration}ms)`
        );
      });

      next();
    });
  }

  /**
   * Setup error handling middleware
   */
  setupErrorHandling(): void {
    // 404 handler for unknown routes
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
      });
    });

    // Global error handler
    this.app.use((err: Error, req: Request, res: Response) => {
      console.error('Server error:', err);

      // Prevent sending multiple responses
      if (res.headersSent) {
        return;
      }

      const statusCode = (err as any).statusCode || 500;

      res.status(statusCode).json({
        success: false,
        error: 'Internal server error',
        message: err.message,
        timestamp: new Date().toISOString(),
        ...(this.config.environment === 'development' && {
          stack: err.stack,
        }),
      });
    });
  }

  /**
   * Initialize all middleware
   */
  setupAll(): void {
    this.setupCors();
    this.setupBodyParser();
    this.setupLogging();
    // Note: Error handling should be setup after routes
  }
}
