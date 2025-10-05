/**
 * Code Review Agent Component with Knowledge Integration
 * React komponent do integracji z Enhanced Code Review Agent
 */

import React, { useState } from 'react';
import { useAgentKnowledge } from '../hooks/useAgentKnowledge';
import {
  EnhancedCodeReviewAgent,
  CodeReviewContext,
  EnhancedReviewResult,
  createEnhancedCodeReviewAgent,
} from '../agents/enhanced-code-review.agent';

// 📝 **Component Props Interface**
interface CodeReviewAgentProps {
  codeSnippet: string;
  fileType?: string;
  framework?: string;
  author?: string;
  onReviewComplete: (result: EnhancedReviewResult) => void;
}

/**
 * 🤖 Code Review Agent with Knowledge Integration
 */
export const CodeReviewAgentWithKnowledge: React.FC<CodeReviewAgentProps> = ({
  codeSnippet,
  fileType = 'typescript',
  framework = 'react',
  author = 'current-user',
  onReviewComplete,
}) => {
  const agentKnowledge = useAgentKnowledge('code-review-agent-001');
  const [reviewing, setReviewing] = useState(false);
  const [lastResult, setLastResult] = useState<EnhancedReviewResult | null>(
    null
  );

  const performReview = async () => {
    setReviewing(true);

    try {
      const agent = createEnhancedCodeReviewAgent({
        id: 'code-review-agent-001',
        name: 'Enhanced Code Review Agent',
        type: 'code-analysis',
        capabilities: ['review', 'knowledge-integration'],
      });

      const context: CodeReviewContext = {
        codeSnippet,
        fileType,
        framework,
        author,
        reviewScope: 'all',
      };

      const result = await agent.performEnhancedReview(context);
      setLastResult(result);
      onReviewComplete(result);
    } catch (error) {
      console.error('Review failed:', error);
      const errorResult: EnhancedReviewResult = {
        success: false,
        error: `Review failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        knowledgeBasedSuggestions: [],
        institutionalGuidelines: [],
        complianceScore: 0,
        learningResources: [],
      };
      setLastResult(errorResult);
      onReviewComplete(errorResult);
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Enhanced Code Review with Knowledge Integration
        </h3>
        <p className="text-gray-600">
          AI-powered code review enhanced with institutional knowledge base
        </p>
      </div>

      {/* Knowledge Base Status */}
      {agentKnowledge.knowledgeSummary && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center space-x-2 mb-2">
            <svg
              className="h-5 w-5 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className="font-medium text-blue-900">
              Knowledge Base Connected
            </h4>
          </div>
          <div className="text-sm text-blue-800 space-y-1">
            <p>
              📚 {agentKnowledge.knowledgeSummary.documentCount} relevant
              documents available
            </p>
            <p>
              🎯 {agentKnowledge.knowledgeSummary.confidence}% confidence level
            </p>
            <p>
              🏷️ Top tags:{' '}
              {agentKnowledge.knowledgeSummary.topTags.slice(0, 3).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Available Feeds Info */}
      {agentKnowledge.availableFeeds.length > 0 && (
        <div className="bg-gray-50 rounded-md p-4">
          <h4 className="font-medium text-gray-900 mb-3">
            Available Knowledge Feeds
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {agentKnowledge.availableFeeds.map(feed => (
              <div key={feed.id} className="bg-white rounded border p-3">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-sm text-gray-900">
                    {feed.name}
                  </h5>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      feed.type === 'global'
                        ? 'bg-blue-100 text-blue-800'
                        : feed.type === 'agent-specific'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {feed.type}
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  {feed.content.documents.length} documents
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-center">
        <button
          onClick={performReview}
          disabled={reviewing || !codeSnippet.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          {reviewing ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Reviewing with Knowledge...</span>
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Start Enhanced Review</span>
            </>
          )}
        </button>
      </div>

      {/* Last Review Results */}
      {lastResult && (
        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-4">
            Latest Review Results
          </h4>

          {lastResult.success ? (
            <div className="space-y-4">
              {/* Compliance Score */}
              <div className="bg-gray-50 rounded-md p-4">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="font-medium text-gray-900">
                    Compliance Score
                  </h5>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      lastResult.complianceScore >= 80
                        ? 'bg-green-100 text-green-800'
                        : lastResult.complianceScore >= 60
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {lastResult.complianceScore}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      lastResult.complianceScore >= 80
                        ? 'bg-green-600'
                        : lastResult.complianceScore >= 60
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                    }`}
                    style={{ width: `${lastResult.complianceScore}%` }}
                  />
                </div>
              </div>

              {/* Knowledge-Based Suggestions */}
              {lastResult.knowledgeBasedSuggestions.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">
                    Knowledge-Based Suggestions
                  </h5>
                  <div className="space-y-3">
                    {lastResult.knowledgeBasedSuggestions
                      .slice(0, 5)
                      .map((suggestion, index) => (
                        <div
                          key={index}
                          className="bg-white border-l-4 border-blue-500 pl-4 py-2"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h6 className="font-medium text-sm text-gray-900">
                              {suggestion.issue}
                            </h6>
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                suggestion.category === 'security'
                                  ? 'bg-red-100 text-red-800'
                                  : suggestion.category === 'performance'
                                    ? 'bg-orange-100 text-orange-800'
                                    : suggestion.category === 'best-practice'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {suggestion.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">
                            {suggestion.suggestion}
                          </p>
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>Source: {suggestion.sourceDocument}</span>
                            <span>
                              Confidence:{' '}
                              {Math.round(suggestion.confidenceScore * 100)}%
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Learning Resources */}
              {lastResult.learningResources.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">
                    Recommended Learning Resources
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {lastResult.learningResources
                      .slice(0, 4)
                      .map((resource, index) => (
                        <div
                          key={index}
                          className="bg-white border rounded-md p-3"
                        >
                          <h6 className="font-medium text-sm text-gray-900 mb-1">
                            {resource.title}
                          </h6>
                          <p className="text-xs text-gray-600 mb-2">
                            {resource.type}
                          </p>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              Relevance: {Math.round(resource.relevance * 100)}%
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center space-x-2">
                <svg
                  className="h-5 w-5 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <h5 className="font-medium text-red-900">Review Failed</h5>
              </div>
              <p className="text-sm text-red-800 mt-2">{lastResult.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {agentKnowledge.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center space-x-2">
            <svg
              className="h-5 w-5 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <h5 className="font-medium text-red-900">Knowledge Base Error</h5>
          </div>
          <p className="text-sm text-red-800 mt-2">{agentKnowledge.error}</p>
          <button
            onClick={agentKnowledge.clearError}
            className="mt-2 text-sm text-red-700 hover:text-red-900 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading State */}
      {agentKnowledge.loading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center space-x-2 text-gray-600">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm">Loading knowledge base...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeReviewAgentWithKnowledge;
