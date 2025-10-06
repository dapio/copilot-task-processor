/**
 * Custom Hook for Admin Panel Operations
 * ThinkCode AI Platform - Admin Panel State Management
 */

import { useState, useEffect, useCallback } from 'react';
import {
  adminApiService,
  AdminApiService,
  WorkflowSession,
  WorkflowMessage,
  AdminApiResponse,
} from '../services/adminApiService';

interface AdminState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  statistics: {
    totalAgents: number;
    activeAgents: number;
    totalProjects: number;
    activeProjects: number;
    totalSessions: number;
    activeSessions: number;
  } | null;
}

interface WorkflowSessionState {
  sessions: WorkflowSession[];
  currentSession: WorkflowSession | null;
  isLoadingSessions: boolean;
  isCreatingSession: boolean;
  isSendingMessage: boolean;
  isGenerating: boolean;
  isFinalizing: boolean;
  error: string | null;
}

/**
 * Main Admin Panel Hook
 */
export function useAdmin() {
  const [state, setState] = useState<AdminState>({
    isConnected: false,
    isLoading: true,
    error: null,
    statistics: null,
  });

  // Check admin API connection
  const checkConnection = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const isConnected = await adminApiService.healthCheck();

      if (isConnected) {
        const statsResponse = await adminApiService.getStatistics();
        setState(prev => ({
          ...prev,
          isConnected: true,
          statistics: statsResponse.data,
          isLoading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          isConnected: false,
          error: 'Admin API is not reachable',
          isLoading: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnected: false,
        error: error instanceof Error ? error.message : 'Connection failed',
        isLoading: false,
      }));
    }
  }, []);

  // Refresh statistics
  const refreshStatistics = useCallback(async () => {
    if (!state.isConnected) return;

    try {
      const response = await adminApiService.getStatistics();
      setState(prev => ({
        ...prev,
        statistics: response.data,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to refresh statistics',
      }));
    }
  }, [state.isConnected]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    ...state,
    checkConnection,
    refreshStatistics,
  };
}

/**
 * Workflow Sessions Management Hook
 */
export function useWorkflowSessions() {
  const [state, setState] = useState<WorkflowSessionState>({
    sessions: [],
    currentSession: null,
    isLoadingSessions: false,
    isCreatingSession: false,
    isSendingMessage: false,
    isGenerating: false,
    isFinalizing: false,
    error: null,
  });

  // Load all sessions
  const loadSessions = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoadingSessions: true, error: null }));
      const response = await adminApiService.getWorkflowSessions();

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          sessions: response.data || [],
          isLoadingSessions: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to load sessions',
          isLoadingSessions: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error:
          error instanceof Error ? error.message : 'Failed to load sessions',
        isLoadingSessions: false,
      }));
    }
  }, []);

  // Create new session
  const createSession = useCallback(
    async (data: {
      title: string;
      initialPrompt?: string;
      createdBy: string;
    }) => {
      try {
        setState(prev => ({ ...prev, isCreatingSession: true, error: null }));
        const response = await adminApiService.createWorkflowSession(data);

        if (response.success && response.data) {
          await loadSessions(); // Refresh sessions list
          return response.data.sessionId;
        } else {
          setState(prev => ({
            ...prev,
            error: response.error || 'Failed to create session',
            isCreatingSession: false,
          }));
          return null;
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          error:
            error instanceof Error ? error.message : 'Failed to create session',
          isCreatingSession: false,
        }));
        return null;
      } finally {
        setState(prev => ({ ...prev, isCreatingSession: false }));
      }
    },
    [loadSessions]
  );

  // Load specific session
  const loadSession = useCallback(async (sessionId: string) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const response = await adminApiService.getWorkflowSession(sessionId);

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          currentSession: response.data || null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to load session',
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error:
          error instanceof Error ? error.message : 'Failed to load session',
      }));
    }
  }, []);

  // Send message to session
  const sendMessage = useCallback(
    async (sessionId: string, message: string) => {
      try {
        setState(prev => ({ ...prev, isSendingMessage: true, error: null }));
        const response = await adminApiService.sendMessage({
          sessionId,
          message,
        });

        if (response.success) {
          // Reload current session to get updated messages
          await loadSession(sessionId);
          return true;
        } else {
          setState(prev => ({
            ...prev,
            error: response.error || 'Failed to send message',
          }));
          return false;
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          error:
            error instanceof Error ? error.message : 'Failed to send message',
        }));
        return false;
      } finally {
        setState(prev => ({ ...prev, isSendingMessage: false }));
      }
    },
    [loadSession]
  );

  // Generate workflow from session
  const generateWorkflow = useCallback(
    async (sessionId: string) => {
      try {
        setState(prev => ({ ...prev, isGenerating: true, error: null }));
        const response = await adminApiService.generateWorkflow(sessionId);

        if (response.success) {
          await loadSession(sessionId); // Refresh session data
          return response.data;
        } else {
          setState(prev => ({
            ...prev,
            error: response.error || 'Failed to generate workflow',
          }));
          return null;
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to generate workflow',
        }));
        return null;
      } finally {
        setState(prev => ({ ...prev, isGenerating: false }));
      }
    },
    [loadSession]
  );

  // Finalize workflow
  const finalizeWorkflow = useCallback(
    async (
      sessionId: string,
      approvals?: { approvedBy: string; notes?: string }
    ) => {
      try {
        setState(prev => ({ ...prev, isFinalizing: true, error: null }));
        const response = await adminApiService.finalizeWorkflow({
          sessionId,
          approvals,
        });

        if (response.success) {
          await loadSession(sessionId); // Refresh session data
          await loadSessions(); // Refresh sessions list
          return response.data;
        } else {
          setState(prev => ({
            ...prev,
            error: response.error || 'Failed to finalize workflow',
          }));
          return null;
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to finalize workflow',
        }));
        return null;
      } finally {
        setState(prev => ({ ...prev, isFinalizing: false }));
      }
    },
    [loadSession, loadSessions]
  );

  // Clear current session
  const clearCurrentSession = useCallback(() => {
    setState(prev => ({ ...prev, currentSession: null }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    ...state,
    loadSessions,
    createSession,
    loadSession,
    sendMessage,
    generateWorkflow,
    finalizeWorkflow,
    clearCurrentSession,
    clearError,
  };
}
