/**
 * Cleanup Service
 * Zarządza operacjami czyszczenia systemu i zadaniami konserwacji
 * Obsługuje zasady retencji danych, czyszczenie plików tymczasowych i optymalizację zasobów
 */

import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import { Result, MLError } from '../providers/ml-provider.interface';
import type {
  CleanupConfiguration,
  CleanupTask,
  CleanupResult,
  CleanupTaskCreationData,
  SystemMetrics,
} from './cleanup-service/types/cleanup.types';
import { DataRetentionManager } from './cleanup-service/managers/data-retention.manager';
import { FileCleanupManager } from './cleanup-service/managers/file-cleanup.manager';
import { DatabaseMaintenanceManager } from './cleanup-service/managers/database-maintenance.manager';
import { PerformanceOptimizationManager } from './cleanup-service/managers/performance-optimization.manager';
import {
  TaskSchedulerUtils,
  CleanupValidationUtils,
} from './cleanup-service/utils/cleanup.utils';

/**
 * CleanupService - Kompleksowa konserwacja systemu i optymalizacja
 *
 * Główna klasa orkiestracyjna zarządzająca wszystkimi operacjami czyszczenia
 * i konserwacji systemu z wykorzystaniem modularnej architektury.
 */
export class CleanupService extends EventEmitter {
  private readonly defaultConfig: CleanupConfiguration = {
    dataRetention: {
      tasks: 90, // 3 miesiące
      executions: 30, // 1 miesiąc
      uploads: 180, // 6 miesięcy
      mockups: 60, // 2 miesiące
      research: 30, // 1 miesiąc
      logs: 7, // 1 tydzień
    },
    fileCleanup: {
      tempDirectory: './temp',
      uploadDirectory: './uploads',
      logDirectory: './logs',
      maxFileAge: 7,
      maxDirectorySize: 1024, // 1GB
    },
    performance: {
      enableVacuum: true,
      enableReindex: true,
      enableAnalyze: true,
      maxQueryTime: 5000, // 5 sekund
    },
    monitoring: {
      alertOnErrors: true,
      maxDiskUsage: 85, // 85%
      maxMemoryUsage: 80, // 80%
    },
  };

  private readonly config: CleanupConfiguration;
  private readonly dataRetentionManager: DataRetentionManager;
  private readonly fileCleanupManager: FileCleanupManager;
  private readonly databaseMaintenanceManager: DatabaseMaintenanceManager;
  private readonly performanceOptimizationManager: PerformanceOptimizationManager;

  constructor(
    private prisma: PrismaClient,
    configOverrides: Partial<CleanupConfiguration> = {}
  ) {
    super();
    this.config = { ...this.defaultConfig, ...configOverrides };

    // Inicjalizacja menedżerów
    this.dataRetentionManager = new DataRetentionManager(this.prisma);
    this.fileCleanupManager = new FileCleanupManager();
    this.databaseMaintenanceManager = new DatabaseMaintenanceManager(
      this.prisma
    );
    this.performanceOptimizationManager = new PerformanceOptimizationManager(
      this.prisma
    );

    this.initializeCleanupTasks();
  }

  /**
   * Inicjalizuje domyślne zadania czyszczenia
   */
  private async initializeCleanupTasks(): Promise<void> {
    const defaultTasks: CleanupTaskCreationData[] = [
      {
        name: 'Codzienne czyszczenie retencji danych',
        type: 'data_retention',
        schedule: '0 2 * * *', // 2:00 codziennie
        configuration: this.config.dataRetention,
      },
      {
        name: 'Tygodniowe czyszczenie plików',
        type: 'file_cleanup',
        schedule: '0 3 * * 0', // 3:00 w niedziele
        configuration: this.config.fileCleanup,
      },
      {
        name: 'Tygodniowa konserwacja bazy danych',
        type: 'database_maintenance',
        schedule: '0 4 * * 0', // 4:00 w niedziele
        configuration: this.config.performance,
      },
      {
        name: 'Codzienna optymalizacja wydajności',
        type: 'performance_optimization',
        schedule: '0 1 * * *', // 1:00 codziennie
        configuration: { monitoring: this.config.monitoring },
      },
    ];

    for (const task of defaultTasks) {
      await this.createCleanupTask(task);
    }
  }

  /**
   * Tworzy nowe zadanie czyszczenia
   */
  async createCleanupTask(
    taskData: CleanupTaskCreationData
  ): Promise<Result<string, MLError>> {
    try {
      // Walidacja danych zadania
      const validation = CleanupValidationUtils.validateCleanupTask(taskData);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Niepoprawne dane zadania czyszczenia',
            details: { errors: validation.errors },
          },
        };
      }

      const cleanupTask = await this.prisma.cleanupTask.create({
        data: {
          name: taskData.name,
          type: taskData.type,
          schedule: taskData.schedule,
          status: 'pending',
          configuration: taskData.configuration as any,
          createdAt: new Date(),
        },
      });

      // Zaplanuj zadanie
      this.scheduleTask(cleanupTask.id, taskData.schedule);

      this.emit('taskCreated', { taskId: cleanupTask.id, name: taskData.name });

      return { success: true, data: cleanupTask.id };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TASK_CREATION_ERROR',
          message: `Nie udało się utworzyć zadania czyszczenia: ${error}`,
          details: {
            taskData,
            error: error instanceof Error ? error.message : error,
          },
        },
      };
    }
  }

  /**
   * Wykonuje zadanie czyszczenia
   */
  async executeCleanupTask(
    taskId: string
  ): Promise<Result<CleanupResult, MLError>> {
    try {
      const task = await this.getTaskById(taskId);
      if (!task.success) return task;

      const taskData = task.data;
      const startTime = new Date();

      await this.updateTaskStatus(taskId, 'running');
      this.emit('taskStarted', { taskId, name: taskData.name });

      const result = await this.executeTaskByType(taskData, startTime);

      await this.updateTaskStatus(
        taskId,
        result.success ? 'completed' : 'failed',
        startTime
      );
      await this.storeCleanupResult(result);

      this.emit('taskCompleted', {
        taskId,
        name: taskData.name,
        success: result.success,
        itemsRemoved: result.itemsRemoved,
        spaceSaved: result.spaceSaved,
      });

      return { success: true, data: result };
    } catch (error) {
      await this.handleTaskError(taskId, error);
      this.emit('taskError', { taskId, error });

      return {
        success: false,
        error: {
          code: 'TASK_EXECUTION_ERROR',
          message: `Nie udało się wykonać zadania czyszczenia: ${error}`,
          details: {
            taskId,
            error: error instanceof Error ? error.message : error,
          },
        },
      };
    }
  }

  private async getTaskById(taskId: string): Promise<Result<any, MLError>> {
    const task = await this.prisma.cleanupTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return {
        success: false,
        error: {
          code: 'TASK_NOT_FOUND',
          message: 'Zadanie czyszczenia nie zostało znalezione',
          details: { taskId },
        },
      };
    }

    return { success: true, data: task };
  }

  private async updateTaskStatus(
    taskId: string,
    status: string,
    lastRun?: Date
  ): Promise<void> {
    await this.prisma.cleanupTask.update({
      where: { id: taskId },
      data: { status, ...(lastRun && { lastRun }) },
    });
  }

  private async executeTaskByType(
    task: any,
    startTime: Date
  ): Promise<CleanupResult> {
    switch (task.type) {
      case 'data_retention':
        return await this.dataRetentionManager.executeCleanup(
          task,
          startTime,
          task.configuration
        );
      case 'file_cleanup':
        return await this.fileCleanupManager.executeCleanup(
          task,
          startTime,
          task.configuration
        );
      case 'database_maintenance':
        return await this.databaseMaintenanceManager.executeCleanup(
          task,
          startTime,
          task.configuration
        );
      case 'performance_optimization':
        return await this.performanceOptimizationManager.executeCleanup(
          task,
          startTime,
          task.configuration
        );
      default:
        throw new Error(`Nieznany typ zadania: ${task.type}`);
    }
  }

  private async storeCleanupResult(result: CleanupResult): Promise<void> {
    await this.prisma.cleanupResult.create({
      data: {
        taskId: result.taskId,
        taskName: result.taskName,
        success: result.success,
        startTime: result.startTime,
        endTime: result.endTime,
        duration: result.duration,
        itemsProcessed: result.itemsProcessed,
        itemsRemoved: result.itemsRemoved,
        spaceSaved: result.spaceSaved,
        errors: result.errors,
        warnings: result.warnings,
        createdAt: new Date(),
      },
    });
  }

  private async handleTaskError(taskId: string, error: unknown): Promise<void> {
    // Logowanie błędu dla diagnostyki
    const errorMessage =
      error instanceof Error ? error.message : 'Nieznany błąd';
    console.error(`Błąd zadania czyszczenia ${taskId}:`, errorMessage);

    await this.prisma.cleanupTask
      .update({
        where: { id: taskId },
        data: { status: 'failed' },
      })
      .catch(() => {});
  }

  /**
   * Pobiera metryki systemu
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    return await this.performanceOptimizationManager.getSystemMetrics();
  }

  /**
   * Planuje zadanie czyszczenia
   */
  private scheduleTask(taskId: string, cronExpression: string): void {
    TaskSchedulerUtils.scheduleTask(taskId, cronExpression, async () => {
      await this.executeCleanupTask(taskId);
    });
  }

  /**
   * Zatrzymuje wszystkie zaplanowane zadania
   */
  stopAllTasks(): void {
    TaskSchedulerUtils.cancelAllTasks();
  }

  /**
   * Get cleanup task status
   */
  async getCleanupTaskStatus(): Promise<Result<CleanupTask[], MLError>> {
    try {
      const tasks = await this.prisma.cleanupTask.findMany({
        orderBy: {
          lastRun: 'desc',
        },
      });

      const cleanupTasks: CleanupTask[] = tasks.map(task => ({
        id: task.id,
        name: task.name,
        type: task.type as any,
        schedule: task.schedule,
        lastRun: task.lastRun || undefined,
        status: task.status as any,
        configuration: task.configuration as any,
      }));

      return { success: true, data: cleanupTasks };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: `Failed to get cleanup task status: ${error}`,
          details: { error: error instanceof Error ? error.message : error },
        },
      };
    }
  }

  /**
   * Get cleanup results history
   */
  async getCleanupResults(
    taskId?: string,
    limit = 50
  ): Promise<Result<CleanupResult[], MLError>> {
    try {
      const whereClause = taskId ? { taskId } : {};

      const results = await this.prisma.cleanupResult.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      const cleanupResults: CleanupResult[] = results.map(result => ({
        taskId: result.taskId,
        taskName: result.taskName,
        success: result.success,
        startTime: result.startTime,
        endTime: result.endTime,
        duration: result.duration,
        itemsProcessed: result.itemsProcessed,
        itemsRemoved: result.itemsRemoved,
        spaceSaved: result.spaceSaved,
        errors: result.errors as string[],
        warnings: result.warnings as string[],
      }));

      return { success: true, data: cleanupResults };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: `Failed to get cleanup results: ${error}`,
          details: {
            taskId,
            error: error instanceof Error ? error.message : error,
          },
        },
      };
    }
  }
}
