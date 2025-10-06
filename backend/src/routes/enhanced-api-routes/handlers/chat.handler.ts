/**
 * Chat Routes Handler
 * Obsługa endpointów związanych z chatem
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import {
  ApiResponse,
  EnhancedApiDependencies,
  ChatMessageRequest,
} from '../types/api.types';
import { chatMessageSchema } from '../schemas/validation.schemas';

export class ChatRoutesHandler {
  private deps: EnhancedApiDependencies;

  constructor(dependencies: EnhancedApiDependencies) {
    this.deps = dependencies;
  }

  /**
   * POST /api/enhanced/chat/sessions
   * Tworzy nową sesję chatu
   */
  async createChatSession(req: Request, res: Response): Promise<void> {
    try {
      const { contextId, contextType = 'project', title } = req.body;

      if (!contextId) {
        res.status(400).json({
          success: false,
          error: 'ID kontekstu jest wymagane',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const sessionId = await this.deps.chatService.createSession({
        contextId,
        contextType: contextType as 'project' | 'agent',
        title: title || `Chat Session ${Date.now()}`,
      });

      const response: ApiResponse = {
        success: true,
        data: {
          sessionId,
          contextId,
          contextType,
          title,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: 'Błąd tworzenia sesji chatu',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }

  /**
   * POST /api/enhanced/chat/sessions/:sessionId/message
   * Wysyła wiadomość w sesji chatu
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const validatedData = chatMessageSchema.parse(
        req.body
      ) as ChatMessageRequest;

      // Dodaj ID do attachments jeśli istnieją
      const attachments = validatedData.attachments?.map(att => ({
        ...att,
        id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }));

      const result = await this.deps.chatService.processMessage({
        sessionId,
        message: validatedData.message,
        contextId: validatedData.contextId,
        provider: validatedData.provider,
        agentId: validatedData.agentId,
        attachments,
        settings: validatedData.settings,
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error.message,
          code: result.error.code,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
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
        error: 'Błąd przetwarzania wiadomości',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }

  /**
   * GET /api/enhanced/chat/sessions/:sessionId/messages
   * Pobiera wiadomości z sesji chatu
   */
  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const messages = await this.deps.chatService.getSessionMessages(
        sessionId,
        {
          limit: parseInt(limit as string, 10),
          offset: parseInt(offset as string, 10),
        }
      );

      const response: ApiResponse = {
        success: true,
        data: messages,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: 'Błąd pobierania wiadomości',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }

  /**
   * GET /api/enhanced/chat/sessions/:sessionId
   * Pobiera szczegóły sesji chatu
   */
  async getSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      const session = await this.deps.chatService.getSession(sessionId);

      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Sesja chatu nie została znaleziona',
          message: `Sesja o ID ${sessionId} nie istnieje`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: session,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: 'Błąd pobierania sesji chatu',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }

  /**
   * DELETE /api/enhanced/chat/sessions/:sessionId
   * Usuwa sesję chatu
   */
  async deleteSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      const success = await this.deps.chatService.deleteSession(sessionId);

      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Sesja chatu nie została znaleziona',
          message: `Sesja o ID ${sessionId} nie istnieje lub nie może być usunięta`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: {
          sessionId,
          message: 'Sesja chatu została usunięta pomyślnie',
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: 'Błąd usuwania sesji chatu',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }
}
