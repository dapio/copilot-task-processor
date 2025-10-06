import { OpenAI } from 'openai';
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';
import { promises as fs } from 'fs';

// Global type for Express Multer
declare global {
  namespace Express {
    namespace Multer {
      interface File {}
    }
  }
}

interface DocumentAnalysis {
  featuresCount: number;
  complexityScore: number;
  estimatedWeeks: number;
  requirements: string[];
  userStories: string[];
  technicalSpecs: string[];
}

interface JiraTask {
  id: string;
  title: string;
  description: string;
  type: 'Story' | 'Task' | 'Epic' | 'Bug';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  estimatedHours: number;
  assignee?: string;
  labels: string[];
  acceptanceCriteria: string[];
}

/**
 * Document Processor with AI Analysis
 */
export class DocumentProcessor {
  private readonly openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Analyze documents and generate tasks
   */
  public async analyzeDocuments(files: any[]): Promise<{
    analysis: DocumentAnalysis;
    tasks: JiraTask[];
  }> {
    // Extract text from all documents
    const documents = await Promise.all(
      files.map(file => this.extractTextFromFile(file))
    );

    const combinedText = documents.join('\n\n');

    // AI analysis
    const analysis = await this.analyzeWithAI(combinedText);
    const tasks = await this.generateTasksFromAnalysis(analysis, combinedText);

    return { analysis, tasks };
  }

  private async extractTextFromFile(file: any): Promise<string> {
    const fileContent = await fs.readFile(file.path);

    switch (file.mimetype) {
      case 'application/pdf': {
        const pdfData = await pdfParse(fileContent);
        return pdfData.text;
      }

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
        const docxResult = await mammoth.extractRawText({
          buffer: fileContent,
        });
        return docxResult.value;
      }

      case 'text/plain':
      case 'text/markdown':
        return fileContent.toString('utf-8');

      default:
        throw new Error(`Unsupported file type: ${file.mimetype}`);
    }
  }

  private async analyzeWithAI(text: string): Promise<DocumentAnalysis> {
    const prompt = `
Analyze this project documentation and provide structured analysis:

DOCUMENT CONTENT:
${text}

Please analyze and provide JSON response with:
1. featuresCount: Number of distinct features identified
2. complexityScore: 1-10 scale of technical complexity
3. estimatedWeeks: Estimated development weeks
4. requirements: Array of functional requirements
5. userStories: Array of user stories found or derived
6. technicalSpecs: Array of technical specifications

Focus on identifying:
- User-facing features
- Technical components
- Integration requirements
- UI/UX elements
- Business logic
- Data models
- API endpoints

Respond with valid JSON only.
`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No analysis received from AI');

    try {
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse AI analysis: ${error}`);
    }
  }

  private async generateTasksFromAnalysis(
    analysis: DocumentAnalysis,
    originalText: string
  ): Promise<JiraTask[]> {
    const prompt = `
Based on this project analysis, generate detailed Jira tasks:

ANALYSIS:
${JSON.stringify(analysis, null, 2)}

ORIGINAL DOCUMENTATION:
${originalText}

Generate tasks as JSON array with each task having:
- id: unique identifier
- title: clear, actionable title
- description: detailed description with context
- type: "Story", "Task", "Bug", or "Epic"
- priority: "High", "Medium", or "Low"
- estimatedHours: realistic hour estimate (1-40)
- dependencies: array of task IDs this depends on
- acceptanceCriteria: array of specific acceptance criteria

Create tasks for:
1. UI/Frontend components
2. Backend APIs and services  
3. Database models and migrations
4. Integration points
5. Testing requirements
6. Documentation updates
7. DevOps/deployment tasks

Make tasks specific, actionable, and properly sized (not too big or small).
Ensure logical dependencies between tasks.
Include comprehensive acceptance criteria.

Respond with valid JSON array only.
`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 4000,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No tasks generated from AI');

    try {
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse AI-generated tasks: ${error}`);
    }
  }
}
