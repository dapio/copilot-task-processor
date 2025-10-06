/**
 * Sessions List Component
 * Displays and manages workflow creation sessions
 */

import React from 'react';
import {
  Card,
  CardContent,
  Badge,
  ScrollArea,
  Button,
} from '../ui/basic-components';
import { Clock, Plus, MessageCircle } from 'lucide-react';

interface WorkflowCreationSession {
  id: string;
  chatSessionId: string;
  status: 'active' | 'completed' | 'cancelled';
  workflowInProgress: {
    name?: string;
    description?: string;
  };
  currentStep: string;
  conversationHistory: string[];
  extractedInformation: any;
  createdAt: Date;
  updatedAt: Date;
}

interface SessionsListProps {
  sessions: WorkflowCreationSession[];
  activeSession: string | null;
  onSelectSession: (sessionId: string) => void;
  onCreateNewSession: () => void;
}

export default function SessionsList({
  sessions,
  activeSession,
  onSelectSession,
  onCreateNewSession,
}: SessionsListProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="w-80 bg-white border-r flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Active Sessions</h2>
          <Button
            onClick={onCreateNewSession}
            size="sm"
            variant="outline"
            className="h-8"
          >
            <Plus className="h-3 w-3 mr-1" />
            New
          </Button>
        </div>
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
              onClick={() => onSelectSession(session.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={getStatusVariant(session.status)}>
                    {session.status}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {session.updatedAt.toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-medium text-sm mb-1">
                  {session.workflowInProgress.name || 'New Workflow'}
                </h3>

                <p className="text-xs text-gray-600 mb-2">
                  Step: {session.currentStep.replace('_', ' ')}
                </p>

                {session.workflowInProgress.description && (
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                    {session.workflowInProgress.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    {session.conversationHistory.length} messages
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {session.updatedAt.toLocaleTimeString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {sessions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No active sessions</p>
              <p className="text-xs">Create a new workflow to get started</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
