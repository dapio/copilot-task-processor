/**
 * Enhanced API Routes Schemas
 * Validation schemas dla Enhanced API
 */

import { z } from 'zod';

export const createContextSchema = z.object({
  name: z.string().min(1),
  projectId: z.string().optional(),
  agentId: z.string().optional(),
  systemPrompt: z.string().optional(),
  parentContextId: z.string().optional(),
  workspace: z
    .object({
      rootPath: z.string().optional(),
      includePatterns: z.array(z.string()).optional(),
      excludePatterns: z.array(z.string()).optional(),
    })
    .optional(),
});

export const chatMessageSchema = z.object({
  message: z.string().min(1),
  contextId: z.string().optional(),
  provider: z.string().optional(),
  agentId: z.string().optional(),
  attachments: z
    .array(
      z.object({
        type: z.enum(['file', 'image', 'code', 'workspace']),
        name: z.string(),
        content: z.string(),
      })
    )
    .optional(),
  settings: z
    .object({
      includeContext: z.boolean().optional(),
      includeWorkspace: z.boolean().optional(),
      maxContextMessages: z.number().optional(),
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().min(1).max(8000).optional(),
    })
    .optional(),
});

export const workflowExecutionSchema = z.object({
  templateId: z.string().optional(),
  contextId: z.string(),
  contextType: z.enum(['project', 'agent']),
  projectId: z.string().optional(),
  parameters: z.record(z.string(), z.any()).optional(),
  providerOverrides: z.record(z.string(), z.string()).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  enableChat: z.boolean().optional(),
  customSteps: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        type: z.enum([
          'ai_generation',
          'human_review',
          'data_processing',
          'integration',
          'validation',
        ]),
        provider: z.string().optional(),
        dependencies: z.array(z.string()),
        configuration: z.record(z.string(), z.any()),
      })
    )
    .optional(),
});

export const workflowTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  category: z.enum([
    'code_generation',
    'analysis',
    'documentation',
    'review',
    'automation',
  ]),
  complexity: z.enum(['simple', 'medium', 'complex', 'enterprise']),
  estimatedDuration: z.number().min(1000),
  providerStrategy: z.object({
    primary: z.string(),
    fallbacks: z.array(z.string()),
    loadBalancing: z.boolean().optional(),
    costOptimization: z.boolean().optional(),
    contextAffinity: z.boolean().optional(),
  }),
  requirements: z.object({
    minimumProviders: z.array(z.string()),
    optionalProviders: z.array(z.string()),
    contextRequired: z.boolean(),
    workspaceAccess: z.boolean(),
  }),
  steps: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      type: z.enum([
        'ai_generation',
        'human_review',
        'data_processing',
        'integration',
        'validation',
      ]),
      agentId: z.string().optional(),
      provider: z.string().optional(),
      dependencies: z.array(z.string()),
      configuration: z.record(z.string(), z.any()),
      maxRetries: z.number().min(0).max(5),
    })
  ),
});
