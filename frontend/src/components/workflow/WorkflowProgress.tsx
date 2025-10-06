/**
 * Workflow Progress Component
 * Shows current progress and extracted information for workflow creation
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Separator,
} from '../ui/basic-components';
import {
  MessageCircle,
  GitBranch,
  Users,
  Zap,
  CheckCircle,
  Brain,
} from 'lucide-react';

interface WorkflowCreationSession {
  id: string;
  chatSessionId: string;
  status: 'active' | 'completed' | 'cancelled';
  workflowInProgress: any;
  currentStep: string;
  conversationHistory: string[];
  extractedInformation: {
    projectType?: string;
    complexity?: string;
    stakeholders?: string[];
    estimatedDuration?: string;
    requiredApprovals?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowProgressProps {
  session: WorkflowCreationSession;
}

export default function WorkflowProgress({ session }: WorkflowProgressProps) {
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
                  {React.createElement(Icon, { className: 'h-4 w-4' })}
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

          {session.extractedInformation.estimatedDuration && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Duration:</span>
              <Badge variant="outline">
                {session.extractedInformation.estimatedDuration}
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

          {session.extractedInformation.requiredApprovals &&
            session.extractedInformation.requiredApprovals.length > 0 && (
              <div>
                <span className="text-sm text-gray-600 block mb-1">
                  Required Approvals:
                </span>
                <div className="flex flex-wrap gap-1">
                  {session.extractedInformation.requiredApprovals.map(
                    (approval, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {approval}
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
}
