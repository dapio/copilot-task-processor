import { ApiError } from './apiService';

// Backend API Response interface
export interface BackendResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// Document analysis types
export interface DocumentAnalysisRequest {
  files: File[];
  analysisType?: 'code' | 'documentation' | 'requirements';
  options?: {
    includeMetadata?: boolean;
    extractKeywords?: boolean;
    generateSummary?: boolean;
  };
}

export interface DocumentAnalysisResult {
  fileAnalysis: Array<{
    fileName: string;
    fileType: string;
    size: number;
    analysis: {
      complexity?: number;
      keywords: string[];
      summary?: string;
      issues?: string[];
      suggestions?: string[];
    };
  }>;
  overallAnalysis: {
    totalFiles: number;
    averageComplexity?: number;
    commonKeywords: string[];
    recommendations: string[];
  };
}

// Task generation types
export interface TaskGenerationRequest {
  projectContext: {
    name: string;
    description: string;
    requirements: string[];
    technologies: string[];
  };
  analysisData?: DocumentAnalysisResult;
  preferences?: {
    taskGranularity?: 'high' | 'medium' | 'low';
    includeEstimates?: boolean;
    includePriorities?: boolean;
  };
}

export interface GeneratedTask {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedHours?: number;
  dependencies: string[];
  tags: string[];
  category: 'development' | 'testing' | 'documentation' | 'research' | 'setup';
}

export interface TaskGenerationResult {
  tasks: GeneratedTask[];
  projectStructure: {
    phases: Array<{
      name: string;
      tasks: string[];
      estimatedDuration?: string;
    }>;
  };
  recommendations: string[];
  metadata: {
    totalTasks: number;
    totalEstimatedHours?: number;
    generatedAt: string;
  };
}

// Integration test types
export interface IntegrationTestResult {
  testName: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  duration?: number;
}

// Task processing types
export interface TaskProcessingRequest {
  task: GeneratedTask;
  context?: {
    projectFiles?: Array<{ name: string; content: string }>;
    dependencies?: string[];
    constraints?: string[];
  };
  options?: {
    generateCode?: boolean;
    createTests?: boolean;
    updateDocs?: boolean;
  };
}

export interface TaskProcessingResult {
  taskId: string;
  status: 'completed' | 'failed' | 'partial';
  results: {
    codeGenerated?: Array<{
      fileName: string;
      content: string;
      language: string;
    }>;
    testsCreated?: Array<{
      fileName: string;
      content: string;
      testType: string;
    }>;
    docsUpdated?: Array<{
      fileName: string;
      content: string;
    }>;
  };
  metrics: {
    processingTime: number;
    confidence: number;
    completeness: number;
  };
  nextSteps?: string[];
}

/**
 * Service for interacting with the backend API
 */
export class BackendApiService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl =
      baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
  }

  /**
   * Check backend health status
   */
  async healthCheck(): Promise<BackendResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return await response.json();
    } catch (error) {
      throw new ApiError(
        500,
        'Failed to connect to backend',
        'CONNECTION_ERROR'
      );
    }
  }

  /**
   * Analyze uploaded documents
   */
  async analyzeDocuments(
    request: DocumentAnalysisRequest
  ): Promise<BackendResponse<DocumentAnalysisResult>> {
    try {
      const formData = new FormData();

      // Add files
      request.files.forEach(file => {
        formData.append('files', file, file.name);
      });

      // Add analysis options
      if (request.analysisType) {
        formData.append('analysisType', request.analysisType);
      }

      if (request.options) {
        formData.append('options', JSON.stringify(request.options));
      }

      const response = await fetch(`${this.baseUrl}/analyze-documents`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(
          response.status,
          errorData.error || 'Analysis failed'
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Document analysis failed', 'ANALYSIS_ERROR');
    }
  }

  /**
   * Generate tasks based on project context
   */
  async generateTasks(
    request: TaskGenerationRequest
  ): Promise<BackendResponse<TaskGenerationResult>> {
    try {
      const response = await fetch(`${this.baseUrl}/generate-tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(
          response.status,
          errorData.error || 'Task generation failed'
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Task generation failed', 'GENERATION_ERROR');
    }
  }

  /**
   * Test backend integrations
   */
  async testIntegrations(): Promise<BackendResponse<IntegrationTestResult[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/test-integrations`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(
          response.status,
          errorData.error || 'Integration test failed'
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Integration test failed', 'TEST_ERROR');
    }
  }

  /**
   * Process a specific task
   */
  async processTask(
    request: TaskProcessingRequest
  ): Promise<BackendResponse<TaskProcessingResult>> {
    try {
      const response = await fetch(`${this.baseUrl}/process-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(
          response.status,
          errorData.error || 'Task processing failed'
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Task processing failed', 'PROCESSING_ERROR');
    }
  }
}

// Export singleton instance
export const backendApiService = new BackendApiService();

// Export helper functions
export const createDocumentAnalysisRequest = (
  files: File[],
  options?: DocumentAnalysisRequest['options']
): DocumentAnalysisRequest => ({
  files,
  analysisType: 'code',
  options: {
    includeMetadata: true,
    extractKeywords: true,
    generateSummary: true,
    ...options,
  },
});

export const createTaskGenerationRequest = (
  projectContext: TaskGenerationRequest['projectContext'],
  analysisData?: DocumentAnalysisResult
): TaskGenerationRequest => ({
  projectContext,
  analysisData,
  preferences: {
    taskGranularity: 'medium',
    includeEstimates: true,
    includePriorities: true,
  },
});

export const createTaskProcessingRequest = (
  task: GeneratedTask,
  options?: TaskProcessingRequest['options']
): TaskProcessingRequest => ({
  task,
  options: {
    generateCode: true,
    createTests: true,
    updateDocs: true,
    ...options,
  },
});
