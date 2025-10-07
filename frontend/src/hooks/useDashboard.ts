/**
 * Dashboard Hook - Centralny hook do zarządzania stanem dashboard
 * @description Obsługuje wszystkie operacje związane z dashboard i projektami
 */

import { useState, useEffect, useCallback } from 'react';
import { useBackendApi } from './useBackendApi';
import type {
  ProjectData,
  Agent,
  ConversationData,
  DashboardState,
  DashboardView,
  DashboardMetrics,
} from '../types/dashboard.types';

export const useDashboard = () => {
  // Stan główny dashboard
  const [state, setState] = useState<DashboardState>({
    activeView: 'overview',
    selectedProject: null,
    selectedAgent: null,
    searchTerm: '',
    loading: false,
    error: null,
    showNewProjectModal: false,
    showNewConversationModal: false,
    showMockupApprovalModal: false,
  });

  // Dane aplikacji
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  const { executeWithRetry, isConnected } = useBackendApi();

  // Ładowanie projektów
  const loadProjects = useCallback(async (): Promise<ProjectData[]> => {
    const result = await executeWithRetry(() => fetch('/api/projects'), 3);

    if (result.success && result.data) {
      const response = result.data as Response;
      if (response.ok) {
        return await response.json();
      }
    }

    throw new Error('Nie można załadować projektów z API');
  }, [executeWithRetry]);

  // Ładowanie agentów
  const loadAgents = useCallback(async (): Promise<Agent[]> => {
    const result = await executeWithRetry(() => fetch('/api/agents'), 3);

    if (result.success && result.data) {
      const response = result.data as Response;
      if (response.ok) {
        return await response.json();
      }
    }

    throw new Error('Nie można załadować agentów z API');
  }, [executeWithRetry]);

  // Ładowanie konwersacji
  const loadConversations = useCallback(async (): Promise<
    ConversationData[]
  > => {
    const result = await executeWithRetry(
      () => fetch('/api/chat/conversations'),
      3
    );

    if (result.success && result.data) {
      const response = result.data as Response;
      if (response.ok) {
        return await response.json();
      }
    }

    throw new Error('Nie można załadować konwersacji z API');
  }, [executeWithRetry]);

  // Ładowanie metryk
  const loadMetrics = useCallback(async (): Promise<DashboardMetrics> => {
    const result = await executeWithRetry(
      () => fetch('/api/dashboard/metrics'),
      3
    );

    if (result.success && result.data) {
      const response = result.data as Response;
      if (response.ok) {
        return await response.json();
      }
    }

    throw new Error('Nie można załadować metryk z API');
  }, [executeWithRetry]);

  const loadInitialData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Równoległe ładowanie danych
      const [projectsResult, agentsResult, conversationsResult] =
        await Promise.allSettled([
          loadProjects(),
          loadAgents(),
          loadConversations(),
        ]);

      // Przetwarzanie wyników
      let loadedProjects: ProjectData[] = [];
      let loadedAgents: Agent[] = [];

      if (projectsResult.status === 'fulfilled') {
        loadedProjects = projectsResult.value;
        setProjects(loadedProjects);
      }
      if (agentsResult.status === 'fulfilled') {
        loadedAgents = agentsResult.value;
        setAgents(loadedAgents);
      }
      if (conversationsResult.status === 'fulfilled') {
        setConversations(conversationsResult.value);
      }

      // Ładuj metryki po załadowaniu projektów i agentów
      const metricsResult = await loadMetrics();
      setMetrics(metricsResult);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Błąd ładowania danych: ${
          error instanceof Error ? error.message : 'Nieznany błąd'
        }`,
      }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [loadProjects, loadAgents, loadConversations, loadMetrics]);

  // Ładowanie danych przy starcie
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Tworzenie nowego projektu
  const createProject = useCallback(
    async (projectData: Omit<ProjectData, 'id'>) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await executeWithRetry(
          () =>
            fetch('/api/projects', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(projectData),
            }),
          3
        );

        if (result.success && result.data) {
          const response = result.data as Response;
          if (response.ok) {
            const newProject = await response.json();
            setProjects(prev => [...prev, newProject]);
            setState(prev => ({ ...prev, showNewProjectModal: false }));
            return { success: true, project: newProject };
          }
        }

        throw new Error('Nie udało się utworzyć projektu');
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Nieznany błąd';
        setState(prev => ({
          ...prev,
          error: `Błąd tworzenia projektu: ${errorMessage}`,
        }));
        return { success: false, error: errorMessage };
      } finally {
        setState(prev => ({ ...prev, loading: false }));
      }
    },
    [executeWithRetry]
  );

  // Aktualizacja projektu
  const updateProject = useCallback(
    async (projectId: string, updates: Partial<ProjectData>) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await executeWithRetry(
          () =>
            fetch(`/api/projects/${projectId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates),
            }),
          3
        );

        if (result.success && result.data) {
          const response = result.data as Response;
          if (response.ok) {
            const updatedProject = await response.json();
            setProjects(prev =>
              prev.map(p => (p.id === projectId ? updatedProject : p))
            );
            return { success: true, project: updatedProject };
          }
        }

        throw new Error('Nie udało się zaktualizować projektu');
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Nieznany błąd';
        setState(prev => ({
          ...prev,
          error: `Błąd aktualizacji projektu: ${errorMessage}`,
        }));
        return { success: false, error: errorMessage };
      } finally {
        setState(prev => ({ ...prev, loading: false }));
      }
    },
    [executeWithRetry]
  );

  // Funkcje pomocnicze dla stanu
  const updateState = useCallback((updates: Partial<DashboardState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setActiveView = useCallback(
    (view: DashboardView) => {
      updateState({ activeView: view });
    },
    [updateState]
  );

  const selectProject = useCallback(
    (project: ProjectData | null) => {
      updateState({ selectedProject: project });
    },
    [updateState]
  );

  const selectAgent = useCallback(
    (agent: Agent | null) => {
      updateState({ selectedAgent: agent });
    },
    [updateState]
  );

  // Filtrowanie i wyszukiwanie
  const filteredProjects = projects.filter(
    project =>
      project.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(state.searchTerm.toLowerCase())
  );

  const filteredAgents = agents.filter(
    agent =>
      agent.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      agent.role.toLowerCase().includes(state.searchTerm.toLowerCase())
  );

  return {
    // Stan
    state,
    projects: filteredProjects,
    allProjects: projects,
    agents: filteredAgents,
    allAgents: agents,
    conversations,
    metrics,
    isConnected,

    // Akcje
    updateState,
    setActiveView,
    selectProject,
    selectAgent,
    createProject,
    updateProject,
    loadInitialData,

    // Utilities
    refreshData: loadInitialData,
  };
};
