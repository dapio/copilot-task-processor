/**
 * Workflows Management Component
 * ThinkCode AI Platform - Zarządzanie przepływami pracy
 */

import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  Edit,
  Trash2,
  Plus,
  Clock,
  CheckCircle,
} from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'stopped';
  steps: WorkflowStep[];
  createdAt: string;
  lastRun: string | null;
  totalRuns: number;
}

interface WorkflowStep {
  id: string;
  name: string;
  type: 'api_call' | 'data_processing' | 'notification' | 'approval';
  config: Record<string, any>;
  order: number;
}

export const WorkflowsView: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workflows');

      if (response.ok) {
        const workflows = await response.json();
        setWorkflows(workflows);
      } else {
        throw new Error('Nie można załadować workflow z API');
      }
    } catch (error) {
      console.error('Failed to load workflows:', error);
      setError('Nie można załadować workflow z API');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (
    workflowId: string,
    newStatus: Workflow['status']
  ) => {
    try {
      setWorkflows(prev =>
        prev.map(w => (w.id === workflowId ? { ...w, status: newStatus } : w))
      );

      // API call would go here
      console.log(`Workflow ${workflowId} status changed to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update workflow status:', error);
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      setWorkflows(prev => prev.filter(w => w.id !== workflowId));
      // API call would go here
      console.log(`Workflow ${workflowId} deleted`);
    } catch (error) {
      console.error('Failed to delete workflow:', error);
    }
  };

  const getStatusIcon = (status: Workflow['status']) => {
    switch (status) {
      case 'active':
        return React.createElement(Play, {
          className: 'w-4 h-4 text-green-500',
        });
      case 'paused':
        return React.createElement(Pause, {
          className: 'w-4 h-4 text-yellow-500',
        });
      case 'stopped':
        return React.createElement(Square, {
          className: 'w-4 h-4 text-red-500',
        });
    }
  };

  const getStatusColor = (status: Workflow['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'stopped':
        return 'bg-red-100 text-red-800';
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading workflows...</span>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
          <p className="text-gray-600">
            Manage and monitor your automated workflows
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Workflow
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {workflows.map(workflow => (
          <div
            key={workflow.id}
            className="bg-white rounded-lg shadow border p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {workflow.name}
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  {workflow.description}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    workflow.status
                  )}`}
                >
                  {getStatusIcon(workflow.status)}
                  <span className="ml-1 capitalize">{workflow.status}</span>
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                Created: {new Date(workflow.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 mr-2" />
                Runs: {workflow.totalRuns}
              </div>
              {workflow.lastRun && (
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  Last run: {new Date(workflow.lastRun).toLocaleDateString()}
                </div>
              )}
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Steps ({workflow.steps.length})
              </h4>
              <div className="space-y-1">
                {workflow.steps.slice(0, 3).map(step => (
                  <div
                    key={step.id}
                    className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded"
                  >
                    {step.order}. {step.name}
                  </div>
                ))}
                {workflow.steps.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{workflow.steps.length - 3} more steps
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                {workflow.status === 'active' ? (
                  <button
                    onClick={() => handleStatusChange(workflow.id, 'paused')}
                    className="flex items-center px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                  >
                    <Pause className="w-3 h-3 mr-1" />
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange(workflow.id, 'active')}
                    className="flex items-center px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Start
                  </button>
                )}

                <button
                  onClick={() => handleStatusChange(workflow.id, 'stopped')}
                  className="flex items-center px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  <Square className="w-3 h-3 mr-1" />
                  Stop
                </button>
              </div>

              <div className="flex space-x-2">
                <button
                  className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                  title="Edit workflow"
                  aria-label="Edit workflow"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteWorkflow(workflow.id)}
                  className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                  title="Delete workflow"
                  aria-label="Delete workflow"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {workflows.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Play className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No workflows yet
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first workflow to automate your processes
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Workflow
          </button>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Workflow</h3>
            <p className="text-gray-600 mb-4">
              Workflow builder coming soon...
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
