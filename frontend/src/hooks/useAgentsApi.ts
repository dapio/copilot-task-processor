/**
 * Hook for Agents API Integration
 * ThinkCode AI Platform - Agents Management
 */

import { useState, useEffect, useCallback } from 'react';
import {
  agentsApiService,
  Agent,
  Project,
  KnowledgeFeed,
  ResearchResult,
  ApiResponse,
} from '../services/agentsApiService';
import { ApiError } from '../services/apiService';

// State interfaces
export interface AgentsState {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  connected: boolean;
}

export interface ProjectsState {
  projects: Project[];
  loading: boolean;
  error: string | null;
}

export interface KnowledgeState {
  feeds: KnowledgeFeed[];
  loading: boolean;
  error: string | null;
}

export interface ResearchState {
  results: ResearchResult[];
  loading: boolean;
  error: string | null;
}

/**
 * Main hook for Agents API
 */
export function useAgentsApi() {
  const [agentsState, setAgentsState] = useState<AgentsState>({
    agents: [],
    loading: false,
    error: null,
    connected: false,
  });

  const [projectsState, setProjectsState] = useState<ProjectsState>({
    projects: [],
    loading: false,
    error: null,
  });

  const [knowledgeState, setKnowledgeState] = useState<KnowledgeState>({
    feeds: [],
    loading: false,
    error: null,
  });

  const [researchState, setResearchState] = useState<ResearchState>({
    results: [],
    loading: false,
    error: null,
  });

  // Check connection on mount
  const checkConnection = useCallback(async () => {
    try {
      const isConnected = await agentsApiService.healthCheck();
      setAgentsState(prev => ({ ...prev, connected: isConnected }));
      return isConnected;
    } catch (error) {
      setAgentsState(prev => ({ ...prev, connected: false }));
      return false;
    }
  }, []);

  // Load agents
  const loadAgents = useCallback(async () => {
    setAgentsState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await agentsApiService.getAgents();

      if (response.success && response.data) {
        setAgentsState(prev => ({
          ...prev,
          agents: response.data!,
          loading: false,
          connected: true,
        }));
      } else {
        throw new Error(response.error || 'Failed to load agents');
      }
    } catch (error) {
      const errorMessage =
        error instanceof ApiError ? error.message : 'Failed to load agents';
      setAgentsState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        connected: false,
      }));
    }
  }, []);

  // Load projects
  const loadProjects = useCallback(async () => {
    setProjectsState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await agentsApiService.getProjects();

      if (response.success && response.data) {
        setProjectsState(prev => ({
          ...prev,
          projects: response.data!,
          loading: false,
        }));
      } else {
        throw new Error(response.error || 'Failed to load projects');
      }
    } catch (error) {
      const errorMessage =
        error instanceof ApiError ? error.message : 'Failed to load projects';
      setProjectsState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, []);

  // Load knowledge feeds
  const loadKnowledgeFeeds = useCallback(async (filters?: any) => {
    setKnowledgeState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await agentsApiService.getKnowledgeFeeds(filters);

      if (response.success && response.data) {
        setKnowledgeState(prev => ({
          ...prev,
          feeds: response.data!,
          loading: false,
        }));
      } else {
        throw new Error(response.error || 'Failed to load knowledge feeds');
      }
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : 'Failed to load knowledge feeds';
      setKnowledgeState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, []);

  // Search solutions
  const searchSolutions = useCallback(
    async (query: string, context?: string) => {
      setResearchState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const response = await agentsApiService.searchSolutions(query, context);

        if (response.success && response.data) {
          setResearchState(prev => ({
            ...prev,
            results: response.data!,
            loading: false,
          }));
        } else {
          throw new Error(response.error || 'Failed to search solutions');
        }
      } catch (error) {
        const errorMessage =
          error instanceof ApiError
            ? error.message
            : 'Failed to search solutions';
        setResearchState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      }
    },
    []
  );

  // Create project
  const createProject = useCallback(
    async (projectData: {
      name: string;
      description?: string;
      type: string;
      metadata?: any;
    }) => {
      try {
        const response = await agentsApiService.createProject(projectData);

        if (response.success) {
          // Reload projects
          await loadProjects();
          return response.data;
        } else {
          throw new Error(response.error || 'Failed to create project');
        }
      } catch (error) {
        const errorMessage =
          error instanceof ApiError
            ? error.message
            : 'Failed to create project';
        setProjectsState(prev => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    [loadProjects]
  );

  // Update agent status
  const updateAgentStatus = useCallback(
    async (agentId: string, isActive: boolean, currentWorkload?: number) => {
      try {
        const response = await agentsApiService.updateAgentStatus(
          agentId,
          isActive,
          currentWorkload
        );

        if (response.success) {
          // Reload agents
          await loadAgents();
          return response.data;
        } else {
          throw new Error(response.error || 'Failed to update agent status');
        }
      } catch (error) {
        const errorMessage =
          error instanceof ApiError
            ? error.message
            : 'Failed to update agent status';
        setAgentsState(prev => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    [loadAgents]
  );

  // Auto-check connection on mount
  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [checkConnection]);

  return {
    // States
    agents: agentsState,
    projects: projectsState,
    knowledge: knowledgeState,
    research: researchState,

    // Actions
    checkConnection,
    loadAgents,
    loadProjects,
    loadKnowledgeFeeds,
    searchSolutions,
    createProject,
    updateAgentStatus,

    // Utilities
    isConnected: agentsState.connected,
    isLoading:
      agentsState.loading ||
      projectsState.loading ||
      knowledgeState.loading ||
      researchState.loading,
  };
}
