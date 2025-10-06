/**
 * Task Generation Component
 * Generate and manage tasks from analysis results
 */

import React, { useState } from 'react';
import {
  Zap,
  CheckSquare,
  Clock,
  User,
  AlertTriangle,
  Download,
  Play,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from '../ui/basic-components';

interface GeneratedTask {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours: number;
  assignee?: string;
  dependencies: string[];
  tags: string[];
}

interface TaskGenerationProps {
  tasks: GeneratedTask[] | null;
  onGenerateTasks: () => void;
  onTaskAction: (
    taskId: string,
    action: 'process' | 'download' | 'delete'
  ) => void;
  isGenerating: boolean;
  hasAnalysisResults: boolean;
}

export default function TaskGeneration({
  tasks,
  onGenerateTasks,
  onTaskAction,
  isGenerating,
  hasAnalysisResults,
}: TaskGenerationProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  const handleTaskSelect = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const getPriorityColor = (priority: GeneratedTask['priority']) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: GeneratedTask['priority']) => {
    switch (priority) {
      case 'critical':
        return React.createElement(AlertTriangle, { className: 'h-3 w-3' });
      default:
        return React.createElement(CheckSquare, { className: 'h-3 w-3' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Task Generation</span>
          </div>
          {tasks && tasks.length > 0 && (
            <Badge variant="secondary">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} generated
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasAnalysisResults && (
          <div className="text-center py-6 text-gray-500">
            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Complete document analysis first</p>
            <p className="text-sm mt-1">
              Tasks will be generated based on analysis results
            </p>
          </div>
        )}

        {hasAnalysisResults && !tasks && !isGenerating && (
          <div className="text-center py-6">
            <Zap className="h-12 w-12 mx-auto mb-4 text-blue-500" />
            <p className="text-gray-700 mb-4">
              Ready to generate tasks from analysis
            </p>
            <Button
              onClick={onGenerateTasks}
              className="flex items-center space-x-2"
            >
              <Zap className="h-4 w-4" />
              <span>Generate Tasks</span>
            </Button>
          </div>
        )}

        {isGenerating && (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating tasks from analysis...</p>
          </div>
        )}

        {tasks && tasks.length > 0 && (
          <div className="space-y-4">
            {/* Task List */}
            <div className="space-y-3">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedTasks.has(task.id)}
                        onChange={() => handleTaskSelect(task.id)}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        aria-label={`Select task: ${task.title}`}
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {task.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {task.description}
                        </p>

                        {/* Task Meta */}
                        <div className="flex items-center space-x-4 mt-3">
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            {getPriorityIcon(task.priority)}
                            <span className="capitalize">{task.priority}</span>
                          </span>

                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{task.estimatedHours}h</span>
                          </div>

                          {task.assignee && (
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <User className="h-3 w-3" />
                              <span>{task.assignee}</span>
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        {task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {task.tags.map((tag, tagIndex) => (
                              <Badge
                                key={tagIndex}
                                variant="outline"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Task Actions */}
                    <div className="flex items-center space-x-1 ml-4">
                      <Button
                        onClick={() => onTaskAction(task.id, 'process')}
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:text-green-700"
                        aria-label={`Process task: ${task.title}`}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={() => onTaskAction(task.id, 'download')}
                        size="sm"
                        variant="outline"
                        className="text-blue-600 hover:text-blue-700"
                        aria-label={`Download task: ${task.title}`}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bulk Actions */}
            {selectedTasks.size > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-700">
                  {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''}{' '}
                  selected
                </span>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline">
                    Process Selected
                  </Button>
                  <Button size="sm" variant="outline">
                    Download Selected
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
