/**
 * File Upload Area Component
 * Handles file drag-and-drop and selection for document analysis
 */

import React, { useRef, useCallback } from 'react';
import {
  Upload,
  File,
  FileText,
  Code,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/basic-components';

interface UploadedFile {
  file: File;
  id: string;
  status: 'uploading' | 'ready' | 'analyzing' | 'completed' | 'error';
  progress?: number;
  analysis?: any;
}

interface FileUploadAreaProps {
  uploadedFiles: UploadedFile[];
  onFileUpload: (files: FileList | null) => void;
  onRemoveFile: (fileId: string) => void;
}

export default function FileUploadArea({
  uploadedFiles,
  onFileUpload,
  onRemoveFile,
}: FileUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      onFileUpload(e.dataTransfer.files);
    },
    [onFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Get file type icon
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return React.createElement(FileText, {
          className: 'h-5 w-5 text-red-500',
        });
      case 'doc':
      case 'docx':
        return React.createElement(FileText, {
          className: 'h-5 w-5 text-blue-500',
        });
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'py':
      case 'java':
      case 'cpp':
      case 'c':
      case 'cs':
        return React.createElement(Code, {
          className: 'h-5 w-5 text-green-500',
        });
      default:
        return React.createElement(File, {
          className: 'h-5 w-5 text-gray-500',
        });
    }
  };

  // Get status badge
  const getStatusBadge = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return (
          <div className="flex items-center space-x-1 text-blue-600 text-sm">
            {React.createElement(RefreshCw, {
              className: 'h-3 w-3 animate-spin',
            })}
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
            {React.createElement(RefreshCw, {
              className: 'h-3 w-3 animate-spin',
            })}
            <span>Analyzing</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center space-x-1 text-green-600 text-sm">
            {React.createElement(CheckCircle, { className: 'h-3 w-3' })}
            <span>Completed</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center space-x-1 text-red-600 text-sm">
            {React.createElement(AlertTriangle, { className: 'h-3 w-3' })}
            <span>Error</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {React.createElement(Upload, { className: 'h-5 w-5' })}
          <span>Document Upload</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
          onClick={handleFileSelect}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          aria-label="Upload files by clicking or dragging"
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium text-gray-700">
            Drop files here or click to select
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Supports PDF, DOC, DOCX, and code files
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.cs,.html,.css,.json,.xml,.md"
            onChange={e => onFileUpload(e.target.files)}
            className="hidden"
            aria-label="Select files to upload"
            title="Select files to upload"
          />
        </div>

        {/* File List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">
              Uploaded Files ({uploadedFiles.length})
            </h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {uploadedFiles.map(file => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    {getFileIcon(file.file.name)}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {file.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    {getStatusBadge(file.status)}
                  </div>
                  <Button
                    onClick={() => onRemoveFile(file.id)}
                    size="sm"
                    variant="outline"
                    className="ml-2 text-red-600 hover:text-red-700"
                    aria-label={`Remove ${file.file.name}`}
                  >
                    {React.createElement(Trash2, { className: 'h-4 w-4' })}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
