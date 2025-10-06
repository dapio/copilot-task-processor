/**
 * Provider Routes Handler
 * Obsługa endpointów związanych z providerami ML
 */

import { Request, Response } from 'express';
import {
  ApiResponse,
  EnhancedApiDependencies,
  ProviderTestRequest,
} from '../types/api.types';

export class ProviderRoutesHandler {
  private deps: EnhancedApiDependencies;

  constructor(dependencies: EnhancedApiDependencies) {
    this.deps = dependencies;
  }

  /**
   * GET /api/enhanced/providers
   * Pobiera listę dostępnych providerów z ich statusem
   */
  async getProviders(req: Request, res: Response): Promise<void> {
    try {
      const providers = this.deps.workflowController.getProviders();

      const response: ApiResponse = {
        success: true,
        data: {
          providers,
          total: providers.length,
          healthy: providers.filter((p: any) => p.status === 'healthy').length,
          degraded: providers.filter((p: any) => p.status === 'degraded')
            .length,
          unhealthy: providers.filter((p: any) => p.status === 'unhealthy')
            .length,
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: 'Błąd pobierania providerów',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }

  /**
   * POST /api/enhanced/providers/:name/test
   * Testuje konkretny provider
   */
  async testProvider(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      const { prompt = 'Test connection', options = {} }: ProviderTestRequest =
        req.body;

      // Obsługuje tylko GitHub Copilot provider na razie
      if (name !== 'github-copilot') {
        res.status(404).json({
          success: false,
          error: 'Provider nie został znaleziony',
          message: `Provider ${name} nie jest zarejestrowany`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Test generowania tekstu
      const testResult = await this.deps.copilotProvider.generateText(prompt, {
        maxTokens: options.maxTokens || 50,
        temperature: options.temperature || 0.7,
      });

      // Test health check
      const healthResult = await this.deps.copilotProvider.healthCheck();

      const response: ApiResponse = {
        success: true,
        data: {
          provider: name,
          testResult: testResult.success,
          response: testResult.success
            ? testResult.data.text
            : testResult.error.message,
          health: healthResult.success ? healthResult.data : healthResult.error,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: 'Test providera nieudany',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }

  /**
   * GET /api/enhanced/providers/:name/health
   * Sprawdza health konkretnego providera
   */
  async getProviderHealth(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;

      if (name !== 'github-copilot') {
        res.status(404).json({
          success: false,
          error: 'Provider nie został znaleziony',
          message: `Provider ${name} nie jest zarejestrowany`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const healthResult = await this.deps.copilotProvider.healthCheck();

      const response: ApiResponse = {
        success: true,
        data: {
          provider: name,
          health: healthResult.success ? healthResult.data : healthResult.error,
          status: healthResult.success ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: 'Błąd sprawdzania health providera',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }

  /**
   * GET /api/enhanced/providers/stats
   * Pobiera statystyki wszystkich providerów
   */
  async getProviderStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = this.deps.workflowController.getProviderStats();

      const response: ApiResponse = {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: 'Błąd pobierania statystyk providerów',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }
}
