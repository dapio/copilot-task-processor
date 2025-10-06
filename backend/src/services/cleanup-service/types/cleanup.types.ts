import { PrismaClient } from '@prisma/client';

export type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };

export interface MLError {
  code: string;
  message: string;
  details?: any;
}

export interface CleanupConfiguration {
  dataRetention: {
    tasks: number; // days to keep task records
    executions: number; // days to keep execution records
    uploads: number; // days to keep uploaded files
    mockups: number; // days to keep mockup approvals
    research: number; // days to keep research results
    logs: number; // days to keep log files
  };
  fileCleanup: {
    tempDirectory: string;
    uploadDirectory: string;
    logDirectory: string;
    maxFileAge: number; // days
    maxDirectorySize: number; // MB
  };
  performance: {
    enableVacuum: boolean;
    enableReindex: boolean;
    enableAnalyze: boolean;
    maxQueryTime: number; // milliseconds
  };
  monitoring: {
    alertOnErrors: boolean;
    maxDiskUsage: number; // percentage
    maxMemoryUsage: number; // percentage
  };
}

export interface CleanupTask {
  id: string;
  name: string;
  type:
    | 'data_retention'
    | 'file_cleanup'
    | 'database_maintenance'
    | 'performance_optimization';
  schedule: string; // cron expression
  lastRun?: Date;
  nextRun?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  configuration: any;
}

export interface CleanupResult {
  taskId: string;
  taskName: string;
  success: boolean;
  startTime: Date;
  endTime: Date;
  duration: number; // milliseconds
  itemsProcessed: number;
  itemsRemoved: number;
  spaceSaved: number; // bytes
  errors: string[];
  warnings: string[];
}

export interface SystemMetrics {
  database: {
    totalSize: number; // bytes
    tableStats: { [tableName: string]: { rows: number; size: number } };
    indexStats: { [indexName: string]: { size: number; usage: number } };
  };
  filesystem: {
    totalSpace: number; // bytes
    usedSpace: number; // bytes
    freeSpace: number; // bytes
    directoryStats: { [directory: string]: { files: number; size: number } };
  };
  performance: {
    avgQueryTime: number; // milliseconds
    slowQueries: Array<{ query: string; time: number; count: number }>;
    memoryUsage: number; // bytes
    cpuUsage: number; // percentage
  };
}

export interface DirectoryCleanupStats {
  processed: number;
  removed: number;
  spaceSaved: number;
}

export interface CleanupTaskCreationData {
  name: string;
  type: CleanupTask['type'];
  schedule: string;
  configuration: any;
}

export interface CleanupServiceDependencies {
  prisma: PrismaClient;
  config?: Partial<CleanupConfiguration>;
}

export interface CleanupTaskExecution {
  taskId: string;
  task: any;
  startTime: Date;
}
