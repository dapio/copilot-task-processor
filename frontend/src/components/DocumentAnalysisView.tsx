/**
 * Document Analysis View Component (Refactored)
 * ThinkCode AI Platform - Document Processing & Analysis
 */

import React, { useState, useCallback } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { useBackendApi } from '../hooks/useBackendApi';
import {
  DocumentAnalysisRequest,
  createDocumentAnalysisRequest,
} from '../services/backendApiService';
import { Button, Alert, AlertDescription } from './ui/basic-components';
import FileUploadArea from './document-analysis/FileUploadArea';
import AnalysisOptionsPanel from './document-analysis/AnalysisOptionsPanel';
import AnalysisResults from './document-analysis/AnalysisResults';
import TaskGeneration from './document-analysis/TaskGeneration';

interface UploadedFile {
  file: File;
  id: string;
  status: 'uploading' | 'ready' | 'analyzing' | 'completed' | 'error';
  progress?: number;
  analysis?: any;
}

interface AnalysisOptions {
  extractText: boolean;
  analyzeStructure: boolean;
  detectKeywords: boolean;
  summarize: boolean;
  generateInsights: boolean;
  analysisDepth: 'shallow' | 'medium' | 'deep';
}

export default function DocumentAnalysisView() {
  const {
    connection: connectionState,
    documentAnalysis: analysisState,
    taskGeneration: taskGenerationState,
    analyzeDocuments,
    generateTasks,
    checkConnection,
  } = useBackendApi();

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptions>({
    extractText: true,
    analyzeStructure: true,
    detectKeywords: true,
    summarize: false,
    generateInsights: false,
    analysisDepth: 'medium',
  });

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

  // Handle document analysis
  const handleAnalyzeDocuments = useCallback(async () => {
    const filesToAnalyze = uploadedFiles
      .filter(f => f.status === 'ready')
      .map(f => f.file);

    if (filesToAnalyze.length === 0) return;

    const request = createDocumentAnalysisRequest(filesToAnalyze, {
      includeMetadata: analysisOptions.analyzeStructure,
      extractKeywords: analysisOptions.detectKeywords,
      generateSummary: analysisOptions.summarize,
    });

    try {
      await analyzeDocuments(request);
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
      requirements: analysisState.result.overallAnalysis?.recommendations || [],
      technologies: analysisState.result.overallAnalysis?.commonKeywords || [],
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

  // Handle task actions
  const handleTaskAction = useCallback(
    async (taskId: string, action: 'process' | 'download' | 'delete') => {
      switch (action) {
        case 'process':
          try {
            // Note: This requires a proper task object, not just taskId
            // await processTask({ task: taskObject });
          } catch (error) {
            console.error('Task processing failed:', error);
          }
          break;
        case 'download':
          // Handle download logic
          console.log('Downloading task:', taskId);
          break;
        case 'delete':
          // Handle delete logic
          console.log('Deleting task:', taskId);
          break;
      }
    },
    []
  );

  const readyFiles = uploadedFiles.filter(f => f.status === 'ready');
  const hasAnalysisResults = analysisState.result !== null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Document Analysis
              </h1>
              <p className="text-gray-600 mt-2">
                Upload, analyze, and generate tasks from your documents
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={checkConnection}
                variant="outline"
                className="flex items-center space-x-2"
                disabled={connectionState.isLoading}
                aria-label="Test backend connection"
              >
                {connectionState.isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Activity className="h-4 w-4" />
                )}
                <span>Test Connection</span>
              </Button>
            </div>
          </div>

          {/* Connection Status */}
          {connectionState.error && (
            <Alert className="mt-4">
              <AlertDescription>
                Backend connection error: {connectionState.error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* File Upload */}
            <FileUploadArea
              uploadedFiles={uploadedFiles}
              onFileUpload={handleFileUpload}
              onRemoveFile={removeFile}
            />

            {/* Analysis Options */}
            <AnalysisOptionsPanel
              options={analysisOptions}
              onChange={setAnalysisOptions}
            />

            {/* Analysis Actions */}
            {readyFiles.length > 0 && (
              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleAnalyzeDocuments}
                  disabled={analysisState.isAnalyzing}
                  className="flex items-center space-x-2"
                >
                  {analysisState.isAnalyzing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Activity className="h-4 w-4" />
                  )}
                  <span>Analyze Documents ({readyFiles.length})</span>
                </Button>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Analysis Results */}
            <AnalysisResults
              results={null} // TODO: Convert DocumentAnalysisResult to AnalysisResult
              isLoading={analysisState.isAnalyzing}
            />

            {/* Task Generation */}
            <TaskGeneration
              tasks={null} // TODO: Convert TaskGenerationResult to GeneratedTask[]
              onGenerateTasks={handleGenerateTasks}
              onTaskAction={handleTaskAction}
              isGenerating={taskGenerationState.isGenerating}
              hasAnalysisResults={hasAnalysisResults}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
