/**
 * ML Provider Interface - Abstrakcja dla różnych providerów AI/ML
 * ThinkCode AI Platform - Enterprise-grade ML integration
 */

export interface GenerationOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  model?: string;
}

export interface EmbeddingOptions {
  model?: string;
  dimensions?: number;
}

export interface MLError {
  code: string;
  message: string;
  details?: any;
  retryable?: boolean;
}

export interface GenerationResult {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, any>;
}

export interface EmbeddingResult {
  embedding: number[];
  usage?: {
    tokens: number;
  };
  metadata?: Record<string, any>;
}

export interface AnalysisResult {
  summary: string;
  complexity: number;
  suggestions: string[];
  confidence: number;
  metadata?: Record<string, any>;
}

/**
 * Result pattern implementation for bulletproof error handling
 */
export type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Main ML Provider Interface
 * All ML providers must implement this interface
 */
export interface IMLProvider {
  /** Provider name identifier */
  readonly name: string;

  /** Provider version */
  readonly version: string;

  /** Check if provider is available and configured */
  isAvailable(): Promise<boolean>;

  /** Generate text from prompt */
  generateText(
    prompt: string,
    options?: GenerationOptions
  ): Promise<Result<GenerationResult, MLError>>;

  /** Generate embeddings for text */
  generateEmbedding(
    text: string,
    options?: EmbeddingOptions
  ): Promise<Result<EmbeddingResult, MLError>>;

  /** Analyze document content */
  analyzeDocument(
    content: string,
    context?: Record<string, any>
  ): Promise<Result<AnalysisResult, MLError>>;

  /** Health check for provider */
  healthCheck(): Promise<
    Result<
      {
        status: 'healthy' | 'degraded' | 'unhealthy';
        details?: string | Record<string, any>;
      },
      MLError
    >
  >;

  /** Get supported models */
  getSupportedModels(): Promise<Result<string[], MLError>>;
}

/**
 * Provider configuration interface
 */
export interface MLProviderConfig {
  name: string;
  type: 'openai' | 'anthropic' | 'local' | 'azure' | 'google' | 'mock';
  apiKey?: string;
  endpoint?: string;
  model?: string;
  enabled: boolean;
  priority: number;
  retryAttempts: number;
  timeoutMs: number;
  metadata?: Record<string, any>;
}

/**
 * Provider factory interface
 */
export interface IMLProviderFactory {
  createProvider(
    config: MLProviderConfig
  ): Promise<Result<IMLProvider, MLError>>;
  getSupportedTypes(): string[];
}
