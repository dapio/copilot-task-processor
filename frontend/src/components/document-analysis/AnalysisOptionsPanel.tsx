/**
 * Analysis Options Component
 * Configure settings for document analysis
 */

import React from 'react';
import { Settings, Filter } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/basic-components';

interface AnalysisOptions {
  extractText: boolean;
  analyzeStructure: boolean;
  detectKeywords: boolean;
  summarize: boolean;
  generateInsights: boolean;
  analysisDepth: 'shallow' | 'medium' | 'deep';
}

interface AnalysisOptionsProps {
  options: AnalysisOptions;
  onChange: (options: AnalysisOptions) => void;
}

export default function AnalysisOptionsPanel({
  options,
  onChange,
}: AnalysisOptionsProps) {
  const handleOptionChange = (
    key: keyof AnalysisOptions,
    value: boolean | string
  ) => {
    onChange({
      ...options,
      [key]: value,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Analysis Options</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Analysis Features */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Analysis Features
          </h4>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="extract-text"
                checked={options.extractText}
                onChange={e =>
                  handleOptionChange('extractText', e.target.checked)
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="extract-text" className="text-sm">
                Extract Text Content
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="analyze-structure"
                checked={options.analyzeStructure}
                onChange={e =>
                  handleOptionChange('analyzeStructure', e.target.checked)
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="analyze-structure" className="text-sm">
                Analyze Document Structure
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="detect-keywords"
                checked={options.detectKeywords}
                onChange={e =>
                  handleOptionChange('detectKeywords', e.target.checked)
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="detect-keywords" className="text-sm">
                Detect Keywords & Entities
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="summarize"
                checked={options.summarize}
                onChange={e =>
                  handleOptionChange('summarize', e.target.checked)
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="summarize" className="text-sm">
                Generate Summary
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="generate-insights"
                checked={options.generateInsights}
                onChange={e =>
                  handleOptionChange('generateInsights', e.target.checked)
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="generate-insights" className="text-sm">
                Generate AI Insights
              </label>
            </div>
          </div>
        </div>

        {/* Analysis Depth */}
        <div className="space-y-2">
          <label
            htmlFor="analysis-depth"
            className="text-sm font-medium text-gray-700"
          >
            Analysis Depth
          </label>
          <select
            id="analysis-depth"
            value={options.analysisDepth}
            onChange={e => handleOptionChange('analysisDepth', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="shallow">Shallow - Quick overview</option>
            <option value="medium">Medium - Standard analysis</option>
            <option value="deep">Deep - Comprehensive analysis</option>
          </select>
        </div>

        {/* Analysis Info */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Deep analysis provides more detailed insights
            but takes longer to complete. Shallow analysis is recommended for
            quick document previews.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
