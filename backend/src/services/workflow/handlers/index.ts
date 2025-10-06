/**
 * Workflow Step Handlers Index
 * Exports all available workflow step handlers for registration
 */

export { HttpRequestHandler } from './http-handler';
export type { HttpRequestInput, HttpRequestOutput } from './http-handler';

export { DatabaseQueryHandler } from './database-handler';
export type {
  DatabaseQueryInput,
  DatabaseQueryOutput,
} from './database-handler';

export { EmailNotificationHandler } from './email-handler';
export type {
  EmailNotificationInput,
  EmailNotificationOutput,
} from './email-handler';

// Handler registry helper
import { PrismaClient } from '@prisma/client';
import { HandlerRegistry } from '../registry';

/**
 * Register all default handlers
 */
export async function registerDefaultHandlers(
  registry: HandlerRegistry,
  prisma: PrismaClient
): Promise<void> {
  // Note: HandlerRegistry expects BaseHandler objects, which have different structure
  // This is a mock implementation - actual integration would need BaseHandler wrappers
  console.log('Mock registration of workflow step handlers', {
    httpHandler: 'http-request',
    dbHandler: 'database-query',
    emailHandler: 'email-notification',
    registry: registry.constructor.name,
    prisma: !!prisma,
  });
}

/**
 * Get list of all available handler types
 */
export function getAvailableHandlerTypes(): string[] {
  return ['http-request', 'database-query', 'email-notification'];
}

/**
 * Get handler metadata by type (mock implementation)
 */
export function getHandlerMetadata(type: string, _prisma?: PrismaClient): any {
  // Mock metadata - actual implementation would create handler instances
  const metadata = {
    'http-request': {
      type: 'http-request',
      version: '1.0.0',
      description: 'Execute HTTP requests with comprehensive error handling',
    },
    'database-query': {
      type: 'database-query',
      version: '1.0.0',
      description: 'Execute database queries with comprehensive error handling',
    },
    'email-notification': {
      type: 'email-notification',
      version: '1.0.0',
      description: 'Send email notifications with templates and attachments',
    },
  };

  if (!metadata[type as keyof typeof metadata]) {
    throw new Error(`Unknown handler type: ${type}`);
  }

  return metadata[type as keyof typeof metadata];
}
