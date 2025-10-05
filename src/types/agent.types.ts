/**
 * 🤖 **Agent Types & Interfaces**
 *
 * Core type definitions for AI agents in the ThinkCode platform
 */

export interface AgentConfig {
  id: string;
  name: string;
  type: string;
  version: string;
  capabilities: string[];
  settings: Record<string, any>;
  knowledgeFeeds?: string[];
}

export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    processingTime: number;
    knowledgeUsed?: boolean;
    confidence?: number;
    [key: string]: any;
  };
}

export interface AgentContext {
  requestId: string;
  timestamp: number;
  userContext?: Record<string, any>;
  projectContext?: Record<string, any>;
}

export interface AgentPerformanceMetrics {
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  knowledgeUsageRate: number;
  lastUpdated: Date;
}
