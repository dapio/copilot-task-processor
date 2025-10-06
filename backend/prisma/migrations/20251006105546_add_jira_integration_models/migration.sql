-- CreateTable
CREATE TABLE "jira_integrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "jiraKey" TEXT NOT NULL,
    "jiraId" TEXT NOT NULL,
    "projectKey" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "lastSyncAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncStatus" TEXT NOT NULL DEFAULT 'active',
    "syncErrors" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "jira_integrations_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "jira_sync_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT,
    "jiraKey" TEXT,
    "action" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "duration" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "jira_integrations_taskId_key" ON "jira_integrations"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "jira_integrations_jiraKey_key" ON "jira_integrations"("jiraKey");
