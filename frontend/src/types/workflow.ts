/**
 * Workflow Types
 * ThinkCode AI Platform - Typy dla systemu workflow i czatu
 */

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status:
    | 'pending'
    | 'in_progress'
    | 'completed'
    | 'failed'
    | 'blocked'
    | 'requires_approval';
  progress?: number;
  assignedAgent?: string;
  agentResponsible?: string;
  estimatedTime?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  startTime?: Date;
  endTime?: Date;
  startedAt?: string;
  completedAt?: string;
  order?: number;
  approvalRequired?: boolean;
  dependencies?: string[];
  requirements?: string[];
  deliverables?: string[];
}

export interface ProjectWorkflow {
  id: string;
  name: string;
  description: string;
  type: string;
  currentStep: number;
  currentStepIndex?: number;
  totalSteps: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused' | 'failed';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  estimatedCompletion?: Date;
  startedAt?: string;
  steps: WorkflowStep[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  stepContext?: string;
  metadata?: {
    agentId?: string;
    stepId?: string;
    type?: 'info' | 'warning' | 'error' | 'success';
  };
}

export interface WorkflowProgress {
  currentStep: number;
  totalSteps: number;
  completedSteps: number;
  overallProgress: number;
  estimatedTimeRemaining?: string;
  nextMilestone?: string;
}
