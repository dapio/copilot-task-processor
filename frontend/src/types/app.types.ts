export type ProcessingStep = 
  | 'upload' 
  | 'documentation' 
  | 'mockups' 
  | 'feedback' 
  | 'tasks' 
  | 'processing';

export interface UploadedDocument {
  file: File;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  status: 'uploaded' | 'analyzed';
  preview?: string;
  contentType?: string;
}

export interface ProcessorParameters {
  jira: {
    host: string;
    email: string;
    token: string;
    projectKey: string;
  };
  bitbucket: {
    username: string;
    appPassword: string;
    workspace: string;
    repo: string;
  };
  ai: {
    openaiKey: string;
    model: string;
    temperature: number;
  };
  workflow: {
    autoCreateBranches: boolean;
    autoCreatePRs: boolean;
    requireTests: boolean;
    minCoverage: number;
    continuousIntegration: boolean;
  };
}

export interface GeneratedDocumentation {
  businessAnalysis: string;
  systemAnalysis: string;
  architecture: string;
  summary: {
    totalFeatures: number;
    complexityScore: number;
    estimatedDuration: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
}

export interface Wireframe {
  name: string;
  description: string;
  svgContent?: string;
  components: string[];
}

export interface UserFlow {
  name: string;
  description: string;
  steps: string[];
}

export interface ComponentSpec {
  name: string;
  type: string;
  description: string;
  props?: string[];
}

export interface GeneratedMockups {
  wireframes: Wireframe[];
  userFlows: UserFlow[];
  components: ComponentSpec[];
  designSystem: {
    colors: string[];
    typography: {
      primary: string;
      secondary: string;
    };
    spacing: number[];
    breakpoints: string[];
  };
}

export interface FeedbackItem {
  type: 'documentation' | 'mockup';
  content: string;
  timestamp: Date;
}

export interface JiraTask {
  id: string;
  title: string;
  description: string;
  type: 'Story' | 'Task' | 'Bug' | 'Epic';
  priority: 'High' | 'Medium' | 'Low';
  estimatedHours: number;
  dependencies: string[];
  acceptanceCriteria: string[];
  jiraKey?: string;
}

export interface ProcessingResult {
  success: boolean;
  issueKey: string;
  duration: number;
  branch?: string;
  pullRequest?: string;
  error?: string;
  taskIndex?: number;
}

export interface ProcessingStatus {
  currentTask: string;
  completed: number;
  total: number;
  status: 'idle' | 'analyzing' | 'creating-tasks' | 'processing' | 'completed';
  results: ProcessingResult[];
}

export interface AppState {
  currentStep: ProcessingStep;
  documents: UploadedDocument[];
  generatedDocs: GeneratedDocumentation | null;
  mockups: GeneratedMockups | null;
  feedback: FeedbackItem[];
  tasks: JiraTask[];
  processingStatus: ProcessingStatus;
  parameters: ProcessorParameters;
}