/**
 * Base API Service
 * ThinkCode AI Platform - Core API Utilities
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export class BaseApiService {
  protected baseUrl: string;
  protected defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  protected async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { method = 'GET', headers = {}, body, timeout = 10000 } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const requestHeaders = {
      ...this.defaultHeaders,
      ...headers,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const requestInit: RequestInit = {
        method,
        headers: requestHeaders,
        signal: controller.signal,
      };

      if (body && method !== 'GET') {
        requestInit.body = JSON.stringify(body);
      }

      const response = await fetch(url, requestInit);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new ApiError(
          `API Error: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408, 'TIMEOUT');
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new ApiError(`Network error: ${errorMessage}`, 0, 'NETWORK_ERROR');
    }
  }

  protected get<T>(
    endpoint: string,
    options?: Omit<ApiRequestOptions, 'method'>
  ) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  protected post<T>(
    endpoint: string,
    body?: any,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  protected put<T>(
    endpoint: string,
    body?: any,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  protected delete<T>(
    endpoint: string,
    options?: Omit<ApiRequestOptions, 'method'>
  ) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Helper functions
export const handleApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 0, 'UNKNOWN_ERROR');
  }

  return new ApiError('An unknown error occurred', 0, 'UNKNOWN_ERROR');
};

export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError;
};
