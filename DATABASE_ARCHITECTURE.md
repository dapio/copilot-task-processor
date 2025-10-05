# Multi-Agent Team Database Schema

## Current State: ❌ NO PERSISTENCE

Currently all data is stored in memory (RAM) in MultiAgentTeamManager:

- `private agents: Map<string, TeamAgent>`
- `private communications: AgentCommunication[]`
- `private pendingDecisions: AgentDecision[]`
- `private activeWorkflows: Map<string, WorkflowInstance>`

**This means all data is lost on restart!**

## Proposed Database Schema

### Database Technology: Prisma + SQLite (upgradeable to PostgreSQL)

### Tables:

#### 1. agents

```sql
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL, -- 'available', 'busy', 'offline'
  workload INTEGER NOT NULL DEFAULT 0,
  current_task TEXT,
  expertise JSON, -- primary, secondary, tools, technologies
  personality JSON, -- traits, workingStyle, communicationStyle
  avatar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. agent_communications

```sql
CREATE TABLE agent_communications (
  id TEXT PRIMARY KEY,
  from_agent_id TEXT NOT NULL,
  to_agent_id TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  status TEXT DEFAULT 'sent', -- 'sent', 'read', 'acknowledged'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_agent_id) REFERENCES agents(id),
  FOREIGN KEY (to_agent_id) REFERENCES agents(id)
);
```

#### 3. agent_decisions

```sql
CREATE TABLE agent_decisions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  question TEXT NOT NULL,
  context TEXT NOT NULL,
  priority TEXT NOT NULL,
  timeout_hours INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'resolved', 'timeout'
  user_response TEXT,
  user_input TEXT,
  suggested_solutions JSON,
  timeout_action JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);
```

#### 4. workflows

```sql
CREATE TABLE workflows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'feature_development', 'mockup_approval', etc.
  status TEXT NOT NULL, -- 'pending', 'in_progress', 'completed', 'failed'
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER NOT NULL,
  context JSON,
  results JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);
```

#### 5. workflow_steps

```sql
CREATE TABLE workflow_steps (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  agent_id TEXT NOT NULL,
  action TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  actual_output TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  started_at DATETIME,
  completed_at DATETIME,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);
```

#### 6. projects

```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL, -- 'planning', 'in_progress', 'testing', 'completed'
  settings JSON, -- project configuration
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 7. user_feedback

```sql
CREATE TABLE user_feedback (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  workflow_id TEXT,
  decision_id TEXT,
  feedback_type TEXT NOT NULL, -- 'approval', 'rejection', 'modification'
  content TEXT NOT NULL,
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (workflow_id) REFERENCES workflows(id),
  FOREIGN KEY (decision_id) REFERENCES agent_decisions(id)
);
```

### Indexes for Performance:

```sql
CREATE INDEX idx_communications_from_agent ON agent_communications(from_agent_id);
CREATE INDEX idx_communications_to_agent ON agent_communications(to_agent_id);
CREATE INDEX idx_communications_created_at ON agent_communications(created_at);
CREATE INDEX idx_decisions_agent ON agent_decisions(agent_id);
CREATE INDEX idx_decisions_status ON agent_decisions(status);
CREATE INDEX idx_workflow_steps_workflow ON workflow_steps(workflow_id);
CREATE INDEX idx_workflow_steps_agent ON workflow_steps(agent_id);
```

## Implementation Plan:

1. **Install Prisma**: `npm install prisma @prisma/client`
2. **Create schema.prisma**: Define models
3. **Generate client**: `npx prisma generate`
4. **Create migrations**: `npx prisma migrate dev`
5. **Update MultiAgentTeamManager**: Add database persistence
6. **Seed initial data**: Migrate AGENT_PERSONAS to database

## Benefits:

✅ **Data persistence** across restarts
✅ **Historical tracking** of all agent activities  
✅ **Scalable architecture** (SQLite → PostgreSQL)
✅ **Query capabilities** for analytics and reporting
✅ **Backup and restore** functionality
✅ **Multi-instance support** (shared database)
