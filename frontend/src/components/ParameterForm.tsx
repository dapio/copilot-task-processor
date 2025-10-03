import React, { useState } from 'react';
import './ParameterForm.css';

interface ParameterFormProps {
  documents: File[];
  onParametersConfigured: (parameters: ProcessorParameters) => void;
}

export const ParameterForm: React.FC<ParameterFormProps> = ({
  documents,
  onParametersConfigured
}) => {
  const [parameters, setParameters] = useState<ProcessorParameters>(
    getDefaultParameters()
  );
  const [activeTab, setActiveTab] = useState<'jira' | 'github' | 'ai' | 'workflow'>('jira');
  const [testingConnections, setTestingConnections] = useState(false);
  const [connectionResults, setConnectionResults] = useState<Record<string, boolean>>({});

  const updateParameter = (section: keyof ProcessorParameters, key: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const testConnections = async () => {
    setTestingConnections(true);
    try {
      const response = await fetch('/api/test-connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parameters)
      });
      const results = await response.json();
      setConnectionResults(results);
    } catch (error) {
      console.error('Connection test failed:', error);
    } finally {
      setTestingConnections(false);
    }
  };

  const handleContinue = () => {
    onParametersConfigured(parameters);
  };

  return (
    <div className="parameter-form">
      <h2>⚙️ Configuration</h2>
      <p>Configure your integrations and workflow settings</p>

      <div className="documents-summary">
        <h3>📄 Documents to Process</h3>
        <ul>
          {documents.map((doc, index) => (
            <li key={index}>{doc.name}</li>
          ))}
        </ul>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'jira' ? 'active' : ''}`}
          onClick={() => setActiveTab('jira')}
        >
          🎯 Jira
        </button>
        <button
          className={`tab ${activeTab === 'github' ? 'active' : ''}`}
          onClick={() => setActiveTab('github')}
        >
          🐙 GitHub
        </button>
        <button
          className={`tab ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          🤖 AI
        </button>
        <button
          className={`tab ${activeTab === 'workflow' ? 'active' : ''}`}
          onClick={() => setActiveTab('workflow')}
        >
          🔄 Workflow
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'jira' && (
          <div className="form-section">
            <h3>Jira Configuration</h3>
            <div className="form-group">
              <label>Jira Host</label>
              <input
                type="url"
                placeholder="https://your-domain.atlassian.net"
                value={parameters.jira.host}
                onChange={e => updateParameter('jira', 'host', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="your-email@company.com"
                value={parameters.jira.email}
                onChange={e => updateParameter('jira', 'email', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>API Token</label>
              <input
                type="password"
                placeholder="Your Jira API token"
                value={parameters.jira.token}
                onChange={e => updateParameter('jira', 'token', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Project Key</label>
              <input
                type="text"
                placeholder="PROJ"
                value={parameters.jira.projectKey}
                onChange={e => updateParameter('jira', 'projectKey', e.target.value)}
              />
            </div>
          </div>
        )}

        {activeTab === 'github' && (
          <div className="form-section">
            <h3>GitHub Configuration</h3>
            <div className="form-group">
              <label>GitHub Token</label>
              <input
                type="password"
                placeholder="ghp_xxxxxxxxxxxxx"
                value={parameters.github.token}
                onChange={e => updateParameter('github', 'token', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Repository Owner</label>
              <input
                type="text"
                placeholder="dapio"
                value={parameters.github.owner}
                onChange={e => updateParameter('github', 'owner', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Repository Name</label>
              <input
                type="text"
                placeholder="my-project"
                value={parameters.github.repo}
                onChange={e => updateParameter('github', 'repo', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Target Branch</label>
              <input
                type="text"
                placeholder="development"
                value={parameters.github.branch}
                onChange={e => updateParameter('github', 'branch', e.target.value)}
              />
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="form-section">
            <h3>AI Configuration</h3>
            <div className="form-group">
              <label>OpenAI API Key</label>
              <input
                type="password"
                placeholder="sk-xxxxxxxxxxxxx"
                value={parameters.ai.openaiKey}
                onChange={e => updateParameter('ai', 'openaiKey', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>AI Model</label>
              <select
                value={parameters.ai.model}
                onChange={e => updateParameter('ai', 'model', e.target.value)}
              >
                <option value="gpt-4">GPT-4 (Recommended)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>
            <div className="form-group">
              <label>Temperature ({parameters.ai.temperature})</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={parameters.ai.temperature}
                onChange={e => updateParameter('ai', 'temperature', parseFloat(e.target.value))}
              />
              <span className="range-labels">
                <span>Conservative</span>
                <span>Creative</span>
              </span>
            </div>
          </div>
        )}

        {activeTab === 'workflow' && (
          <div className="form-section">
            <h3>Workflow Settings</h3>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={parameters.workflow.autoCreateBranches}
                  onChange={e => updateParameter('workflow', 'autoCreateBranches', e.target.checked)}
                />
                Auto-create GitHub branches
              </label>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={parameters.workflow.autoCreatePRs}
                  onChange={e => updateParameter('workflow', 'autoCreatePRs', e.target.checked)}
                />
                Auto-create Pull Requests
              </label>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={parameters.workflow.requireTests}
                  onChange={e => updateParameter('workflow', 'requireTests', e.target.checked)}
                />
                Require comprehensive tests
              </label>
            </div>
            <div className="form-group">
              <label>Minimum Test Coverage ({parameters.workflow.minCoverage}%)</label>
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={parameters.workflow.minCoverage}
                onChange={e => updateParameter('workflow', 'minCoverage', parseInt(e.target.value))}
              />
            </div>
          </div>
        )}
      </div>

      <div className="connection-test">
        <button
          onClick={testConnections}
          disabled={testingConnections}
          className="test-button"
        >
          {testingConnections ? '🔄 Testing...' : '🔍 Test Connections'}
        </button>

        {Object.keys(connectionResults).length > 0 && (
          <div className="connection-results">
            <h4>Connection Test Results:</h4>
            <ul>
              <li>Jira: {connectionResults.jira ? '✅' : '❌'}</li>
              <li>GitHub: {connectionResults.github ? '✅' : '❌'}</li>
              <li>OpenAI: {connectionResults.ai ? '✅' : '❌'}</li>
            </ul>
          </div>
        )}
      </div>

      <div className="form-actions">
        <button
          onClick={handleContinue}
          className="continue-button primary"
        >
          Continue to Task Generation →
        </button>
      </div>
    </div>
  );
};