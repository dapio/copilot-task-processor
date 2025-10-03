import React, { useState, useEffect } from 'react';
import './ProcessingDashboard.css';

interface ProcessingDashboardProps {
  tasks: JiraTask[];
  parameters: ProcessorParameters;
  status: ProcessingStatus;
  onStatusUpdate: (status: ProcessingStatus) => void;
}

export const ProcessingDashboard: React.FC<ProcessingDashboardProps> = ({
  tasks,
  parameters,
  status,
  onStatusUpdate
}) => {
  const [processing, setProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const startProcessing = async () => {
    setProcessing(true);
    
    try {
      // First, create Jira tasks
      onStatusUpdate({
        ...status,
        status: 'creating-tasks',
        currentTask: 'Creating Jira tasks...'
      });

      const createTasksResponse = await fetch('/api/create-jira-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, parameters })
      });

      const createdTasks = await createTasksResponse.json();
      
      // Then process each task
      onStatusUpdate({
        ...status,
        status: 'processing',
        total: tasks.length,
        completed: 0
      });

      for (let i = 0; i < createdTasks.length; i++) {
        const task = createdTasks[i];
        
        onStatusUpdate({
          ...status,
          status: 'processing',
          currentTask: `Processing ${task.key}: ${task.title}`,
          completed: i,
          total: tasks.length
        });

        // Process individual task
        const processResponse = await fetch('/api/process-task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskKey: task.key, parameters })
        });

        const result = await processResponse.json();
        
        onStatusUpdate({
          ...status,
          results: [...status.results, result]
        });

        // Add to logs
        setLogs(prev => [...prev, 
          `✅ Completed ${task.key}: ${result.success ? 'SUCCESS' : 'FAILED'}`
        ]);
      }

      onStatusUpdate({
        ...status,
        status: 'completed',
        completed: tasks.length
      });

    } catch (error) {
      console.error('Processing failed:', error);
      setLogs(prev => [...prev, `❌ Processing failed: ${error}`]);
    } finally {
      setProcessing(false);
    }
  };

  const progressPercentage = status.total > 0 ? (status.completed / status.total) * 100 : 0;

  return (
    <div className="processing-dashboard">
      <h2>🚀 Processing Dashboard</h2>
      
      <div className="processing-overview">
        <div className="overview-stats">
          <div className="stat-card">
            <h3>📋 Total Tasks</h3>
            <div className="stat-value">{tasks.length}</div>
          </div>
          <div className="stat-card">
            <h3>⏱️ Est. Time</h3>
            <div className="stat-value">
              {tasks.reduce((sum, task) => sum + task.estimatedHours, 0)}h
            </div>
          </div>
          <div className="stat-card">
            <h3>✅ Completed</h3>
            <div className="stat-value">
              {status.completed}/{status.total}
            </div>
          </div>
          <div className="stat-card">
            <h3>📊 Progress</h3>
            <div className="stat-value">{progressPercentage.toFixed(0)}%</div>
          </div>
        </div>

        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="current-status">
        <h3>Current Status</h3>
        <div className={`status-indicator ${status.status}`}>
          <span className="status-icon">
            {status.status === 'idle' && '⏸️'}
            {status.status === 'analyzing' && '🤖'}
            {status.status === 'creating-tasks' && '📋'}
            {status.status === 'processing' && '⚙️'}
            {status.status === 'completed' && '✅'}
          </span>
          <span className="status-text">
            {status.status === 'idle' && 'Ready to start'}
            {status.status === 'analyzing' && 'Analyzing documents...'}
            {status.status === 'creating-tasks' && 'Creating Jira tasks...'}
            {status.status === 'processing' && status.currentTask}
            {status.status === 'completed' && 'All tasks completed!'}
          </span>
        </div>
      </div>

      <div className="processing-controls">
        {!processing && status.status === 'idle' && (
          <button onClick={startProcessing} className="start-button primary">
            🚀 Start Automated Processing
          </button>
        )}
        
        {processing && (
          <button disabled className="processing-button">
            ⚙️ Processing... Please wait
          </button>
        )}

        {status.status === 'completed' && (
          <div className="completion-actions">
            <button className="view-results-button">
              📊 View Detailed Results
            </button>
            <button className="restart-button">
              🔄 Process New Documents
            </button>
          </div>
        )}
      </div>

      <div className="tasks-progress">
        <h3>📋 Task Progress</h3>
        <div className="tasks-list">
          {tasks.map((task, index) => {
            const isCompleted = index < status.completed;
            const isCurrent = index === status.completed;
            const result = status.results.find(r => r.taskIndex === index);
            
            return (
              <div key={task.id} className={`task-progress-item ${
                isCompleted ? 'completed' : isCurrent ? 'current' : 'pending'
              }`}>
                <div className="task-status-icon">
                  {isCompleted && (result?.success ? '✅' : '❌')}
                  {isCurrent && '⚙️'}
                  {!isCompleted && !isCurrent && '⏳'}
                </div>
                <div className="task-info">
                  <div className="task-title">{task.title}</div>
                  <div className="task-meta">
                    {task.type} • {task.priority} Priority • {task.estimatedHours}h
                  </div>
                  {result && (
                    <div className="task-result">
                      {result.success ? (
                        <div className="success-details">
                          ✅ Branch: {result.branch} | PR: #{result.prNumber}
                        </div>
                      ) : (
                        <div className="error-details">
                          ❌ Error: {result.error}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="processing-logs">
        <h3>📄 Processing Logs</h3>
        <div className="logs-container">
          {logs.map((log, index) => (
            <div key={index} className="log-entry">
              {new Date().toLocaleTimeString()} - {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};