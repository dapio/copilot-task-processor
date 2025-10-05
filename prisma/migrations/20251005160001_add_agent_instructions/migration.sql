-- CreateTable
CREATE TABLE "AgentInstruction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "targetRole" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "examples" TEXT,
    "violations" TEXT,
    "enforcementLevel" TEXT NOT NULL DEFAULT 'warning',
    "autoApply" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" TEXT
);

-- CreateTable
CREATE TABLE "AgentInstructionConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "instructionId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "customSettings" TEXT,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastApplied" DATETIME,
    CONSTRAINT "AgentInstructionConfig_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AgentInstructionConfig_instructionId_fkey" FOREIGN KEY ("instructionId") REFERENCES "AgentInstruction" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InstructionRuleCheck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instructionId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "projectId" TEXT,
    "workflowStepId" TEXT,
    "ruleType" TEXT NOT NULL,
    "checkResult" TEXT NOT NULL,
    "findings" TEXT,
    "autoFixed" BOOLEAN NOT NULL DEFAULT false,
    "checkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InstructionRuleCheck_instructionId_fkey" FOREIGN KEY ("instructionId") REFERENCES "AgentInstruction" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InstructionRuleCheck_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InstructionRuleCheck_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InstructionRuleCheck_workflowStepId_fkey" FOREIGN KEY ("workflowStepId") REFERENCES "WorkflowStep" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BestPractice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parentId" TEXT,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "tags" TEXT,
    "description" TEXT NOT NULL,
    "rule" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "goodExamples" TEXT,
    "badExamples" TEXT,
    "resources" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "impact" TEXT NOT NULL DEFAULT 'medium',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BestPractice_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BestPractice" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AgentInstruction_category_idx" ON "AgentInstruction"("category");

-- CreateIndex
CREATE INDEX "AgentInstruction_targetRole_idx" ON "AgentInstruction"("targetRole");

-- CreateIndex
CREATE INDEX "AgentInstruction_priority_idx" ON "AgentInstruction"("priority");

-- CreateIndex
CREATE INDEX "AgentInstruction_isActive_idx" ON "AgentInstruction"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AgentInstruction_name_version_key" ON "AgentInstruction"("name", "version");

-- CreateIndex
CREATE INDEX "AgentInstructionConfig_agentId_idx" ON "AgentInstructionConfig"("agentId");

-- CreateIndex
CREATE INDEX "AgentInstructionConfig_instructionId_idx" ON "AgentInstructionConfig"("instructionId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentInstructionConfig_agentId_instructionId_key" ON "AgentInstructionConfig"("agentId", "instructionId");

-- CreateIndex
CREATE INDEX "InstructionRuleCheck_instructionId_idx" ON "InstructionRuleCheck"("instructionId");

-- CreateIndex
CREATE INDEX "InstructionRuleCheck_agentId_idx" ON "InstructionRuleCheck"("agentId");

-- CreateIndex
CREATE INDEX "InstructionRuleCheck_checkResult_idx" ON "InstructionRuleCheck"("checkResult");

-- CreateIndex
CREATE INDEX "InstructionRuleCheck_checkedAt_idx" ON "InstructionRuleCheck"("checkedAt");

-- CreateIndex
CREATE INDEX "BestPractice_category_idx" ON "BestPractice"("category");

-- CreateIndex
CREATE INDEX "BestPractice_subcategory_idx" ON "BestPractice"("subcategory");

-- CreateIndex
CREATE INDEX "BestPractice_difficulty_idx" ON "BestPractice"("difficulty");

-- CreateIndex
CREATE INDEX "BestPractice_impact_idx" ON "BestPractice"("impact");

-- CreateIndex
CREATE INDEX "BestPractice_isActive_idx" ON "BestPractice"("isActive");

-- CreateIndex
CREATE INDEX "BestPractice_parentId_idx" ON "BestPractice"("parentId");
