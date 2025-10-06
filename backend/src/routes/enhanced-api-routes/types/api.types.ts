/**
 * Enhanced API Routes Types
 * Definicje typów dla Enhanced API
 */

import { Request, Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface EnhancedApiDependencies {
  prisma: any;
  contextManager: any;
  chatService: any;
  workflowController: any;
  copilotProvider: any;
}

export interface RouteHandler {
  (req: Request, res: Response): Promise<void>;
}

export interface ProviderTestRequest {
  prompt?: string;
  options?: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
  };
}

export interface ContextCreateRequest {
  name: string;
  projectId?: string;
  agentId?: string;
  systemPrompt?: string;
  parentContextId?: string;
  workspace?: {
    rootPath?: string;
    includePatterns?: string[];
    excludePatterns?: string[];
  };
}

export interface ChatMessageRequest {
  message: string;
  contextId?: string;
  provider?: string;
  agentId?: string;
  attachments?: {
    type: 'file' | 'image' | 'code' | 'workspace';
    name: string;
    content: string;
  }[];
  settings?: {
    includeContext?: boolean;
    includeWorkspace?: boolean;
    maxContextMessages?: number;
    temperature?: number;
    maxTokens?: number;
  };
}

export interface WorkflowExecutionRequest {
  templateId?: string;
  contextId: string;
  contextType: 'project' | 'agent';
  projectId?: string;
  parameters?: Record<string, any>;
  providerOverrides?: Record<string, string>;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  enableChat?: boolean;
  customSteps?: {
    name: string;
    description?: string;
    type:
      | 'ai_generation'
      | 'human_review'
      | 'data_processing'
      | 'integration'
      | 'validation';
    provider?: string;
    dependencies: string[];
    configuration: Record<string, any>;
  }[];
}
