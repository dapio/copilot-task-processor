-- CreateTable
CREATE TABLE "KnowledgeFeed" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "department" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "tags" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "KnowledgeDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "feedId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "extractedText" TEXT,
    "tags" TEXT,
    "relevanceScore" REAL,
    "author" TEXT NOT NULL,
    "department" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KnowledgeDocument_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "KnowledgeFeed" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CodeSnippet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "feedId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "framework" TEXT,
    "code" TEXT NOT NULL,
    "usage" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT,
    "author" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CodeSnippet_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "KnowledgeFeed" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProcessDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "feedId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "steps" TEXT NOT NULL,
    "tools" TEXT,
    "department" TEXT NOT NULL,
    "stakeholders" TEXT,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProcessDefinition_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "KnowledgeFeed" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ToolDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "feedId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "apiEndpoint" TEXT,
    "documentation" TEXT,
    "configuration" TEXT,
    "requirements" TEXT,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ToolDefinition_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "KnowledgeFeed" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentFeedAccess" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "accessType" TEXT NOT NULL DEFAULT 'read',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "grantedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT,
    CONSTRAINT "AgentFeedAccess_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AgentFeedAccess_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "KnowledgeFeed" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeedLearningHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "documentId" TEXT,
    "snippetId" TEXT,
    "processId" TEXT,
    "toolId" TEXT,
    "actionType" TEXT NOT NULL,
    "context" TEXT,
    "effectiveness" REAL,
    "feedback" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeedLearningHistory_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeedLearningHistory_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "KnowledgeFeed" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeedLearningHistory_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "KnowledgeDocument" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FeedLearningHistory_snippetId_fkey" FOREIGN KEY ("snippetId") REFERENCES "CodeSnippet" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FeedLearningHistory_processId_fkey" FOREIGN KEY ("processId") REFERENCES "ProcessDefinition" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FeedLearningHistory_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "ToolDefinition" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KnowledgeBestPractice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "feedId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "technology" TEXT,
    "content" TEXT NOT NULL,
    "examples" TEXT,
    "antiPatterns" TEXT,
    "complexity" TEXT NOT NULL DEFAULT 'medium',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "source" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KnowledgeBestPractice_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "KnowledgeFeed" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "KnowledgeFeed_type_idx" ON "KnowledgeFeed"("type");

-- CreateIndex
CREATE INDEX "KnowledgeFeed_department_idx" ON "KnowledgeFeed"("department");

-- CreateIndex
CREATE INDEX "KnowledgeFeed_isActive_idx" ON "KnowledgeFeed"("isActive");

-- CreateIndex
CREATE INDEX "KnowledgeFeed_priority_idx" ON "KnowledgeFeed"("priority");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_feedId_idx" ON "KnowledgeDocument"("feedId");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_type_idx" ON "KnowledgeDocument"("type");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_author_idx" ON "KnowledgeDocument"("author");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_isActive_idx" ON "KnowledgeDocument"("isActive");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_department_idx" ON "KnowledgeDocument"("department");

-- CreateIndex
CREATE INDEX "CodeSnippet_feedId_idx" ON "CodeSnippet"("feedId");

-- CreateIndex
CREATE INDEX "CodeSnippet_language_idx" ON "CodeSnippet"("language");

-- CreateIndex
CREATE INDEX "CodeSnippet_framework_idx" ON "CodeSnippet"("framework");

-- CreateIndex
CREATE INDEX "CodeSnippet_category_idx" ON "CodeSnippet"("category");

-- CreateIndex
CREATE INDEX "CodeSnippet_isActive_idx" ON "CodeSnippet"("isActive");

-- CreateIndex
CREATE INDEX "ProcessDefinition_feedId_idx" ON "ProcessDefinition"("feedId");

-- CreateIndex
CREATE INDEX "ProcessDefinition_department_idx" ON "ProcessDefinition"("department");

-- CreateIndex
CREATE INDEX "ProcessDefinition_category_idx" ON "ProcessDefinition"("category");

-- CreateIndex
CREATE INDEX "ProcessDefinition_priority_idx" ON "ProcessDefinition"("priority");

-- CreateIndex
CREATE INDEX "ProcessDefinition_isActive_idx" ON "ProcessDefinition"("isActive");

-- CreateIndex
CREATE INDEX "ToolDefinition_feedId_idx" ON "ToolDefinition"("feedId");

-- CreateIndex
CREATE INDEX "ToolDefinition_type_idx" ON "ToolDefinition"("type");

-- CreateIndex
CREATE INDEX "ToolDefinition_category_idx" ON "ToolDefinition"("category");

-- CreateIndex
CREATE INDEX "ToolDefinition_isActive_idx" ON "ToolDefinition"("isActive");

-- CreateIndex
CREATE INDEX "AgentFeedAccess_agentId_idx" ON "AgentFeedAccess"("agentId");

-- CreateIndex
CREATE INDEX "AgentFeedAccess_feedId_idx" ON "AgentFeedAccess"("feedId");

-- CreateIndex
CREATE INDEX "AgentFeedAccess_accessType_idx" ON "AgentFeedAccess"("accessType");

-- CreateIndex
CREATE INDEX "AgentFeedAccess_isActive_idx" ON "AgentFeedAccess"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AgentFeedAccess_agentId_feedId_key" ON "AgentFeedAccess"("agentId", "feedId");

-- CreateIndex
CREATE INDEX "FeedLearningHistory_agentId_idx" ON "FeedLearningHistory"("agentId");

-- CreateIndex
CREATE INDEX "FeedLearningHistory_feedId_idx" ON "FeedLearningHistory"("feedId");

-- CreateIndex
CREATE INDEX "FeedLearningHistory_actionType_idx" ON "FeedLearningHistory"("actionType");

-- CreateIndex
CREATE INDEX "FeedLearningHistory_timestamp_idx" ON "FeedLearningHistory"("timestamp");

-- CreateIndex
CREATE INDEX "FeedLearningHistory_effectiveness_idx" ON "FeedLearningHistory"("effectiveness");

-- CreateIndex
CREATE INDEX "KnowledgeBestPractice_feedId_idx" ON "KnowledgeBestPractice"("feedId");

-- CreateIndex
CREATE INDEX "KnowledgeBestPractice_domain_idx" ON "KnowledgeBestPractice"("domain");

-- CreateIndex
CREATE INDEX "KnowledgeBestPractice_category_idx" ON "KnowledgeBestPractice"("category");

-- CreateIndex
CREATE INDEX "KnowledgeBestPractice_priority_idx" ON "KnowledgeBestPractice"("priority");

-- CreateIndex
CREATE INDEX "KnowledgeBestPractice_complexity_idx" ON "KnowledgeBestPractice"("complexity");

-- CreateIndex
CREATE INDEX "KnowledgeBestPractice_isActive_idx" ON "KnowledgeBestPractice"("isActive");
