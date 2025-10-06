import { PrismaClient } from '@prisma/client';
import { CleanupConfiguration, CleanupResult } from '../types/cleanup.types';

/**
 * DataRetentionManager - Zarządza retencją danych w bazie
 */
export class DataRetentionManager {
  constructor(private prisma: PrismaClient) {}

  /**
   * Wykonuje czyszczenie retencji danych
   */
  async executeCleanup(
    task: any,
    startTime: Date,
    config: CleanupConfiguration['dataRetention']
  ): Promise<CleanupResult> {
    const endTime = new Date();
    const errors: string[] = [];
    const warnings: string[] = [];
    let itemsProcessed = 0;
    let itemsRemoved = 0;

    try {
      // Czyszczenie starych zadań
      const tasksResult = await this.cleanupOldTasks(config.tasks);
      itemsProcessed += tasksResult.processed;
      itemsRemoved += tasksResult.removed;
      if (tasksResult.error) errors.push(tasksResult.error);

      // Czyszczenie starych wykonań
      const executionsResult = await this.cleanupOldExecutions(
        config.executions
      );
      itemsProcessed += executionsResult.processed;
      itemsRemoved += executionsResult.removed;
      if (executionsResult.error) errors.push(executionsResult.error);

      // Czyszczenie starych wyników badań
      const researchResult = await this.cleanupOldResearch(config.research);
      itemsProcessed += researchResult.processed;
      itemsRemoved += researchResult.removed;
      if (researchResult.error) errors.push(researchResult.error);

      // Czyszczenie starych zatwierdzeń makiet
      const mockupsResult = await this.cleanupOldMockups(config.mockups);
      itemsProcessed += mockupsResult.processed;
      itemsRemoved += mockupsResult.removed;
      if (mockupsResult.error) errors.push(mockupsResult.error);
    } catch (error) {
      errors.push(`Błąd podczas czyszczenia retencji danych: ${error}`);
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
      itemsRemoved,
      spaceSaved: itemsRemoved * 1024, // Przybliżone oszacowanie
      errors,
      warnings,
    };
  }

  /**
   * Czyści stare zadania
   */
  private async cleanupOldTasks(
    retentionDays: number
  ): Promise<{ processed: number; removed: number; error?: string }> {
    try {
      const cutoffDate = new Date(
        Date.now() - retentionDays * 24 * 60 * 60 * 1000
      );

      const deleteResult = await this.prisma.task.deleteMany({
        where: {
          status: 'completed',
          updatedAt: { lt: cutoffDate },
        },
      });

      return {
        processed: deleteResult.count,
        removed: deleteResult.count,
      };
    } catch (error) {
      return {
        processed: 0,
        removed: 0,
        error: `Błąd podczas czyszczenia zadań: ${error}`,
      };
    }
  }

  /**
   * Czyści stare wykonania workflow
   */
  private async cleanupOldExecutions(
    retentionDays: number
  ): Promise<{ processed: number; removed: number; error?: string }> {
    try {
      const cutoffDate = new Date(
        Date.now() - retentionDays * 24 * 60 * 60 * 1000
      );

      const deleteResult = await this.prisma.workflowExecution.deleteMany({
        where: {
          status: { in: ['completed', 'failed'] },
          startedAt: { lt: cutoffDate },
        },
      });

      return {
        processed: deleteResult.count,
        removed: deleteResult.count,
      };
    } catch (error) {
      return {
        processed: 0,
        removed: 0,
        error: `Błąd podczas czyszczenia wykonań: ${error}`,
      };
    }
  }

  /**
   * Czyści stare wyniki badań
   */
  private async cleanupOldResearch(
    retentionDays: number
  ): Promise<{ processed: number; removed: number; error?: string }> {
    try {
      const cutoffDate = new Date(
        Date.now() - retentionDays * 24 * 60 * 60 * 1000
      );

      const deleteResult = await this.prisma.researchResult.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
        },
      });

      return {
        processed: deleteResult.count,
        removed: deleteResult.count,
      };
    } catch (error) {
      return {
        processed: 0,
        removed: 0,
        error: `Błąd podczas czyszczenia wyników badań: ${error}`,
      };
    }
  }

  /**
   * Czyści stare zatwierdzenia makiet
   */
  private async cleanupOldMockups(
    retentionDays: number
  ): Promise<{ processed: number; removed: number; error?: string }> {
    try {
      const cutoffDate = new Date(
        Date.now() - retentionDays * 24 * 60 * 60 * 1000
      );

      const deleteResult = await this.prisma.mockupApproval.deleteMany({
        where: {
          status: { in: ['approved', 'rejected'] },
          updatedAt: { lt: cutoffDate },
        },
      });

      return {
        processed: deleteResult.count,
        removed: deleteResult.count,
      };
    } catch (error) {
      return {
        processed: 0,
        removed: 0,
        error: `Błąd podczas czyszczenia zatwierdzeń makiet: ${error}`,
      };
    }
  }
}
