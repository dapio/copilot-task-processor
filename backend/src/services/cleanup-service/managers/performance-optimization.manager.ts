import { PrismaClient } from '@prisma/client';
import {
  CleanupConfiguration,
  CleanupResult,
  SystemMetrics,
} from '../types/cleanup.types';

/**
 * PerformanceOptimizationManager - Zarządza optymalizacją wydajności systemu
 */
export class PerformanceOptimizationManager {
  constructor(private prisma: PrismaClient) {}

  /**
   * Wykonuje optymalizację wydajności
   */
  async executeCleanup(
    task: any,
    startTime: Date,
    config: { monitoring: CleanupConfiguration['monitoring'] }
  ): Promise<CleanupResult> {
    const endTime = new Date();
    const errors: string[] = [];
    const warnings: string[] = [];
    let itemsProcessed = 0;

    try {
      // Pobierz metryki systemu
      const metrics = await this.getSystemMetrics();
      itemsProcessed++;

      // Sprawdź wykorzystanie dysku
      if (metrics.filesystem.usedSpace / metrics.filesystem.totalSpace > 0.85) {
        warnings.push('Wykorzystanie dysku powyżej 85%');
      }

      // Sprawdź wolne zapytania (symulowane)
      if (metrics.performance.avgQueryTime > 1000) {
        warnings.push(
          `Średni czas zapytania wynosi ${metrics.performance.avgQueryTime}ms`
        );
      }

      // Czyść stare wyniki czyszczenia
      const cleanupResult = await this.cleanupOldResults();
      itemsProcessed += cleanupResult.removed;

      // Analizuj wykorzystanie pamięci
      if (
        metrics.performance.memoryUsage >
        config.monitoring.maxMemoryUsage * 1024 * 1024
      ) {
        warnings.push(
          `Wysokie wykorzystanie pamięci: ${Math.round(
            metrics.performance.memoryUsage / 1024 / 1024
          )}MB`
        );
      }

      // Sprawdź wykorzystanie CPU
      if (metrics.performance.cpuUsage > 80) {
        warnings.push(
          `Wysokie wykorzystanie CPU: ${metrics.performance.cpuUsage}%`
        );
      }
    } catch (error) {
      errors.push(`Błąd podczas optymalizacji wydajności: ${error}`);
    }

    endTime.setTime(Date.now());

    return {
      taskId: task.id,
      taskName: task.name,
      success: errors.length === 0,
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
      itemsProcessed,
      itemsRemoved: 0,
      spaceSaved: 0,
      errors,
      warnings,
    };
  }

  /**
   * Pobiera metryki systemu
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    // Mockowa implementacja - w produkcji zbierałaby prawdziwe metryki
    return {
      database: {
        totalSize: 50 * 1024 * 1024, // 50MB
        tableStats: {
          Task: { rows: 1000, size: 5 * 1024 * 1024 },
          WorkflowExecution: { rows: 500, size: 10 * 1024 * 1024 },
          Agent: { rows: 10, size: 1024 * 1024 },
        },
        indexStats: {
          Task_status_idx: { size: 512 * 1024, usage: 95 },
          WorkflowExecution_status_idx: { size: 256 * 1024, usage: 88 },
        },
      },
      filesystem: {
        totalSpace: 100 * 1024 * 1024 * 1024, // 100GB
        usedSpace: 60 * 1024 * 1024 * 1024, // 60GB
        freeSpace: 40 * 1024 * 1024 * 1024, // 40GB
        directoryStats: {
          './uploads': { files: 150, size: 20 * 1024 * 1024 },
          './logs': { files: 50, size: 5 * 1024 * 1024 },
          './temp': { files: 10, size: 1024 * 1024 },
        },
      },
      performance: {
        avgQueryTime: 250, // millisekund
        slowQueries: [
          { query: 'SELECT * FROM Task WHERE...', time: 1500, count: 5 },
          { query: 'SELECT * FROM WorkflowExecution...', time: 2000, count: 2 },
        ],
        memoryUsage: 512 * 1024 * 1024, // 512MB
        cpuUsage: 45, // 45%
      },
    };
  }

  /**
   * Czyści stare wyniki czyszczenia
   */
  private async cleanupOldResults(): Promise<{ removed: number }> {
    try {
      const cleanupCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 dni

      const deleteResult = await this.prisma.cleanupResult.deleteMany({
        where: {
          createdAt: { lt: cleanupCutoff },
        },
      });

      return { removed: deleteResult.count };
    } catch (error) {
      console.warn('Błąd podczas czyszczenia starych wyników:', error);
      return { removed: 0 };
    }
  }

  /**
   * Analizuje wydajność zapytań
   */
  async analyzeQueryPerformance(): Promise<{
    slowQueries: Array<{ query: string; avgTime: number; count: number }>;
    recommendations: string[];
  }> {
    // W rzeczywistej implementacji analizowałoby prawdziwe zapytania
    const slowQueries = [
      {
        query: 'SELECT * FROM Task WHERE status = ?',
        avgTime: 1500,
        count: 10,
      },
      {
        query: 'SELECT * FROM WorkflowExecution JOIN Task ON...',
        avgTime: 2200,
        count: 5,
      },
    ];

    const recommendations: string[] = [];

    slowQueries.forEach(query => {
      if (query.avgTime > 1000) {
        recommendations.push(
          `Zapytanie "${query.query.substring(
            0,
            50
          )}..." wymaga optymalizacji (${query.avgTime}ms)`
        );
      }
    });

    return {
      slowQueries,
      recommendations,
    };
  }

  /**
   * Sprawdza stan indeksów
   */
  async checkIndexHealth(): Promise<{
    indexStats: Array<{ name: string; usage: number; size: number }>;
    unusedIndexes: string[];
  }> {
    // W rzeczywistej implementacji sprawdzałoby prawdziwe indeksy
    const indexStats = [
      { name: 'Task_status_idx', usage: 95, size: 512 * 1024 },
      { name: 'WorkflowExecution_status_idx', usage: 88, size: 256 * 1024 },
      { name: 'Agent_type_idx', usage: 5, size: 128 * 1024 },
    ];

    const unusedIndexes = indexStats
      .filter(index => index.usage < 10)
      .map(index => index.name);

    return {
      indexStats,
      unusedIndexes,
    };
  }
}
