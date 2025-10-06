import { RateLimiter, CSRFProtection } from '../utils/security';

// API Response interface
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
  timestamp: string;
}

// API Error class
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Retry configuration
export interface RetryConfig {
  maxAttempts: number;
  delay: number;
  backoff?: number;
}

// Request configuration
export interface RequestConfig {
  timeout?: number;
  retries?: RetryConfig;
  skipAuth?: boolean;
  skipCSRF?: boolean;
}

// Default configurations
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delay: 1000,
  backoff: 2,
};

export class ApiService {
  private baseUrl: string;
  private rateLimiter: RateLimiter;
  private authToken: string | null = null;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
    this.rateLimiter = new RateLimiter(100, 60000); // 100 requests per minute
  }

  // Set authentication token
  setAuthToken(token: string) {
    this.authToken = token;
  }

  // Generic request method with security features
  private async request<T>(
    endpoint: string,
    options: any = {},
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const requestId = this.generateRequestId();

    // Rate limiting check
    if (!this.rateLimiter.isAllowed('global')) {
      throw new ApiError(429, 'Too many requests. Please try again later.');
    }

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      ...(options.headers as Record<string, string>),
    };

    // Add CSRF token for state-changing operations
    if (
      !config.skipCSRF &&
      ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method || '')
    ) {
      headers['X-CSRF-Token'] = CSRFProtection.getToken();
    }

    // Add authentication
    if (!config.skipAuth && this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    // Prepare request options
    const requestOptions: any = {
      ...options,
      headers,
      signal: this.createTimeoutSignal(config.timeout || DEFAULT_TIMEOUT),
    };

    const retryConfig = config.retries || DEFAULT_RETRY_CONFIG;
    return this.executeWithRetry<T>(
      url,
      requestOptions,
      retryConfig,
      requestId
    );
  }

  // Execute request with retry logic
  private async executeWithRetry<T>(
    url: string,
    options: any,
    retryConfig: RetryConfig,
    requestId: string,
    attempt: number = 1
  ): Promise<ApiResponse<T>> {
    try {
      console.log(
        `[${requestId}] Attempt ${attempt} for ${options.method} ${url}`
      );

      const response = await fetch(url, options);
      const responseData = await this.handleResponse<T>(response, requestId);

      console.log(`[${requestId}] Success on attempt ${attempt}`);
      return responseData;
    } catch (error) {
      console.error(`[${requestId}] Attempt ${attempt} failed:`, error);

      if (attempt >= retryConfig.maxAttempts) {
        throw error;
      }

      // Check if error is retryable
      if (!this.isRetryableError(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay =
        retryConfig.delay * Math.pow(retryConfig.backoff || 1, attempt - 1);
      console.log(`[${requestId}] Retrying in ${delay}ms...`);

      await this.sleep(delay);
      return this.executeWithRetry<T>(
        url,
        options,
        retryConfig,
        requestId,
        attempt + 1
      );
    }
  }

  // Handle API response
  private async handleResponse<T>(
    response: Response,
    requestId: string
  ): Promise<ApiResponse<T>> {
    const timestamp = new Date().toISOString();

    try {
      const data = await response.json();

      if (!response.ok) {
        const error = new ApiError(
          response.status,
          data.message || response.statusText,
          data.code
        );

        console.error(`[${requestId}] API Error:`, error);
        throw error;
      }

      return {
        data: data.data || data,
        message: data.message,
        status: response.status,
        timestamp,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle non-JSON responses
      const text = await response.text();
      console.error(`[${requestId}] Failed to parse response:`, text);

      throw new ApiError(
        response.status,
        `Invalid response format: ${text.substring(0, 100)}`,
        'INVALID_RESPONSE'
      );
    }
  }

  // Check if error is retryable
  private isRetryableError(error: any): boolean {
    // Retry on network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return true;
    }

    // Retry on timeout
    if (error.name === 'AbortError') {
      return true;
    }

    // Retry on server errors (5xx)
    if (error instanceof ApiError && error.status >= 500) {
      return true;
    }

    // Retry on rate limiting (429)
    if (error instanceof ApiError && error.status === 429) {
      return true;
    }

    return false;
  }

  // Create timeout signal
  private createTimeoutSignal(timeout: number): AbortSignal {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeout);
    return controller.signal;
  }

  // Generate unique request ID
  private generateRequestId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  // Sleep utility
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // HTTP Methods
  async get<T>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' }, config);
  }

  async post<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      config
    );
  }

  async put<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      config
    );
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      },
      config
    );
  }

  async delete<T>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' }, config);
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health', {
        timeout: 5000,
        retries: { maxAttempts: 1, delay: 0 },
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  // Get rate limit info
  getRateLimitInfo(): {
    remaining: number;
    resetTime: number;
  } {
    return {
      remaining: this.rateLimiter.getRemainingAttempts('global'),
      resetTime: this.rateLimiter.getResetTime('global'),
    };
  }
}

// Singleton instance
export const apiService = new ApiService();

export default apiService;
