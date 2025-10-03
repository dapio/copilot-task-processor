import winston from 'winston';

/**
 * Singleton Logger with enterprise-grade features
 */
export class Logger {
  private static instance: Logger;
  private readonly winston: winston.Logger;

  private constructor() {
    this.winston = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'copilot-task-processor' },
      transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ],
    });
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public info(message: string, meta?: any): void {
    this.winston.info(message, meta);
  }

  public error(message: string, error?: any): void {
    this.winston.error(message, error);
  }

  public debug(message: string, meta?: any): void {
    this.winston.debug(message, meta);
  }

  public warn(message: string, meta?: any): void {
    this.winston.warn(message, meta);
  }
}