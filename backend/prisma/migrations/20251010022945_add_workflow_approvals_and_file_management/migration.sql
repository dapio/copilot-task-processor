-- CreateTable
CREATE TABLE "workflow_step_approvals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "workflowRunId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "rejectedAt" DATETIME,
    "comments" TEXT,
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workflow_step_approvals_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workflow_step_approvals_workflowRunId_fkey" FOREIGN KEY ("workflowRunId") REFERENCES "WorkflowRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workflow_step_conversations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "approvalId" TEXT NOT NULL,
    "agentId" TEXT,
    "role" TEXT NOT NULL,
    "agentType" TEXT,
    "content" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "attachments" JSONB,
    "parentId" TEXT,
    "isImportant" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workflow_step_conversations_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "workflow_step_approvals" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workflow_step_conversations_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "workflow_step_conversations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "workflow_step_conversations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "project_files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "fullPath" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "hash" TEXT,
    "uploadedBy" TEXT,
    "processedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "analysis" JSONB,
    "extractedText" TEXT,
    "tags" JSONB,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "project_files_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agent_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatar" TEXT,
    "color" TEXT NOT NULL,
    "icon" TEXT,
    "bio" TEXT,
    "specialties" JSONB,
    "personality" JSONB,
    "settings" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "agent_profiles_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workflow_step_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "approvalId" TEXT NOT NULL,
    "agentId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'analysis',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "assignedTo" TEXT,
    "questions" JSONB,
    "requirements" JSONB,
    "deliverables" JSONB,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "estimatedTime" INTEGER,
    "actualTime" INTEGER,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "blockedReason" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workflow_step_tasks_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "workflow_step_approvals" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workflow_step_tasks_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "workflow_step_approvals_workflowRunId_stepId_key" ON "workflow_step_approvals"("workflowRunId", "stepId");

-- CreateIndex
CREATE INDEX "workflow_step_conversations_approvalId_timestamp_idx" ON "workflow_step_conversations"("approvalId", "timestamp");

-- CreateIndex
CREATE INDEX "project_files_projectId_category_idx" ON "project_files"("projectId", "category");

-- CreateIndex
CREATE INDEX "project_files_projectId_status_idx" ON "project_files"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "agent_profiles_agentId_key" ON "agent_profiles"("agentId");

-- CreateIndex
CREATE INDEX "workflow_step_tasks_approvalId_status_idx" ON "workflow_step_tasks"("approvalId", "status");

-- CreateIndex
CREATE INDEX "workflow_step_tasks_assignedTo_status_idx" ON "workflow_step_tasks"("assignedTo", "status");
