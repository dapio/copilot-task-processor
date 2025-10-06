/**
 * Common types used across the frontend
 */

export interface Result<T, E> {
  success: boolean;
  data?: T;
  error?: E;
}

export interface MLError {
  code: string;
  message: string;
  details?: any;
  retryable?: boolean;
}