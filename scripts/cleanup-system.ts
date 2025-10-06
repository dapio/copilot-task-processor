#!/usr/bin/env node

/**
 * ThinkCode AI Platform - System Cleanup Script
 * Comprehensive system cleanup with enterprise standards
 */

import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import * as path from 'path';

interface CleanupResult {
  success: boolean;
  message: string;
  details?: any;
}

class SystemCleanup {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async performCleanup(): Promise<CleanupResult> {
    try {
      console.log('🧹 Starting ThinkCode AI Platform System Cleanup...');

      // 1. Database cleanup
      await this.cleanupDatabase();

      // 2. Log files cleanup
      await this.cleanupLogFiles();

      // 3. Temporary files cleanup
      await this.cleanupTempFiles();

      // 4. Cache cleanup
      await this.cleanupCache();

      console.log('✅ System cleanup completed successfully!');

      return {
        success: true,
        message: 'System cleanup completed successfully',
      };
    } catch (error) {
      console.error('❌ System cleanup failed:', error);

      return {
        success: false,
        message: 'System cleanup failed',
        details: error,
      };
    } finally {
      await this.prisma.$disconnect();
    }
  }

  private async cleanupDatabase(): Promise<void> {
    console.log('📊 Cleaning up database...');

    try {
      // Clean old workflow executions (older than 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deletedWorkflows = await this.prisma.workflowExecution.deleteMany({
        where: {
          startedAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      console.log(
        `  ✓ Deleted ${deletedWorkflows.count} old workflow executions`
      );

      // Clean old documents (older than 90 days and not linked to active workflows)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const deletedDocuments = await this.prisma.document.deleteMany({
        where: {
          createdAt: {
            lt: ninetyDaysAgo,
          },
        },
      });

      console.log(`  ✓ Deleted ${deletedDocuments.count} old documents`);

      // Clean old knowledge entries (older than 90 days and archived)
      const deletedKnowledge = await this.prisma.knowledgeEntry.deleteMany({
        where: {
          status: 'archived',
          createdAt: {
            lt: ninetyDaysAgo,
          },
        },
      });

      console.log(
        `  ✓ Deleted ${deletedKnowledge.count} orphaned knowledge entries`
      );
    } catch (error) {
      console.error('  ❌ Database cleanup error:', error);
      throw error;
    }
  }

  private async cleanupLogFiles(): Promise<void> {
    console.log('📝 Cleaning up log files...');

    try {
      const logsDir = path.join(process.cwd(), 'logs');

      if (await this.directoryExists(logsDir)) {
        const logFiles = await fs.readdir(logsDir);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        let deletedCount = 0;

        for (const file of logFiles) {
          const filePath = path.join(logsDir, file);
          const stats = await fs.stat(filePath);

          if (stats.mtime < sevenDaysAgo) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        }

        console.log(`  ✓ Deleted ${deletedCount} old log files`);
      }
    } catch (error) {
      console.error('  ❌ Log files cleanup error:', error);
      throw error;
    }
  }

  private async cleanupTempFiles(): Promise<void> {
    console.log('🗂️ Cleaning up temporary files...');

    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');

      if (await this.directoryExists(uploadsDir)) {
        const uploadFiles = await fs.readdir(uploadsDir);
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        let deletedCount = 0;

        for (const file of uploadFiles) {
          const filePath = path.join(uploadsDir, file);
          const stats = await fs.stat(filePath);

          if (stats.mtime < oneDayAgo) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        }

        console.log(`  ✓ Deleted ${deletedCount} temporary upload files`);
      }
    } catch (error) {
      console.error('  ❌ Temporary files cleanup error:', error);
      throw error;
    }
  }

  private async cleanupCache(): Promise<void> {
    console.log('🗄️ Cleaning up cache files...');

    try {
      const cacheDirectories = [
        path.join(process.cwd(), '.next', 'cache'),
        path.join(process.cwd(), 'node_modules', '.cache'),
        path.join(process.cwd(), 'frontend', '.next', 'cache'),
        path.join(process.cwd(), 'admin-panel', '.next', 'cache'),
      ];

      let deletedCount = 0;

      for (const cacheDir of cacheDirectories) {
        if (await this.directoryExists(cacheDir)) {
          await this.removeDirectory(cacheDir);
          deletedCount++;
        }
      }

      console.log(`  ✓ Cleaned ${deletedCount} cache directories`);
    } catch (error) {
      console.error('  ❌ Cache cleanup error:', error);
      throw error;
    }
  }

  private async directoryExists(dir: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dir);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  private async removeDirectory(dir: string): Promise<void> {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`  ⚠️ Could not remove directory ${dir}:`, error);
    }
  }
}

// Main execution
if (require.main === module) {
  const cleanup = new SystemCleanup();

  cleanup
    .performCleanup()
    .then(result => {
      if (result.success) {
        console.log('🎉 ThinkCode AI Platform cleanup completed!');
        process.exit(0);
      } else {
        console.error('❌ Cleanup failed:', result.message);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Unexpected error during cleanup:', error);
      process.exit(1);
    });
}

export { SystemCleanup };
