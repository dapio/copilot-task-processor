/**
 * Enhanced Workflow Hook
 * Zarządza stanem workflow z integracją backendu
 */

import { useState, useEffect, useCallback } from 'react';

export interface AgentProfile {
  id: string;
  displayName: string;
  firstName?: string;
  color: string;
  icon: string;
  bio?: string;
  specialties: string[];
}

export interface WorkflowStep {
  id: string;
  stepName: string;
  stepNumber: number;
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  isActive: boolean;
  canProceed: boolean;
  hasActivity: boolean;
  assignedAgents: AgentProfile[];
  conversationCount: number;
  taskCount: number;
  lastActivity: string;
  description?: string;
}

export interface ProjectFile {
  id: string;
  filename: string;
  originalName: string;
  category: 'input' | 'output' | 'mockup' | 'document' | 'analysis';
  status: 'uploaded' | 'processing' | 'processed' | 'analyzed';
  size: number;
  mimeType: string;
  createdAt: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  agentType?: string;
  content: string;
  messageType: 'text' | 'task' | 'question' | 'analysis' | 'file';
  timestamp: string;
  isImportant: boolean;
  agent?: AgentProfile;
}

export interface StepTask {
  id: string;
  title: string;
  description?: string;
  type: 'analysis' | 'review' | 'question' | 'approval' | 'generation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
  assignedTo?: string;
  questions: string[];
  progress: number;
  agent?: AgentProfile;
}

export interface WorkflowHookProps {
  projectId: string;
  workflowRunId: string;
}

export interface WorkflowHookResult {
  // State
  currentStepId: string;
  steps: WorkflowStep[];
  files: ProjectFile[];
  conversations: ConversationMessage[];
  tasks: StepTask[];
  loading: boolean;
  error: string | null;

  // Actions
  startStep: (stepId: string) => Promise<void>;
  approveStep: (stepId: string, comments?: string) => Promise<void>;
  rejectStep: (stepId: string, reason: string) => Promise<void>;
  requestRevision: (stepId: string, comments: string) => Promise<void>;
  sendMessage: (stepId: string, message: string) => Promise<void>;
  uploadFiles: (stepId: string, files: FileList) => Promise<void>;
  setCurrentStep: (stepId: string) => void;
  refreshData: () => Promise<void>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useEnhancedWorkflow({
  projectId,
  workflowRunId,
}: WorkflowHookProps): WorkflowHookResult {
  const [currentStepId, setCurrentStepId] = useState<string>('');
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [conversations, setConversations] = useState<ConversationMessage[]>([]);
  const [tasks, setTasks] = useState<StepTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch workflow data from backend
  const fetchWorkflowData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch workflow steps from new control API
      const stepsResponse = await fetch(
        `${API_BASE_URL}/api/workflow-control/steps/${workflowRunId}?projectId=${projectId}`
      );

      if (!stepsResponse.ok) {
        throw new Error('Failed to fetch workflow steps');
      }

      const stepsData = await stepsResponse.json();
      setSteps(stepsData);

      // Find active step
      const activeStep = stepsData.find((step: WorkflowStep) => step.isActive);
      if (activeStep && !currentStepId) {
        setCurrentStepId(activeStep.id);
      }

      // Fetch project files
      const filesResponse = await fetch(
        `${API_BASE_URL}/api/workflow-step/project/${projectId}/files`
      );

      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        setFiles(filesData);
      }

      // Fetch conversations for current step
      if (currentStepId) {
        const conversationsResponse = await fetch(
          `${API_BASE_URL}/api/workflow-step/project/${projectId}/run/${workflowRunId}/step/${currentStepId}/conversations`
        );

        if (conversationsResponse.ok) {
          const conversationsData = await conversationsResponse.json();
          setConversations(conversationsData);
        }

        // Fetch tasks for current step
        const tasksResponse = await fetch(
          `${API_BASE_URL}/api/workflow-step/project/${projectId}/run/${workflowRunId}/step/${currentStepId}/tasks`
        );

        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          setTasks(tasksData);
        }
      }
    } catch (err) {
      console.error('Error fetching workflow data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [projectId, workflowRunId, currentStepId]);

  // Initialize data on mount
  useEffect(() => {
    fetchWorkflowData();
  }, [fetchWorkflowData]);

  // Start a workflow step
  const startStep = useCallback(
    async (stepId: string) => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/workflow-control/step/start`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              projectId,
              workflowRunId,
              stepId,
              action: 'start',
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to start step');
        }

        await fetchWorkflowData();
      } catch (err) {
        console.error('Error starting step:', err);
        setError(err instanceof Error ? err.message : 'Failed to start step');
      }
    },
    [projectId, workflowRunId, fetchWorkflowData]
  );

  // Approve a workflow step
  const approveStep = useCallback(
    async (stepId: string, comments?: string) => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/workflow-control/step/approve`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              projectId,
              workflowRunId,
              stepId,
              action: 'approve',
              comments: comments || '',
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to approve step');
        }

        await fetchWorkflowData();
      } catch (err) {
        console.error('Error approving step:', err);
        setError(err instanceof Error ? err.message : 'Failed to approve step');
      }
    },
    [projectId, workflowRunId, fetchWorkflowData]
  );

  // Reject a workflow step
  const rejectStep = useCallback(
    async (stepId: string, reason: string) => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/workflow-control/step/reject`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              projectId,
              workflowRunId,
              stepId,
              action: 'reject',
              comments: reason,
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to reject step');
        }

        await fetchWorkflowData();
      } catch (err) {
        console.error('Error rejecting step:', err);
        setError(err instanceof Error ? err.message : 'Failed to reject step');
      }
    },
    [projectId, workflowRunId, fetchWorkflowData]
  );

  // Request revision for a workflow step
  const requestRevision = useCallback(
    async (stepId: string, comments: string) => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/workflow-control/step/revision`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              projectId,
              workflowRunId,
              stepId,
              action: 'request_revision',
              comments,
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to request revision');
        }

        await fetchWorkflowData();
      } catch (err) {
        console.error('Error requesting revision:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to request revision'
        );
      }
    },
    [projectId, workflowRunId, fetchWorkflowData]
  );

  // Send message in step conversation
  const sendMessage = useCallback(
    async (stepId: string, message: string) => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/workflow-step/project/${projectId}/run/${workflowRunId}/step/${stepId}/conversation`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: message,
              messageType: 'text',
              role: 'user',
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        // Refresh conversations
        await fetchWorkflowData();
      } catch (err) {
        console.error('Error sending message:', err);
        setError(err instanceof Error ? err.message : 'Failed to send message');
      }
    },
    [projectId, workflowRunId, fetchWorkflowData]
  );

  // Upload files for a step
  const uploadFiles = useCallback(
    async (stepId: string, fileList: FileList) => {
      try {
        const formData = new FormData();

        for (let i = 0; i < fileList.length; i++) {
          formData.append('files', fileList[i]);
        }

        formData.append('stepId', stepId);
        formData.append('category', 'input');

        const response = await fetch(
          `${API_BASE_URL}/api/workflow-step/project/${projectId}/files/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error('Failed to upload files');
        }

        await fetchWorkflowData();
      } catch (err) {
        console.error('Error uploading files:', err);
        setError(err instanceof Error ? err.message : 'Failed to upload files');
      }
    },
    [projectId, fetchWorkflowData]
  );

  // Set current step
  const setCurrentStep = useCallback((stepId: string) => {
    setCurrentStepId(stepId);
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await fetchWorkflowData();
  }, [fetchWorkflowData]);

  return {
    // State
    currentStepId,
    steps,
    files,
    conversations,
    tasks,
    loading,
    error,

    // Actions
    startStep,
    approveStep,
    rejectStep,
    requestRevision,
    sendMessage,
    uploadFiles,
    setCurrentStep,
    refreshData,
  };
}
