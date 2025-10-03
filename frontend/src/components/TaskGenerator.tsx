import React, { useState, useEffect } from 'react';
import './TaskGenerator.css';

interface TaskGeneratorProps {
  documents: File[];
  parameters: ProcessorParameters;
  onTasksGenerated: (tasks: JiraTask[]) => void;
}

export const TaskGenerator: React.FC<TaskGeneratorProps> = ({
  documents,
  parameters,
  onTasksGenerated
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [generatedTasks, setGeneratedTasks] = useState<JiraTask[]>([]);
  const [editingTask, setEditingTask] = useState<string | null>(null);

  useEffect(() => {
    analyzeDocuments();
  }, []);

  const analyzeDocuments = async () => {
    setAnalyzing(true);
    try {
      const formData = new FormData();
      documents.forEach(doc => formData.append('documents', doc));
      formData.append('parameters', JSON.stringify(parameters));

      const response = await fetch('/api/analyze-documents', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      setAnalysis(result.analysis);
      setGeneratedTasks(result.tasks);
    } catch (error) {
      console.error('Document analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const updateTask = (taskId: string, updates: Partial<JiraTask>) => {
    setGeneratedTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
  };

  const removeTask = (taskId: string) => {
    setGeneratedTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const addNewTask = () => {
    const newTask: JiraTask = {
      id: `task-${Date.now()}`,
      title: 'New Task',
      description: '',
      type: 'Task',
      priority: 'Medium',
      estimatedHours: 4,
      dependencies: [],
      acceptanceCriteria: []
    };
    setGeneratedTasks(prev => [...prev, newTask]);
    setEditingTask(newTask.id);
  };

  const handleContinue = () => {
    onTasksGenerated(generatedTasks);
  };

  if (analyzing) {
    return (
      <div className="task-generator analyzing">
        <h2>🤖 Analyzing Documentation</h2>
        <div className="analysis-progress">
          <div className="spinner"></div>
          <p>AI is analyzing your documents and generating tasks...</p>
          <ul className="analysis-steps">
            <li>📄 Extracting content from documents</li>
            <li>🧠 Identifying features and requirements</li>
            <li>📋 Breaking down into actionable tasks</li>
            <li>🎯 Prioritizing and estimating effort</li>
            <li>✅ Generating acceptance criteria</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="task-generator">
      <h2>📋 Generated Tasks</h2>
      <p>Review and modify the automatically generated Jira tasks</p>

      {analysis && (
        <div className="analysis-summary">
          <h3>📊 Document Analysis Summary</h3>
          <div className="analysis-stats">
            <div className="stat">
              <span className="label">Features Identified:</span>
              <span className="value">{analysis.featuresCount}</span>
            </div>
            <div className="stat">
              <span className="label">Complexity Score:</span>
              <span className="value">{analysis.complexityScore}/10</span>
            </div>
            <div className="stat">
              <span className="label">Estimated Timeline:</span>
              <span className="value">{analysis.estimatedWeeks} weeks</span>
            </div>
          </div>
        </div>
      )}

      <div className="tasks-container">
        <div className="tasks-header">
          <h3>Tasks ({generatedTasks.length})</h3>
          <button onClick={addNewTask} className="add-task-button">
            ➕ Add Task
          </button>
        </div>

        <div className="tasks-list">
          {generatedTasks.map(task => (
            <div key={task.id} className="task-card">
              <div className="task-header">
                <div className="task-meta">
                  <select
                    value={task.type}
                    onChange={e => updateTask(task.id, { type: e.target.value as any })}
                  >
                    <option value="Story">📖 Story</option>
                    <option value="Task">✅ Task</option>
                    <option value="Bug">🐛 Bug</option>
                    <option value="Epic">🎯 Epic</option>
                  </select>
                  <select
                    value={task.priority}
                    onChange={e => updateTask(task.id, { priority: e.target.value as any })}
                  >
                    <option value="High">🔴 High</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Low">🟢 Low</option>
                  </select>
                </div>
                <button
                  onClick={() => removeTask(task.id)}
                  className="remove-task-button"
                >
                  🗑️
                </button>
              </div>

              <div className="task-content">
                <input
                  type="text"
                  value={task.title}
                  onChange={e => updateTask(task.id, { title: e.target.value })}
                  className="task-title"
                  placeholder="Task title..."
                />

                <textarea
                  value={task.description}
                  onChange={e => updateTask(task.id, { description: e.target.value })}
                  className="task-description"
                  placeholder="Task description..."
                  rows={3}
                />

                <div className="task-details">
                  <div className="detail-group">
                    <label>Estimated Hours:</label>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={task.estimatedHours}
                      onChange={e => updateTask(task.id, { estimatedHours: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="acceptance-criteria">
                  <h4>✅ Acceptance Criteria</h4>
                  {task.acceptanceCriteria.map((criterion, index) => (
                    <div key={index} className="criterion">
                      <input
                        type="text"
                        value={criterion}
                        onChange={e => {
                          const newCriteria = [...task.acceptanceCriteria];
                          newCriteria[index] = e.target.value;
                          updateTask(task.id, { acceptanceCriteria: newCriteria });
                        }}
                        placeholder="Acceptance criterion..."
                      />
                      <button
                        onClick={() => {
                          const newCriteria = task.acceptanceCriteria.filter((_, i) => i !== index);
                          updateTask(task.id, { acceptanceCriteria: newCriteria });
                        }}
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newCriteria = [...task.acceptanceCriteria, ''];
                      updateTask(task.id, { acceptanceCriteria: newCriteria });
                    }}
                    className="add-criterion-button"
                  >
                    ➕ Add Criterion
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="generation-summary">
        <h3>📊 Project Summary</h3>
        <div className="summary-stats">
          <div className="stat">
            <span className="label">Total Tasks:</span>
            <span className="value">{generatedTasks.length}</span>
          </div>
          <div className="stat">
            <span className="label">Total Hours:</span>
            <span className="value">
              {generatedTasks.reduce((sum, task) => sum + task.estimatedHours, 0)}h
            </span>
          </div>
          <div className="stat">
            <span className="label">High Priority:</span>
            <span className="value">
              {generatedTasks.filter(t => t.priority === 'High').length}
            </span>
          </div>
        </div>
      </div>

      <div className="generator-actions">
        <button onClick={analyzeDocuments} className="regenerate-button">
          🔄 Re-analyze Documents
        </button>
        <button
          onClick={handleContinue}
          disabled={generatedTasks.length === 0}
          className="continue-button primary"
        >
          Start Processing ({generatedTasks.length} tasks) →
        </button>
      </div>
    </div>
  );
};