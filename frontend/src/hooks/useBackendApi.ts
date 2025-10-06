import { useState, useCallback, useEffect } from 'react';
import {
  backendApiService,
  DocumentAnalysisRequest,
  DocumentAnalysisResult,
  TaskGenerationRequest,
  TaskGenerationResult,
  TaskProcessingRequest,
  TaskProcessingResult,
  IntegrationTestResult,
} from '../services/backendApiService';
import { ApiError } from '../services/apiService';

// Hook state interfaces
export interface BackendConnectionState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastChecked: Date | null;
}

export interface DocumentAnalysisState {
  isAnalyzing: boolean;
  result: DocumentAnalysisResult | null;
  error: string | null;
  progress?: number;
}

export interface TaskGenerationState {
  isGenerating: boolean;
  result: TaskGenerationResult | null;
  error: string | null;
  progress?: number;
}

export interface TaskProcessingState {
  isProcessing: boolean;
  result: TaskProcessingResult | null;
  error: string | null;
  progress?: number;
}

export interface IntegrationTestState {
  isTesting: boolean;
  results: IntegrationTestResult[] | null;
  error: string | null;
}

/**
 * Hook for managing backend API connections and operations
 */
export function useBackendApi() {
  // Connection state
  const [connectionState, setConnectionState] =
    useState<BackendConnectionState>({
      isConnected: false,
      isLoading: false,
      error: null,
      lastChecked: null,
    });

  // Document analysis state
  const [documentAnalysisState, setDocumentAnalysisState] =
    useState<DocumentAnalysisState>({
      isAnalyzing: false,
      result: null,
      error: null,
    });

  // Task generation state
  const [taskGenerationState, setTaskGenerationState] =
    useState<TaskGenerationState>({
      isGenerating: false,
      result: null,
      error: null,
    });

  // Task processing state
  const [taskProcessingState, setTaskProcessingState] =
    useState<TaskProcessingState>({
      isProcessing: false,
      result: null,
      error: null,
    });

  // Integration test state
  const [integrationTestState, setIntegrationTestState] =
    useState<IntegrationTestState>({
      isTesting: false,
      results: null,
      error: null,
    });

  /**
   * Execute function with retry logic
   */
  const executeWithRetry = useCallback(
    async <T>(
      fn: () => Promise<T>,
      maxRetries: number = 3
    ): Promise<{ success: boolean; data?: T; error?: string }> => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const data = await fn();
          return { success: true, data };
        } catch (error) {
          if (attempt === maxRetries) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
      }
      return { success: false, error: 'Max retries exceeded' };
    },
    []
  );

  /**
   * Check backend health and connection
   */
  const checkConnection = useCallback(async (): Promise<boolean> => {
    setConnectionState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await backendApiService.healthCheck();

      const isConnected = response.success || false;
      setConnectionState({
        isConnected,
        isLoading: false,
        error: null,
        lastChecked: new Date(),
      });

      return isConnected;
    } catch (error) {
      const errorMessage =
        error instanceof ApiError ? error.message : 'Connection failed';
      setConnectionState({
        isConnected: false,
        isLoading: false,
        error: errorMessage,
        lastChecked: new Date(),
      });

      return false;
    }
  }, []);

  /**
   * Analyze documents
   */
  const analyzeDocuments = useCallback(
    async (
      request: DocumentAnalysisRequest
    ): Promise<DocumentAnalysisResult | null> => {
      setDocumentAnalysisState({
        isAnalyzing: true,
        result: null,
        error: null,
        progress: 0,
      });

      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setDocumentAnalysisState(prev => ({
            ...prev,
            progress: Math.min((prev.progress || 0) + 10, 90),
          }));
        }, 500);

        const response = await backendApiService.analyzeDocuments(request);

        clearInterval(progressInterval);

        if (response.success && response.data) {
          setDocumentAnalysisState({
            isAnalyzing: false,
            result: response.data,
            error: null,
            progress: 100,
          });

          return response.data;
        } else {
          throw new Error(response.error || 'Analysis failed');
        }
      } catch (error) {
        const errorMessage =
          error instanceof ApiError
            ? error.message
            : 'Document analysis failed';
        setDocumentAnalysisState({
          isAnalyzing: false,
          result: null,
          error: errorMessage,
          progress: 0,
        });

        return null;
      }
    },
    []
  );

  /**
   * Generate tasks
   */
  const generateTasks = useCallback(
    async (
      request: TaskGenerationRequest
    ): Promise<TaskGenerationResult | null> => {
      setTaskGenerationState({
        isGenerating: true,
        result: null,
        error: null,
        progress: 0,
      });

      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setTaskGenerationState(prev => ({
            ...prev,
            progress: Math.min((prev.progress || 0) + 15, 90),
          }));
        }, 800);

        const response = await backendApiService.generateTasks(request);

        clearInterval(progressInterval);

        if (response.success && response.data) {
          setTaskGenerationState({
            isGenerating: false,
            result: response.data,
            error: null,
            progress: 100,
          });

          return response.data;
        } else {
          throw new Error(response.error || 'Task generation failed');
        }
      } catch (error) {
        const errorMessage =
          error instanceof ApiError ? error.message : 'Task generation failed';
        setTaskGenerationState({
          isGenerating: false,
          result: null,
          error: errorMessage,
          progress: 0,
        });

        return null;
      }
    },
    []
  );

  /**
   * Process a task
   */
  const processTask = useCallback(
    async (
      request: TaskProcessingRequest
    ): Promise<TaskProcessingResult | null> => {
      setTaskProcessingState({
        isProcessing: true,
        result: null,
        error: null,
        progress: 0,
      });

      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setTaskProcessingState(prev => ({
            ...prev,
            progress: Math.min((prev.progress || 0) + 5, 90),
          }));
        }, 1000);

        const response = await backendApiService.processTask(request);

        clearInterval(progressInterval);

        if (response.success && response.data) {
          setTaskProcessingState({
            isProcessing: false,
            result: response.data,
            error: null,
            progress: 100,
          });

          return response.data;
        } else {
          throw new Error(response.error || 'Task processing failed');
        }
      } catch (error) {
        const errorMessage =
          error instanceof ApiError ? error.message : 'Task processing failed';
        setTaskProcessingState({
          isProcessing: false,
          result: null,
          error: errorMessage,
          progress: 0,
        });

        return null;
      }
    },
    []
  );

  /**
   * Test backend integrations
   */
  const testIntegrations = useCallback(async (): Promise<
    IntegrationTestResult[] | null
  > => {
    setIntegrationTestState({
      isTesting: true,
      results: null,
      error: null,
    });

    try {
      const response = await backendApiService.testIntegrations();

      if (response.success && response.data) {
        setIntegrationTestState({
          isTesting: false,
          results: response.data,
          error: null,
        });

        return response.data;
      } else {
        throw new Error(response.error || 'Integration test failed');
      }
    } catch (error) {
      const errorMessage =
        error instanceof ApiError ? error.message : 'Integration test failed';
      setIntegrationTestState({
        isTesting: false,
        results: null,
        error: errorMessage,
      });

      return null;
    }
  }, []);

  /**
   * Clear specific operation state
   */
  const clearAnalysisState = useCallback(() => {
    setDocumentAnalysisState({
      isAnalyzing: false,
      result: null,
      error: null,
    });
  }, []);

  const clearGenerationState = useCallback(() => {
    setTaskGenerationState({
      isGenerating: false,
      result: null,
      error: null,
    });
  }, []);

  const clearProcessingState = useCallback(() => {
    setTaskProcessingState({
      isProcessing: false,
      result: null,
      error: null,
    });
  }, []);

  const clearTestState = useCallback(() => {
    setIntegrationTestState({
      isTesting: false,
      results: null,
      error: null,
    });
  }, []);

  // Auto-check connection on mount
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    // Connection state
    connection: connectionState,
    checkConnection,
    executeWithRetry,
    isConnected: connectionState.isConnected,

    // Document analysis
    documentAnalysis: documentAnalysisState,
    analyzeDocuments,
    clearAnalysisState,

    // Task generation
    taskGeneration: taskGenerationState,
    generateTasks,
    clearGenerationState,

    // Task processing
    taskProcessing: taskProcessingState,
    processTask,
    clearProcessingState,

    // Integration testing
    integrationTest: integrationTestState,
    testIntegrations,
    clearTestState,

    // Utility methods
    isAnyOperationInProgress:
      documentAnalysisState.isAnalyzing ||
      taskGenerationState.isGenerating ||
      taskProcessingState.isProcessing ||
      integrationTestState.isTesting,
  };
}

/**
 * Hook specifically for connection monitoring
 */
export function useBackendConnection() {
  const { connection, checkConnection } = useBackendApi();

  return {
    isConnected: connection.isConnected,
    isChecking: connection.isLoading,
    error: connection.error,
    lastChecked: connection.lastChecked,
    checkConnection,
  };
}
