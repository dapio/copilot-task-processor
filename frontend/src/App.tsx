import React, { useState } from 'react';
import { DocumentUploader } from './components/DocumentUploader';
import { ParameterForm } from './components/ParameterForm';
import { TaskGenerator } from './components/TaskGenerator';
import { ProcessingDashboard } from './components/ProcessingDashboard';
import './App.css';

interface AppState {
  step: 'upload' | 'configure' | 'generate' | 'process';
  documents: File[];
  parameters: ProcessorParameters;
  tasks: JiraTask[];
  processingStatus: ProcessingStatus;
}

interface ProcessorParameters {
  jira: {
    host: string;
    email: string;
    token: string;
    projectKey: string;
  };
  github: {
    token: string;
    owner: string;
    repo: string;
    branch: string;
  };
  ai: {
    openaiKey: string;
    model: string;
    temperature: number;
  };
  workflow: {
    autoCreateBranches: boolean;
    autoCreatePRs: boolean;
    requireTests: boolean;
    minCoverage: number;
  };
}

interface JiraTask {
  id: string;
  title: string;
  description: string;
  type: 'Story' | 'Task' | 'Bug' | 'Epic';
  priority: 'High' | 'Medium' | 'Low';
  estimatedHours: number;
  dependencies: string[];
  acceptanceCriteria: string[];
}

interface ProcessingStatus {
  currentTask: string;
  completed: number;
  total: number;
  status: 'idle' | 'analyzing' | 'creating-tasks' | 'processing' | 'completed';
  results: ProcessingResult[];
}

/**
 * Main Application Component
 */
export const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    step: 'upload',
    documents: [],
    parameters: getDefaultParameters(),
    tasks: [],
    processingStatus: {
      currentTask: '',
      completed: 0,
      total: 0,
      status: 'idle',
      results: []
    }
  });

  const handleDocumentsUploaded = (documents: File[]) => {
    setState(prev => ({
      ...prev,
      documents,
      step: 'configure'
    }));
  };

  const handleParametersConfigured = (parameters: ProcessorParameters) => {
    setState(prev => ({
      ...prev,
      parameters,
      step: 'generate'
    }));
  };

  const handleTasksGenerated = (tasks: JiraTask[]) => {
    setState(prev => ({
      ...prev,
      tasks,
      step: 'process'
    }));
  };

  const handleProcessingUpdate = (status: ProcessingStatus) => {
    setState(prev => ({
      ...prev,
      processingStatus: status
    }));
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 Copilot Task Processor</h1>
        <p>Enterprise Document-to-Code Automation</p>
      </header>

      <main className="app-main">
        {state.step === 'upload' && (
          <DocumentUploader onDocumentsUploaded={handleDocumentsUploaded} />
        )}

        {state.step === 'configure' && (
          <ParameterForm
            documents={state.documents}
            onParametersConfigured={handleParametersConfigured}
          />
        )}

        {state.step === 'generate' && (
          <TaskGenerator
            documents={state.documents}
            parameters={state.parameters}
            onTasksGenerated={handleTasksGenerated}
          />
        )}

        {state.step === 'process' && (
          <ProcessingDashboard
            tasks={state.tasks}
            parameters={state.parameters}
            status={state.processingStatus}
            onStatusUpdate={handleProcessingUpdate}
          />
        )}
      </main>
    </div>
  );
};

function getDefaultParameters(): ProcessorParameters {
  return {
    jira: {
      host: 'https://your-domain.atlassian.net',
      email: '',
      token: '',
      projectKey: 'PROJ'
    },
    github: {
      token: '',
      owner: 'dapio',
      repo: '',
      branch: 'development'
    },
    ai: {
      openaiKey: '',
      model: 'gpt-4',
      temperature: 0.3
    },
    workflow: {
      autoCreateBranches: true,
      autoCreatePRs: true,
      requireTests: true,
      minCoverage: 80
    }
  };
}