import React, { useState, useEffect, useCallback } from 'react';
import { useBackendApi } from '../src/hooks/useBackendApi';
import {
  createDocumentAnalysisRequest,
  createTaskGenerationRequest,
  DocumentAnalysisResult,
  TaskGenerationResult,
  GeneratedTask,
  IntegrationTestResult,
} from '../src/services/backendApiService';

interface ProjectData {
  name: string;
  description: string;
  requirements: string[];
  technologies: string[];
}

export default function CompleteDashboard() {
  // Backend API integration
  const {
    connection,
    checkConnection,
    documentAnalysis,
    analyzeDocuments,
    taskGeneration,
    generateTasks,
    integrationTest,
    testIntegrations,
    taskProcessing,
    processTask,
  } = useBackendApi();

  // Local state
  const [currentView, setCurrentView] = useState<
    'dashboard' | 'documents' | 'tasks' | 'settings'
  >('dashboard');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [projectData, setProjectData] = useState<ProjectData>({
    name: 'ThinkCode AI Platform',
    description: 'Advanced task processing and document generation system',
    requirements: [
      'Document processing and analysis',
      'Task generation and management',
      'Backend API integration',
      'Frontend dashboard with real-time updates',
    ],
    technologies: ['React', 'TypeScript', 'Node.js', 'Express.js'],
  });
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  // Auto-check connection on mount
  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [checkConnection]);

  // File handling
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const handleAnalyzeDocuments = useCallback(async () => {
    if (selectedFiles.length === 0) {
      alert('Please select files to analyze');
      return;
    }

    const request = createDocumentAnalysisRequest(selectedFiles, {
      includeMetadata: true,
      extractKeywords: true,
      generateSummary: true,
    });

    const result = await analyzeDocuments(request);
    if (result) {
      // Auto-generate tasks based on analysis
      const taskRequest = createTaskGenerationRequest(projectData, result);
      await generateTasks(taskRequest);
    }
  }, [selectedFiles, projectData, analyzeDocuments, generateTasks]);

  const handleGenerateTasks = useCallback(async () => {
    const request = createTaskGenerationRequest(
      projectData,
      documentAnalysis.result || undefined
    );
    await generateTasks(request);
  }, [projectData, documentAnalysis.result, generateTasks]);

  const handleProcessTask = useCallback(
    async (task: GeneratedTask) => {
      const request = {
        task,
        context: {
          projectFiles: [],
          dependencies: task.dependencies,
          constraints: [],
        },
        options: {
          generateCode: true,
          createTests: true,
          updateDocs: true,
        },
      };

      await processTask(request);
    },
    [processTask]
  );

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  // Statistics calculation
  const stats = {
    documentsAnalyzed: documentAnalysis.result?.fileAnalysis.length || 0,
    tasksGenerated: taskGeneration.result?.tasks.length || 0,
    tasksCompleted: selectedTasks.length,
    integrationsPassed:
      integrationTest.results?.filter(r => r.status === 'pass').length || 0,
    connectionStatus: connection.isConnected ? 'online' : 'offline',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <header
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          padding: '1rem 2rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              color: '#2c3e50',
              fontSize: '24px',
              fontWeight: '700',
            }}
          >
            🤖 ThinkCode AI Platform
          </h1>
          <p
            style={{
              margin: '4px 0 0 0',
              color: '#7f8c8d',
              fontSize: '14px',
            }}
          >
            Intelligent Task Processing & Document Analysis
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Connection Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              background: connection.isConnected ? '#d4edda' : '#f8d7da',
              color: connection.isConnected ? '#155724' : '#721c24',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            <span>{connection.isConnected ? '🟢' : '🔴'}</span>
            Backend {connection.isConnected ? 'Online' : 'Offline'}
          </div>

          {/* Navigation */}
          <nav style={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { key: 'dashboard', label: '📊 Dashboard', icon: '📊' },
              { key: 'documents', label: '📄 Documents', icon: '📄' },
              { key: 'tasks', label: '📋 Tasks', icon: '📋' },
              { key: 'settings', label: '⚙️ Settings', icon: '⚙️' },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setCurrentView(item.key as any)}
                style={{
                  background:
                    currentView === item.key ? '#3498db' : 'transparent',
                  color: currentView === item.key ? 'white' : '#2c3e50',
                  border:
                    currentView === item.key ? 'none' : '1px solid #bdc3c7',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem' }}>
        {currentView === 'dashboard' && (
          <div>
            {/* Stats Overview */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem',
              }}
            >
              <StatCard
                title="Documents Analyzed"
                value={stats.documentsAnalyzed}
                icon="📄"
                color="#3498db"
                loading={documentAnalysis.isAnalyzing}
              />
              <StatCard
                title="Tasks Generated"
                value={stats.tasksGenerated}
                icon="📋"
                color="#2ecc71"
                loading={taskGeneration.isGenerating}
              />
              <StatCard
                title="Tasks Completed"
                value={stats.tasksCompleted}
                icon="✅"
                color="#f39c12"
                loading={taskProcessing.isProcessing}
              />
              <StatCard
                title="Integrations"
                value={stats.integrationsPassed}
                icon="🔗"
                color="#9b59b6"
                loading={integrationTest.isTesting}
              />
            </div>

            {/* Quick Actions */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '12px',
                padding: '2rem',
                marginBottom: '2rem',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
              }}
            >
              <h2 style={{ margin: '0 0 1.5rem 0', color: '#2c3e50' }}>
                ⚡ Quick Actions
              </h2>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <ActionButton
                  onClick={handleAnalyzeDocuments}
                  disabled={
                    selectedFiles.length === 0 || documentAnalysis.isAnalyzing
                  }
                  loading={documentAnalysis.isAnalyzing}
                  primary
                >
                  🔍 Analyze Documents ({selectedFiles.length})
                </ActionButton>
                <ActionButton
                  onClick={handleGenerateTasks}
                  disabled={taskGeneration.isGenerating}
                  loading={taskGeneration.isGenerating}
                >
                  🎯 Generate Tasks
                </ActionButton>
                <ActionButton
                  onClick={testIntegrations}
                  disabled={integrationTest.isTesting}
                  loading={integrationTest.isTesting}
                >
                  🧪 Test Integrations
                </ActionButton>
                <ActionButton onClick={() => setCurrentView('documents')}>
                  📄 Manage Documents
                </ActionButton>
              </div>
            </div>

            {/* Recent Activity */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2rem',
              }}
            >
              {/* Analysis Results */}
              {documentAnalysis.result && (
                <ActivityPanel
                  title="📊 Latest Analysis"
                  data={documentAnalysis.result}
                  type="analysis"
                />
              )}

              {/* Generated Tasks */}
              {taskGeneration.result && (
                <ActivityPanel
                  title="📋 Generated Tasks"
                  data={taskGeneration.result}
                  type="tasks"
                />
              )}
            </div>
          </div>
        )}

        {currentView === 'documents' && (
          <DocumentsView
            selectedFiles={selectedFiles}
            onFileSelect={handleFileSelect}
            analysisState={documentAnalysis}
            onAnalyze={handleAnalyzeDocuments}
          />
        )}

        {currentView === 'tasks' && (
          <TasksView
            taskState={taskGeneration}
            selectedTasks={selectedTasks}
            onToggleTask={toggleTaskSelection}
            onProcessTask={handleProcessTask}
            onGenerateTasks={handleGenerateTasks}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            projectData={projectData}
            onProjectDataChange={setProjectData}
            integrationTest={integrationTest}
            onTestIntegrations={testIntegrations}
          />
        )}
      </main>
    </div>
  );
}

// Utility Components
interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  loading,
}) => (
  <div
    style={{
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
      borderLeft: `4px solid ${color}`,
    }}
  >
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <p
          style={{ margin: '0 0 0.5rem 0', color: '#7f8c8d', fontSize: '14px' }}
        >
          {title}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: '32px',
            fontWeight: '700',
            color: '#2c3e50',
          }}
        >
          {loading ? '...' : value}
        </p>
      </div>
      <div style={{ fontSize: '48px', opacity: 0.7 }}>{icon}</div>
    </div>
  </div>
);

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  primary?: boolean;
  children: React.ReactNode;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  disabled,
  loading,
  primary,
  children,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      background: primary ? '#3498db' : '#ecf0f1',
      color: primary ? 'white' : '#2c3e50',
      border: 'none',
      padding: '0.875rem 1.5rem',
      borderRadius: '8px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.2s',
      opacity: disabled ? 0.6 : 1,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    }}
  >
    {loading && (
      <span style={{ animation: 'spin 1s linear infinite' }}>🔄</span>
    )}
    {children}
  </button>
);

interface ActivityPanelProps {
  title: string;
  data: any;
  type: 'analysis' | 'tasks';
}

const ActivityPanel: React.FC<ActivityPanelProps> = ({ title, data, type }) => (
  <div
    style={{
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
    }}
  >
    <h3 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>{title}</h3>
    {type === 'analysis' && (
      <div>
        <p>
          <strong>Files:</strong> {data.fileAnalysis?.length || 0}
        </p>
        <p>
          <strong>Keywords:</strong>{' '}
          {data.overallAnalysis?.commonKeywords?.join(', ')}
        </p>
        <p>
          <strong>Avg Complexity:</strong>{' '}
          {data.overallAnalysis?.averageComplexity}
        </p>
      </div>
    )}
    {type === 'tasks' && (
      <div>
        <p>
          <strong>Tasks:</strong> {data.tasks?.length || 0}
        </p>
        <p>
          <strong>Phases:</strong> {data.projectStructure?.phases?.length || 0}
        </p>
        <p>
          <strong>Est. Hours:</strong> {data.metadata?.totalEstimatedHours || 0}
        </p>
      </div>
    )}
  </div>
);

// View Components
interface DocumentsViewProps {
  selectedFiles: File[];
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  analysisState: any;
  onAnalyze: () => void;
}

const DocumentsView: React.FC<DocumentsViewProps> = ({
  selectedFiles,
  onFileSelect,
  analysisState,
  onAnalyze,
}) => (
  <div
    style={{
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '12px',
      padding: '2rem',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
    }}
  >
    <h2 style={{ margin: '0 0 2rem 0', color: '#2c3e50' }}>
      📄 Document Analysis
    </h2>

    <div style={{ marginBottom: '2rem' }}>
      <label
        style={{
          display: 'block',
          marginBottom: '0.5rem',
          color: '#2c3e50',
          fontWeight: '600',
        }}
      >
        Select Files:
      </label>
      <input
        type="file"
        multiple
        onChange={onFileSelect}
        accept=".js,.ts,.tsx,.jsx,.md,.txt,.json,.yaml,.yml,.py,.java,.cpp,.c,.cs,.go,.rs"
        style={{
          width: '100%',
          padding: '0.75rem',
          border: '2px dashed #bdc3c7',
          borderRadius: '8px',
          background: '#f8f9fa',
        }}
      />
      {selectedFiles.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <strong>Selected Files:</strong>
          <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
            {selectedFiles.map((file, index) => (
              <li key={index} style={{ color: '#7f8c8d' }}>
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>

    <ActionButton
      onClick={onAnalyze}
      disabled={selectedFiles.length === 0 || analysisState.isAnalyzing}
      loading={analysisState.isAnalyzing}
      primary
    >
      🔍 Analyze Documents
    </ActionButton>

    {analysisState.result && (
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ color: '#2c3e50' }}>Analysis Results</h3>
        <div
          style={{
            background: '#f8f9fa',
            padding: '1rem',
            borderRadius: '8px',
            marginTop: '1rem',
          }}
        >
          <pre
            style={{
              margin: 0,
              fontSize: '14px',
              color: '#495057',
              whiteSpace: 'pre-wrap',
            }}
          >
            {JSON.stringify(analysisState.result, null, 2)}
          </pre>
        </div>
      </div>
    )}
  </div>
);

interface TasksViewProps {
  taskState: any;
  selectedTasks: string[];
  onToggleTask: (taskId: string) => void;
  onProcessTask: (task: GeneratedTask) => void;
  onGenerateTasks: () => void;
}

const TasksView: React.FC<TasksViewProps> = ({
  taskState,
  selectedTasks,
  onToggleTask,
  onProcessTask,
  onGenerateTasks,
}) => (
  <div
    style={{
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '12px',
      padding: '2rem',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
    }}
  >
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
      }}
    >
      <h2 style={{ margin: 0, color: '#2c3e50' }}>📋 Task Management</h2>
      <ActionButton
        onClick={onGenerateTasks}
        disabled={taskState.isGenerating}
        loading={taskState.isGenerating}
        primary
      >
        🎯 Generate New Tasks
      </ActionButton>
    </div>

    {taskState.result?.tasks?.map((task: GeneratedTask) => (
      <div
        key={task.id}
        style={{
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem',
          background: selectedTasks.includes(task.id) ? '#e3f2fd' : 'white',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'start',
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <input
                type="checkbox"
                checked={selectedTasks.includes(task.id)}
                onChange={() => onToggleTask(task.id)}
              />
              <h4 style={{ margin: 0, color: '#2c3e50' }}>{task.title}</h4>
              <span
                style={{
                  background:
                    task.priority === 'high'
                      ? '#e74c3c'
                      : task.priority === 'medium'
                        ? '#f39c12'
                        : '#95a5a6',
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              >
                {task.priority}
              </span>
            </div>
            <p style={{ color: '#7f8c8d', margin: '0.5rem 0' }}>
              {task.description}
            </p>
            <div style={{ fontSize: '12px', color: '#95a5a6' }}>
              <span>🏷️ {task.tags.join(', ')} • </span>
              <span>⏱️ {task.estimatedHours}h • </span>
              <span>📂 {task.category}</span>
            </div>
          </div>
          <ActionButton onClick={() => onProcessTask(task)}>
            ⚙️ Process
          </ActionButton>
        </div>
      </div>
    ))}
  </div>
);

interface SettingsViewProps {
  projectData: ProjectData;
  onProjectDataChange: (data: ProjectData) => void;
  integrationTest: any;
  onTestIntegrations: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  projectData,
  onProjectDataChange,
  integrationTest,
  onTestIntegrations,
}) => (
  <div
    style={{
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '12px',
      padding: '2rem',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
    }}
  >
    <h2 style={{ margin: '0 0 2rem 0', color: '#2c3e50' }}>⚙️ Settings</h2>

    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ color: '#2c3e50' }}>Project Configuration</h3>
      <div style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
            }}
          >
            Project Name:
          </label>
          <input
            type="text"
            value={projectData.name}
            onChange={e =>
              onProjectDataChange({ ...projectData, name: e.target.value })
            }
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #bdc3c7',
              borderRadius: '4px',
            }}
          />
        </div>
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
            }}
          >
            Description:
          </label>
          <textarea
            value={projectData.description}
            onChange={e =>
              onProjectDataChange({
                ...projectData,
                description: e.target.value,
              })
            }
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #bdc3c7',
              borderRadius: '4px',
              resize: 'vertical',
            }}
          />
        </div>
      </div>
    </div>

    <div>
      <h3 style={{ color: '#2c3e50' }}>Integration Tests</h3>
      <ActionButton
        onClick={onTestIntegrations}
        disabled={integrationTest.isTesting}
        loading={integrationTest.isTesting}
        primary
      >
        🧪 Run All Tests
      </ActionButton>

      {integrationTest.results && (
        <div style={{ marginTop: '1rem' }}>
          {integrationTest.results.map(
            (test: IntegrationTestResult, index: number) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  marginBottom: '0.5rem',
                  background:
                    test.status === 'pass'
                      ? '#d4edda'
                      : test.status === 'fail'
                        ? '#f8d7da'
                        : '#fff3cd',
                  borderRadius: '4px',
                }}
              >
                <span>
                  {test.status === 'pass'
                    ? '✅'
                    : test.status === 'fail'
                      ? '❌'
                      : '⚠️'}
                </span>
                <strong>{test.testName}:</strong>
                <span>{test.message}</span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  </div>
);
