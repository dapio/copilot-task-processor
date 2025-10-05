/**
 * Knowledge Base Manager Component
 * Interface do zarządzania feedami wiedzy dla agentów
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  knowledgeBaseService,
  KnowledgeFeed,
  Document,
} from '../services/knowledge-base.service';

// 📊 **Statistics Interface**
interface KnowledgeStats {
  totalFeeds: number;
  totalDocuments: number;
  activeFeeds: number;
  feedsByType: Record<string, number>;
  documentsByType: Record<string, number>;
  recentActivity: Array<{
    action: string;
    feedId: string;
    feedName: string;
    timestamp: Date;
  }>;
}

// 🔍 **Search Results Interface**
interface SearchResults {
  documents: Document[];
  totalFound: number;
  searchContext: string;
}

// 📝 **Form Data Interfaces**
interface CreateFeedForm {
  name: string;
  description: string;
  type: 'global' | 'agent-specific' | 'departmental';
  agentIds: string[];
  department: string;
  priority: 'low' | 'medium' | 'high';
}

interface AddDocumentForm {
  title: string;
  type: 'manual' | 'specification' | 'guide' | 'policy' | 'code-example';
  content: string;
  tags: string;
  author: string;
  department: string;
}

/**
 * 🧠 Knowledge Base Manager Component
 */
export const KnowledgeBaseManager: React.FC = () => {
  // 📊 State Management
  const [activeTab, setActiveTab] = useState<
    'overview' | 'feeds' | 'search' | 'create'
  >('overview');
  const [feeds, setFeeds] = useState<KnowledgeFeed[]>([]);
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 📝 Form State
  const [createFeedForm, setCreateFeedForm] = useState<CreateFeedForm>({
    name: '',
    description: '',
    type: 'global',
    agentIds: [],
    department: '',
    priority: 'medium',
  });

  const [addDocumentForm, setAddDocumentForm] = useState<AddDocumentForm>({
    title: '',
    type: 'guide',
    content: '',
    tags: '',
    author: '',
    department: '',
  });

  const [selectedFeedId, setSelectedFeedId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // 🔄 **Data Loading**
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [feedsList, statsData] = await Promise.all([
        knowledgeBaseService.listAllFeeds(),
        knowledgeBaseService.getKnowledgeStats(),
      ]);

      setFeeds(feedsList);
      setStats(statsData);
    } catch (err) {
      setError(
        `Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 🔍 **Search Handler**
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const results = await knowledgeBaseService.searchRelevantKnowledge(
        searchQuery,
        undefined,
        { maxResults: 20, minRelevance: 0.2 }
      );
      setSearchResults(results);
    } catch (err) {
      setError(
        `Search failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  // 📝 **Create Feed Handler**
  const handleCreateFeed = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

      try {
        const feedData = {
          name: createFeedForm.name,
          description: createFeedForm.description,
          type: createFeedForm.type,
          agentIds:
            createFeedForm.type === 'agent-specific'
              ? createFeedForm.agentIds
              : undefined,
          department:
            createFeedForm.type === 'departmental'
              ? createFeedForm.department
              : undefined,
          content: {
            documents: [],
            codeSnippets: [],
            processes: [],
            tools: [],
          },
          metadata: {
            lastUpdated: new Date(),
            version: '1.0.0',
            tags: [],
            priority: createFeedForm.priority,
            isActive: true,
          },
        };

        const result = await knowledgeBaseService.createFeed(feedData);

        if (result.success) {
          await loadData();
          setCreateFeedForm({
            name: '',
            description: '',
            type: 'global',
            agentIds: [],
            department: '',
            priority: 'medium',
          });
          setActiveTab('feeds');
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(
          `Failed to create feed: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      } finally {
        setLoading(false);
      }
    },
    [createFeedForm, loadData]
  );

  // 📄 **Add Document Handler**
  const handleAddDocument = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedFeedId) {
        setError('Please select a feed first');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const documentData = {
          title: addDocumentForm.title,
          type: addDocumentForm.type,
          content: addDocumentForm.content,
          format: 'markdown' as const,
          tags: addDocumentForm.tags
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean),
          author: addDocumentForm.author,
          department: addDocumentForm.department,
        };

        const result = await knowledgeBaseService.addDocumentToFeed(
          selectedFeedId,
          documentData
        );

        if (result.success) {
          await loadData();
          setAddDocumentForm({
            title: '',
            type: 'guide',
            content: '',
            tags: '',
            author: '',
            department: '',
          });
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(
          `Failed to add document: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      } finally {
        setLoading(false);
      }
    },
    [selectedFeedId, addDocumentForm, loadData]
  );

  // 🎨 **Render Methods**
  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Total Feeds
        </h3>
        <p className="text-3xl font-bold text-blue-600">
          {stats?.totalFeeds || 0}
        </p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Active Feeds
        </h3>
        <p className="text-3xl font-bold text-green-600">
          {stats?.activeFeeds || 0}
        </p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Total Documents
        </h3>
        <p className="text-3xl font-bold text-purple-600">
          {stats?.totalDocuments || 0}
        </p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Global Feeds
        </h3>
        <p className="text-3xl font-bold text-orange-600">
          {stats?.feedsByType?.global || 0}
        </p>
      </div>
    </div>
  );

  const renderFeeds = () => (
    <div className="space-y-6">
      {feeds.map(feed => (
        <div key={feed.id} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {feed.name}
              </h3>
              <p className="text-gray-600">{feed.description}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    feed.type === 'global'
                      ? 'bg-blue-100 text-blue-800'
                      : feed.type === 'agent-specific'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-green-100 text-green-800'
                  }`}
                >
                  {feed.type}
                </span>
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    feed.metadata.priority === 'high'
                      ? 'bg-red-100 text-red-800'
                      : feed.metadata.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {feed.metadata.priority} priority
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {feed.content.documents.length} documents
              </p>
              <p className="text-sm text-gray-500">v{feed.metadata.version}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-2">Recent Documents</h4>
            <div className="space-y-2">
              {feed.content.documents.slice(0, 3).map(doc => (
                <div key={doc.id} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{doc.title}</span>
                  <span className="text-xs text-gray-500">{doc.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSearch = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex space-x-4">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search knowledge base..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading || !searchQuery.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {searchResults && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            Search Results ({searchResults.totalFound} found)
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {searchResults.searchContext}
          </p>

          <div className="space-y-4">
            {searchResults.documents.map(doc => (
              <div key={doc.id} className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium text-gray-900">{doc.title}</h4>
                <p className="text-sm text-gray-600">
                  {doc.type} • {doc.author}
                </p>
                <p className="text-sm text-gray-700 mt-2">
                  {doc.content.substring(0, 200)}...
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  {doc.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {doc.relevanceScore && (
                    <span className="text-xs text-blue-600">
                      Relevance: {Math.round(doc.relevanceScore * 100)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderCreate = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Create Feed Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Create New Feed</h3>
        <form onSubmit={handleCreateFeed} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Feed Name
            </label>
            <input
              type="text"
              value={createFeedForm.name}
              onChange={e =>
                setCreateFeedForm(prev => ({ ...prev, name: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={createFeedForm.description}
              onChange={e =>
                setCreateFeedForm(prev => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Feed Type
            </label>
            <select
              value={createFeedForm.type}
              onChange={e =>
                setCreateFeedForm(prev => ({
                  ...prev,
                  type: e.target.value as
                    | 'global'
                    | 'agent-specific'
                    | 'departmental',
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="global">Global (All Agents)</option>
              <option value="agent-specific">Agent Specific</option>
              <option value="departmental">Departmental</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={createFeedForm.priority}
              onChange={e =>
                setCreateFeedForm(prev => ({
                  ...prev,
                  priority: e.target.value as 'low' | 'medium' | 'high',
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Feed'}
          </button>
        </form>
      </div>

      {/* Add Document Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Add Document</h3>
        <form onSubmit={handleAddDocument} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Feed
            </label>
            <select
              value={selectedFeedId}
              onChange={e => setSelectedFeedId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Choose a feed...</option>
              {feeds.map(feed => (
                <option key={feed.id} value={feed.id}>
                  {feed.name} ({feed.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Title
            </label>
            <input
              type="text"
              value={addDocumentForm.title}
              onChange={e =>
                setAddDocumentForm(prev => ({ ...prev, title: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Type
            </label>
            <select
              value={addDocumentForm.type}
              onChange={e =>
                setAddDocumentForm(prev => ({
                  ...prev,
                  type: e.target.value as
                    | 'manual'
                    | 'specification'
                    | 'guide'
                    | 'policy'
                    | 'code-example',
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="guide">Guide</option>
              <option value="manual">Manual</option>
              <option value="specification">Specification</option>
              <option value="policy">Policy</option>
              <option value="code-example">Code Example</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              value={addDocumentForm.content}
              onChange={e =>
                setAddDocumentForm(prev => ({
                  ...prev,
                  content: e.target.value,
                }))
              }
              rows={8}
              placeholder="Enter document content in Markdown format..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={addDocumentForm.tags}
              onChange={e =>
                setAddDocumentForm(prev => ({ ...prev, tags: e.target.value }))
              }
              placeholder="react, typescript, best-practices"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Author
            </label>
            <input
              type="text"
              value={addDocumentForm.author}
              onChange={e =>
                setAddDocumentForm(prev => ({
                  ...prev,
                  author: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !selectedFeedId}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : 'Add Document'}
          </button>
        </form>
      </div>
    </div>
  );

  // 🎨 **Main Render**
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Knowledge Base Management
          </h1>
          <p className="text-gray-600 mt-2">
            Zarządzaj feedami wiedzy dla agentów AI w Twojej organizacji
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { key: 'overview', label: '📊 Overview', count: null },
              { key: 'feeds', label: '📚 Feeds', count: feeds.length },
              { key: 'search', label: '🔍 Search', count: null },
              { key: 'create', label: '➕ Create', count: null },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.key
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'feeds' && renderFeeds()}
          {activeTab === 'search' && renderSearch()}
          {activeTab === 'create' && renderCreate()}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseManager;
