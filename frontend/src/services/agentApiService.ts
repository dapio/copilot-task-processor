/**
 * Real Agent API Service
 * ThinkCode AI Platform - PRAWDZIWE API AGENTÓW
 */

import { Agent } from '../types/project';

const AGENTS_API_BASE =
  process.env.NEXT_PUBLIC_AGENTS_API_URL || 'http://localhost:3006/api';

export interface AgentApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface CreateAgentRequest {
  name: string;
  type: string;
  capabilities?: string[];
  config?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface UpdateAgentRequest {
  name?: string;
  type?: string;
  status?: 'idle' | 'active' | 'busy' | 'error';
  capabilities?: string[];
  config?: Record<string, any>;
  metadata?: Record<string, any>;
}

class AgentApiService {
  private async fetchApi<T>(
    endpoint: string,
    options?: any
  ): Promise<AgentApiResponse<T>> {
    try {
      const response = await fetch(`${AGENTS_API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error(`API Error [${endpoint}]:`, error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Pobierz wszystkich agentów
   */
  async getAgents(): Promise<AgentApiResponse<Agent[]>> {
    return this.fetchApi<Agent[]>('/agents');
  }

  /**
   * Pobierz agenta po ID
   */
  async getAgent(id: string): Promise<AgentApiResponse<Agent>> {
    return this.fetchApi<Agent>(`/agents/${id}`);
  }

  /**
   * Utwórz nowego agenta
   */
  async createAgent(
    agentData: CreateAgentRequest
  ): Promise<AgentApiResponse<Agent>> {
    return this.fetchApi<Agent>('/agents', {
      method: 'POST',
      body: JSON.stringify(agentData),
    });
  }

  /**
   * Zaktualizuj agenta
   */
  async updateAgent(
    id: string,
    agentData: UpdateAgentRequest
  ): Promise<AgentApiResponse<Agent>> {
    return this.fetchApi<Agent>(`/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(agentData),
    });
  }

  /**
   * Usuń agenta
   */
  async deleteAgent(id: string): Promise<AgentApiResponse<void>> {
    return this.fetchApi<void>(`/agents/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Kontroluj agenta (start/stop/pause/restart)
   */
  async controlAgent(
    id: string,
    action: 'start' | 'pause' | 'stop' | 'restart'
  ): Promise<AgentApiResponse<void>> {
    return this.fetchApi<void>(`/agents/${id}/control`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  }

  /**
   * Pobierz metryki agentów
   */
  async getAgentMetrics(): Promise<AgentApiResponse<any>> {
    return this.fetchApi<any>('/agents/metrics');
  }

  /**
   * Sprawdź status API
   */
  async healthCheck(): Promise<AgentApiResponse<any>> {
    return this.fetchApi<any>('/health');
  }

  // ===== WORKFLOW API METHODS =====

  /**
   * Pobierz workflow projektu
   */
  async getProjectWorkflow(projectId: string): Promise<AgentApiResponse<any>> {
    return this.fetchApi<any>(`/projects/${projectId}/workflow`);
  }

  /**
   * Rozpocznij workflow
   */
  async startWorkflow(
    projectId: string,
    workflowType?: string
  ): Promise<AgentApiResponse<any>> {
    return this.fetchApi<any>(`/projects/${projectId}/workflow/start`, {
      method: 'POST',
      body: JSON.stringify({ workflowType }),
    });
  }

  // ===== CHAT API METHODS =====

  /**
   * Pobierz historię czatu
   */
  async getChatHistory(projectId: string): Promise<AgentApiResponse<any[]>> {
    return this.fetchApi<any[]>(`/projects/${projectId}/chat`);
  }

  /**
   * Wyślij wiadomość w czacie
   */
  async sendMessage(
    projectId: string,
    message: string
  ): Promise<AgentApiResponse<any>> {
    return this.fetchApi<any>(`/projects/${projectId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }
}

export const agentApiService = new AgentApiService();
export default agentApiService;
