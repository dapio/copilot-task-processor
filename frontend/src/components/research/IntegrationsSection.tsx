/**
 * Integrations Section Component
 * Handles system integration testing and results display
 */

import React from 'react';
import {
  Activity,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';

interface IntegrationTestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  duration?: number;
  details?: any;
}

interface IntegrationsSectionProps {
  integrationResults: IntegrationTestResult[];
  isTesting: boolean;
  onRunTests: () => void;
}

export default function IntegrationsSection({
  integrationResults,
  isTesting,
  onRunTests,
}: IntegrationsSectionProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'text-green-600 bg-green-100';
      case 'fail':
        return 'text-red-600 bg-red-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return React.createElement(CheckCircle, { className: 'h-4 w-4' });
      case 'fail':
        return React.createElement(AlertTriangle, { className: 'h-4 w-4' });
      case 'warning':
        return React.createElement(AlertTriangle, { className: 'h-4 w-4' });
      default:
        return React.createElement(Clock, { className: 'h-4 w-4' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Integration Test Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              System Integration Tests
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Test connections to external services and internal components
            </p>
          </div>

          <button
            onClick={onRunTests}
            disabled={isTesting}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            title="Run integration tests"
            aria-label="Run integration tests"
          >
            {isTesting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Activity className="h-4 w-4" />
            )}
            <span>{isTesting ? 'Running...' : 'Run Tests'}</span>
          </button>
        </div>
      </div>

      {/* Integration Results */}
      {integrationResults.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Test Results
              </h3>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>
                    {integrationResults.filter(r => r.status === 'pass').length}{' '}
                    Passed
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    {integrationResults.filter(r => r.status === 'fail').length}{' '}
                    Failed
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-yellow-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    {
                      integrationResults.filter(r => r.status === 'warning')
                        .length
                    }{' '}
                    Warnings
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-3">
              {integrationResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg ${
                    result.status === 'pass'
                      ? 'border-green-200 bg-green-50'
                      : result.status === 'fail'
                      ? 'border-red-200 bg-red-50'
                      : 'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-lg ${getStatusColor(
                          result.status
                        )}`}
                      >
                        {getStatusIcon(result.status)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {result.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {result.message}
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-sm text-gray-500">
                      {result.duration && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{result.duration}ms</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {result.details && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {integrationResults.length === 0 && !isTesting && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Tests Run Yet
          </h3>
          <p className="text-gray-600">
            Click the &quot;Run Tests&quot; button above to start system
            integration testing.
          </p>
        </div>
      )}
    </div>
  );
}
