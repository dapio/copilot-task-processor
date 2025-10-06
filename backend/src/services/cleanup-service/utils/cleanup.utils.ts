/**
 * CronUtils - Narzędzia do parsowania wyrażeń cron
 */
export class CronUtils {
  /**
   * Parsuje wyrażenie cron do interwału w milisekundach (uproszczone)
   */
  static parseCronToInterval(cronExpression: string): number {
    // Uproszczone parsowanie cron - w produkcji użyj odpowiedniej biblioteki
    if (cronExpression === '0 2 * * *') return 24 * 60 * 60 * 1000; // Codziennie o 2:00
    if (cronExpression === '0 3 * * 0') return 7 * 24 * 60 * 60 * 1000; // Tygodniowo niedziela 3:00
    if (cronExpression === '0 4 * * 0') return 7 * 24 * 60 * 60 * 1000; // Tygodniowo niedziela 4:00
    if (cronExpression === '0 1 * * *') return 24 * 60 * 60 * 1000; // Codziennie o 1:00

    return 24 * 60 * 60 * 1000; // Domyślnie codziennie
  }

  /**
   * Sprawdza czy wyrażenie cron jest poprawne
   */
  static isValidCronExpression(cronExpression: string): boolean {
    // Podstawowa walidacja - w produkcji użyj biblioteki cron-parser
    const parts = cronExpression.split(' ');

    if (parts.length !== 5) {
      return false;
    }

    // Sprawdź podstawowe formaty
    const validExpressions = [
      '0 2 * * *', // Codziennie o 2:00
      '0 3 * * 0', // Tygodniowo niedziela 3:00
      '0 4 * * 0', // Tygodniowo niedziela 4:00
      '0 1 * * *', // Codziennie o 1:00
    ];

    return validExpressions.includes(cronExpression);
  }

  /**
   * Oblicza następny czas uruchomienia dla wyrażenia cron
   */
  static getNextRunTime(
    cronExpression: string,
    fromDate: Date = new Date()
  ): Date {
    const interval = this.parseCronToInterval(cronExpression);
    return new Date(fromDate.getTime() + interval);
  }
}

/**
 * TaskSchedulerUtils - Narzędzia do zarządzania harmonogramem zadań
 */
export class TaskSchedulerUtils {
  private static scheduledTasks = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();

  /**
   * Planuje zadanie
   */
  static scheduleTask(
    taskId: string,
    cronExpression: string,
    executeCallback: () => Promise<void>
  ): boolean {
    try {
      // Anuluj poprzednie zadanie jeśli istnieje
      this.cancelTask(taskId);

      const interval = CronUtils.parseCronToInterval(cronExpression);

      if (interval > 0) {
        const timeout = setTimeout(async () => {
          await executeCallback();
          // Ponownie zaplanuj zadanie
          this.scheduleTask(taskId, cronExpression, executeCallback);
        }, interval);

        this.scheduledTasks.set(taskId, timeout);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Błąd podczas planowania zadania ${taskId}:`, error);
      return false;
    }
  }

  /**
   * Anuluje zaplanowane zadanie
   */
  static cancelTask(taskId: string): boolean {
    const timeout = this.scheduledTasks.get(taskId);

    if (timeout) {
      clearTimeout(timeout);
      this.scheduledTasks.delete(taskId);
      return true;
    }

    return false;
  }

  /**
   * Anuluje wszystkie zaplanowane zadania
   */
  static cancelAllTasks(): void {
    this.scheduledTasks.forEach(timeout => {
      clearTimeout(timeout);
    });
    this.scheduledTasks.clear();
  }

  /**
   * Zwraca listę aktywnych zadań
   */
  static getActiveTaskIds(): string[] {
    return Array.from(this.scheduledTasks.keys());
  }

  /**
   * Sprawdza czy zadanie jest aktywne
   */
  static isTaskActive(taskId: string): boolean {
    return this.scheduledTasks.has(taskId);
  }
}

/**
 * CleanupValidationUtils - Narzędzia walidacji dla operacji czyszczenia
 */
export class CleanupValidationUtils {
  /**
   * Waliduje konfigurację czyszczenia
   */
  static validateCleanupConfiguration(config: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Walidacja retencji danych
    if (config.dataRetention) {
      if (config.dataRetention.tasks < 1) {
        errors.push('Retencja zadań musi być co najmniej 1 dzień');
      }
      if (config.dataRetention.executions < 1) {
        errors.push('Retencja wykonań musi być co najmniej 1 dzień');
      }
      if (config.dataRetention.logs < 1) {
        errors.push('Retencja logów musi być co najmniej 1 dzień');
      }
    }

    // Walidacja czyszczenia plików
    if (config.fileCleanup) {
      if (config.fileCleanup.maxFileAge < 1) {
        errors.push('Maksymalny wiek plików musi być co najmniej 1 dzień');
      }
      if (config.fileCleanup.maxDirectorySize < 1) {
        errors.push('Maksymalny rozmiar katalogu musi być co najmniej 1MB');
      }
    }

    // Walidacja monitorowania
    if (config.monitoring) {
      if (
        config.monitoring.maxDiskUsage < 50 ||
        config.monitoring.maxDiskUsage > 100
      ) {
        errors.push(
          'Maksymalne wykorzystanie dysku musi być między 50% a 100%'
        );
      }
      if (
        config.monitoring.maxMemoryUsage < 50 ||
        config.monitoring.maxMemoryUsage > 100
      ) {
        errors.push(
          'Maksymalne wykorzystanie pamięci musi być między 50% a 100%'
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Waliduje dane zadania czyszczenia
   */
  static validateCleanupTask(taskData: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!taskData.name || taskData.name.trim().length === 0) {
      errors.push('Nazwa zadania jest wymagana');
    }

    if (!taskData.type) {
      errors.push('Typ zadania jest wymagany');
    }

    const validTypes = [
      'data_retention',
      'file_cleanup',
      'database_maintenance',
      'performance_optimization',
    ];
    if (taskData.type && !validTypes.includes(taskData.type)) {
      errors.push(
        `Niepoprawny typ zadania. Dozwolone: ${validTypes.join(', ')}`
      );
    }

    if (!taskData.schedule) {
      errors.push('Harmonogram zadania jest wymagany');
    }

    if (
      taskData.schedule &&
      !CronUtils.isValidCronExpression(taskData.schedule)
    ) {
      errors.push('Niepoprawne wyrażenie cron');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * MetricsUtils - Narzędzia do formatowania i analizy metryk
 */
export class MetricsUtils {
  /**
   * Formatuje rozmiar w bajtach do czytelnej postaci
   */
  static formatBytes(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

    if (bytes === 0) return '0 B';

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Formatuje czas w milisekundach do czytelnej postaci
   */
  static formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Oblicza procent wykorzystania
   */
  static calculateUsagePercentage(used: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((used / total) * 100 * 100) / 100;
  }

  /**
   * Generuje podsumowanie wyników czyszczenia
   */
  static generateCleanupSummary(results: any[]): {
    totalItemsProcessed: number;
    totalItemsRemoved: number;
    totalSpaceSaved: number;
    successRate: number;
    totalDuration: number;
  } {
    const summary = results.reduce(
      (acc, result) => ({
        totalItemsProcessed: acc.totalItemsProcessed + result.itemsProcessed,
        totalItemsRemoved: acc.totalItemsRemoved + result.itemsRemoved,
        totalSpaceSaved: acc.totalSpaceSaved + result.spaceSaved,
        successCount: acc.successCount + (result.success ? 1 : 0),
        totalDuration: acc.totalDuration + result.duration,
      }),
      {
        totalItemsProcessed: 0,
        totalItemsRemoved: 0,
        totalSpaceSaved: 0,
        successCount: 0,
        totalDuration: 0,
      }
    );

    return {
      totalItemsProcessed: summary.totalItemsProcessed,
      totalItemsRemoved: summary.totalItemsRemoved,
      totalSpaceSaved: summary.totalSpaceSaved,
      successRate:
        results.length > 0 ? (summary.successCount / results.length) * 100 : 0,
      totalDuration: summary.totalDuration,
    };
  }
}
