/**
 * Workflow Assistant Agent Types
 * Complete type definitions for workflow assistance domain
 */

export interface WorkflowContext {
  workflowId: string;
  currentStep: string;
  stepIndex: number;
  totalSteps: number;

  // Execution state
  executionId: string;
  status: 'running' | 'paused' | 'error' | 'waiting_approval' | 'completed';

  // User context
  userId: string;
  userRole: 'developer' | 'product_owner' | 'stakeholder' | 'admin';
  experience: 'beginner' | 'intermediate' | 'expert';

  // Workflow data
  projectType: string;
  complexity: 'simple' | 'medium' | 'complex' | 'enterprise';

  // Current state
  stepData: any;
  previousSteps: string[];
  blockers: string[];
  warnings: string[];
}

export interface AssistantRecommendation {
  type: 'suggestion' | 'warning' | 'error' | 'optimization' | 'next_action';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  actionText?: string;
  actionType?: 'button' | 'link' | 'modal' | 'redirect';
  actionData?: any;

  // Context
  stepId?: string;
  category: 'technical' | 'process' | 'decision' | 'quality' | 'performance';

  // Timing
  showAt:
    | 'immediate'
    | 'before_step'
    | 'after_step'
    | 'on_error'
    | 'on_approval';
  expiresAt?: Date;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;

  // Context
  workflowContext?: WorkflowContext;
  recommendations?: AssistantRecommendation[];

  // Metadata
  messageType:
    | 'question'
    | 'guidance'
    | 'warning'
    | 'confirmation'
    | 'troubleshooting';
  intent?: string;
  confidence?: number;
}

export interface WorkflowAnalysis {
  userSkillLevel: 'beginner' | 'intermediate' | 'expert';
  potentialBlockers: string[];
  suggestedApproach: string;
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high';
  criticalSteps: string[];
}

export interface TroubleshootingResult {
  issue: string;
  possibleCauses: string[];
  solutions: TroubleshootingSolution[];
  preventionTips: string[];
}

export interface TroubleshootingSolution {
  title: string;
  description: string;
  steps: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
  confidence: number;
}

export interface UserInteractionHistory {
  userId: string;
  pastWorkflows: WorkflowExecutionSummary[];
  skillProgression: SkillAssessment[];
  commonIssues: string[];
  preferredCommunicationStyle: string;
}

export interface WorkflowExecutionSummary {
  workflowId: string;
  executionDate: Date;
  duration: number;
  success: boolean;
  stepsCompleted: number;
  totalSteps: number;
  issuesEncountered: string[];
}

export interface SkillAssessment {
  skill: string;
  level: number; // 1-10
  assessedAt: Date;
  evidence: string[];
}

export interface AssistantConfig {
  name: string;
  role: string;
  personality: string;
  expertise: string[];
  tone: string;
  verbosity: string;
  proactivity: string;
  autoSuggestNextSteps: boolean;
  predictBlockers: boolean;
  monitorPerformance: boolean;
  learnFromHistory: boolean;
}

export interface PerformanceMetrics {
  executionId: string;
  stepTimes: Record<string, number>;
  totalDuration: number;
  errorCount: number;
  userSatisfaction?: number;
  assistantHelpfulness?: number;
}

export interface ContextualHelp {
  stepId: string;
  helpType: 'tooltip' | 'guide' | 'video' | 'documentation';
  content: string;
  priority: number;
  triggers: string[];
}

// Response types
export interface AssistingResult {
  conversation: ConversationMessage[];
  recommendations: AssistantRecommendation[];
  nextSuggestedActions: string[];
}

export interface GuidanceResult {
  message: ConversationMessage;
  actionSuggestions: string[];
  contextualHelp: ContextualHelp[];
}

export interface TroubleshootingContext {
  issue: string;
  errorDetails?: any;
  stepContext: WorkflowContext;
  userActions: string[];
  environment: Record<string, any>;
}

export interface OptimizationSuggestion {
  area: 'performance' | 'usability' | 'efficiency' | 'quality';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  priority: number;
}
