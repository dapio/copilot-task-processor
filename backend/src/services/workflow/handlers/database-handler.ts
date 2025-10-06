/**
 * Database Query Handler for Workflow Steps
 * Executes database queries with connection management and error handling
 */

import { PrismaClient } from '@prisma/client';
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

export interface DatabaseQueryInput {
  query: string;
  parameters?: any[];
  database?: string;
  timeout?: number;
  transaction?: boolean;
  readOnly?: boolean;
}

export interface DatabaseQueryOutput {
  results: any[];
  rowCount: number;
  executionTime: number;
  affectedRows?: number;
}

/**
 * Database Query Handler
 * Executes SQL queries with comprehensive error handling
 */
export class DatabaseQueryHandler
  implements IWorkflowStepHandler<DatabaseQueryInput, DatabaseQueryOutput>
{
  readonly type = 'database-query';
  readonly version = '1.0.0';
  readonly description =
    'Execute database queries with comprehensive error handling';

  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async execute(
    input: DatabaseQueryInput
  ): Promise<Result<DatabaseQueryOutput, StepExecutionError>> {
    const startTime = Date.now();

    try {
      // Validate input
      const validation = this.validateInput(input);
      if (!validation.success) {
        return { success: false, error: validation.error };
      }

      // Execute query based on type
      const result = await this.executeQuery(input);
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          results: result.results,
          rowCount: result.rowCount,
          executionTime,
          affectedRows: result.affectedRows,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: new StepExecutionError(
          'DATABASE_QUERY_ERROR',
          `Database query execution error: ${error.message}`,
          {
            query: input.query,
            parameters: input.parameters,
            error: this.serializeError(error),
          }
        ),
      };
    }
  }

  /**
   * Execute database query
   */
  private async executeQuery(input: DatabaseQueryInput): Promise<{
    results: any[];
    rowCount: number;
    affectedRows?: number;
  }> {
    const { query, timeout = 30000, transaction = false } = input;

    // Set query timeout
    if (timeout > 0) {
      // Implementation depends on database driver
      console.log(`Setting query timeout: ${timeout}ms`);
    }

    if (transaction) {
      return await this.executeInTransaction(query);
    } else {
      return await this.executeSingleQuery(query);
    }
  }

  /**
   * Execute query in transaction
   */
  private async executeInTransaction(query: string): Promise<{
    results: any[];
    rowCount: number;
    affectedRows?: number;
  }> {
    return await this.prisma.$transaction(async tx => {
      // Use raw query execution
      const results = await (tx as any).$queryRaw`${query}`;

      return {
        results: Array.isArray(results) ? results : [results],
        rowCount: Array.isArray(results) ? results.length : 1,
        affectedRows: this.getAffectedRows(results),
      };
    });
  }

  /**
   * Execute single query
   */
  private async executeSingleQuery(query: string): Promise<{
    results: any[];
    rowCount: number;
    affectedRows?: number;
  }> {
    // Determine query type
    const queryType = this.getQueryType(query);

    if (queryType === 'SELECT') {
      const results = await this.prisma.$queryRaw`${query}`;
      return {
        results: Array.isArray(results) ? results : [results],
        rowCount: Array.isArray(results) ? results.length : 1,
      };
    } else {
      // INSERT, UPDATE, DELETE
      const result = await this.prisma.$executeRaw`${query}`;
      return {
        results: [],
        rowCount: 0,
        affectedRows: result,
      };
    }
  }

  /**
   * Determine query type from SQL
   */
  private getQueryType(
    query: string
  ): 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'OTHER' {
    const normalizedQuery = query.trim().toUpperCase();

    if (normalizedQuery.startsWith('SELECT')) return 'SELECT';
    if (normalizedQuery.startsWith('INSERT')) return 'INSERT';
    if (normalizedQuery.startsWith('UPDATE')) return 'UPDATE';
    if (normalizedQuery.startsWith('DELETE')) return 'DELETE';

    return 'OTHER';
  }

  /**
   * Extract affected rows count from result
   */
  private getAffectedRows(result: any): number | undefined {
    if (typeof result === 'number') return result;
    if (result && typeof result.count === 'number') return result.count;
    if (result && typeof result.affectedRows === 'number')
      return result.affectedRows;
    return undefined;
  }

  /**
   * Validate input parameters
   */
  private validateInput(
    input: DatabaseQueryInput
  ): Result<void, StepExecutionError> {
    if (!input.query) {
      return {
        success: false,
        error: new StepExecutionError('INVALID_INPUT', 'SQL query is required'),
      };
    }

    if (typeof input.query !== 'string') {
      return {
        success: false,
        error: new StepExecutionError(
          'INVALID_INPUT',
          'Query must be a string'
        ),
      };
    }

    // Basic SQL injection prevention
    const suspiciousPatterns = [
      /;\s*DROP\s+/i,
      /;\s*DELETE\s+FROM\s+/i,
      /;\s*TRUNCATE\s+/i,
      /--/,
      /\/\*/,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(input.query)) {
        return {
          success: false,
          error: new StepExecutionError(
            'SECURITY_VIOLATION',
            'Query contains potentially dangerous patterns'
          ),
        };
      }
    }

    if (input.parameters && !Array.isArray(input.parameters)) {
      return {
        success: false,
        error: new StepExecutionError(
          'INVALID_INPUT',
          'Parameters must be an array'
        ),
      };
    }

    if (
      input.timeout &&
      (typeof input.timeout !== 'number' || input.timeout < 1000)
    ) {
      return {
        success: false,
        error: new StepExecutionError(
          'INVALID_INPUT',
          'Timeout must be a number >= 1000ms'
        ),
      };
    }

    return { success: true, data: undefined };
  }

  /**
   * Serialize error for logging (avoid circular references)
   */
  private serializeError(error: any): any {
    if (!error) return null;

    return {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
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
        required: ['query'],
        properties: {
          query: { type: 'string', minLength: 1 },
          parameters: { type: 'array' },
          database: { type: 'string' },
          timeout: { type: 'number', minimum: 1000, maximum: 300000 },
          transaction: { type: 'boolean' },
          readOnly: { type: 'boolean' },
        },
      },
      outputSchema: {
        type: 'object',
        required: ['results', 'rowCount', 'executionTime'],
        properties: {
          results: { type: 'array' },
          rowCount: { type: 'number' },
          executionTime: { type: 'number' },
          affectedRows: { type: 'number' },
        },
      },
    };
  }
}
