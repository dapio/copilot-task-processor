/**
 * Document Analysis View Component
 * ThinkCode AI Platform - Document Processing & Analysis
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  Upload,
  File,
  FileText,
  Code,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Eye,
  Trash2,
  FolderOpen,
  Search,
  Filter,
  BarChart3,
  Clock,
  Activity,
} from 'lucide-react';
import { useBackendApi } from '../hooks/useBackendApi';
import {
  DocumentAnalysisRequest,
  GeneratedTask,
  createDocumentAnalysisRequest,
} from '../services/backendApiService';

interface UploadedFile {
  file: File;
  id: string;
  status: 'uploading' | 'ready' | 'analyzing' | 'completed' | 'error';
  progress?: number;
  analysis?: any;
}

export default function DocumentAnalysisView() {
  const {
    connection: connectionState,
    documentAnalysis: analysisState,
    taskGeneration: taskGenerationState,
    analyzeDocuments,
    generateTasks,
    processTask,
    testIntegrations,
    checkConnection,
  } = useBackendApi();

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [analysisOptions, setAnalysisOptions] = useState({
    analysisType: 'code' as 'code' | 'documentation' | 'requirements',
    includeMetadata: true,
    extractKeywords: true,
    generateSummary: true,
  });
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'ready',
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  // Remove file
  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  // Analyze documents
  const handleAnalyzeDocuments = useCallback(async () => {
    const filesToAnalyze = uploadedFiles
      .filter(f => f.status === 'ready')
      .map(f => f.file);

    if (filesToAnalyze.length === 0) return;

    const request = createDocumentAnalysisRequest(
      filesToAnalyze,
      analysisOptions
    );

    try {
      await analyzeDocuments(request);

      // Update file statuses
      setUploadedFiles(prev =>
        prev.map(f => ({
          ...f,
          status: f.status === 'ready' ? 'completed' : f.status,
        }))
      );
    } catch (error) {
      console.error('Analysis failed:', error);
      setUploadedFiles(prev =>
        prev.map(f => ({
          ...f,
          status: f.status === 'ready' ? 'error' : f.status,
        }))
      );
    }
  }, [uploadedFiles, analysisOptions, analyzeDocuments]);

  // Generate tasks from analysis
  const handleGenerateTasks = useCallback(async () => {
    if (!analysisState.result) return;

    const projectContext = {
      name: 'Document Analysis Project',
      description: 'Generated from document analysis',
      requirements: analysisState.result.overallAnalysis.recommendations,
      technologies: analysisState.result.overallAnalysis.commonKeywords,
    };

    try {
      await generateTasks({
        projectContext,
        analysisData: analysisState.result,
        preferences: {
          taskGranularity: 'medium',
          includeEstimates: true,
          includePriorities: true,
        },
      });
    } catch (error) {
      console.error('Task generation failed:', error);
    }
  }, [analysisState.result, generateTasks]);

  // Get file type icon
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'py':
      case 'java':
      case 'cs':
      case 'cpp':
      case 'c':
        return <Code className="h-5 w-5 text-green-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get status badge
  const getStatusBadge = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return (
          <div className="flex items-center space-x-1 text-blue-600 text-sm">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Uploading</span>
          </div>
        );
      case 'ready':
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
            Ready
          </span>
        );
      case 'analyzing':
        return (
          <div className="flex items-center space-x-1 text-blue-600 text-sm">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Analyzing</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center space-x-1 text-green-600 text-sm">
            <CheckCircle className="h-3 w-3" />
            <span>Completed</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center space-x-1 text-red-600 text-sm">
            <AlertTriangle className="h-3 w-3" />
            <span>Error</span>
          </div>
        );
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Document Analysis
          </h1>
          <p className="text-gray-500 mt-2">
            Upload and analyze documents to generate development tasks
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div
            className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm ${
              connectionState.isConnected
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                connectionState.isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span>
              {connectionState.isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <button
            onClick={checkConnection}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${connectionState.isLoading ? 'animate-spin' : ''}`}
            />
            <span>Test Connection</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Upload & Files */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Area */}
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-8">
            <div
              className="text-center cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDrop={e => {
                e.preventDefault();
                handleFileUpload(e.dataTransfer.files);
              }}
              onDragOver={e => e.preventDefault()}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Upload Documents
              </h3>
              <p className="text-gray-500 mb-4">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-gray-400">
                Supports: PDF, DOC, DOCX, TXT, MD, JS, TS, PY (Max 50MB each)
              </p>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.md,.js,.ts,.jsx,.tsx,.py,.java,.cs,.cpp,.c,.json"
                onChange={e => handleFileUpload(e.target.files)}
                className="hidden"
                title="Upload files for analysis"
                aria-label="Upload files for analysis"
              />
            </div>
          </div>

          {/* Analysis Options */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Analysis Options
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Analysis Type
                </label>
                <select
                  value={analysisOptions.analysisType}
                  onChange={e =>
                    setAnalysisOptions(prev => ({
                      ...prev,
                      analysisType: e.target.value as
                        | 'code'
                        | 'documentation'
                        | 'requirements',
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  title="Select analysis type"
                  aria-label="Select analysis type"
                >
                  <option value="code">Code Analysis</option>
                  <option value="documentation">Documentation Review</option>
                  <option value="requirements">Requirements Analysis</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Options
                </label>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={analysisOptions.includeMetadata}
                      onChange={e =>
                        setAnalysisOptions(prev => ({
                          ...prev,
                          includeMetadata: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Include Metadata
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={analysisOptions.extractKeywords}
                      onChange={e =>
                        setAnalysisOptions(prev => ({
                          ...prev,
                          extractKeywords: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Extract Keywords
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={analysisOptions.generateSummary}
                      onChange={e =>
                        setAnalysisOptions(prev => ({
                          ...prev,
                          generateSummary: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Generate Summary
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Uploaded Files ({uploadedFiles.length})
                  </h3>

                  <div className="flex space-x-2">
                    <button
                      onClick={handleAnalyzeDocuments}
                      disabled={
                        analysisState.isAnalyzing ||
                        uploadedFiles.every(f => f.status !== 'ready')
                      }
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {analysisState.isAnalyzing ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Activity className="h-4 w-4" />
                      )}
                      <span>Analyze Documents</span>
                    </button>

                    <button
                      onClick={() => setUploadedFiles([])}
                      className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Clear All</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-3">
                  {uploadedFiles.map(uploadedFile => (
                    <div
                      key={uploadedFile.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getFileIcon(uploadedFile.file.name)}
                        <div>
                          <p className="font-medium text-gray-900">
                            {uploadedFile.file.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {(uploadedFile.file.size / 1024 / 1024).toFixed(2)}{' '}
                            MB
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {getStatusBadge(uploadedFile.status)}

                        <button
                          onClick={() => removeFile(uploadedFile.id)}
                          className="text-gray-400 hover:text-red-500"
                          title="Remove file"
                          aria-label="Remove file"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          {/* Analysis Results */}
          {analysisState.result && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Analysis Results
                </h3>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {analysisState.result.overallAnalysis.totalFiles}
                    </p>
                    <p className="text-sm text-blue-800">Files Analyzed</p>
                  </div>

                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {
                        analysisState.result.overallAnalysis.commonKeywords
                          .length
                      }
                    </p>
                    <p className="text-sm text-green-800">Keywords Found</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Common Keywords
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysisState.result.overallAnalysis.commonKeywords
                      .slice(0, 8)
                      .map((keyword: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full"
                        >
                          {keyword}
                        </span>
                      ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Recommendations
                  </h4>
                  <div className="space-y-2">
                    {analysisState.result.overallAnalysis.recommendations
                      .slice(0, 3)
                      .map((rec: string, index: number) => (
                        <div key={index} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-600">{rec}</p>
                        </div>
                      ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerateTasks}
                  disabled={taskGenerationState.isGenerating}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {taskGenerationState.isGenerating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  <span>Generate Tasks</span>
                </button>
              </div>
            </div>
          )}

          {/* Generated Tasks */}
          {taskGenerationState.result && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Generated Tasks ({taskGenerationState.result.tasks.length})
                  </h3>
                  <span className="text-sm text-gray-500">
                    {taskGenerationState.result.metadata.totalEstimatedHours}{' '}
                    hours estimated
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {taskGenerationState.result.tasks.map(
                    (task: GeneratedTask) => (
                      <div
                        key={task.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedTasks.has(task.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          const newSelected = new Set(selectedTasks);
                          if (newSelected.has(task.id)) {
                            newSelected.delete(task.id);
                          } else {
                            newSelected.add(task.id);
                          }
                          setSelectedTasks(newSelected);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {task.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {task.description}
                            </p>

                            <div className="flex items-center space-x-4 mt-2">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  task.priority === 'high'
                                    ? 'bg-red-100 text-red-800'
                                    : task.priority === 'medium'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {task.priority} priority
                              </span>

                              <span className="text-xs text-gray-500 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {task.estimatedHours}h
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {(analysisState.error ||
            taskGenerationState.error ||
            connectionState.error) && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <h3 className="font-medium text-red-800">Error</h3>
              </div>
              <p className="text-sm text-red-700">
                {analysisState.error ||
                  taskGenerationState.error ||
                  connectionState.error}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
