/**
 * Context Routes Handler
 * Obsługa endpointów związanych z kontekstami
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import {
  ApiResponse,
  EnhancedApiDependencies,
  ContextCreateRequest,
} from '../types/api.types';
import { createContextSchema } from '../schemas/validation.schemas';

export class ContextRoutesHandler {
  private deps: EnhancedApiDependencies;

  constructor(dependencies: EnhancedApiDependencies) {
    this.deps = dependencies;
  }

  /**
   * POST /api/enhanced/contexts/project
   * Tworzy nowy kontekst projektu
   */
  async createProjectContext(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = createContextSchema.parse(
        req.body
      ) as ContextCreateRequest;

      if (!validatedData.projectId) {
        res.status(400).json({
          success: false,
          error: 'ID projektu jest wymagane dla kontekstu projektu',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const contextId = await this.deps.contextManager.createProjectContext({
        projectId: validatedData.projectId,
        name: validatedData.name,
        systemPrompt: validatedData.systemPrompt,
        workspace: validatedData.workspace,
      });

      const response: ApiResponse = {
        success: true,
        data: {
          contextId,
          type: 'project',
          name: validatedData.name,
          projectId: validatedData.projectId,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(201).json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Błąd walidacji',
          details: error.issues,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const response: ApiResponse = {
        success: false,
        error: 'Błąd tworzenia kontekstu projektu',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }

  /**
   * POST /api/enhanced/contexts/agent
   * Tworzy nowy kontekst agenta
   */
  async createAgentContext(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = createContextSchema.parse(
        req.body
      ) as ContextCreateRequest;

      if (!validatedData.agentId) {
        res.status(400).json({
          success: false,
          error: 'ID agenta jest wymagane dla kontekstu agenta',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const contextId = await this.deps.contextManager.createAgentContext({
        agentId: validatedData.agentId,
        parentProjectContextId: validatedData.parentContextId,
        name: validatedData.name,
        systemPrompt: validatedData.systemPrompt,
      });

      const response: ApiResponse = {
        success: true,
        data: {
          contextId,
          type: 'agent',
          name: validatedData.name,
          agentId: validatedData.agentId,
          parentProjectContextId: validatedData.parentContextId,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(201).json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Błąd walidacji',
          details: error.issues,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const response: ApiResponse = {
        success: false,
        error: 'Błąd tworzenia kontekstu agenta',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }

  /**
   * GET /api/enhanced/contexts/:contextId
   * Pobiera szczegóły kontekstu
   */
  async getContext(req: Request, res: Response): Promise<void> {
    try {
      const { contextId } = req.params;
      const { type = 'auto' } = req.query;

      let context = null;
      let contextType = type;

      // Auto-detect context type if needed
      if (type === 'auto') {
        // Try project context first
        try {
          context = await this.deps.contextManager.getProjectContext(contextId);
          if (context) {
            contextType = 'project';
          }
        } catch {
          // Try agent context
          try {
            context = await this.deps.contextManager.getAgentContext(contextId);
            if (context) {
              contextType = 'agent';
            }
          } catch {
            // Context not found
          }
        }
      } else {
        // Get specific context type
        if (type === 'project') {
          context = await this.deps.contextManager.getProjectContext(contextId);
        } else if (type === 'agent') {
          context = await this.deps.contextManager.getAgentContext(contextId);
        }
      }

      if (!context) {
        res.status(404).json({
          success: false,
          error: 'Kontekst nie został znaleziony',
          message: `Kontekst o ID ${contextId} nie istnieje`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: {
          ...context,
          type: contextType,
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: 'Błąd pobierania kontekstu',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }

  /**
   * DELETE /api/enhanced/contexts/:contextId
   * Usuwa kontekst
   */
  async deleteContext(req: Request, res: Response): Promise<void> {
    try {
      const { contextId } = req.params;
      const { type } = req.query;

      let success = false;

      if (type === 'project' || type === 'auto') {
        try {
          success = await this.deps.contextManager.deleteProjectContext(
            contextId
          );
        } catch {
          // Try agent context if project failed
        }
      }

      if (!success && (type === 'agent' || type === 'auto')) {
        try {
          success = await this.deps.contextManager.deleteAgentContext(
            contextId
          );
        } catch {
          // Context not found
        }
      }

      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Kontekst nie został znaleziony',
          message: `Kontekst o ID ${contextId} nie istnieje lub nie może być usunięty`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: {
          contextId,
          message: 'Kontekst został usunięty pomyślnie',
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: 'Błąd usuwania kontekstu',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }
}
