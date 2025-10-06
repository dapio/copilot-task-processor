/**
 * Workflow Admin Panel - React Component
 * Chat-based interface for creating and managing workflows
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Textarea,
  Badge,
  ScrollArea,
  Separator,
  Alert,
  AlertDescription,
} from './ui/basic-components';
import {
  MessageCircle,
  Settings,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  GitBranch,
  Zap,
  Brain,
  Send,
  Plus,
  Edit3,
  Save,
  Eye,
  Trash2,
} from 'lucide-react';

// Typy danych
interface WorkflowCreationSession {
  id: string;
  chatSessionId: string;
  status: 'active' | 'completed' | 'cancelled';
  workflowInProgress: Partial<WorkflowTemplate>;
  currentStep:
    | 'basic_info'
    | 'steps_definition'
    | 'approvals_setup'
    | 'testing'
    | 'finalization';
  conversationHistory: string[];
  extractedInformation: {
    projectType?: string;
    complexity?: string;
    stakeholders?: string[];
    technicalRequirements?: string[];
    businessRequirements?: string[];
    approvalGates?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: 'simple' | 'medium' | 'complex' | 'enterprise';
  steps: WorkflowStep[];
  approvals: ApprovalGate[];
  estimatedDuration: number;
}

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type: string;
  provider: string;
}

interface ApprovalGate {
  id: string;
  stepId: string;
  approverType: string;
  required: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'message' | 'suggestion' | 'progress' | 'error';
}

import useWorkflowAdmin from '../hooks/useWorkflowAdmin';

// Komponent Chat Interface
const ChatInterface: React.FC<{
  session: WorkflowCreationSession;
  onSendMessage: (message: string) => void;
  loading: boolean;
}> = ({ session, onSendMessage, loading }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Konwertuj conversation history na chat messages
  useEffect(() => {
    const chatMessages: ChatMessage[] = session.conversationHistory.map(
      (msg, index) => {
        const isUser = msg.startsWith('User:');
        return {
          id: `msg_${index}`,
          sender: isUser ? 'user' : 'assistant',
          content: isUser ? msg.substring(6) : msg.substring(11),
          timestamp: new Date(),
          type: 'message',
        };
      }
    );
    setMessages(chatMessages);
  }, [session.conversationHistory]);

  const handleSend = () => {
    if (message.trim() && !loading) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900 border'
                  }`}
                >
                  <div className="text-sm font-medium mb-1">
                    {msg.sender === 'user' ? 'You' : 'AI Assistant'}
                  </div>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2 border">
                  <div className="flex items-center space-x-2">
                    <div className="animate-pulse flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                    <span className="text-sm text-gray-500">
                      AI is thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      <div className="p-4">
        <div className="flex space-x-2">
          <Textarea
            value={message}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setMessage(e.target.value)
            }
            onKeyPress={handleKeyPress}
            placeholder="Describe your workflow requirements..."
            className="flex-1 min-h-[60px] max-h-[120px]"
            disabled={loading}
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || loading}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Komponent Session Overview
const SessionOverview: React.FC<{
  session: WorkflowCreationSession;
}> = ({ session }) => {
  const progressSteps = [
    { key: 'basic_info', label: 'Basic Info', icon: MessageCircle },
    { key: 'steps_definition', label: 'Steps Definition', icon: GitBranch },
    { key: 'approvals_setup', label: 'Approvals Setup', icon: Users },
    { key: 'testing', label: 'Testing', icon: Zap },
    { key: 'finalization', label: 'Finalization', icon: CheckCircle },
  ];

  const currentStepIndex = progressSteps.findIndex(
    step => step.key === session.currentStep
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5" />
          <span>Workflow Progress</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Steps */}
        <div className="space-y-3">
          {progressSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;

            return (
              <div key={step.key} className="flex items-center space-x-3">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    isActive
                      ? 'bg-blue-500 text-white'
                      : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={`text-sm ${
                    isActive
                      ? 'font-medium text-blue-600'
                      : isCompleted
                        ? 'text-green-600'
                        : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Extracted Information */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Extracted Information</h4>

          {session.extractedInformation.projectType && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Project Type:</span>
              <Badge variant="outline">
                {session.extractedInformation.projectType}
              </Badge>
            </div>
          )}

          {session.extractedInformation.complexity && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Complexity:</span>
              <Badge variant="outline">
                {session.extractedInformation.complexity}
              </Badge>
            </div>
          )}

          {session.extractedInformation.stakeholders &&
            session.extractedInformation.stakeholders.length > 0 && (
              <div>
                <span className="text-sm text-gray-600 block mb-1">
                  Stakeholders:
                </span>
                <div className="flex flex-wrap gap-1">
                  {session.extractedInformation.stakeholders.map(
                    (stakeholder, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {stakeholder}
                      </Badge>
                    )
                  )}
                </div>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
};

// Główny komponent Admin Panel
const WorkflowAdminPanel: React.FC = () => {
  const {
    sessions,
    activeSession,
    activeSessionData,
    loading,
    error,
    startNewSession,
    sendMessage,
    generateWorkflow,
    setActiveSession,
    setError,
  } = useWorkflowAdmin();

  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionPrompt, setNewSessionPrompt] = useState('');

  const handleCreateSession = async () => {
    if (!newSessionTitle.trim()) return;

    try {
      await startNewSession(newSessionTitle, newSessionPrompt);
      setShowNewSessionDialog(false);
      setNewSessionTitle('');
      setNewSessionPrompt('');
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleSendMessage = async (message: string) => {
    if (activeSession) {
      await sendMessage(activeSession, message);
    }
  };

  const handleGenerateWorkflow = async () => {
    if (activeSession) {
      await generateWorkflow(activeSession);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Workflow Admin Panel
            </h1>
            <p className="text-gray-600">
              Create and manage AI-powered workflows
            </p>
          </div>

          <Button onClick={() => setShowNewSessionDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Workflow
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Sessions */}
        <div className="w-80 bg-white border-r flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900">Active Sessions</h2>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {sessions.map(session => (
                <Card
                  key={session.id}
                  className={`cursor-pointer transition-colors ${
                    activeSession === session.id
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveSession(session.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        variant={
                          session.status === 'active'
                            ? 'default'
                            : session.status === 'completed'
                              ? 'success'
                              : 'destructive'
                        }
                      >
                        {session.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {session.updatedAt.toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-medium text-sm mb-1">
                      {session.workflowInProgress.name || 'New Workflow'}
                    </h3>

                    <p className="text-xs text-gray-600">
                      Step: {session.currentStep.replace('_', ' ')}
                    </p>

                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {session.conversationHistory.length} messages
                    </div>
                  </CardContent>
                </Card>
              ))}

              {sessions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active sessions</p>
                  <p className="text-xs">
                    Create a new workflow to get started
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Panel */}
        <div className="flex-1 flex">
          {activeSessionData ? (
            <>
              {/* Chat Interface */}
              <div className="flex-1 flex flex-col">
                <div className="bg-white border-b px-6 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold">
                        {activeSessionData.workflowInProgress.name ||
                          'New Workflow'}
                      </h2>
                      <p className="text-sm text-gray-600">
                        Current step:{' '}
                        {activeSessionData.currentStep.replace('_', ' ')}
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      {activeSessionData.currentStep === 'testing' && (
                        <Button
                          onClick={handleGenerateWorkflow}
                          disabled={loading}
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Generate Workflow
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 bg-gray-50">
                  <ChatInterface
                    session={activeSessionData}
                    onSendMessage={handleSendMessage}
                    loading={loading}
                  />
                </div>
              </div>

              {/* Right Sidebar - Session Details */}
              <div className="w-80 bg-gray-50 border-l overflow-auto">
                <div className="p-4 space-y-4">
                  <SessionOverview session={activeSessionData} />

                  {activeSessionData.workflowInProgress.steps &&
                    activeSessionData.workflowInProgress.steps.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">
                            Workflow Preview
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {activeSessionData.workflowInProgress.steps.map(
                              (step, index) => (
                                <div
                                  key={index}
                                  className="text-xs p-2 bg-white rounded border"
                                >
                                  <div className="font-medium">{step.name}</div>
                                  <div className="text-gray-600">
                                    {step.description}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                </div>
              </div>
            </>
          ) : (
            // Empty state
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Brain className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-600 mb-2">
                  Select or Create a Workflow
                </h2>
                <p className="text-gray-500 mb-4">
                  Choose an active session or start creating a new workflow
                </p>
                <Button onClick={() => setShowNewSessionDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Workflow
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="m-4 border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-800">
            {error}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="ml-2 text-red-600 hover:text-red-800"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* New Session Dialog */}
      {showNewSessionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create New Workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Workflow Title
                </label>
                <Input
                  value={newSessionTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewSessionTitle(e.target.value)
                  }
                  placeholder="e.g., E-commerce Platform Workflow"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Initial Description (Optional)
                </label>
                <Textarea
                  value={newSessionPrompt}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNewSessionPrompt(e.target.value)
                  }
                  placeholder="Describe your project and workflow requirements..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowNewSessionDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateSession}
                  disabled={!newSessionTitle.trim() || loading}
                >
                  {loading ? 'Creating...' : 'Create Workflow'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default WorkflowAdminPanel;
