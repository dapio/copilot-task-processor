/**
 * HTTP Request Handler for Workflow Steps
 * Executes HTTP requests with comprehensive error handling and retries
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { StepExecutionError } from '../errors';
import { Result } from '../../../providers/ml-provider.interface';

// Step Handler Interface
interface IWorkflowStepHandler<TInput = any, TOutput = any> {
  readonly type: string;
  readonly version: string;
  readonly description: string;
  execute(
    input: TInput,
    context: Record<string, any>
  ): Promise<Result<TOutput, StepExecutionError>>;
  getMetadata(): any;
}

export interface HttpRequestInput {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  validateStatus?: (status: number) => boolean;
}

export interface HttpRequestOutput {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  responseTime: number;
}

/**
 * HTTP Request Handler
 * Executes HTTP requests with configurable options
 */
export class HttpRequestHandler
  implements IWorkflowStepHandler<HttpRequestInput, HttpRequestOutput>
{
  readonly type = 'http-request';
  readonly version = '1.0.0';
  readonly description =
    'Execute HTTP requests with comprehensive error handling';

  async execute(
    input: HttpRequestInput,
    _context: Record<string, any>
  ): Promise<Result<HttpRequestOutput, StepExecutionError>> {
    try {
      // Validate input
      const validation = this.validateInput(input);
      if (!validation.success) {
        return { success: false, error: validation.error };
      }

      // Prepare and execute request
      const config = this.prepareRequestConfig(input);
      return await this.executeRequestWithRetries(config, input);
    } catch (error: any) {
      return {
        success: false,
        error: new StepExecutionError(
          'HTTP_REQUEST_ERROR',
          `HTTP request execution error: ${error.message}`,
          {
            url: input.url,
            method: input.method,
            error: this.serializeError(error),
          }
        ),
      };
    }
  }

  /**
   * Prepare axios request configuration
   */
  private prepareRequestConfig(input: HttpRequestInput): AxiosRequestConfig {
    const config: AxiosRequestConfig = {
      url: input.url,
      method: input.method,
      headers: {
        'User-Agent': 'ThinkCode-Workflow-Engine/1.0',
        ...input.headers,
      },
      timeout: input.timeout || 30000,
      validateStatus:
        input.validateStatus || (status => status >= 200 && status < 300),
    };

    // Add body for non-GET requests
    if (input.method !== 'GET' && input.body) {
      config.data = input.body;

      // Set content type if not provided
      if (!config.headers?.['Content-Type']) {
        config.headers = {
          ...config.headers,
          'Content-Type': 'application/json',
        };
      }
    }

    return config;
  }

  /**
   * Execute request with retry logic
   */
  private async executeRequestWithRetries(
    config: AxiosRequestConfig,
    input: HttpRequestInput
  ): Promise<Result<HttpRequestOutput, StepExecutionError>> {
    const startTime = Date.now();
    let lastError: any;
    const maxRetries = Math.max(0, input.retries || 0);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response: AxiosResponse = await axios(config);
        const responseTime = Date.now() - startTime;

        return {
          success: true,
          data: {
            statusCode: response.status,
            headers: response.headers as Record<string, string>,
            body: response.data,
            responseTime,
          },
        };
      } catch (error: any) {
        lastError = error;

        // Don't retry on client errors (4xx) except 429 (Too Many Requests)
        if (
          error.response?.status >= 400 &&
          error.response?.status < 500 &&
          error.response?.status !== 429
        ) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    return {
      success: false,
      error: new StepExecutionError(
        'HTTP_REQUEST_FAILED',
        `HTTP request failed after ${
          maxRetries + 1
        } attempts: ${this.getErrorMessage(lastError)}`,
        {
          url: input.url,
          method: input.method,
          attempts: maxRetries + 1,
          lastError: this.serializeError(lastError),
        }
      ),
    };
  }

  /**
   * Validate input parameters
   */
  private validateInput(
    input: HttpRequestInput
  ): Result<void, StepExecutionError> {
    if (!input.url) {
      return {
        success: false,
        error: new StepExecutionError('INVALID_INPUT', 'URL is required'),
      };
    }

    if (!input.method) {
      return {
        success: false,
        error: new StepExecutionError(
          'INVALID_INPUT',
          'HTTP method is required'
        ),
      };
    }

    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    if (!validMethods.includes(input.method)) {
      return {
        success: false,
        error: new StepExecutionError(
          'INVALID_INPUT',
          `Invalid HTTP method: ${
            input.method
          }. Must be one of: ${validMethods.join(', ')}`
        ),
      };
    }

    // Validate URL format
    try {
      new URL(input.url);
    } catch {
      return {
        success: false,
        error: new StepExecutionError(
          'INVALID_INPUT',
          `Invalid URL format: ${input.url}`
        ),
      };
    }

    return { success: true, data: undefined };
  }

  /**
   * Extract error message from various error types
   */
  private getErrorMessage(error: any): string {
    if (error.response) {
      return `${error.response.status} ${error.response.statusText}`;
    }
    if (error.request) {
      return 'No response received';
    }
    return error.message || 'Unknown error';
  }

  /**
   * Serialize error for logging (avoid circular references)
   */
  private serializeError(error: any): any {
    if (!error) return null;

    return {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
    };
  }

  /**
   * Get handler metadata
   */
  getMetadata() {
    return {
      type: this.type,
      version: this.version,
      description: this.description,
      inputSchema: {
        type: 'object',
        required: ['url', 'method'],
        properties: {
          url: { type: 'string', format: 'uri' },
          method: {
            type: 'string',
            enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          },
          headers: { type: 'object' },
          body: {},
          timeout: { type: 'number', minimum: 1000, maximum: 300000 },
          retries: { type: 'number', minimum: 0, maximum: 10 },
        },
      },
      outputSchema: {
        type: 'object',
        required: ['statusCode', 'headers', 'body', 'responseTime'],
        properties: {
          statusCode: { type: 'number' },
          headers: { type: 'object' },
          body: {},
          responseTime: { type: 'number' },
        },
      },
    };
  }
}
