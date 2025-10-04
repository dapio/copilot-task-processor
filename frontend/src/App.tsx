import React, { useState } from 'react';
import { DocumentUploader } from './components/DocumentUploader';
import { DocumentationGenerator } from './components/DocumentationGenerator';
import { MockupGenerator } from './components/MockupGenerator';
import { FeedbackChat } from './components/FeedbackChat';
import { TaskGenerator } from './components/TaskGenerator';
import { ProcessingDashboard } from './components/ProcessingDashboard';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AppState, ProcessingStep } from './types/app.types';
import './App.css';

const initialState: AppState = {
  currentStep: 'upload',
  documents: [],
  generatedDocs: null,
  mockups: null,
  feedback: [],
  tasks: [],
  processingStatus: {
    currentTask: '',
    completed: 0,
    total: 0,
    status: 'idle',
    results: []
  },
  parameters: {
    jira: { host: '', email: '', token: '', projectKey: '' },
    bitbucket: { username: '', appPassword: '', workspace: '', repo: '' },
    ai: { openaiKey: '', model: 'gpt-4', temperature: 0.3 },
    workflow: {
      autoCreateBranches: true,
      autoCreatePRs: true,
      requireTests: true,
      minCoverage: 80,
      continuousIntegration: true
    }
  }
};

export const App: React.FC = () => {
  const [state, setState] = useState<AppState>(initialState);

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const nextStep = (step: ProcessingStep) => {
    updateState({ currentStep: step });
  };

  const addFeedback = (feedback: { type: 'documentation' | 'mockup'; content: string; timestamp: Date }) => {
    setState(prev => ({
      ...prev,
      feedback: [...prev.feedback, feedback]
    }));
  };

  return (
    <div className="app">
      <Header currentStep={state.currentStep} />
      
      <div className="app-body">
        <Sidebar 
          currentStep={state.currentStep} 
          onStepClick={nextStep}
          processingStatus={state.processingStatus}
        />
        
        <main className="app-main">
          {state.currentStep === 'upload' && (
            <DocumentUploader
              documents={state.documents}
              onDocumentsUploaded={(docs) => {
                updateState({ documents: docs });
                nextStep('documentation');
              }}
            />
          )}

          {state.currentStep === 'documentation' && (
            <DocumentationGenerator
              documents={state.documents}
              parameters={state.parameters}
              onDocumentationGenerated={(docs) => {
                updateState({ generatedDocs: docs });
                nextStep('mockups');
              }}
            />
          )}

          {state.currentStep === 'mockups' && (
            <MockupGenerator
              documents={state.documents}
              documentation={state.generatedDocs}
              parameters={state.parameters}
              onMockupsGenerated={(mockups) => {
                updateState({ mockups });
                nextStep('feedback');
              }}
            />
          )}

          {state.currentStep === 'feedback' && (
            <div className="feedback-stage">
              <div className="content-review">
                <div className="documentation-review">
                  <h2>📋 Generated Documentation</h2>
                  {state.generatedDocs && (
                    <div className="doc-sections">
                      <div className="doc-section">
                        <h3>🏢 Business Analysis</h3>
                        <div className="doc-content">{state.generatedDocs.businessAnalysis}</div>
                      </div>
                      <div className="doc-section">
                        <h3>⚙️ System Analysis</h3>
                        <div className="doc-content">{state.generatedDocs.systemAnalysis}</div>
                      </div>
                      <div className="doc-section">
                        <h3>🏗️ Architecture</h3>
                        <div className="doc-content">{state.generatedDocs.architecture}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mockups-review">
                  <h2>🎨 Generated Mockups</h2>
                  {state.mockups && (
                    <div className="mockup-gallery">
                      {state.mockups.wireframes.map((mockup, index) => (
                        <div key={index} className="mockup-item">
                          <h4>{mockup.name}</h4>
                          <div className="mockup-preview">
                            {mockup.svgContent ? (
                              <div dangerouslySetInnerHTML={{ __html: mockup.svgContent }} />
                            ) : (
                              <div className="mockup-placeholder">{mockup.description}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <FeedbackChat
                feedback={state.feedback}
                onFeedbackSubmit={addFeedback}
                onApprovalComplete={() => nextStep('tasks')}
              />
            </div>
          )}

          {state.currentStep === 'tasks' && (
            <TaskGenerator
              documents={state.documents}
              documentation={state.generatedDocs}
              mockups={state.mockups}
              feedback={state.feedback}
              parameters={state.parameters}
              onTasksGenerated={(tasks) => {
                updateState({ tasks });
                nextStep('processing');
              }}
            />
          )}

          {state.currentStep === 'processing' && (
            <ProcessingDashboard
              tasks={state.tasks}
              parameters={state.parameters}
              status={state.processingStatus}
              onStatusUpdate={(status) => updateState({ processingStatus: status })}
            />
          )}
        </main>
      </div>
    </div>
  );
};