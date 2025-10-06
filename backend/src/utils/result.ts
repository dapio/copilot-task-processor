/**
 * Result Pattern Implementation
 *
 * Type-safe error handling using Result<T, E> pattern
 */

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp?: Date;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Create a standardized service error
 */
export function createServiceError(
  code: string,
  message: string,
  details?: Record<string, any>,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): ServiceError {
  return {
    code,
    message,
    details,
    timestamp: new Date(),
    severity,
  };
}

/**
 * Create a success result
 */
export function createSuccess<T>(data: T): Result<T, ServiceError> {
  return { success: true, data };
}

/**
 * Create an error result
 */
export function createError<T>(error: ServiceError): Result<T, ServiceError> {
  return { success: false, error };
}

/**
 * Check if result is successful
 */
export function isSuccess<T, E>(
  result: Result<T, E>
): result is { success: true; data: T } {
  return result.success;
}

/**
 * Check if result is an error
 */
export function isError<T, E>(
  result: Result<T, E>
): result is { success: false; error: E } {
  return !result.success;
}

/**
 * Map result data if successful
 */
export function mapResult<T, U, E>(
  result: Result<T, E>,
  mapper: (data: T) => U
): Result<U, E> {
  if (isSuccess(result)) {
    return { success: true, data: mapper(result.data) };
  } else {
    return { success: false, error: result.error };
  }
}

/**
 * Chain results together (flatMap)
 */
export function chainResult<T, U, E>(
  result: Result<T, E>,
  mapper: (data: T) => Result<U, E>
): Result<U, E> {
  if (isSuccess(result)) {
    return mapper(result.data);
  } else {
    return { success: false, error: result.error };
  }
}

/**
 * Convert Result to Promise for async operations
 */
export function resultToPromise<T, E>(result: Result<T, E>): Promise<T> {
  if (isSuccess(result)) {
    return Promise.resolve(result.data);
  } else {
    return Promise.reject(result.error);
  }
}

/**
 * Convert Promise to Result (catches errors)
 */
export async function promiseToResult<T>(
  promise: Promise<T>
): Promise<Result<T, ServiceError>> {
  try {
    const data = await promise;
    return createSuccess(data);
  } catch (error) {
    return createError(
      createServiceError(
        'PROMISE_ERROR',
        error instanceof Error ? error.message : 'Unknown error',
        { originalError: error }
      )
    );
  }
}

/**
 * Combine multiple results into one
 */
export function combineResults<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const data: T[] = [];

  for (const result of results) {
    if (isSuccess(result)) {
      data.push(result.data);
    } else {
      return { success: false, error: result.error };
    }
  }

  return { success: true, data };
}

/**
 * Handle result with callbacks
 */
export function handleResult<T, E, R>(
  result: Result<T, E>,
  onSuccess: (data: T) => R,
  onError: (error: E) => R
): R {
  if (isSuccess(result)) {
    return onSuccess(result.data);
  } else {
    return onError(result.error);
  }
}

/**
 * Wrap function to return Result instead of throwing
 */
export function wrapFunction<T extends any[], R>(
  fn: (...args: T) => R
): (...args: T) => Result<R, ServiceError> {
  return (...args: T) => {
    try {
      const result = fn(...args);
      return createSuccess(result);
    } catch (error) {
      return createError(
        createServiceError(
          'FUNCTION_ERROR',
          error instanceof Error ? error.message : 'Function execution failed',
          { args, originalError: error }
        )
      );
    }
  };
}

/**
 * Wrap async function to return Result instead of throwing
 */
export function wrapAsyncFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<Result<R, ServiceError>> {
  return async (...args: T) => {
    try {
      const result = await fn(...args);
      return createSuccess(result);
    } catch (error) {
      return createError(
        createServiceError(
          'ASYNC_FUNCTION_ERROR',
          error instanceof Error
            ? error.message
            : 'Async function execution failed',
          { args, originalError: error }
        )
      );
    }
  };
}

/**
 * Filter results, keeping only successful ones
 */
export function filterSuccessfulResults<T, E>(results: Result<T, E>[]): T[] {
  return results.filter(isSuccess).map(result => result.data);
}

/**
 * Filter results, keeping only errors
 */
export function filterErrorResults<T, E>(results: Result<T, E>[]): E[] {
  return results.filter(isError).map(result => result.error);
}

/**
 * Partition results into successes and errors
 */
export function partitionResults<T, E>(
  results: Result<T, E>[]
): { successes: T[]; errors: E[] } {
  const successes: T[] = [];
  const errors: E[] = [];

  for (const result of results) {
    if (isSuccess(result)) {
      successes.push(result.data);
    } else {
      errors.push(result.error);
    }
  }

  return { successes, errors };
}

/**
 * Try multiple operations until one succeeds
 */
export async function trySequential<T, E>(
  operations: (() => Promise<Result<T, E>>)[]
): Promise<Result<T, E[]>> {
  const errors: E[] = [];

  for (const operation of operations) {
    const result = await operation();
    if (isSuccess(result)) {
      return result;
    }
    errors.push(result.error);
  }

  return {
    success: false,
    error: errors,
  };
}

/**
 * Execute operations in parallel and return first success or all errors
 */
export async function tryParallel<T, E>(
  operations: (() => Promise<Result<T, E>>)[]
): Promise<Result<T, E[]>> {
  const results = await Promise.all(operations.map(op => op()));

  for (const result of results) {
    if (isSuccess(result)) {
      return result;
    }
  }

  return {
    success: false,
    error: results.filter(isError).map(r => r.error),
  };
}

/**
 * Retry operation with exponential backoff
 */
export async function retryWithBackoff<T, E>(
  operation: () => Promise<Result<T, E>>,
  maxAttempts: number = 3,
  baseDelay: number = 1000,
  backoffMultiplier: number = 2
): Promise<Result<T, ServiceError>> {
  let lastError: E | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await operation();

    if (isSuccess(result)) {
      return result;
    }

    lastError = result.error;

    if (attempt < maxAttempts) {
      const delay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return createError(
    createServiceError(
      'MAX_RETRIES_EXCEEDED',
      `Operation failed after ${maxAttempts} attempts`,
      { maxAttempts, lastError }
    )
  );
}

/**
 * Create a timeout wrapper for operations
 */
export async function withTimeout<T>(
  operation: () => Promise<Result<T, ServiceError>>,
  timeoutMs: number
): Promise<Result<T, ServiceError>> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(
        createServiceError(
          'OPERATION_TIMEOUT',
          `Operation timed out after ${timeoutMs}ms`,
          { timeoutMs }
        )
      );
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([operation(), timeoutPromise]);
    return result;
  } catch (error) {
    if (error instanceof Object && 'code' in error) {
      return createError(error as ServiceError);
    }
    return createError(
      createServiceError('TIMEOUT_ERROR', 'Operation timed out', {
        timeoutMs,
        originalError: error,
      })
    );
  }
}
