#!/usr/bin/env tsx
/**
 * System Cleanup Script - Automatyczne czyszczenie plików tymczasowych
 * Usuwa wszystkie pliki tymczasowe generowane przez agentów i procesy
 */

import { promises as fs } from 'fs';
import * as path from 'path';
const ROOT_DIR = path.resolve(process.cwd());

interface CleanupConfig {
  tempDirs: string[];
  tempFilePatterns: string[];
  logRetentionDays: number;
  maxFileAge: number; // w millisekundach
}

const CLEANUP_CONFIG: CleanupConfig = {
  tempDirs: [
    'uploads/temp',
    'logs/temp',
    'backend/temp',
    'frontend/temp',
    'dist/temp',
    '.tmp',
    'tmp',
    'temp',
  ],
  tempFilePatterns: [
    '*.tmp',
    '*.temp',
    '*.log.old',
    '*.backup',
    '.DS_Store',
    'Thumbs.db',
    '*.swp',
    '*.swo',
    '*~',
    '*.cache',
    '*.lock',
  ],
  logRetentionDays: 7,
  maxFileAge: 24 * 60 * 60 * 1000, // 24 godziny
};

class SystemCleaner {
  private deletedFiles: string[] = [];
  private deletedDirs: string[] = [];
  private freedSpace: number = 0;

  async cleanup(): Promise<void> {
    console.log('🧹 Rozpoczynam czyszczenie systemu...\n');

    try {
      await this.cleanTempDirectories();
      await this.cleanTempFiles();
      await this.cleanOldLogs();
      await this.cleanNodeModulesCache();
      await this.cleanBuildArtifacts();

      this.printSummary();
    } catch (error) {
      console.error('❌ Błąd podczas czyszczenia:', error);
      throw error;
    }
  }

  private async cleanTempDirectories(): Promise<void> {
    console.log('📁 Czyszczenie katalogów tymczasowych...');

    for (const tempDir of CLEANUP_CONFIG.tempDirs) {
      const fullPath = path.join(ROOT_DIR, tempDir);

      try {
        const exists = await this.pathExists(fullPath);
        if (exists) {
          await this.removeDirectory(fullPath);
          this.deletedDirs.push(tempDir);
          console.log(`   ✅ Usunięto: ${tempDir}`);
        }
      } catch (error) {
        console.log(
          `   ⚠️  Nie można usunąć: ${tempDir} (${error instanceof Error ? error.message : 'Unknown error'})`
        );
      }
    }
  }

  private async cleanTempFiles(): Promise<void> {
    console.log('\n📄 Czyszczenie plików tymczasowych...');

    await this.scanAndCleanFiles(ROOT_DIR);
  }

  private async scanAndCleanFiles(dirPath: string): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // Skip node_modules, .git i inne duże katalogi
          if (!['node_modules', '.git', '.next', 'dist'].includes(entry.name)) {
            await this.scanAndCleanFiles(fullPath);
          }
        } else if (entry.isFile()) {
          const shouldDelete = await this.shouldDeleteFile(
            fullPath,
            entry.name
          );

          if (shouldDelete) {
            try {
              const stats = await fs.stat(fullPath);
              this.freedSpace += stats.size;

              await fs.unlink(fullPath);
              this.deletedFiles.push(path.relative(ROOT_DIR, fullPath));
              console.log(
                `   ✅ Usunięto: ${path.relative(ROOT_DIR, fullPath)}`
              );
            } catch (error) {
              console.log(
                `   ⚠️  Nie można usunąć: ${path.relative(ROOT_DIR, fullPath)}`
              );
            }
          }
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  }

  private async shouldDeleteFile(
    filePath: string,
    fileName: string
  ): Promise<boolean> {
    // Sprawdź wzorce nazw plików
    for (const pattern of CLEANUP_CONFIG.tempFilePatterns) {
      if (this.matchPattern(fileName, pattern)) {
        return true;
      }
    }

    // Sprawdź wiek pliku
    try {
      const stats = await fs.stat(filePath);
      const age = Date.now() - stats.mtime.getTime();

      if (age > CLEANUP_CONFIG.maxFileAge && this.isTempFile(fileName)) {
        return true;
      }
    } catch (error) {
      return false;
    }

    return false;
  }

  private isTempFile(fileName: string): boolean {
    const tempIndicators = ['temp', 'tmp', 'cache', 'backup', 'old'];
    const lowerName = fileName.toLowerCase();

    return tempIndicators.some(indicator => lowerName.includes(indicator));
  }

  private matchPattern(fileName: string, pattern: string): boolean {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i');
    return regex.test(fileName);
  }

  private async cleanOldLogs(): Promise<void> {
    console.log('\n📋 Czyszczenie starych logów...');

    const logsDir = path.join(ROOT_DIR, 'logs');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_CONFIG.logRetentionDays);

    try {
      const exists = await this.pathExists(logsDir);
      if (!exists) return;

      const files = await fs.readdir(logsDir);

      for (const file of files) {
        const filePath = path.join(logsDir, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime < cutoffDate) {
          this.freedSpace += stats.size;
          await fs.unlink(filePath);
          this.deletedFiles.push(path.relative(ROOT_DIR, filePath));
          console.log(`   ✅ Usunięto stary log: ${file}`);
        }
      }
    } catch (error) {
      console.log(
        '   ⚠️  Błąd czyszczenia logów:',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  private async cleanNodeModulesCache(): Promise<void> {
    console.log('\n📦 Czyszczenie cache Node.js...');

    const cacheDirs = [
      'node_modules/.cache',
      'backend/node_modules/.cache',
      'frontend/node_modules/.cache',
      '.npm/_cacache',
    ];

    for (const cacheDir of cacheDirs) {
      const fullPath = path.join(ROOT_DIR, cacheDir);

      try {
        const exists = await this.pathExists(fullPath);
        if (exists) {
          await this.removeDirectory(fullPath);
          this.deletedDirs.push(cacheDir);
          console.log(`   ✅ Wyczyszczono cache: ${cacheDir}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Nie można wyczyścić cache: ${cacheDir}`);
      }
    }
  }

  private async cleanBuildArtifacts(): Promise<void> {
    console.log('\n🏗️  Czyszczenie artefaktów build...');

    const buildDirs = [
      '.next',
      'dist',
      'build',
      'out',
      'backend/dist',
      'frontend/.next',
      'frontend/dist',
      'frontend/build',
    ];

    for (const buildDir of buildDirs) {
      const fullPath = path.join(ROOT_DIR, buildDir);

      try {
        const exists = await this.pathExists(fullPath);
        if (exists) {
          const stats = await fs.stat(fullPath);
          if (stats.isDirectory()) {
            // Tylko jeśli katalog jest starszy niż godzina
            const age = Date.now() - stats.mtime.getTime();
            if (age > 60 * 60 * 1000) {
              // 1 godzina
              await this.removeDirectory(fullPath);
              this.deletedDirs.push(buildDir);
              console.log(`   ✅ Usunięto stary build: ${buildDir}`);
            }
          }
        }
      } catch (error) {
        console.log(`   ⚠️  Nie można usunąć build: ${buildDir}`);
      }
    }
  }

  private async removeDirectory(dirPath: string): Promise<void> {
    await fs.rm(dirPath, { recursive: true, force: true });
  }

  private async pathExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private printSummary(): void {
    console.log('\n🎉 Czyszczenie zakończone!');
    console.log('='.repeat(50));
    console.log(`📁 Usunięte katalogi: ${this.deletedDirs.length}`);
    console.log(`📄 Usunięte pliki: ${this.deletedFiles.length}`);
    console.log(`💾 Zwolnione miejsce: ${this.formatBytes(this.freedSpace)}`);
    console.log('='.repeat(50));

    if (this.deletedDirs.length > 0) {
      console.log('\n📁 Usunięte katalogi:');
      this.deletedDirs.forEach(dir => console.log(`   - ${dir}`));
    }

    if (this.deletedFiles.length > 10) {
      console.log(
        `\n📄 Przykład usuniętych plików (${this.deletedFiles.length} total):`
      );
      this.deletedFiles
        .slice(0, 10)
        .forEach(file => console.log(`   - ${file}`));
      console.log(`   ... i ${this.deletedFiles.length - 10} więcej`);
    } else if (this.deletedFiles.length > 0) {
      console.log('\n📄 Usunięte pliki:');
      this.deletedFiles.forEach(file => console.log(`   - ${file}`));
    }
  }
}

// Uruchom czyszczenie
if (require.main === module) {
  const cleaner = new SystemCleaner();
  cleaner
    .cleanup()
    .then(() => {
      console.log('\n✨ System wyczyszczony!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Błąd czyszczenia:', error);
      process.exit(1);
    });
}

export { SystemCleaner };
