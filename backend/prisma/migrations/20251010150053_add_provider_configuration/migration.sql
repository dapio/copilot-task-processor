-- CreateTable
CREATE TABLE "provider_configurations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiKey" TEXT,
    "apiUrl" TEXT,
    "modelName" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "maxTokens" INTEGER,
    "temperature" REAL,
    "config" JSONB,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "provider_configurations_providerId_key" ON "provider_configurations"("providerId");
