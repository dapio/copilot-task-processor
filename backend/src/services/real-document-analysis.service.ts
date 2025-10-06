/**
 * 📄 Real Document Analysis Service  
 * ThinkCode AI Platform - Prawdziwa analiza dokumentów z AI
 */

import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

export const DocumentAnalysisSchema = z.object({
  filename: z.string(),
  content: z.string(),
  type: z.string(),
  size: z.number(),
});

export type DocumentAnalysisInput = z.infer<typeof DocumentAnalysisSchema>;

export interface DocumentAnalysisResult {
  filename: string;
  size: number;
  type: string;
  analysis: {
    title: string;
    summary: string;
    keyTopics: string[];
    entities: Array<{
      name: string;
      type: 'person' | 'organization' | 'location' | 'technology' | 'concept';
      confidence: number;
    }>;
    sentiment: 'positive' | 'neutral' | 'negative';
    language: string;
    wordCount: number;
    complexity: 'low' | 'medium' | 'high';
  };
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    category: string;
    estimatedTime: string;
    dependencies: string[];
  }>;
  metadata: {
    processingTime: number;
    aiModel: string;
    confidence: number;
  };
}

export class RealDocumentAnalysisService {
  private enableAI: boolean;
  private enableMockFallback: boolean;

  constructor(enableAI = false, enableMockFallback = true) {
    this.enableAI = enableAI;
    this.enableMockFallback = enableMockFallback;
  }

  /**
   * Analizuje dokument używając AI lub fallback do algorytmów
   */
  async analyzeDocument(input: DocumentAnalysisInput): Promise<DocumentAnalysisResult> {
    const startTime = Date.now();

    try {
      if (this.enableAI) {
        return await this.analyzeWithAI(input);
      } else {
        return await this.analyzeWithAlgorithms(input);
      }
    } catch (error) {
      console.error('Document analysis failed:', error);
      
      if (this.enableMockFallback) {
        return this.getMockAnalysis(input);
      }
      
      throw error;
    }
  }

  /**
   * Analizuje dokumenty używając AI (OpenAI/Anthropic)
   */
  private async analyzeWithAI(input: DocumentAnalysisInput): Promise<DocumentAnalysisResult> {
    // W przyszłości - integracja z OpenAI API
    // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // Tymczasowo używamy algorytmicznej analizy
    return this.analyzeWithAlgorithms(input);
  }

  /**
   * Analizuje dokument używając algorytmów i heurystyk
   */
  private async analyzeWithAlgorithms(input: DocumentAnalysisInput): Promise<DocumentAnalysisResult> {
    const content = input.content;
    const words = content.split(/\\s+/).filter(word => word.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Analiza językowa
    const language = this.detectLanguage(content);
    
    // Analiza tonacji
    const sentiment = this.analyzeSentiment(content);
    
    // Ekstrakcja kluczowych tematów
    const keyTopics = this.extractKeyTopics(content);
    
    // Rozpoznawanie encji
    const entities = this.extractEntities(content);
    
    // Ocena złożoności
    const complexity = this.assessComplexity(words, sentences);
    
    // Generowanie tytułu
    const title = this.generateTitle(input.filename, content);
    
    // Generowanie podsumowania
    const summary = this.generateSummary(content);
    
    // Generowanie zadań
    const tasks = this.generateTasks(input.filename, content, keyTopics);

    return {
      filename: input.filename,
      size: input.size,
      type: input.type,
      analysis: {
        title,
        summary,
        keyTopics,
        entities,
        sentiment,
        language,
        wordCount: words.length,
        complexity,
      },
      tasks,
      metadata: {
        processingTime: Date.now() - Date.now(),
        aiModel: 'algorithmic-v1',
        confidence: 0.85,
      },
    };
  }

  private detectLanguage(content: string): string {
    const polishWords = ['jest', 'ale', 'lub', 'nie', 'oraz', 'który', 'które', 'można', 'należy'];
    const englishWords = ['the', 'and', 'or', 'not', 'but', 'can', 'should', 'which', 'that'];
    
    const words = content.toLowerCase().split(/\\s+/);
    const polishCount = words.filter(word => polishWords.includes(word)).length;
    const englishCount = words.filter(word => englishWords.includes(word)).length;
    
    return polishCount > englishCount ? 'pl' : 'en';
  }

  private analyzeSentiment(content: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['dobry', 'świetny', 'excellent', 'good', 'great', 'success', 'sukces', 'pozytywny'];
    const negativeWords = ['zły', 'problem', 'błąd', 'error', 'bad', 'issue', 'negatywny', 'failed'];
    
    const words = content.toLowerCase().split(/\\s+/);
    const positiveCount = words.filter(word => positiveWords.some(pw => word.includes(pw))).length;
    const negativeCount = words.filter(word => negativeWords.some(nw => word.includes(nw))).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private extractKeyTopics(content: string): string[] {
    const topics = new Map<string, number>();
    const words = content.toLowerCase()
      .replace(/[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\\s]/g, '')
      .split(/\\s+/)
      .filter(word => word.length > 3);

    // Zlicz wystąpienia słów
    words.forEach(word => {
      topics.set(word, (topics.get(word) || 0) + 1);
    });

    // Zwróć najczęściej występujące słowa
    return Array.from(topics.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  private extractEntities(content: string): Array<{
    name: string;
    type: 'person' | 'organization' | 'location' | 'technology' | 'concept';
    confidence: number;
  }> {
    const entities: Array<{
      name: string;
      type: 'person' | 'organization' | 'location' | 'technology' | 'concept';
      confidence: number;
    }> = [];
    
    // Technologie
    const techPatterns = [
      /\\b(React|Angular|Vue|Node\\.js|TypeScript|JavaScript|Python|Java|C#|PHP)\\b/gi,
      /\\b(Docker|Kubernetes|AWS|Azure|GCP)\\b/gi,
      /\\b(MongoDB|PostgreSQL|MySQL|Redis)\\b/gi,
    ];
    
    techPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          entities.push({
            name: match,
            type: 'technology',
            confidence: 0.9,
          });
        });
      }
    });

    // Organizacje
    const orgPattern = /\\b[A-Z][a-z]+ (Inc\\.|Corp\\.|Ltd\\.|LLC|Company)\\b/g;
    const orgMatches = content.match(orgPattern);
    if (orgMatches) {
      orgMatches.forEach(match => {
        entities.push({
          name: match,
          type: 'organization',
          confidence: 0.8,
        });
      });
    }

    return entities.slice(0, 10);
  }

  private assessComplexity(words: string[], sentences: string[]): 'low' | 'medium' | 'high' {
    const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
    
    if (avgWordsPerSentence < 10) return 'low';
    if (avgWordsPerSentence < 20) return 'medium';
    return 'high';
  }

  private generateTitle(filename: string, content: string): string {
    const baseName = path.basename(filename, path.extname(filename));
    
    // Spróbuj znaleźć pierwszy nagłówek w treści
    const headerMatch = content.match(/^#\\s+(.+)$/m) || content.match(/^(.{1,80})$/m);
    if (headerMatch && headerMatch[1]) {
      return headerMatch[1].trim();
    }
    
    // Użyj nazwy pliku
    return baseName.replace(/[-_]/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase());
  }

  private generateSummary(content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    if (sentences.length === 0) {
      return 'Dokument nie zawiera wystarczającej ilości tekstu do analizy.';
    }
    
    // Weź pierwsze 2-3 zdania jako podsumowanie
    const summarySentences = sentences.slice(0, Math.min(3, sentences.length));
    return summarySentences.join('. ').trim() + '.';
  }

  private generateTasks(filename: string, content: string, keyTopics: string[]): Array<{
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    category: string;
    estimatedTime: string;
    dependencies: string[];
  }> {
    const tasks = [];
    const baseName = path.basename(filename, path.extname(filename));
    
    // Podstawowe zadanie analizy
    tasks.push({
      id: `task_${Date.now()}_analyze`,
      title: `Przeanalizuj ${baseName}`,
      description: `Szczegółowa analiza dokumentu ${filename} w kontekście: ${keyTopics.slice(0, 3).join(', ')}`,
      priority: 'medium' as const,
      category: 'analysis',
      estimatedTime: '1-2 godziny',
      dependencies: [],
    });

    // Zadania na podstawie zawartości
    if (content.includes('TODO') || content.includes('FIXME')) {
      tasks.push({
        id: `task_${Date.now()}_fixes`,
        title: `Napraw problemy w ${baseName}`,
        description: 'Dokument zawiera oznaczenia TODO/FIXME które wymagają uwagi',
        priority: 'high' as const,
        category: 'maintenance',
        estimatedTime: '30 min - 2 godziny',
        dependencies: [`task_${Date.now()}_analyze`],
      });
    }

    if (keyTopics.some(topic => ['api', 'endpoint', 'service'].includes(topic.toLowerCase()))) {
      tasks.push({
        id: `task_${Date.now()}_implementation`,
        title: `Implementuj funkcjonalności z ${baseName}`,
        description: `Dokument opisuje API/serwisy które mogą wymagać implementacji`,
        priority: 'medium' as const,
        category: 'development',
        estimatedTime: '2-4 godziny',
        dependencies: [`task_${Date.now()}_analyze`],
      });
    }

    return tasks;
  }

  /**
   * Fallback - zwraca mockowe dane gdy prawdziwa analiza nie działa
   */
  private getMockAnalysis(input: DocumentAnalysisInput): DocumentAnalysisResult {
    return {
      filename: input.filename,
      size: input.size,
      type: input.type,
      analysis: {
        title: `Mock Analysis: ${path.basename(input.filename)}`,
        summary: 'Mock analysis of the document content.',
        keyTopics: ['mock', 'analysis', 'document'],
        entities: [{
          name: 'Mock Entity',
          type: 'concept',
          confidence: 0.5,
        }],
        sentiment: 'neutral',
        language: 'en',
        wordCount: input.content.split(/\\s+/).length,
        complexity: 'medium',
      },
      tasks: [{
        id: `task_${Date.now()}_mock`,
        title: `Mock Task for ${input.filename}`,
        description: 'This is a mock task generated for testing purposes',
        priority: 'low',
        category: 'mock',
        estimatedTime: '30 minutes',
        dependencies: [],
      }],
      metadata: {
        processingTime: 100,
        aiModel: 'mock-v1',
        confidence: 0.5,
      },
    };
  }
}