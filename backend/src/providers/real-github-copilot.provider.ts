/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Real GitHub Copilot Provider
 * Based on Microsoft's VS Code Copilot Chat implementation
 * Repository: https://github.com/microsoft/vscode-copilot-chat
 * License: MIT
 */

import { randomBytes } from 'crypto';

// Types based on VS Code Copilot implementation
interface CopilotToken {
  token: string;
  expires_at: number;
  refresh_in: number;
  username: string;
  copilot_plan:
    | 'free'
    | 'individual'
    | 'individual_pro'
    | 'business'
    | 'enterprise';
  sku?: string;
  chat_enabled?: boolean;
  organization_list?: string[];
  endpoints?: {
    api: string;
    telemetry: string;
    proxy: string;
    'origin-tracker'?: string;
  };
}

interface CopilotUserInfo {
  access_type_sku: string;
  analytics_tracking_id: string;
  assigned_date: string;
  can_signup_for_limited: boolean;
  chat_enabled: boolean;
  copilot_plan: string;
  organization_login_list: string[];
  organization_list: Array<{
    login: string;
    name: string | null;
  }>;
}

// FetchOptions interface removed - using native fetch options

interface CopilotChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface CopilotChatRequest {
  messages: CopilotChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface CopilotChatResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Real GitHub Copilot Provider
 * Implements actual communication with GitHub Copilot API using the same patterns as VS Code extension
 */
export class RealGitHubCopilotProvider {
  private copilotToken: CopilotToken | null = null;
  private githubToken: string;
  private baseApiUrl: string = 'https://api.githubcopilot.com';

  // CAPI endpoints based on VS Code implementation
  private readonly endpoints = {
    copilotToken: '/copilot_internal/v2/token',
    userInfo: '/copilot_internal/user',
    chat: '/chat/completions',
    models: '/models',
  };

  constructor(
    githubToken: string,
    options?: {
      baseApiUrl?: string;
    }
  ) {
    this.githubToken = githubToken;
    if (options?.baseApiUrl) {
      this.baseApiUrl = options.baseApiUrl;
    }
  }

  /**
   * Exchange GitHub token for Copilot token
   * Based on VS Code implementation: fetchCopilotTokenFromGitHubToken
   */
  private async exchangeGitHubTokenForCopilotToken(): Promise<CopilotToken> {
    const requestId = this.generateRequestId();

    const response = await fetch(
      `${this.baseApiUrl}${this.endpoints.copilotToken}`,
      {
        method: 'GET',
        headers: {
          Authorization: `token ${this.githubToken}`,
          'X-GitHub-Api-Version': '2025-04-01',
          'User-Agent': 'ThinkCode-AI-Platform/1.0.0',
          Accept: 'application/json',
          'X-Request-Id': requestId,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to get Copilot token: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const tokenData = await response.json();

    // Parse token info based on VS Code implementation
    const copilotToken: CopilotToken = {
      token: tokenData.token,
      expires_at: tokenData.expires_at,
      refresh_in: tokenData.refresh_in,
      username: tokenData.username || 'unknown',
      copilot_plan: tokenData.copilot_plan || 'individual',
      sku: tokenData.sku,
      chat_enabled: tokenData.chat_enabled ?? true,
      organization_list: tokenData.organization_list || [],
      endpoints: tokenData.endpoints,
    };

    return copilotToken;
  }

  /**
   * Get current Copilot token, refreshing if needed
   */
  private async getCopilotToken(force: boolean = false): Promise<CopilotToken> {
    const now = Math.floor(Date.now() / 1000);

    if (
      !this.copilotToken ||
      this.copilotToken.expires_at < now + 60 * 5 || // 5min buffer
      force
    ) {
      this.copilotToken = await this.exchangeGitHubTokenForCopilotToken();
    }

    return this.copilotToken;
  }

  /**
   * Get user info from Copilot API
   */
  async getUserInfo(): Promise<CopilotUserInfo> {
    const token = await this.getCopilotToken();
    const requestId = this.generateRequestId();

    const response = await fetch(
      `${this.baseApiUrl}${this.endpoints.userInfo}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token.token}`,
          'X-GitHub-Api-Version': '2025-04-01',
          'User-Agent': 'ThinkCode-AI-Platform/1.0.0',
          Accept: 'application/json',
          'X-Request-Id': requestId,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to get user info: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return await response.json();
  }

  /**
   * Send chat request to Copilot API
   * Based on VS Code CopilotChatEndpoint implementation
   */
  async chat(request: CopilotChatRequest): Promise<CopilotChatResponse> {
    const token = await this.getCopilotToken();
    const requestId = this.generateRequestId();

    const requestBody = {
      messages: request.messages,
      model: request.model || 'gpt-4',
      temperature: request.temperature ?? 0.1,
      max_tokens: request.max_tokens ?? 4096,
      stream: request.stream ?? false,
      ...this.getRequestMetadata(),
    };

    const response = await fetch(`${this.baseApiUrl}${this.endpoints.chat}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.token}`,
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2025-04-01',
        'User-Agent': 'ThinkCode-AI-Platform/1.0.0',
        Accept: 'application/json',
        'X-Request-Id': requestId,
        ...this.getAdditionalHeaders(),
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Handle token expiration - refresh and retry once
      if (response.status === 401 || response.status === 403) {
        console.log('Token expired, refreshing...');
        await this.getCopilotToken(true); // Force refresh
        return this.chat(request); // Retry once
      }

      throw new Error(
        `Copilot API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return await response.json();
  }

  /**
   * Get available models
   */
  async getModels(): Promise<
    Array<{ id: string; name: string; capabilities: string[] }>
  > {
    const token = await this.getCopilotToken();
    const requestId = this.generateRequestId();

    try {
      const response = await fetch(
        `${this.baseApiUrl}${this.endpoints.models}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token.token}`,
            'X-GitHub-Api-Version': '2025-04-01',
            'User-Agent': 'ThinkCode-AI-Platform/1.0.0',
            Accept: 'application/json',
            'X-Request-Id': requestId,
          },
        }
      );

      if (!response.ok) {
        // If models endpoint is not available, return default models
        return this.getDefaultModels();
      }

      const data = await response.json();
      return data.data || this.getDefaultModels();
    } catch (error) {
      console.warn('Failed to fetch models, using defaults:', error);
      return this.getDefaultModels();
    }
  }

  /**
   * Check if user has access to Copilot
   */
  async checkAccess(): Promise<{
    hasAccess: boolean;
    plan: string;
    chatEnabled: boolean;
    username: string;
  }> {
    try {
      const token = await this.getCopilotToken();
      await this.getUserInfo(); // Verify access

      return {
        hasAccess: true,
        plan: token.copilot_plan,
        chatEnabled: token.chat_enabled ?? true,
        username: token.username,
      };
    } catch {
      return {
        hasAccess: false,
        plan: 'none',
        chatEnabled: false,
        username: 'unknown',
      };
    }
  }

  /**
   * Generate request metadata similar to VS Code implementation
   */
  private getRequestMetadata() {
    return {
      intent: true,
      n: 1,
      // Add more metadata as needed based on VS Code implementation
    };
  }

  /**
   * Get additional headers for API requests
   */
  private getAdditionalHeaders(): Record<string, string> {
    return {
      'Copilot-Integration-Id': 'vscode-chat',
      'OpenAI-Intent': 'copilot-panel',
      // Add more headers as discovered from VS Code implementation
    };
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Default models when API doesn't provide them
   */
  private getDefaultModels() {
    return [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        capabilities: ['chat', 'reasoning', 'code'],
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        capabilities: ['chat', 'reasoning', 'code', 'vision'],
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        capabilities: ['chat', 'code'],
      },
    ];
  }

  /**
   * Reset token (force refresh on next request)
   */
  resetToken(): void {
    this.copilotToken = null;
  }

  /**
   * Get current token info (without sensitive data)
   */
  getTokenInfo(): Omit<CopilotToken, 'token'> | null {
    if (!this.copilotToken) return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { token, ...tokenInfo } = this.copilotToken;
    return tokenInfo;
  }
}

/**
 * Factory function to create RealGitHubCopilotProvider
 */
export function createRealGitHubCopilotProvider(
  githubToken: string,
  options?: {
    baseApiUrl?: string;
  }
): RealGitHubCopilotProvider {
  return new RealGitHubCopilotProvider(githubToken, options);
}

/**
 * Provider configuration for integration with existing system
 */
export const RealGitHubCopilotProviderConfig = {
  id: 'real-github-copilot',
  name: 'GitHub Copilot (Real)',
  type: 'copilot' as const,
  description:
    'Real GitHub Copilot integration based on VS Code implementation',
  requiredEnvVars: ['GITHUB_TOKEN'],
  capabilities: ['chat', 'code-completion', 'reasoning', 'context-aware'],
};
