/**
 * Winston Logger Configuration
 * Enterprise-grade structured logging
 */

import winston from 'winston';
import { env } from './env.validation';

/**
 * Custom log format for structured logging
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const logObject: Record<string, any> = {
      timestamp,
      level,
      message,
    };

    if (stack) logObject.stack = stack;
    if (Object.keys(meta).length > 0) logObject.meta = meta;

    return JSON.stringify(logObject);
  })
);

/**
 * Console format for development
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level}]: ${message}${stack ? `\n${stack}` : ''}`;
  })
);

/**
 * Create winston logger instance
 */
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: logFormat,
  defaultMeta: {
    service: 'thinkcode-ai-backend',
    version: process.env.npm_package_version || '1.0.0',
  },
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: env.NODE_ENV === 'development' ? consoleFormat : logFormat,
    }),

    // File transport for production
    ...(env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
        ]
      : []),
  ],

  // Don't exit on handled exceptions
  exitOnError: false,

  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],

  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

/**
 * Request logger middleware
 */
export function createRequestLogger() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    const { method, url, ip, headers } = req;

    // Log request
    logger.info('Request started', {
      method,
      url,
      ip,
      userAgent: headers['user-agent'],
      contentLength: headers['content-length'],
    });

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;

      logger.info('Request completed', {
        method,
        url,
        statusCode,
        duration,
        ip,
      });
    });

    next();
  };
}

/**
 * Error logger helper
 */
export function logError(error: Error, context?: Record<string, any>) {
  logger.error(error.message, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    ...context,
  });
}

/**
 * Security logger helper
 */
export function logSecurityEvent(event: string, details: Record<string, any>) {
  logger.warn('Security event', {
    event,
    ...details,
    security: true,
  });
}
