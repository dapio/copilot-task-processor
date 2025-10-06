/**
 * React Hook for Workflow Admin Panel API Integration
 * Handles communication with backend API for workflow creation
 */

import { useState, useCallback, useEffect } from 'react';

// API Types
interface WorkflowCreationSession {
  id: string;
  chatSessionId: string;
  status: 'active' | 'completed' | 'cancelled';
  workflowInProgress: Partial<WorkflowTemplate>;
  currentStep:
    | 'basic_info'
    | 'steps_definition'
    | 'approvals_setup'
    | 'testing'
    | 'finalization';
  conversationHistory: string[];
  extractedInformation: {
    projectType?: string;
    complexity?: string;
    stakeholders?: string[];
    technicalRequirements?: string[];
    businessRequirements?: string[];
    approvalGates?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: 'simple' | 'medium' | 'complex' | 'enterprise';
  steps: WorkflowStep[];
  approvals: ApprovalGate[];
  estimatedDuration: number;
}

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type: string;
  provider: string;
}

interface ApprovalGate {
  id: string;
  stepId: string;
  approverType: string;
  required: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ChatMessageResponse {
  response: string;
  suggestedActions?: string[];
  workflowProgress?: Partial<WorkflowTemplate>;
  needsApproval?: boolean;
}

// API Service
class WorkflowAdminAPI {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/admin/workflow') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: any = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async createSession(
    title: string,
    initialPrompt?: string
  ): Promise<ApiResponse<{ sessionId: string }>> {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify({
        title,
        initialPrompt,
        createdBy: 'admin', // TODO: Get from auth context
      }),
    });
  }

  async getSessions(): Promise<
    ApiResponse<{ sessions: WorkflowCreationSession[] }>
  > {
    return this.request('/sessions');
  }

  async getSession(
    sessionId: string
  ): Promise<ApiResponse<{ session: WorkflowCreationSession }>> {
    return this.request(`/sessions/${sessionId}`);
  }

  async sendMessage(
    sessionId: string,
    message: string
  ): Promise<ApiResponse<ChatMessageResponse>> {
    return this.request('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ sessionId, message }),
    });
  }

  async generateWorkflow(
    sessionId: string
  ): Promise<ApiResponse<WorkflowTemplate>> {
    return this.request('/generate', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  }

  async finalizeWorkflow(
    sessionId: string,
    approvals?: { approvedBy: string; notes?: string }
  ): Promise<ApiResponse<string>> {
    return this.request('/finalize', {
      method: 'POST',
      body: JSON.stringify({ sessionId, approvals }),
    });
  }

  async cancelSession(
    sessionId: string
  ): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  async getHealth(): Promise<ApiResponse<any>> {
    return this.request('/health');
  }
}

// Singleton API instance
const api = new WorkflowAdminAPI();

// React Hook
export const useWorkflowAdmin = () => {
  const [sessions, setSessions] = useState<WorkflowCreationSession[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert date strings to Date objects
  const convertSession = (session: any): WorkflowCreationSession => ({
    ...session,
    createdAt: new Date(session.createdAt),
    updatedAt: new Date(session.updatedAt),
  });

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getSessions();
      if (result.success && result.data) {
        setSessions(result.data.sessions.map(convertSession));
        setError(null);
      } else {
        setError(result.error || 'Failed to load sessions');
      }
    } catch {
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const startNewSession = useCallback(
    async (title: string, initialPrompt?: string): Promise<string | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await api.createSession(title, initialPrompt);

        if (result.success && result.data) {
          // Reload sessions to get the new one
          await loadSessions();
          setActiveSession(result.data.sessionId);
          return result.data.sessionId;
        } else {
          setError(result.error || 'Failed to create session');
          return null;
        }
      } catch {
        setError('Failed to create session');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [loadSessions]
  );

  const sendMessage = useCallback(
    async (sessionId: string, message: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const result = await api.sendMessage(sessionId, message);

        if (result.success) {
          // Update local session with new conversation
          setSessions(prev =>
            prev.map(session => {
              if (session.id === sessionId) {
                return {
                  ...session,
                  conversationHistory: [
                    ...session.conversationHistory,
                    `User: ${message}`,
                    `Assistant: ${result.data?.response || 'AI response'}`,
                  ],
                  updatedAt: new Date(),
                  workflowProgress:
                    result.data?.workflowProgress || session.workflowInProgress,
                };
              }
              return session;
            })
          );
          return true;
        } else {
          setError(result.error || 'Failed to send message');
          return false;
        }
      } catch {
        setError('Failed to send message');
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const generateWorkflow = useCallback(
    async (sessionId: string): Promise<WorkflowTemplate | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await api.generateWorkflow(sessionId);

        if (result.success && result.data) {
          // Update session with generated workflow
          setSessions(prev =>
            prev.map(session => {
              if (session.id === sessionId) {
                return {
                  ...session,
                  workflowInProgress: result.data!,
                  currentStep: 'finalization' as const,
                  updatedAt: new Date(),
                };
              }
              return session;
            })
          );
          return result.data;
        } else {
          setError(result.error || 'Failed to generate workflow');
          return null;
        }
      } catch {
        setError('Failed to generate workflow');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const finalizeWorkflow = useCallback(
    async (
      sessionId: string,
      approvals?: { approvedBy: string; notes?: string }
    ): Promise<string | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await api.finalizeWorkflow(sessionId, approvals);

        if (result.success && result.data) {
          // Mark session as completed
          setSessions(prev =>
            prev.map(session => {
              if (session.id === sessionId) {
                return {
                  ...session,
                  status: 'completed' as const,
                  updatedAt: new Date(),
                };
              }
              return session;
            })
          );
          return result.data;
        } else {
          setError(result.error || 'Failed to finalize workflow');
          return null;
        }
      } catch {
        setError('Failed to finalize workflow');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const cancelSession = useCallback(
    async (sessionId: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const result = await api.cancelSession(sessionId);

        if (result.success) {
          // Mark session as cancelled
          setSessions(prev =>
            prev.map(session => {
              if (session.id === sessionId) {
                return {
                  ...session,
                  status: 'cancelled' as const,
                  updatedAt: new Date(),
                };
              }
              return session;
            })
          );

          // Clear active session if it was cancelled
          if (activeSession === sessionId) {
            setActiveSession(null);
          }

          return true;
        } else {
          setError(result.error || 'Failed to cancel session');
          return false;
        }
      } catch {
        setError('Failed to cancel session');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [activeSession]
  );

  const refreshSession = useCallback(
    async (sessionId: string): Promise<boolean> => {
      try {
        const result = await api.getSession(sessionId);

        if (result.success && result.data) {
          setSessions(prev =>
            prev.map(session =>
              session.id === sessionId
                ? convertSession(result.data!.session)
                : session
            )
          );
          return true;
        } else {
          setError(result.error || 'Failed to refresh session');
          return false;
        }
      } catch {
        setError('Failed to refresh session');
        return false;
      }
    },
    []
  );

  // Derived state
  const activeSessionData = sessions.find(s => s.id === activeSession);
  const activeSessions = sessions.filter(s => s.status === 'active');
  const completedSessions = sessions.filter(s => s.status === 'completed');

  return {
    // State
    sessions,
    activeSession,
    activeSessionData,
    activeSessions,
    completedSessions,
    loading,
    error,

    // Actions
    startNewSession,
    sendMessage,
    generateWorkflow,
    finalizeWorkflow,
    cancelSession,
    refreshSession,
    loadSessions,

    // Control
    setActiveSession,
    setError,
  };
};

export default useWorkflowAdmin;
