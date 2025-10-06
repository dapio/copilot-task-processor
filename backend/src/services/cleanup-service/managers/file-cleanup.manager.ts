import { promises as fs } from 'fs';
import * as path from 'path';
import {
  CleanupConfiguration,
  CleanupResult,
  DirectoryCleanupStats,
} from '../types/cleanup.types';

/**
 * FileCleanupManager - Zarządza czyszczeniem plików i katalogów
 */
export class FileCleanupManager {
  constructor() {}

  /**
   * Wykonuje czyszczenie plików
   */
  async executeCleanup(
    task: any,
    startTime: Date,
    config: CleanupConfiguration['fileCleanup']
  ): Promise<CleanupResult> {
    const endTime = new Date();
    const errors: string[] = [];
    const warnings: string[] = [];
    let itemsProcessed = 0;
    let itemsRemoved = 0;
    let spaceSaved = 0;

    try {
      // Czyszczenie katalogu tymczasowego
      const tempStats = await this.cleanupDirectory(
        config.tempDirectory,
        config.maxFileAge
      );
      itemsProcessed += tempStats.processed;
      itemsRemoved += tempStats.removed;
      spaceSaved += tempStats.spaceSaved;

      // Czyszczenie starych plików przesłanych (zachowaj referencje w bazie)
      const uploadStats = await this.cleanupDirectory(
        config.uploadDirectory,
        config.maxFileAge * 2 // Zachowaj pliki przesłane dłużej
      );
      itemsProcessed += uploadStats.processed;
      itemsRemoved += uploadStats.removed;
      spaceSaved += uploadStats.spaceSaved;

      // Czyszczenie plików logów
      const logStats = await this.cleanupDirectory(
        config.logDirectory,
        7 // Zachowaj logi przez 1 tydzień
      );
      itemsProcessed += logStats.processed;
      itemsRemoved += logStats.removed;
      spaceSaved += logStats.spaceSaved;
    } catch (error) {
      errors.push(`Błąd podczas czyszczenia plików: ${error}`);
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
      spaceSaved,
      errors,
      warnings,
    };
  }

  /**
   * Czyści katalog usuwając stare pliki
   */
  async cleanupDirectory(
    directoryPath: string,
    maxAgeInDays: number
  ): Promise<DirectoryCleanupStats> {
    let processed = 0;
    let removed = 0;
    let spaceSaved = 0;

    try {
      const cutoffTime = Date.now() - maxAgeInDays * 24 * 60 * 60 * 1000;

      // Sprawdź czy katalog istnieje
      try {
        await fs.access(directoryPath);
      } catch {
        return { processed, removed, spaceSaved };
      }

      const files = await fs.readdir(directoryPath);

      for (const file of files) {
        const filePath = path.join(directoryPath, file);
        const stats = await fs.stat(filePath);

        processed++;

        if (stats.mtime.getTime() < cutoffTime) {
          spaceSaved += stats.size;
          await fs.unlink(filePath);
          removed++;
        }
      }
    } catch (error) {
      console.warn(
        `Błąd podczas czyszczenia katalogu ${directoryPath}:`,
        error
      );
    }

    return { processed, removed, spaceSaved };
  }

  /**
   * Sprawdza rozmiar katalogu
   */
  async getDirectorySize(directoryPath: string): Promise<number> {
    let totalSize = 0;

    try {
      const files = await fs.readdir(directoryPath);

      for (const file of files) {
        const filePath = path.join(directoryPath, file);
        const stats = await fs.stat(filePath);

        if (stats.isFile()) {
          totalSize += stats.size;
        } else if (stats.isDirectory()) {
          totalSize += await this.getDirectorySize(filePath);
        }
      }
    } catch (error) {
      console.warn(
        `Błąd podczas obliczania rozmiaru katalogu ${directoryPath}:`,
        error
      );
    }

    return totalSize;
  }

  /**
   * Liczy pliki w katalogu
   */
  async countFilesInDirectory(directoryPath: string): Promise<number> {
    let fileCount = 0;

    try {
      const files = await fs.readdir(directoryPath);

      for (const file of files) {
        const filePath = path.join(directoryPath, file);
        const stats = await fs.stat(filePath);

        if (stats.isFile()) {
          fileCount++;
        } else if (stats.isDirectory()) {
          fileCount += await this.countFilesInDirectory(filePath);
        }
      }
    } catch (error) {
      console.warn(
        `Błąd podczas liczenia plików w katalogu ${directoryPath}:`,
        error
      );
    }

    return fileCount;
  }
}
