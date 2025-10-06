/**
 * Security Middleware Configuration
 * Enterprise-grade security for Express application
 */

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { Request, Response, NextFunction } from 'express';
import { env, getAllowedOrigins } from './env.validation';
import { logSecurityEvent } from './logger';

/**
 * Helmet security configuration
 */
export function createHelmetMiddleware() {
  return helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
        connectSrc: [
          "'self'",
          'https://api.openai.com',
          'https://api.github.com',
        ],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },

    // Cross Origin Embedder Policy
    crossOriginEmbedderPolicy: false, // Disable for API compatibility

    // HTTP Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },

    // Referrer Policy
    referrerPolicy: { policy: 'no-referrer-when-downgrade' },

    // X-Frame-Options
    frameguard: { action: 'deny' },

    // X-Content-Type-Options
    noSniff: true,

    // X-XSS-Protection (legacy but still useful)
    xssFilter: true,
  });
}

/**
 * Rate limiting configuration
 */
export function createRateLimiter() {
  return rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS, // 15 minutes
    max: env.RATE_LIMIT_MAX_REQUESTS, // limit each IP to requests per windowMs
    message: {
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000),
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false, // Disable the X-RateLimit-* headers

    // Custom handler for rate limit exceeded
    handler: (req: Request, res: Response) => {
      logSecurityEvent('rate_limit_exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method,
      });

      res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000),
      });
    },

    // Skip rate limiting for certain conditions
    skip: (req: Request) => {
      // Skip for health checks
      if (req.url === '/health') return true;

      // Skip for trusted IPs in development
      if (env.NODE_ENV === 'development' && req.ip === '127.0.0.1') return true;

      return false;
    },
  });
}

/**
 * Slow down middleware for additional protection
 */
export function createSlowDown() {
  return slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: Math.floor(env.RATE_LIMIT_MAX_REQUESTS * 0.5), // Allow 50% of rate limit
    delayMs: () => 500, // Add 500ms delay per request after delayAfter
    maxDelayMs: 20000, // Maximum delay of 20 seconds
  });
}

/**
 * CORS configuration
 */
export function createCorsOptions() {
  return {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      const allowedOrigins = getAllowedOrigins();

      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);

      // Check if origin is allowed
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logSecurityEvent('cors_violation', {
          origin,
          allowedOrigins,
        });
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
      'X-API-Key',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
    maxAge: 86400, // 24 hours
  };
}

/**
 * Input sanitization middleware
 */
export function sanitizeInput() {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Recursively sanitize object
    function sanitize(obj: any): any {
      if (typeof obj === 'string') {
        // Remove potential XSS vectors
        return obj
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+=/gi, '');
      }

      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }

      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            sanitized[key] = sanitize(obj[key]);
          }
        }
        return sanitized;
      }

      return obj;
    }

    // Sanitize request body
    if (req.body) {
      req.body = sanitize(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
      req.query = sanitize(req.query);
    }

    next();
  };
}

/**
 * File upload security middleware
 */
export function createFileUploadSecurity() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check file size
    const contentLength = parseInt(req.get('content-length') || '0');
    const maxSize = env.MAX_FILE_SIZE_MB * 1024 * 1024;

    if (contentLength > maxSize) {
      logSecurityEvent('file_size_exceeded', {
        ip: req.ip,
        contentLength,
        maxSize,
        userAgent: req.get('User-Agent'),
      });

      return res.status(413).json({
        success: false,
        error: 'FILE_TOO_LARGE',
        message: `File size exceeds ${env.MAX_FILE_SIZE_MB}MB limit`,
      });
    }

    next();
  };
}

/**
 * Security headers middleware
 */
export function addSecurityHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Remove server information
    res.removeHeader('X-Powered-By');

    // Add custom security headers
    res.setHeader('X-API-Version', '1.0.0');
    res.setHeader('X-Request-ID', req.headers['x-request-id'] || 'unknown');

    next();
  };
}
