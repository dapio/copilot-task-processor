/**
 * Agents API Service - Integracja z Agents Server (port 3002)
 * ThinkCode AI Platform - Agents Management
 */

import { ApiError } from './apiService';

export interface Agent {
  id: string;
  name: string;
  role: string;
  department: string;
  isActive: boolean;
  currentWorkload: number;
  capabilities: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  createdAt: string;
  workflows: Workflow[];
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  projectId: string;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  stepNumber: number;
  name: string;
  description?: string;
  status: string;
  assignedAgent?: Agent;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  count?: number;
}

export interface KnowledgeFeed {
  id: string;
  title: string;
  type: string;
  department: string;
  content: string;
  isActive: boolean;
  createdAt: string;
}

export interface ResearchResult {
  title: string;
  url: string;
  content: string;
  summary: string;
  relevanceScore: number;
  source: string;
  tags: string[];
}

/**
 * Service for interacting with Agents API (port 3002)
 */
export class AgentsApiService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3002/api') {
    this.baseUrl = baseUrl;
  }

  // ==========================================
  // AGENTS MANAGEMENT
  // ==========================================

  /**
   * Get all agents
   */
  async getAgents(): Promise<ApiResponse<Agent[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/agents`);

      if (!response.ok) {
        throw new ApiError(response.status, 'Failed to fetch agents');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to connect to agents API');
    }
  }

  /**
   * Get agent by ID
   */
  async getAgent(agentId: string): Promise<ApiResponse<Agent>> {
    try {
      const response = await fetch(`${this.baseUrl}/agents/${agentId}`);

      if (!response.ok) {
        throw new ApiError(response.status, 'Failed to fetch agent');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to connect to agents API');
    }
  }

  /**
   * Update agent status
   */
  async updateAgentStatus(
    agentId: string,
    isActive: boolean,
    currentWorkload?: number
  ): Promise<ApiResponse<Agent>> {
    try {
      const response = await fetch(`${this.baseUrl}/agents/${agentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive, currentWorkload }),
      });

      if (!response.ok) {
        throw new ApiError(response.status, 'Failed to update agent status');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to update agent status');
    }
  }

  // ==========================================
  // PROJECTS MANAGEMENT
  // ==========================================

  /**
   * Get all projects
   */
  async getProjects(): Promise<ApiResponse<Project[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/projects`);

      if (!response.ok) {
        throw new ApiError(response.status, 'Failed to fetch projects');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to connect to agents API');
    }
  }

  /**
   * Create new project
   */
  async createProject(project: {
    name: string;
    description?: string;
    type: string;
    metadata?: any;
  }): Promise<ApiResponse<Project>> {
    try {
      const response = await fetch(`${this.baseUrl}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });

      if (!response.ok) {
        throw new ApiError(response.status, 'Failed to create project');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to create project');
    }
  }

  /**
   * Get recommended team for project
   */
  async getRecommendedTeam(projectId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/projects/${projectId}/recommended-team`
      );

      if (!response.ok) {
        throw new ApiError(response.status, 'Failed to get recommended team');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to get recommended team');
    }
  }

  // ==========================================
  // KNOWLEDGE FEEDS
  // ==========================================

  /**
   * Get knowledge feeds
   */
  async getKnowledgeFeeds(
    filters?: any
  ): Promise<ApiResponse<KnowledgeFeed[]>> {
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`${this.baseUrl}/knowledge/feeds?${params}`);

      if (!response.ok) {
        throw new ApiError(response.status, 'Failed to fetch knowledge feeds');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to fetch knowledge feeds');
    }
  }

  // ==========================================
  // RESEARCH CAPABILITIES
  // ==========================================

  /**
   * Search for solutions
   */
  async searchSolutions(
    query: string,
    context?: string,
    agentId?: string
  ): Promise<ApiResponse<ResearchResult[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/research/solutions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, context, agentId }),
      });

      if (!response.ok) {
        throw new ApiError(response.status, 'Failed to search solutions');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to search solutions');
    }
  }

  /**
   * Research integrations
   */
  async researchIntegrations(
    technology: string,
    context?: string,
    agentId?: string
  ): Promise<ApiResponse<ResearchResult[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/research/integrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technology, context, agentId }),
      });

      if (!response.ok) {
        throw new ApiError(response.status, 'Failed to research integrations');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to research integrations');
    }
  }

  /**
   * Health check for Agents API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const agentsApiService = new AgentsApiService();
