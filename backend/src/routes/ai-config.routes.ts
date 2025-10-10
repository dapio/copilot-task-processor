/**
 * AI Configuration Routes
 * Backend endpoints for managing AI provider configuration
 */

import { Router, Request, Response } from 'express';
import { agentModelAssignmentService } from '../services/agent-model-assignment.service';

export const aiConfigRoutes = Router();

/**
 * Get current AI configuration
 */
aiConfigRoutes.get('/configuration', async (req: Request, res: Response) => {
  try {
    // Get available providers (simplified for now)
    const providerConfigs = [
      {
        id: 'groq',
        name: 'Groq (Darmowy)',
        type: 'groq',
        enabled: true,
        isDefault: true,
        models: [
          'llama-3.1-70b-versatile',
          'llama-3.1-8b-instant',
          'mixtral-8x7b-32768',
          'gemma2-9b-it',
        ],
        defaultModel: 'llama-3.1-70b-versatile',
        settings: {
          maxTokens: 8192,
          temperature: 0.7,
          timeout: 30000,
        },
      },
      {
        id: 'openai',
        name: 'OpenAI',
        type: 'openai',
        enabled: false,
        isDefault: false,
        models: ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'],
        defaultModel: 'gpt-4',
        settings: {
          maxTokens: 4096,
          temperature: 0.7,
          timeout: 30000,
        },
      },
    ];

    const configuration = {
      defaultProvider: 'groq',
      fallbackProvider: 'groq',
      enableFallback: true,
      providers: providerConfigs,
      globalSettings: {
        maxTokens: 4096,
        temperature: 0.7,
        enableMemory: true,
        sessionTimeout: 3600000,
      },
    };

    res.json({
      success: true,
      data: configuration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting AI configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI configuration',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Update AI configuration
 */
aiConfigRoutes.put('/configuration', async (req: Request, res: Response) => {
  try {
    const { defaultProvider, fallbackProvider } = req.body;

    // Basic validation (simplified)
    const validProviders = ['groq', 'openai', 'anthropic', 'google'];

    if (defaultProvider && !validProviders.includes(defaultProvider)) {
      return res.status(400).json({
        success: false,
        error: `Provider '${defaultProvider}' not supported`,
        timestamp: new Date().toISOString(),
      });
    }

    if (fallbackProvider && !validProviders.includes(fallbackProvider)) {
      return res.status(400).json({
        success: false,
        error: `Fallback provider '${fallbackProvider}' not supported`,
        timestamp: new Date().toISOString(),
      });
    }

    // TODO: Store configuration in database/config service
    // For now, just return success

    res.json({
      success: true,
      data: { updated: true },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating AI configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update AI configuration',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Update provider API key
 */
aiConfigRoutes.put(
  '/providers/:providerId/api-key',
  async (req: Request, res: Response) => {
    try {
      const { providerId } = req.params;
      const { apiKey } = req.body;

      if (!apiKey || typeof apiKey !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'API key is required',
          timestamp: new Date().toISOString(),
        });
      }

      // Basic validation
      const validProviders = ['groq', 'openai', 'anthropic', 'google'];
      if (!validProviders.includes(providerId)) {
        return res.status(404).json({
          success: false,
          error: `Provider '${providerId}' not supported`,
          timestamp: new Date().toISOString(),
        });
      }

      // TODO: Store API key securely in environment/config service

      res.json({
        success: true,
        data: { updated: true },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating provider API key:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update API key',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * Test provider connection
 */
aiConfigRoutes.post(
  '/providers/:providerId/test',
  async (req: Request, res: Response) => {
    try {
      const { providerId } = req.params;

      const validProviders = ['groq', 'openai', 'anthropic', 'google'];
      if (!validProviders.includes(providerId)) {
        return res.status(404).json({
          success: false,
          error: `Provider '${providerId}' not supported`,
          timestamp: new Date().toISOString(),
        });
      }

      // TODO: Implement actual provider health checks
      const isHealthy = providerId === 'groq'; // Groq is always healthy in demo

      res.json({
        success: true,
        data: {
          provider: providerId,
          status: isHealthy ? 'healthy' : 'unhealthy',
          message: isHealthy
            ? 'Provider is working correctly'
            : 'Provider requires configuration',
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error testing provider:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test provider',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * Get available models for provider
 */
aiConfigRoutes.get(
  '/providers/:providerId/models',
  async (req: Request, res: Response) => {
    try {
      const { providerId } = req.params;

      const providerModels: Record<string, string[]> = {
        groq: [
          'llama-3.1-70b-versatile',
          'llama-3.1-8b-instant',
          'mixtral-8x7b-32768',
          'gemma2-9b-it',
        ],
        openai: ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'],
        anthropic: [
          'claude-3-5-sonnet-20241022',
          'claude-3-opus-20240229',
          'claude-3-haiku-20240307',
        ],
        google: ['gemini-1.5-pro', 'gemini-1.5-flash'],
      };

      const models = providerModels[providerId];
      if (!models) {
        return res.status(404).json({
          success: false,
          error: `Provider '${providerId}' not supported`,
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        success: true,
        data: {
          provider: providerId,
          models: models,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error getting provider models:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get provider models',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * Get agent-provider assignments
 */
aiConfigRoutes.get(
  '/agent-assignments',
  async (req: Request, res: Response) => {
    try {
      const assignments = agentModelAssignmentService.getAllAssignments();

      const formattedAssignments = Object.entries(assignments).map(
        ([agentType, assignment]) => ({
          agentType,
          primaryProvider: assignment.primaryProvider,
          fallbackProviders: assignment.fallbackProviders || [],
        })
      );

      res.json({
        success: true,
        data: formattedAssignments,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error getting agent assignments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get agent assignments',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * Update agent-provider assignments
 */
aiConfigRoutes.put(
  '/agent-assignments',
  async (req: Request, res: Response) => {
    try {
      const { assignments } = req.body;

      if (!Array.isArray(assignments)) {
        return res.status(400).json({
          success: false,
          error: 'Assignments must be an array',
          timestamp: new Date().toISOString(),
        });
      }

      // Validate assignment format
      for (const assignment of assignments) {
        if (!assignment.agentType || !assignment.primaryProvider) {
          return res.status(400).json({
            success: false,
            error: 'Each assignment must have agentType and primaryProvider',
            timestamp: new Date().toISOString(),
          });
        }

        // Validate provider exists
        const validProviders = ['groq', 'openai', 'anthropic', 'google'];
        if (!validProviders.includes(assignment.primaryProvider)) {
          return res.status(400).json({
            success: false,
            error: `Primary provider '${assignment.primaryProvider}' not supported`,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // TODO: Update assignments in agent model assignment service
      // For now, just return success

      res.json({
        success: true,
        data: { updated: true },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating agent assignments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update agent assignments',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

export default aiConfigRoutes;
