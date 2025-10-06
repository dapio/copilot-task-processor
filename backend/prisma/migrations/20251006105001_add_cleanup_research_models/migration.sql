/*
  Warnings:

  - You are about to drop the `agent_best_practices` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "agent_best_practices";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "AgentBestPractice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "rule" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "examples" JSONB,
    "antipatterns" JSONB,
    "tools" JSONB,
    "tags" JSONB,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "createdBy" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WorkflowTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "type" TEXT NOT NULL,
    "category" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "steps" JSONB NOT NULL,
    "conditions" JSONB,
    "variables" JSONB,
    "metadata" JSONB,
    "timeout" INTEGER,
    "retryPolicy" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "inputSchema" JSONB,
    "outputSchema" JSONB,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "tags" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WorkflowStepTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "handler" TEXT NOT NULL,
    "handlerConfig" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "dependencies" JSONB,
    "conditions" JSONB,
    "timeout" INTEGER,
    "retries" INTEGER DEFAULT 0,
    "retryDelay" INTEGER DEFAULT 1000,
    "inputMapping" JSONB,
    "outputMapping" JSONB,
    "onError" TEXT,
    "errorHandler" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkflowStepTemplate_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "WorkflowTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkflowRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "projectId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "currentStepId" TEXT,
    "input" JSONB,
    "output" JSONB,
    "context" JSONB,
    "variables" JSONB,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "estimatedEnd" DATETIME,
    "actualDuration" INTEGER,
    "totalSteps" INTEGER NOT NULL DEFAULT 0,
    "completedSteps" INTEGER NOT NULL DEFAULT 0,
    "failedSteps" INTEGER NOT NULL DEFAULT 0,
    "skippedSteps" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "errorCode" TEXT,
    "errorDetails" JSONB,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "executor" TEXT,
    "executorType" TEXT,
    "executionLog" JSONB,
    "performanceLog" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkflowRun_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "WorkflowTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkflowRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkflowStepExecution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowRunId" TEXT NOT NULL,
    "stepTemplateId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "maxAttempts" INTEGER NOT NULL DEFAULT 1,
    "input" JSONB,
    "output" JSONB,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "duration" INTEGER,
    "timeout" INTEGER,
    "error" TEXT,
    "errorCode" TEXT,
    "errorDetails" JSONB,
    "stackTrace" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" DATETIME,
    "retryReason" TEXT,
    "cpuUsage" REAL,
    "memoryUsage" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkflowStepExecution_workflowRunId_fkey" FOREIGN KEY ("workflowRunId") REFERENCES "WorkflowRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkflowStepExecution_stepTemplateId_fkey" FOREIGN KEY ("stepTemplateId") REFERENCES "WorkflowStepTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkflowExecutionEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowRunId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'info',
    "message" TEXT NOT NULL,
    "details" JSONB,
    "stepId" TEXT,
    "userId" TEXT,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkflowExecutionEvent_workflowRunId_fkey" FOREIGN KEY ("workflowRunId") REFERENCES "WorkflowRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkflowHandler" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "handlerClass" TEXT,
    "handlerMethod" TEXT,
    "configSchema" JSONB,
    "inputSchema" JSONB,
    "outputSchema" JSONB,
    "requirements" JSONB,
    "dependencies" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "documentation" TEXT,
    "examples" JSONB,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WorkflowSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "scheduleType" TEXT NOT NULL,
    "cronExpression" TEXT,
    "interval" INTEGER,
    "scheduledAt" DATETIME,
    "input" JSONB,
    "context" JSONB,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "lastRun" DATETIME,
    "nextRun" DATETIME,
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkflowSchedule_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "WorkflowTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentFeed" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentFeed_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AgentFeed_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "knowledge_feeds" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectFeed" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectFeed_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProjectFeed_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "knowledge_feeds" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectChatSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT,
    "context" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectChatSession_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "agentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ProjectChatSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProjectChatMessage_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MockupApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "mockupData" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvalComments" JSONB,
    "iterations" JSONB,
    "currentIteration" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MockupApproval_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResearchSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "apiConfig" JSONB,
    "metadata" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ResearchQuery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "query" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "projectId" TEXT,
    "results" JSONB,
    "sources" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResearchQuery_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cleanup_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "lastRun" DATETIME,
    "nextRun" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "configuration" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "cleanup_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL,
    "itemsProcessed" INTEGER NOT NULL,
    "itemsRemoved" INTEGER NOT NULL,
    "spaceSaved" INTEGER NOT NULL,
    "errors" JSONB NOT NULL,
    "warnings" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cleanup_results_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "cleanup_tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "research_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "query" TEXT NOT NULL,
    "searchType" TEXT NOT NULL,
    "results" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "keyFindings" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "confidence" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "AgentBestPractice_agentType_active_idx" ON "AgentBestPractice"("agentType", "active");

-- CreateIndex
CREATE INDEX "AgentBestPractice_category_idx" ON "AgentBestPractice"("category");

-- CreateIndex
CREATE UNIQUE INDEX "AgentBestPractice_agentType_category_title_key" ON "AgentBestPractice"("agentType", "category", "title");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_category_active_idx" ON "WorkflowTemplate"("category", "active");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_type_idx" ON "WorkflowTemplate"("type");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_priority_idx" ON "WorkflowTemplate"("priority");

-- CreateIndex
CREATE INDEX "WorkflowStepTemplate_workflowId_order_idx" ON "WorkflowStepTemplate"("workflowId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowStepTemplate_workflowId_stepId_key" ON "WorkflowStepTemplate"("workflowId", "stepId");

-- CreateIndex
CREATE INDEX "WorkflowRun_workflowId_status_idx" ON "WorkflowRun"("workflowId", "status");

-- CreateIndex
CREATE INDEX "WorkflowRun_projectId_idx" ON "WorkflowRun"("projectId");

-- CreateIndex
CREATE INDEX "WorkflowRun_status_createdAt_idx" ON "WorkflowRun"("status", "createdAt");

-- CreateIndex
CREATE INDEX "WorkflowRun_executor_idx" ON "WorkflowRun"("executor");

-- CreateIndex
CREATE INDEX "WorkflowStepExecution_workflowRunId_stepId_idx" ON "WorkflowStepExecution"("workflowRunId", "stepId");

-- CreateIndex
CREATE INDEX "WorkflowStepExecution_status_idx" ON "WorkflowStepExecution"("status");

-- CreateIndex
CREATE INDEX "WorkflowStepExecution_startTime_idx" ON "WorkflowStepExecution"("startTime");

-- CreateIndex
CREATE INDEX "WorkflowExecutionEvent_workflowRunId_type_idx" ON "WorkflowExecutionEvent"("workflowRunId", "type");

-- CreateIndex
CREATE INDEX "WorkflowExecutionEvent_createdAt_idx" ON "WorkflowExecutionEvent"("createdAt");

-- CreateIndex
CREATE INDEX "WorkflowExecutionEvent_level_idx" ON "WorkflowExecutionEvent"("level");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowHandler_name_key" ON "WorkflowHandler"("name");

-- CreateIndex
CREATE INDEX "WorkflowHandler_type_enabled_idx" ON "WorkflowHandler"("type", "enabled");

-- CreateIndex
CREATE INDEX "WorkflowHandler_category_idx" ON "WorkflowHandler"("category");

-- CreateIndex
CREATE INDEX "WorkflowSchedule_enabled_nextRun_idx" ON "WorkflowSchedule"("enabled", "nextRun");

-- CreateIndex
CREATE INDEX "WorkflowSchedule_workflowId_idx" ON "WorkflowSchedule"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentFeed_agentId_feedId_key" ON "AgentFeed"("agentId", "feedId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectFeed_projectId_feedId_key" ON "ProjectFeed"("projectId", "feedId");

-- CreateIndex
CREATE INDEX "ProjectChatSession_projectId_idx" ON "ProjectChatSession"("projectId");

-- CreateIndex
CREATE INDEX "ProjectChatMessage_sessionId_idx" ON "ProjectChatMessage"("sessionId");

-- CreateIndex
CREATE INDEX "MockupApproval_projectId_idx" ON "MockupApproval"("projectId");

-- CreateIndex
CREATE INDEX "MockupApproval_status_idx" ON "MockupApproval"("status");

-- CreateIndex
CREATE INDEX "ResearchQuery_agentId_idx" ON "ResearchQuery"("agentId");
