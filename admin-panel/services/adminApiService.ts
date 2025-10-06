/**
 * Admin Panel API Service
 * ThinkCode AI Platform - Workflow Admin Management
 */

import { ApiError } from './apiService';

export interface WorkflowSession {
  id: string;
  title: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  messages: WorkflowMessage[];
}

export interface WorkflowMessage {
  id: string;
  sessionId: string;
  message: string;
  response?: string;
  timestamp: string;
  type: 'user' | 'assistant';
}

export interface AdminApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * Service for Admin Panel API interactions
 */
export class AdminApiService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3006/api/admin') {
    this.baseUrl = baseUrl;
  }

  // ==========================================
  // WORKFLOW SESSION MANAGEMENT
  // ==========================================

  /**
   * Create new workflow creation session
   */
  async createWorkflowSession(data: {
    title: string;
    initialPrompt?: string;
    createdBy: string;
  }): Promise<AdminApiResponse<{ sessionId: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/workflow/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new ApiError(
          'Failed to create workflow session',
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to create workflow session', 500);
    }
  }

  /**
   * Get all workflow sessions
   */
  async getWorkflowSessions(): Promise<AdminApiResponse<WorkflowSession[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/workflow/sessions`);

      if (!response.ok) {
        throw new ApiError(
          'Failed to fetch workflow sessions',
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to fetch workflow sessions', 500);
    }
  }

  /**
   * Get specific workflow session
   */
  async getWorkflowSession(
    sessionId: string
  ): Promise<AdminApiResponse<WorkflowSession>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/workflow/sessions/${sessionId}`
      );

      if (!response.ok) {
        throw new ApiError('Failed to fetch workflow session', response.status);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to fetch workflow session', 500);
    }
  }

  /**
   * Send message to workflow session
   */
  async sendMessage(data: {
    sessionId: string;
    message: string;
  }): Promise<AdminApiResponse<WorkflowMessage>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/workflow/sessions/${data.sessionId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: data.message }),
        }
      );

      if (!response.ok) {
        throw new ApiError('Failed to send message', response.status);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to send message', 500);
    }
  }

  /**
   * Generate workflow from session
   */
  async generateWorkflow(sessionId: string): Promise<AdminApiResponse<any>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/workflow/sessions/${sessionId}/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        throw new ApiError('Failed to generate workflow', response.status);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to generate workflow', 500);
    }
  }

  /**
   * Finalize workflow
   */
  async finalizeWorkflow(data: {
    sessionId: string;
    approvals?: {
      approvedBy: string;
      notes?: string;
    };
  }): Promise<AdminApiResponse<any>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/workflow/sessions/${data.sessionId}/finalize`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data.approvals),
        }
      );

      if (!response.ok) {
        throw new ApiError('Failed to finalize workflow', response.status);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to finalize workflow', 500);
    }
  }

  // ==========================================
  // ADMIN UTILITIES
  // ==========================================

  /**
   * Health check for Admin API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/../health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get admin statistics
   */
  async getStatistics(): Promise<AdminApiResponse<any>> {
    try {
      const agentsResponse = await fetch(`${this.baseUrl}/../agents`);
      const projectsResponse = await fetch(`${this.baseUrl}/../projects`);
      const sessionsResponse = await fetch(`${this.baseUrl}/workflow/sessions`);

      const [agents, projects, sessions] = await Promise.all([
        agentsResponse.ok ? agentsResponse.json() : { data: [] },
        projectsResponse.ok ? projectsResponse.json() : { data: [] },
        sessionsResponse.ok ? sessionsResponse.json() : { data: [] },
      ]);

      const stats = {
        totalAgents: agents.data?.length || 0,
        activeAgents: agents.data?.filter((a: any) => a.isActive).length || 0,
        totalProjects: projects.data?.length || 0,
        activeProjects:
          projects.data?.filter((p: any) => p.status !== 'completed').length ||
          0,
        totalSessions: sessions.data?.length || 0,
        activeSessions:
          sessions.data?.filter((s: any) => s.status === 'active').length || 0,
      };

      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new ApiError('Failed to get admin statistics', 500);
    }
  }
}

// Export singleton instance
export const adminApiService = new AdminApiService();
