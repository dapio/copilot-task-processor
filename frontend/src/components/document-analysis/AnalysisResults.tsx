/**
 * Analysis Results Component
 * Display analysis results and insights
 */

import React from 'react';
import {
  BarChart3,
  FileText,
  Tag,
  Lightbulb,
  Clock,
  CheckCircle,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '../ui/basic-components';

interface AnalysisResult {
  summary: string;
  keywords: string[];
  structure: {
    sections: number;
    pages: number;
    wordCount: number;
  };
  insights: string[];
  processingTime: number;
}

interface AnalysisResultsProps {
  results: AnalysisResult[] | null;
  isLoading: boolean;
}

export default function AnalysisResults({
  results,
  isLoading,
}: AnalysisResultsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Analysis Results</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Analyzing documents...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!results || results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Analysis Results</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No analysis results yet</p>
            <p className="text-sm mt-1">
              Upload and analyze documents to see results
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {results.map((result, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Document {index + 1} Analysis</span>
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>{result.processingTime}ms</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Summary
              </h4>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                {result.summary}
              </p>
            </div>

            {/* Structure */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Document Structure
              </h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {result.structure.sections}
                  </div>
                  <div className="text-sm text-gray-600">Sections</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {result.structure.pages}
                  </div>
                  <div className="text-sm text-gray-600">Pages</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {result.structure.wordCount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Words</div>
                </div>
              </div>
            </div>

            {/* Keywords */}
            {result.keywords.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Tag className="h-4 w-4 mr-2" />
                  Key Terms
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.keywords.slice(0, 10).map((keyword, keyIndex) => (
                    <Badge key={keyIndex} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                  {result.keywords.length > 10 && (
                    <Badge variant="outline">
                      +{result.keywords.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Insights */}
            {result.insights.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  AI Insights
                </h4>
                <ul className="space-y-2">
                  {result.insights.map((insight, insightIndex) => (
                    <li
                      key={insightIndex}
                      className="text-sm text-gray-700 bg-yellow-50 p-2 rounded border-l-4 border-yellow-400"
                    >
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
