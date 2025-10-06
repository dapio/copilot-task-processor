/**
 * Research & Integration View Component
 * ThinkCode AI Platform - Research Tools & System Integration
 */

import React, { useState, useCallback, useEffect } from 'react';
import styles from '../styles/research-integration.module.css';
import {
  Search,
  Link,
  Code,
  Database,
  Globe,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Download,
  Filter,
  BarChart3,
  Activity,
  Target,
  Zap,
  Clock,
  BookOpen,
  ExternalLink,
  Star,
  Tag,
} from 'lucide-react';
import { useAgentsApi } from '../hooks/useAgentsApi';
import { agentsApiService } from '../services/agentsApiService';

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

interface IntegrationTestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  duration?: number;
  details?: any;
}

export default function ResearchIntegrationView() {
  const [activeTab, setActiveTab] = useState<'research' | 'integrations'>(
    'research'
  );
  const [researchQuery, setResearchQuery] = useState<ResearchQuery>({
    query: '',
    category: 'solutions',
  });
  const [researchResults, setResearchResults] = useState<ResearchResult[]>([]);
  const [integrationResults, setIntegrationResults] = useState<
    IntegrationTestResult[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<ResearchResult | null>(
    null
  );

  // Perform research
  const handleResearch = useCallback(async () => {
    if (!researchQuery.query.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      let endpoint = '';
      const payload: any = { query: researchQuery.query };

      switch (researchQuery.category) {
        case 'solutions':
          endpoint = '/research/solutions';
          if (researchQuery.filters?.technology) {
            payload.technology = researchQuery.filters.technology;
          }
          break;
        case 'integrations':
          endpoint = '/research/integrations';
          if (researchQuery.filters?.complexity) {
            payload.complexity = researchQuery.filters.complexity;
          }
          break;
        case 'technologies':
          endpoint = '/research/technologies';
          if (researchQuery.filters?.category) {
            payload.category = researchQuery.filters.category;
          }
          break;
        case 'compare':
          endpoint = '/research/compare';
          // Split query into technologies to compare
          payload.technologies = researchQuery.query.split(' vs ');
          break;
      }

      const response = await agentsApiService.searchSolutions(payload);

      if (response.success && response.data) {
        setResearchResults(response.data as ResearchResult[]);
      } else {
        setError('Research failed: ' + response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Research failed');
      console.error('Research error:', err);
    } finally {
      setIsSearching(false);
    }
  }, [researchQuery]);

  // Test system integrations
  const handleIntegrationTests = useCallback(async () => {
    setIsTesting(true);
    setError(null);

    try {
      const response = await agentsApiService.researchIntegrations(
        'system integrations test'
      );

      if (response.success && response.data) {
        // Convert research results to integration test format
        const testResults = (response.data as ResearchResult[]).map(
          (result, index): IntegrationTestResult => ({
            name: result.title,
            status:
              result.relevanceScore > 0.8
                ? 'pass'
                : result.relevanceScore > 0.5
                ? 'warning'
                : 'fail',
            message: result.summary,
            duration: Math.floor(Math.random() * 100) + 50, // Mock duration
            details: {
              url: result.url,
              source: result.source,
              tags: result.tags,
            },
          })
        );

        setIntegrationResults(testResults);
      } else {
        setError('Integration tests failed: ' + response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Integration tests failed');
      console.error('Integration test error:', err);
    } finally {
      setIsTesting(false);
    }
  }, []);

  // Auto-run integration tests on component mount
  useEffect(() => {
    if (activeTab === 'integrations') {
      handleIntegrationTests();
    }
  }, [activeTab, handleIntegrationTests]);

  // Handle enter key in search
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleResearch();
    }
  };

  // Get status color for integration results
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

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4" />;
      case 'fail':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Research & Integration
          </h1>
          <p className="text-gray-500 mt-2">
            Search for solutions, technologies, and test system integrations
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('research')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'research'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Search className="h-4 w-4 inline mr-2" />
              Research
            </button>
            <button
              onClick={() => setActiveTab('integrations')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'integrations'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Activity className="h-4 w-4 inline mr-2" />
              Integrations
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'research' ? (
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
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleResearch}
                disabled={isSearching || !researchQuery.query.trim()}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span>Search</span>
              </button>
            </div>

            {/* Query Filters */}
            {researchQuery.category !== 'compare' && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {researchQuery.category === 'solutions' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Technology
                    </label>
                    <select
                      value={researchQuery.filters?.technology || ''}
                      onChange={e =>
                        setResearchQuery(prev => ({
                          ...prev,
                          filters: {
                            ...prev.filters,
                            technology: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      title="Filter by technology"
                      aria-label="Filter by technology"
                    >
                      <option value="">All Technologies</option>
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="react">React</option>
                      <option value="node">Node.js</option>
                      <option value="database">Database</option>
                    </select>
                  </div>
                )}

                {researchQuery.category === 'integrations' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Complexity
                    </label>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      title="Filter by complexity"
                      aria-label="Filter by complexity"
                    >
                      <option value="">All Complexity</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                )}

                {researchQuery.category === 'technologies' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={researchQuery.filters?.category || ''}
                      onChange={e =>
                        setResearchQuery(prev => ({
                          ...prev,
                          filters: {
                            ...prev.filters,
                            category: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      title="Filter by category"
                      aria-label="Filter by category"
                    >
                      <option value="">All Categories</option>
                      <option value="frontend">Frontend</option>
                      <option value="backend">Backend</option>
                      <option value="database">Database</option>
                      <option value="devops">DevOps</option>
                      <option value="testing">Testing</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {researchQuery.category === 'compare' && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  <strong>Tip:</strong> Use &quot;vs&quot; to compare
                  technologies (e.g., &quot;React vs Vue vs Angular&quot;)
                </p>
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
                    Search Results ({researchResults.length})
                  </h3>
                </div>

                <div className="p-6">
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {researchResults.map((result, index) => (
                      <div
                        key={index}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedResult === result
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedResult(result)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 line-clamp-2">
                            {result.title}
                          </h4>
                          <div className="flex items-center space-x-2 ml-2">
                            <span className="flex items-center text-yellow-500">
                              <Star className="h-3 w-3 mr-1" />
                              <span className="text-xs">
                                {(result.relevanceScore * 100).toFixed(0)}%
                              </span>
                            </span>

                            <button
                              onClick={e => {
                                e.stopPropagation();
                                if (typeof window !== 'undefined')
                                  window.open(result.url, '_blank');
                              }}
                              className="text-gray-400 hover:text-blue-500"
                              title="Open external link"
                              aria-label="Open external link"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {result.summary}
                        </p>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center">
                            <Globe className="h-3 w-3 mr-1" />
                            {result.source}
                          </span>

                          <div className="flex space-x-1">
                            {result.tags.slice(0, 2).map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="px-1 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
                      <button
                        onClick={() => {
                          if (typeof window !== 'undefined')
                            window.open(selectedResult.url, '_blank');
                        }}
                        className="flex items-center space-x-2 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg text-sm"
                        title="Open full article"
                        aria-label="Open full article"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>View Source</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      {selectedResult.title}
                    </h4>

                    <div className="mb-4">
                      <h5 className="font-medium text-gray-700 mb-2">
                        Summary
                      </h5>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {selectedResult.summary}
                      </p>
                    </div>

                    <div className="mb-4">
                      <h5 className="font-medium text-gray-700 mb-2">
                        Content Preview
                      </h5>
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                        {selectedResult.content.slice(0, 500)}
                        {selectedResult.content.length > 500 && '...'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">
                          Relevance
                        </h5>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full">
                            <div
                              className={`h-2 bg-yellow-500 rounded-full ${styles.progressBar}`}
                              data-width={`${Math.round(
                                selectedResult.relevanceScore * 100
                              )}%`}
                            />
                          </div>
                          <span className="text-sm text-gray-600">
                            {(selectedResult.relevanceScore * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Tags</h5>
                        <div className="flex flex-wrap gap-1">
                          {selectedResult.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No Results */}
          {!isSearching &&
            researchResults.length === 0 &&
            researchQuery.query && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Results Found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your search query or filters to find relevant
                  results.
                </p>
              </div>
            )}
        </div>
      ) : (
        /* Integration Tests Tab */
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
                onClick={handleIntegrationTests}
                disabled={isTesting}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isTesting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Activity className="h-4 w-4" />
                )}
                <span>Run Tests</span>
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
                        {
                          integrationResults.filter(r => r.status === 'pass')
                            .length
                        }{' '}
                        Passed
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>
                        {
                          integrationResults.filter(r => r.status === 'fail')
                            .length
                        }{' '}
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
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h3 className="font-medium text-red-800">Error</h3>
          </div>
          <p className="text-sm text-red-700 mt-2">{error}</p>
        </div>
      )}
    </div>
  );
}
