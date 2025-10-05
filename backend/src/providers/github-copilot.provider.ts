/**
 * GitHub Copilot Provider - Główny provider AI dla ThinkCode Platform
 * Integracja z GitHub Copilot Chat API z zarządzaniem kontekstem
 */

import {
  IMLProvider,
  GenerationOptions,
  EmbeddingOptions,
  GenerationResult,
  EmbeddingResult,
  AnalysisResult,
  Result,
  MLError,
} from './ml-provider.interface';

export interface CopilotChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface CopilotContext {
  id: string;
  name: string;
  projectId?: string;
  agentId?: string;
  messages: CopilotChatMessage[];
  systemPrompt?: string;
  workspace?: {
    files: string[];
    activeFile?: string;
    selection?: { start: number; end: number };
  };
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CopilotChatOptions extends GenerationOptions {
  contextId?: string;
  includeWorkspace?: boolean;
  includeHistory?: boolean;
  maxHistoryMessages?: number;
  preserveContext?: boolean;
}

export class GitHubCopilotProvider implements IMLProvider {
  readonly name = 'github-copilot';
  readonly version = '1.0.0';

  private contexts: Map<string, CopilotContext> = new Map();
  private defaultContext: CopilotContext;
  private apiKey?: string;
  private endpoint: string;

  constructor(
    options: {
      apiKey?: string;
      endpoint?: string;
      defaultSystemPrompt?: string;
    } = {}
  ) {
    this.apiKey = options.apiKey || process.env.GITHUB_COPILOT_API_KEY;
    this.endpoint =
      options.endpoint || 'https://api.github.com/copilot/chat/completions';

    // Stwórz domyślny kontekst projektu
    this.defaultContext = {
      id: 'default-project-context',
      name: 'Project Context',
      messages: [],
      systemPrompt:
        options.defaultSystemPrompt || this.getDefaultSystemPrompt(),
      metadata: {
        type: 'project',
        persistent: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.contexts.set(this.defaultContext.id, this.defaultContext);
  }

  /**
   * Generuje tekst z użyciem GitHub Copilot Chat
   */
  async generateText(
    prompt: string,
    options: CopilotChatOptions = {}
  ): Promise<Result<GenerationResult, MLError>> {
    try {
      const context = await this.getOrCreateContext(options.contextId);

      // Dodaj wiadomość użytkownika do kontekstu
      const userMessage: CopilotChatMessage = {
        role: 'user',
        content: prompt,
        timestamp: new Date().toISOString(),
        metadata: {
          provider: 'github-copilot',
          options,
        },
      };

      if (options.preserveContext !== false) {
        context.messages.push(userMessage);
      }

      // Przygotuj historię konwersacji
      const messages = this.prepareMessages(context, options);

      // Wywołaj GitHub Copilot API
      const response = await this.callCopilotAPI(messages, options);

      if (!response.success) {
        return response;
      }

      const result = response.data;

      // Dodaj odpowiedź asystenta do kontekstu
      if (options.preserveContext !== false) {
        const assistantMessage: CopilotChatMessage = {
          role: 'assistant',
          content: result.text,
          timestamp: new Date().toISOString(),
          metadata: {
            provider: 'github-copilot',
            usage: result.usage,
          },
        };
        context.messages.push(assistantMessage);
        context.updatedAt = new Date();
      }

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COPILOT_GENERATION_ERROR',
          message: `GitHub Copilot generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
          retryable: true,
        },
      };
    }
  }

  /**
   * Generuje embeddings (fallback do OpenAI lub lokalnego modelu)
   */
  async generateEmbedding(
    text: string,
    options: EmbeddingOptions = {}
  ): Promise<Result<EmbeddingResult, MLError>> {
    // GitHub Copilot nie oferuje bezpośrednio embeddingów
    // Implementujemy fallback lub mock
    return {
      success: false,
      error: {
        code: 'EMBEDDINGS_NOT_SUPPORTED',
        message:
          'GitHub Copilot does not support embeddings generation. Use OpenAI provider for embeddings.',
        retryable: false,
      },
    };
  }

  /**
   * Analizuje dokument z użyciem GitHub Copilot
   */
  async analyzeDocument(
    content: string,
    options: CopilotChatOptions = {}
  ): Promise<Result<AnalysisResult, MLError>> {
    const analysisPrompt = `
Przeanalizuj następujący dokument i dostarczz szczegółową analizę:

${content}

Proszę o:
1. Podsumowanie treści
2. Ocenę złożożności (1-10)
3. Konkretne sugestie dotyczące ulepszeń
4. Ocenę pewności analizy (0-1)

Format odpowiedzi jako JSON:
{
  "summary": "...",
  "complexity": number,
  "suggestions": ["..."],
  "confidence": number
}`;

    const result = await this.generateText(analysisPrompt, options);

    if (!result.success) {
      return result;
    }

    try {
      // Próbuj sparsować JSON z odpowiedzi
      const jsonMatch = result.data.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      return {
        success: true,
        data: {
          summary: analysis.summary || 'No summary provided',
          complexity: analysis.complexity || 5,
          suggestions: analysis.suggestions || [],
          confidence: analysis.confidence || 0.7,
          metadata: {
            provider: 'github-copilot',
            originalResponse: result.data.text,
          },
        },
      };
    } catch (error) {
      // Fallback jeśli parsing JSON się nie powiedzie
      return {
        success: true,
        data: {
          summary: result.data.text.substring(0, 200) + '...',
          complexity: 5,
          suggestions: [
            'Review the document structure',
            'Consider adding more details',
          ],
          confidence: 0.5,
          metadata: {
            provider: 'github-copilot',
            parseError:
              error instanceof Error ? error.message : 'Unknown parsing error',
            originalResponse: result.data.text,
          },
        },
      };
    }
  }

  /**
   * Sprawdza stan zdrowia providera
   */
  async healthCheck(): Promise<
    Result<
      {
        status: 'healthy' | 'degraded' | 'unhealthy';
        details?: string | Record<string, any>;
      },
      MLError
    >
  > {
    try {
      // Sprawdź dostępność API
      if (!this.apiKey) {
        return {
          success: true,
          data: {
            status: 'degraded',
            details: {
              apiKey: 'missing',
              message: 'GitHub Copilot API key not configured',
              contextsCount: this.contexts.size,
              mockMode: true,
            },
          },
        };
      }

      // Prosty test API
      const testResult = await this.generateText('Test connection', {
        maxTokens: 10,
        preserveContext: false,
      });

      return {
        success: true,
        data: {
          status: testResult.success ? 'healthy' : 'unhealthy',
          details: {
            apiKey: 'configured',
            apiEndpoint: this.endpoint,
            contextsCount: this.contexts.size,
            testResult: testResult.success,
            mockMode: false,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: `GitHub Copilot health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
          retryable: true,
        },
      };
    }
  }

  /**
   * Sprawdza czy provider jest dostępny
   */
  async isAvailable(): Promise<boolean> {
    try {
      const health = await this.healthCheck();
      return (
        health.success &&
        (health.data.status === 'healthy' || health.data.status === 'degraded')
      );
    } catch {
      return false;
    }
  }

  /**
   * Zwraca listę wspieranych modeli
   */
  async getSupportedModels(): Promise<Result<string[], MLError>> {
    return {
      success: true,
      data: [
        'gpt-4',
        'gpt-4-turbo',
        'gpt-3.5-turbo',
        'copilot-codex',
        'copilot-chat',
      ],
    };
  }

  // === Context Management Methods ===

  /**
   * Tworzy nowy kontekst dla agenta lub projektu
   */
  async createContext(options: {
    name: string;
    projectId?: string;
    agentId?: string;
    systemPrompt?: string;
    parentContextId?: string;
  }): Promise<string> {
    const contextId = `context-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const parentContext = options.parentContextId
      ? this.contexts.get(options.parentContextId)
      : undefined;

    const context: CopilotContext = {
      id: contextId,
      name: options.name,
      projectId: options.projectId,
      agentId: options.agentId,
      messages: parentContext ? [...parentContext.messages] : [],
      systemPrompt: options.systemPrompt || this.getDefaultSystemPrompt(),
      metadata: {
        parentContextId: options.parentContextId,
        type: options.agentId ? 'agent' : 'project',
        persistent: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.contexts.set(contextId, context);
    return contextId;
  }

  /**
   * Pobiera kontekst
   */
  getContext(contextId: string): CopilotContext | undefined {
    return this.contexts.get(contextId);
  }

  /**
   * Aktualizuje kontekst
   */
  async updateContext(
    contextId: string,
    updates: Partial<CopilotContext>
  ): Promise<boolean> {
    const context = this.contexts.get(contextId);
    if (!context) {
      return false;
    }

    Object.assign(context, updates, { updatedAt: new Date() });
    return true;
  }

  /**
   * Usuwa kontekst
   */
  async deleteContext(contextId: string): Promise<boolean> {
    return this.contexts.delete(contextId);
  }

  /**
   * Listuje wszystkie konteksty
   */
  listContexts(filter?: {
    projectId?: string;
    agentId?: string;
  }): CopilotContext[] {
    const contexts = Array.from(this.contexts.values());

    if (!filter) {
      return contexts;
    }

    return contexts.filter(context => {
      if (filter.projectId && context.projectId !== filter.projectId) {
        return false;
      }
      if (filter.agentId && context.agentId !== filter.agentId) {
        return false;
      }
      return true;
    });
  }

  /**
   * Dodaje wiadomość do kontekstu
   */
  async addMessageToContext(
    contextId: string,
    message: Omit<CopilotChatMessage, 'timestamp'>
  ): Promise<boolean> {
    const context = this.contexts.get(contextId);
    if (!context) {
      return false;
    }

    const fullMessage: CopilotChatMessage = {
      ...message,
      timestamp: new Date().toISOString(),
    };

    context.messages.push(fullMessage);
    context.updatedAt = new Date();
    return true;
  }

  // === Private Methods ===

  private async getOrCreateContext(
    contextId?: string
  ): Promise<CopilotContext> {
    if (!contextId) {
      return this.defaultContext;
    }

    let context = this.contexts.get(contextId);
    if (!context) {
      // Stwórz nowy kontekst jako potomek domyślnego
      const newContextId = await this.createContext({
        name: `Auto-created context ${contextId}`,
        parentContextId: this.defaultContext.id,
      });
      context = this.contexts.get(newContextId)!;
    }

    return context;
  }

  private prepareMessages(
    context: CopilotContext,
    options: CopilotChatOptions
  ): CopilotChatMessage[] {
    const messages: CopilotChatMessage[] = [];

    // Dodaj system prompt
    if (context.systemPrompt) {
      messages.push({
        role: 'system',
        content: context.systemPrompt,
      });
    }

    // Dodaj historię konwersacji
    if (options.includeHistory !== false) {
      const maxHistory = options.maxHistoryMessages || 20;
      const recentMessages = context.messages.slice(-maxHistory);
      messages.push(...recentMessages);
    }

    // Dodaj informacje o workspace jeśli wymagane
    if (options.includeWorkspace && context.workspace) {
      const workspaceInfo = this.formatWorkspaceInfo(context.workspace);
      messages.push({
        role: 'system',
        content: `Current workspace context: ${workspaceInfo}`,
      });
    }

    return messages;
  }

  private async callCopilotAPI(
    messages: CopilotChatMessage[],
    options: CopilotChatOptions
  ): Promise<Result<GenerationResult, MLError>> {
    // W przypadku braku API key, użyj mock response
    if (!this.apiKey) {
      return this.getMockResponse(messages, options);
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'ThinkCode-AI-Platform/1.0',
        },
        body: JSON.stringify({
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          model: options.model || 'gpt-4',
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2000,
          top_p: options.topP || 1,
          frequency_penalty: options.frequencyPenalty || 0,
          presence_penalty: options.presencePenalty || 0,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid API response format');
      }

      return {
        success: true,
        data: {
          text: data.choices[0].message.content,
          usage: data.usage
            ? {
                promptTokens: data.usage.prompt_tokens,
                completionTokens: data.usage.completion_tokens,
                totalTokens: data.usage.total_tokens,
              }
            : undefined,
          metadata: {
            provider: 'github-copilot',
            model: data.model || 'gpt-4',
            finishReason: data.choices[0].finish_reason,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COPILOT_API_ERROR',
          message: `GitHub Copilot API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
          retryable: true,
        },
      };
    }
  }

  private getMockResponse(
    messages: CopilotChatMessage[],
    options: CopilotChatOptions
  ): Result<GenerationResult, MLError> {
    const lastMessage = messages[messages.length - 1];
    const prompt = lastMessage?.content || '';

    // Inteligentne mock responses based on prompt
    let mockText = '';

    if (prompt.toLowerCase().includes('test')) {
      mockText =
        '✅ GitHub Copilot mock provider is working correctly. This is a test response.';
    } else if (
      prompt.toLowerCase().includes('code') ||
      prompt.toLowerCase().includes('implement')
    ) {
      mockText = `// GitHub Copilot mock implementation
function solution() {
  // This is a mock response from GitHub Copilot Provider
  console.log("Implementation would be generated here");
  return "Mock result for: ${prompt.substring(0, 50)}...";
}`;
    } else if (
      prompt.toLowerCase().includes('analiz') ||
      prompt.toLowerCase().includes('review')
    ) {
      mockText = `📊 **Analiza (Mock Response)**

**Podsumowanie:** ${prompt.substring(0, 100)}...

**Kluczowe punkty:**
- Mock analysis point 1
- Mock analysis point 2  
- Mock analysis point 3

**Rekomendacje:**
- Consider implementing proper GitHub Copilot API integration
- Review the current mock implementation
- Test with real API when available`;
    } else {
      mockText = `🤖 **GitHub Copilot Response (Mock)**

Dla zapytania: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"

To jest mock response z GitHub Copilot Provider. W wersji produkcyjnej ta odpowiedź byłaby generowana przez rzeczywisty GitHub Copilot API.

**Kontekst:** ${messages.length} wiadomości w historii konwersacji.
**Provider:** GitHub Copilot (Mock Mode)
**Timestamp:** ${new Date().toISOString()}`;
    }

    return {
      success: true,
      data: {
        text: mockText,
        usage: {
          promptTokens: Math.floor(prompt.length / 4),
          completionTokens: Math.floor(mockText.length / 4),
          totalTokens: Math.floor((prompt.length + mockText.length) / 4),
        },
        metadata: {
          provider: 'github-copilot',
          mode: 'mock',
          model: 'gpt-4-mock',
          messagesInContext: messages.length,
        },
      },
    };
  }

  private formatWorkspaceInfo(workspace: CopilotContext['workspace']): string {
    if (!workspace) return 'No workspace context available';

    const info = [];
    if (workspace.files?.length) {
      info.push(
        `Files: ${workspace.files.slice(0, 5).join(', ')}${workspace.files.length > 5 ? '...' : ''}`
      );
    }
    if (workspace.activeFile) {
      info.push(`Active file: ${workspace.activeFile}`);
    }
    if (workspace.selection) {
      info.push(
        `Selection: lines ${workspace.selection.start}-${workspace.selection.end}`
      );
    }

    return info.join(', ');
  }

  private getDefaultSystemPrompt(): string {
    return `Jesteś zaawansowanym asystentem AI GitHub Copilot zintegrowanym z ThinkCode AI Platform. 

**Twoja rola:**
- Pomagasz w rozwoju oprogramowania i analizie kodu
- Działasz w kontekście projektów i workflow agentów
- Masz dostęp do pełnego kontekstu projektu i historii konwersacji
- Współpracujesz z innymi providerami AI w ramach centralnie sterowanego workflow

**Możliwości:**
- Generowanie i analiza kodu w różnych językach programowania
- Refactoring i optymalizacja kodu
- Debugowanie i rozwiązywanie problemów
- Dokumentacja i komentarze
- Architektura i design patterns
- Code review i sugestie ulepszeń

**Zasady:**
- Zawsze dostarczaj wysokiej jakości, czytelny kod
- Używaj najlepszych praktyk i wzorców projektowych
- Uwzględniaj kontekst projektu i poprzednie konwersacje
- Bądź precyzyjny i konkretny w swoich odpowiedziach
- W przypadku niepewności, pytaj o dodatkowe szczegóły

**Format odpowiedzi:**
- Używaj Markdown dla formatowania
- Zaznaczaj bloki kodu odpowiednimi językami
- Dostarczaj przykłady i wyjaśnienia
- Uwzględniaj aspekty bezpieczeństwa i wydajności

Aktualna data: ${new Date().toISOString().split('T')[0]}`;
  }
}

export default GitHubCopilotProvider;
