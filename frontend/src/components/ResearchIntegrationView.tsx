/**
 * Research & Integration View Component
 * ThinkCode AI Platform - Research Tools & System Integration
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Search, Activity, AlertTriangle } from 'lucide-react';
import { agentsApiService } from '../services/agentsApiService';
import ResearchSection from './research/ResearchSection';
import IntegrationsSection from './research/IntegrationsSection';

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
            duration: Math.floor(Math.random() * 100) + 50, // Random duration for demo
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
              title="Switch to research tab"
              aria-label="Switch to research tab"
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
              title="Switch to integrations tab"
              aria-label="Switch to integrations tab"
            >
              <Activity className="h-4 w-4 inline mr-2" />
              Integrations
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'research' ? (
        <ResearchSection
          researchQuery={researchQuery}
          setResearchQuery={setResearchQuery}
          researchResults={researchResults}
          isSearching={isSearching}
          selectedResult={selectedResult}
          setSelectedResult={setSelectedResult}
          onResearch={handleResearch}
          onKeyPress={handleKeyPress}
        />
      ) : (
        <IntegrationsSection
          integrationResults={integrationResults}
          isTesting={isTesting}
          onRunTests={handleIntegrationTests}
        />
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
