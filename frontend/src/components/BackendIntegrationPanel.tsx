import React, { useState } from 'react';
import { useBackendApi } from '../hooks/useBackendApi';
import {
  createDocumentAnalysisRequest,
  createTaskGenerationRequest,
} from '../services/backendApiService';

interface BackendIntegrationPanelProps {
  className?: string;
}

export const BackendIntegrationPanel: React.FC<
  BackendIntegrationPanelProps
> = ({ className = '' }) => {
  const {
    connection,
    checkConnection,
    documentAnalysis,
    analyzeDocuments,
    taskGeneration,
    generateTasks,
    integrationTest,
    testIntegrations,
    isAnyOperationInProgress,
  } = useBackendApi();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [projectName, setProjectName] = useState('ThinkCode AI Platform');
  const [projectDescription, setProjectDescription] = useState(
    'Advanced task processing and document generation system'
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const handleDocumentAnalysis = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select files to analyze');
      return;
    }

    const request = createDocumentAnalysisRequest(selectedFiles, {
      includeMetadata: true,
      extractKeywords: true,
      generateSummary: true,
    });

    await analyzeDocuments(request);
  };

  const handleTaskGeneration = async () => {
    const request = createTaskGenerationRequest({
      name: projectName,
      description: projectDescription,
      requirements: [
        'Document processing and analysis',
        'Task generation and management',
        'Backend API integration',
        'Frontend dashboard with real-time updates',
      ],
      technologies: ['React', 'TypeScript', 'Node.js', 'Express.js'],
    });

    await generateTasks(request);
  };

  const getStatusIcon = (
    isConnected: boolean,
    isLoading: boolean,
    error: string | null
  ) => {
    if (isLoading) return '🔄';
    if (error) return '❌';
    if (isConnected) return '✅';
    return '⚠️';
  };

  const getStatusColor = (
    isConnected: boolean,
    isLoading: boolean,
    error: string | null
  ) => {
    if (isLoading) return '#ff8c00';
    if (error) return '#dc3545';
    if (isConnected) return '#28a745';
    return '#ffc107';
  };

  return (
    <div className={`backend-integration-panel ${className}`}>
      <style jsx>{`
        .backend-integration-panel {
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: white;
          margin-bottom: 20px;
        }

        .status-section {
          margin-bottom: 20px;
          padding: 15px;
          border: 1px solid #e9ecef;
          border-radius: 5px;
          background: #f8f9fa;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .status-indicator {
          font-size: 18px;
        }

        .operation-section {
          margin-bottom: 20px;
          padding: 15px;
          border: 1px solid #e9ecef;
          border-radius: 5px;
        }

        .operation-section h4 {
          margin: 0 0 10px 0;
          color: #495057;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #495057;
        }

        .form-control {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-control:focus {
          outline: none;
          border-color: #80bdff;
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background-color: #007bff;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #0056b3;
        }

        .btn-success {
          background-color: #28a745;
          color: white;
        }

        .btn-success:hover:not(:disabled) {
          background-color: #1e7e34;
        }

        .btn-info {
          background-color: #17a2b8;
          color: white;
        }

        .btn-info:hover:not(:disabled) {
          background-color: #138496;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #545b62;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background-color: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
          margin: 10px 0;
        }

        .progress-bar-fill {
          height: 100%;
          background-color: #007bff;
          transition: width 0.3s;
        }

        .result-panel {
          margin-top: 15px;
          padding: 10px;
          border: 1px solid #d1ecf1;
          border-radius: 4px;
          background-color: #d4edda;
          font-size: 12px;
        }

        .error-panel {
          margin-top: 15px;
          padding: 10px;
          border: 1px solid #f5c6cb;
          border-radius: 4px;
          background-color: #f8d7da;
          color: #721c24;
          font-size: 12px;
        }

        .file-list {
          margin-top: 10px;
          font-size: 12px;
          color: #6c757d;
        }

        .button-group {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .last-checked {
          font-size: 12px;
          color: #6c757d;
          margin-left: auto;
        }
      `}</style>

      <h3>🔗 Backend Integration Panel</h3>

      {/* Connection Status */}
      <div className="status-section">
        <div className="connection-status">
          <span
            className="status-indicator"
            style={{
              color: getStatusColor(
                connection.isConnected,
                connection.isLoading,
                connection.error
              ),
            }}
          >
            {getStatusIcon(
              connection.isConnected,
              connection.isLoading,
              connection.error
            )}
          </span>
          <span>
            <strong>Backend Connection:</strong>{' '}
            {connection.isLoading
              ? 'Checking...'
              : connection.isConnected
                ? 'Connected'
                : connection.error
                  ? `Error: ${connection.error}`
                  : 'Disconnected'}
          </span>
          {connection.lastChecked && (
            <span className="last-checked">
              Last checked: {connection.lastChecked.toLocaleTimeString()}
            </span>
          )}
        </div>
        <button
          className="btn btn-secondary"
          onClick={checkConnection}
          disabled={connection.isLoading}
        >
          🔄 Check Connection
        </button>
      </div>

      {/* Document Analysis */}
      <div className="operation-section">
        <h4>📄 Document Analysis</h4>
        <div className="form-group">
          <label htmlFor="file-input">Select Files:</label>
          <input
            id="file-input"
            type="file"
            multiple
            onChange={handleFileSelect}
            className="form-control"
            accept=".js,.ts,.tsx,.jsx,.md,.txt,.json,.yaml,.yml"
          />
          {selectedFiles.length > 0 && (
            <div className="file-list">
              Selected: {selectedFiles.map(f => f.name).join(', ')}
            </div>
          )}
        </div>

        {documentAnalysis.progress !== undefined &&
          documentAnalysis.progress > 0 && (
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${documentAnalysis.progress}%` }}
              />
            </div>
          )}

        <button
          className="btn btn-primary"
          onClick={handleDocumentAnalysis}
          disabled={
            documentAnalysis.isAnalyzing ||
            selectedFiles.length === 0 ||
            isAnyOperationInProgress
          }
        >
          {documentAnalysis.isAnalyzing
            ? '🔄 Analyzing...'
            : '🔍 Analyze Documents'}
        </button>

        {documentAnalysis.result && (
          <div className="result-panel">
            <strong>Analysis Complete!</strong>
            <br />
            Files analyzed: {documentAnalysis.result.fileAnalysis.length}
            <br />
            Total keywords:{' '}
            {documentAnalysis.result.overallAnalysis.commonKeywords.length}
            <br />
            Recommendations:{' '}
            {documentAnalysis.result.overallAnalysis.recommendations.length}
          </div>
        )}

        {documentAnalysis.error && (
          <div className="error-panel">
            <strong>Analysis Error:</strong> {documentAnalysis.error}
          </div>
        )}
      </div>

      {/* Task Generation */}
      <div className="operation-section">
        <h4>📋 Task Generation</h4>
        <div className="form-group">
          <label htmlFor="project-name">Project Name:</label>
          <input
            id="project-name"
            type="text"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            className="form-control"
            placeholder="Enter project name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="project-description">Project Description:</label>
          <textarea
            id="project-description"
            value={projectDescription}
            onChange={e => setProjectDescription(e.target.value)}
            className="form-control"
            rows={3}
            placeholder="Describe your project..."
          />
        </div>

        {taskGeneration.progress !== undefined &&
          taskGeneration.progress > 0 && (
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${taskGeneration.progress}%` }}
              />
            </div>
          )}

        <button
          className="btn btn-success"
          onClick={handleTaskGeneration}
          disabled={
            taskGeneration.isGenerating ||
            !projectName.trim() ||
            isAnyOperationInProgress
          }
        >
          {taskGeneration.isGenerating
            ? '🔄 Generating...'
            : '🎯 Generate Tasks'}
        </button>

        {taskGeneration.result && (
          <div className="result-panel">
            <strong>Tasks Generated!</strong>
            <br />
            Total tasks: {taskGeneration.result.tasks.length}
            <br />
            Phases: {taskGeneration.result.projectStructure.phases.length}
            <br />
            Estimated hours:{' '}
            {taskGeneration.result.metadata.totalEstimatedHours || 'N/A'}
          </div>
        )}

        {taskGeneration.error && (
          <div className="error-panel">
            <strong>Generation Error:</strong> {taskGeneration.error}
          </div>
        )}
      </div>

      {/* Integration Tests */}
      <div className="operation-section">
        <h4>🧪 Integration Tests</h4>
        <button
          className="btn btn-info"
          onClick={testIntegrations}
          disabled={integrationTest.isTesting || isAnyOperationInProgress}
        >
          {integrationTest.isTesting ? '🔄 Testing...' : '🔬 Run Tests'}
        </button>

        {integrationTest.results && (
          <div className="result-panel">
            <strong>Test Results:</strong>
            <br />
            {integrationTest.results.map((test, index) => (
              <div key={index} style={{ marginBottom: '5px' }}>
                {test.status === 'pass'
                  ? '✅'
                  : test.status === 'fail'
                    ? '❌'
                    : '⚠️'}{' '}
                {test.testName}: {test.message}
              </div>
            ))}
          </div>
        )}

        {integrationTest.error && (
          <div className="error-panel">
            <strong>Test Error:</strong> {integrationTest.error}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="operation-section">
        <h4>⚡ Quick Actions</h4>
        <div className="button-group">
          <button
            className="btn btn-secondary"
            onClick={() =>
              window.open('http://localhost:3002/api/health', '_blank')
            }
            disabled={isAnyOperationInProgress}
          >
            🌐 Open Backend Health
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => window.open('http://localhost:3002', '_blank')}
            disabled={isAnyOperationInProgress}
          >
            🏠 Open Backend Root
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => window.location.reload()}
            disabled={isAnyOperationInProgress}
          >
            🔄 Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
};
