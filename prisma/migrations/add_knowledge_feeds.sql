-- Knowledge Feed System Migration
-- Dodaje system feedów wiedzy dla agentów AI

-- 1. Knowledge Feeds (główne feedy wiedzy)
CREATE TABLE "KnowledgeFeed" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL, -- 'global', 'agent-specific', 'departmental'
    "department" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high'
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "tags" TEXT, -- JSON array
    "metadata" TEXT, -- JSON metadata
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- 2. Knowledge Documents (dokumenty w feedach)
CREATE TABLE "KnowledgeDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "feedId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL, -- 'manual', 'specification', 'guide', 'policy', 'code-example'
    "content" TEXT NOT NULL,
    "format" TEXT NOT NULL, -- 'markdown', 'pdf', 'html', 'docx', 'txt'
    "extractedText" TEXT, -- dla PDF/DOCX
    "tags" TEXT, -- JSON array
    "relevanceScore" REAL,
    "author" TEXT NOT NULL,
    "department" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("feedId") REFERENCES "KnowledgeFeed"("id") ON DELETE CASCADE
);

-- 3. Code Snippets (fragmenty kodu)
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
    "tags" TEXT, -- JSON array
    "author" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("feedId") REFERENCES "KnowledgeFeed"("id") ON DELETE CASCADE
);

-- 4. Process Definitions (definicje procesów)
CREATE TABLE "ProcessDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "feedId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "steps" TEXT NOT NULL, -- JSON array
    "tools" TEXT, -- JSON array
    "department" TEXT NOT NULL,
    "stakeholders" TEXT, -- JSON array
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("feedId") REFERENCES "KnowledgeFeed"("id") ON DELETE CASCADE
);

-- 5. Tool Definitions (definicje narzędzi)
CREATE TABLE "ToolDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "feedId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL, -- 'internal', 'external', 'api', 'service'
    "url" TEXT,
    "apiEndpoint" TEXT,
    "documentation" TEXT,
    "configuration" TEXT, -- JSON
    "requirements" TEXT, -- JSON array
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("feedId") REFERENCES "KnowledgeFeed"("id") ON DELETE CASCADE
);

-- 6. Agent Feed Access (które agenty mają dostęp do których feedów)
CREATE TABLE "AgentFeedAccess" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "accessType" TEXT NOT NULL DEFAULT 'read', -- 'read', 'write', 'admin'
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "grantedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT,
    FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE,
    FOREIGN KEY ("feedId") REFERENCES "KnowledgeFeed"("id") ON DELETE CASCADE
);

-- 7. Feed Learning History (historia uczenia się agentów z feedów)
CREATE TABLE "FeedLearningHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "documentId" TEXT,
    "snippetId" TEXT,
    "processId" TEXT,
    "toolId" TEXT,
    "actionType" TEXT NOT NULL, -- 'viewed', 'applied', 'referenced', 'improved'
    "context" TEXT, -- Kontekst w jakim użyto wiedzy
    "effectiveness" REAL, -- Jak skuteczne było użycie (0-1)
    "feedback" TEXT, -- Feedback od agenta
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE,
    FOREIGN KEY ("feedId") REFERENCES "KnowledgeFeed"("id") ON DELETE CASCADE,
    FOREIGN KEY ("documentId") REFERENCES "KnowledgeDocument"("id") ON DELETE SET NULL,
    FOREIGN KEY ("snippetId") REFERENCES "CodeSnippet"("id") ON DELETE SET NULL,
    FOREIGN KEY ("processId") REFERENCES "ProcessDefinition"("id") ON DELETE SET NULL,
    FOREIGN KEY ("toolId") REFERENCES "ToolDefinition"("id") ON DELETE SET NULL
);

-- 8. Best Practices (najlepsze praktyki)
CREATE TABLE "BestPractice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "feedId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "domain" TEXT NOT NULL, -- 'frontend', 'backend', 'database', 'security', 'performance'
    "technology" TEXT,
    "content" TEXT NOT NULL,
    "examples" TEXT, -- JSON array of examples
    "antiPatterns" TEXT, -- JSON array of what NOT to do
    "complexity" TEXT NOT NULL DEFAULT 'medium', -- 'basic', 'medium', 'advanced'
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "source" TEXT, -- Skąd pochodzi ta praktyka
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("feedId") REFERENCES "KnowledgeFeed"("id") ON DELETE CASCADE
);

-- Indexes for Performance
CREATE INDEX "idx_knowledge_feed_type" ON "KnowledgeFeed"("type");
CREATE INDEX "idx_knowledge_feed_department" ON "KnowledgeFeed"("department");
CREATE INDEX "idx_knowledge_feed_active" ON "KnowledgeFeed"("isActive");

CREATE INDEX "idx_knowledge_document_feed" ON "KnowledgeDocument"("feedId");
CREATE INDEX "idx_knowledge_document_type" ON "KnowledgeDocument"("type");
CREATE INDEX "idx_knowledge_document_author" ON "KnowledgeDocument"("author");
CREATE INDEX "idx_knowledge_document_active" ON "KnowledgeDocument"("isActive");

CREATE INDEX "idx_code_snippet_feed" ON "CodeSnippet"("feedId");
CREATE INDEX "idx_code_snippet_language" ON "CodeSnippet"("language");
CREATE INDEX "idx_code_snippet_category" ON "CodeSnippet"("category");

CREATE INDEX "idx_process_definition_feed" ON "ProcessDefinition"("feedId");
CREATE INDEX "idx_process_definition_department" ON "ProcessDefinition"("department");
CREATE INDEX "idx_process_definition_category" ON "ProcessDefinition"("category");

CREATE INDEX "idx_tool_definition_feed" ON "ToolDefinition"("feedId");
CREATE INDEX "idx_tool_definition_type" ON "ToolDefinition"("type");
CREATE INDEX "idx_tool_definition_category" ON "ToolDefinition"("category");

CREATE INDEX "idx_agent_feed_access_agent" ON "AgentFeedAccess"("agentId");
CREATE INDEX "idx_agent_feed_access_feed" ON "AgentFeedAccess"("feedId");
CREATE INDEX "idx_agent_feed_access_type" ON "AgentFeedAccess"("accessType");

CREATE INDEX "idx_learning_history_agent" ON "FeedLearningHistory"("agentId");
CREATE INDEX "idx_learning_history_feed" ON "FeedLearningHistory"("feedId");
CREATE INDEX "idx_learning_history_action" ON "FeedLearningHistory"("actionType");
CREATE INDEX "idx_learning_history_timestamp" ON "FeedLearningHistory"("timestamp");

CREATE INDEX "idx_best_practice_feed" ON "BestPractice"("feedId");
CREATE INDEX "idx_best_practice_domain" ON "BestPractice"("domain");
CREATE INDEX "idx_best_practice_category" ON "BestPractice"("category");
CREATE INDEX "idx_best_practice_priority" ON "BestPractice"("priority");