import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * Validation error response interface
 */
interface ValidationError {
  success: false;
  error: string;
  details: any[];
  timestamp: string;
}

/**
 * Middleware to validate request body against Zod schema
 */
export function validateRequestBody(schema: ZodSchema) {
  // @ts-ignore
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.body);
      req.body = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError: ValidationError = {
          success: false,
          error: 'Validation failed',
          details: error.issues,
          timestamp: new Date().toISOString(),
        };

        return res.status(400).json(validationError);
      }

      return res.status(500).json({
        success: false,
        error: 'Internal validation error',
        timestamp: new Date().toISOString(),
      });
    }
  };
}

/**
 * Middleware to validate request params against Zod schema
 */
export function validateRequestParams(schema: ZodSchema) {
  // @ts-ignore
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.params);
      req.params = result as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError: ValidationError = {
          success: false,
          error: 'Parameter validation failed',
          details: error.issues,
          timestamp: new Date().toISOString(),
        };

        return res.status(400).json(validationError);
      }

      return res.status(500).json({
        success: false,
        error: 'Internal validation error',
        timestamp: new Date().toISOString(),
      });
    }
  };
}

/**
 * Middleware to validate request query against Zod schema
 */
export function validateRequestQuery(schema: ZodSchema) {
  // @ts-ignore
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.query);
      req.query = result as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError: ValidationError = {
          success: false,
          error: 'Query validation failed',
          details: error.issues,
          timestamp: new Date().toISOString(),
        };

        return res.status(400).json(validationError);
      }

      return res.status(500).json({
        success: false,
        error: 'Internal validation error',
        timestamp: new Date().toISOString(),
      });
    }
  };
}
