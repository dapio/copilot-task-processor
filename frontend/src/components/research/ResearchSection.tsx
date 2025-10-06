/**
 * Research Section Component
 * Handles research queries and results display
 */

import React from 'react';
import {
  Search,
  Globe,
  RefreshCw,
  Eye,
  Download,
  Filter,
  ExternalLink,
  Star,
  Tag,
} from 'lucide-react';

interface ResearchQuery {
  query: string;
  category: 'solutions' | 'integrations' | 'technologies' | 'compare';
  filters?: {
    technology?: string;
    complexity?: 'low' | 'medium' | 'high';
    category?: string;
  };
}

interface ResearchResult {
  title: string;
  url: string;
  content: string;
  summary: string;
  relevanceScore: number;
  source: string;
  tags: string[];
  createdAt?: string;
}

interface ResearchSectionProps {
  researchQuery: ResearchQuery;
  setResearchQuery: (
    query: ResearchQuery | ((prev: ResearchQuery) => ResearchQuery)
  ) => void;
  researchResults: ResearchResult[];
  isSearching: boolean;
  selectedResult: ResearchResult | null;
  setSelectedResult: (result: ResearchResult | null) => void;
  onResearch: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export default function ResearchSection({
  researchQuery,
  setResearchQuery,
  researchResults,
  isSearching,
  selectedResult,
  setSelectedResult,
  onResearch,
  onKeyPress,
}: ResearchSectionProps) {
  return (
    <div className="space-y-6">
      {/* Research Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Research Query
          </h2>
          <div className="flex items-center space-x-2">
            <select
              value={researchQuery.category}
              onChange={e =>
                setResearchQuery(prev => ({
                  ...prev,
                  category: e.target.value as any,
                }))
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              title="Select research category"
              aria-label="Select research category"
            >
              <option value="solutions">Solutions</option>
              <option value="integrations">Integrations</option>
              <option value="technologies">Technologies</option>
              <option value="compare">Compare</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Enter your research query..."
              value={researchQuery.query}
              onChange={e =>
                setResearchQuery(prev => ({
                  ...prev,
                  query: e.target.value,
                }))
              }
              onKeyPress={onKeyPress}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Research query input"
            />
          </div>

          <button
            onClick={onResearch}
            disabled={isSearching || !researchQuery.query.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            title="Start research"
            aria-label="Start research"
          >
            {isSearching ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span>{isSearching ? 'Searching...' : 'Research'}</span>
          </button>
        </div>

        {/* Filters */}
        {researchQuery.category !== 'compare' && (
          <div className="mt-4 flex items-center space-x-4">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Filters:</span>

            {researchQuery.category === 'solutions' && (
              <select
                value={researchQuery.filters?.technology || ''}
                onChange={e =>
                  setResearchQuery(prev => ({
                    ...prev,
                    filters: { ...prev.filters, technology: e.target.value },
                  }))
                }
                className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                aria-label="Filter by technology"
              >
                <option value="">All Technologies</option>
                <option value="react">React</option>
                <option value="nodejs">Node.js</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
              </select>
            )}

            {researchQuery.category === 'integrations' && (
              <select
                value={researchQuery.filters?.complexity || ''}
                onChange={e =>
                  setResearchQuery(prev => ({
                    ...prev,
                    filters: {
                      ...prev.filters,
                      complexity: e.target.value as any,
                    },
                  }))
                }
                className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                aria-label="Filter by complexity"
              >
                <option value="">All Complexity</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            )}

            {researchQuery.category === 'technologies' && (
              <select
                value={researchQuery.filters?.category || ''}
                onChange={e =>
                  setResearchQuery(prev => ({
                    ...prev,
                    filters: { ...prev.filters, category: e.target.value },
                  }))
                }
                className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                aria-label="Filter by category"
              >
                <option value="">All Categories</option>
                <option value="frontend">Frontend</option>
                <option value="backend">Backend</option>
                <option value="database">Database</option>
                <option value="devops">DevOps</option>
              </select>
            )}
          </div>
        )}
      </div>

      {/* Research Results */}
      {researchResults.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Results List */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Research Results ({researchResults.length})
              </h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {researchResults.map((result, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedResult(result)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedResult === result ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {result.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {result.summary}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Globe className="h-3 w-3 mr-1" />
                          {result.source}
                        </span>
                        <span className="flex items-center">
                          <Star className="h-3 w-3 mr-1" />
                          {Math.round(result.relevanceScore * 100)}%
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <Eye className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  {result.tags && result.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {result.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Selected Result Detail */}
          {selectedResult && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Result Details
                  </h3>
                  <div className="flex items-center space-x-2">
                    <a
                      href={selectedResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="Open in new tab"
                      aria-label="Open result in new tab"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="Download result"
                      aria-label="Download result"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 max-h-96 overflow-y-auto">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {selectedResult.title}
                </h4>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Relevance Score</span>
                    <span>
                      {Math.round(selectedResult.relevanceScore * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`bg-blue-600 h-2 rounded-full ${
                        selectedResult.relevanceScore > 0.8
                          ? 'w-4/5'
                          : selectedResult.relevanceScore > 0.6
                          ? 'w-3/5'
                          : selectedResult.relevanceScore > 0.4
                          ? 'w-2/5'
                          : 'w-1/5'
                      }`}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 mb-2">Summary</h5>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {selectedResult.summary}
                  </p>
                </div>

                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 mb-2">
                    Content Preview
                  </h5>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {selectedResult.content.substring(0, 300)}...
                  </p>
                </div>

                {selectedResult.tags && selectedResult.tags.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Tags</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedResult.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {researchResults.length === 0 && !isSearching && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Results Yet
          </h3>
          <p className="text-gray-600">
            Enter a research query above to start searching for solutions,
            technologies, and integrations.
          </p>
        </div>
      )}
    </div>
  );
}
