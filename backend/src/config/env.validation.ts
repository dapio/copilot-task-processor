/**
 * Environment Variables Validation
 * Secure validation and type-safe environment configuration
 */

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z
    .string()
    .default('3000')
    .transform(Number)
    .pipe(z.number().min(1000).max(65535)),

  // Database
  DATABASE_URL: z.string().min(1),

  // API Keys - Required in production
  OPENAI_API_KEY: z.string().min(1).optional(),
  GITHUB_COPILOT_API_KEY: z.string().min(1).optional(),

  // CORS Origins
  ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:3001,http://127.0.0.1:3001'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),

  // File Upload
  MAX_FILE_SIZE_MB: z.string().default('10').transform(Number), // Reduced from 50MB for security
  MAX_FILES_PER_UPLOAD: z.string().default('5').transform(Number),

  // JWT Secret (for future authentication)
  JWT_SECRET: z.string().min(32).optional(),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates and parses environment variables
 * @throws {Error} If validation fails
 */
export function validateEnv(): EnvConfig {
  try {
    const parsed = envSchema.parse(process.env);

    // Additional validation for production
    if (parsed.NODE_ENV === 'production') {
      if (!parsed.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is required in production');
      }
      if (!parsed.JWT_SECRET) {
        throw new Error('JWT_SECRET is required in production');
      }
    }

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map(
        (err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`
      );
      throw new Error(`Environment validation failed:\n${messages.join('\n')}`);
    }
    throw error;
  }
}

/**
 * Parsed and validated environment configuration
 */
export const env = validateEnv();

/**
 * Get allowed CORS origins as array
 */
export function getAllowedOrigins(): string[] {
  return env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
}
