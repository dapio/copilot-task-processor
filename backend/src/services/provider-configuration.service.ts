/**
 * Provider Configuration Service
 * Zarządza konfiguracją AI providerów w bazie danych
 */

import { PrismaClient } from '@prisma/client';

interface CreateProviderConfigRequest {
  providerId: string;
  name: string;
  apiKey?: string;
  apiUrl?: string;
  modelName?: string;
  isEnabled?: boolean;
  priority?: number;
  maxTokens?: number;
  temperature?: number;
  config?: any;
}

interface UpdateProviderConfigRequest
  extends Partial<CreateProviderConfigRequest> {
  id: string;
}

export class ProviderConfigurationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Szyfruje API key przed zapisem (PROSTY BASE64)
   */
  private encryptApiKey(apiKey: string): string {
    return Buffer.from(apiKey).toString('base64');
  }

  /**
   * Deszyfruje API key
   */
  private decryptApiKey(encryptedApiKey: string): string {
    try {
      return Buffer.from(encryptedApiKey, 'base64').toString('utf8');
    } catch (error) {
      console.error('Error decrypting API key:', error);
      return '';
    }
  }

  /**
   * Tworzy nową konfigurację providera
   */
  async createProviderConfig(data: CreateProviderConfigRequest): Promise<any> {
    const encryptedApiKey = data.apiKey
      ? this.encryptApiKey(data.apiKey)
      : null;

    return await (this.prisma as any).providerConfiguration.create({
      data: {
        providerId: data.providerId,
        name: data.name,
        apiKey: encryptedApiKey,
        apiUrl: data.apiUrl,
        modelName: data.modelName,
        isEnabled: data.isEnabled ?? true,
        priority: data.priority ?? 1,
        maxTokens: data.maxTokens,
        temperature: data.temperature,
        config: data.config,
      },
    });
  }

  /**
   * Pobiera wszystkie konfiguracje providerów
   */
  async getAllProviderConfigs(): Promise<any[]> {
    const configs = await (this.prisma as any).providerConfiguration.findMany({
      orderBy: { priority: 'asc' },
    });

    return configs.map((config: any) => ({
      ...config,
      apiKeyDecrypted: config.apiKey
        ? this.decryptApiKey(config.apiKey)
        : undefined,
    }));
  }

  /**
   * Pobiera konfigurację konkretnego providera
   */
  async getProviderConfig(providerId: string): Promise<any | null> {
    const config = await (this.prisma as any).providerConfiguration.findUnique({
      where: { providerId },
    });

    if (!config) return null;

    return {
      ...config,
      apiKeyDecrypted: config.apiKey
        ? this.decryptApiKey(config.apiKey)
        : undefined,
    };
  }

  /**
   * Aktualizuje konfigurację providera
   */
  async updateProviderConfig(data: UpdateProviderConfigRequest): Promise<any> {
    const updateData: any = { ...data };
    delete updateData.id;

    if (data.apiKey) {
      updateData.apiKey = this.encryptApiKey(data.apiKey);
    }

    return await (this.prisma as any).providerConfiguration.update({
      where: { id: data.id },
      data: updateData,
    });
  }

  /**
   * Usuwa konfigurację providera
   */
  async deleteProviderConfig(id: string): Promise<void> {
    await (this.prisma as any).providerConfiguration.delete({
      where: { id },
    });
  }

  /**
   * Pobiera aktywne konfiguracje providerów posortowane według priority
   */
  async getActiveProviderConfigs(): Promise<any[]> {
    const configs = await (this.prisma as any).providerConfiguration.findMany({
      where: { isEnabled: true },
      orderBy: { priority: 'asc' },
    });

    return configs.map((config: any) => ({
      ...config,
      apiKeyDecrypted: config.apiKey
        ? this.decryptApiKey(config.apiKey)
        : undefined,
    }));
  }

  /**
   * Inicjalizuje defaultowe konfiguracje providerów
   */
  async initializeDefaultConfigs(): Promise<void> {
    const defaultConfigs = [
      {
        providerId: 'github-copilot',
        name: 'GitHub Copilot',
        apiKey: '', // Token zostanie dodany przez użytkownika w interfejsie
        priority: 1,
        isEnabled: false, // Wyłączony domyślnie - wymaga tokenu
        maxTokens: 4096,
        temperature: 0.3,
      },
      {
        providerId: 'groq',
        name: 'Groq (Free)',
        priority: 2,
        isEnabled: true,
        modelName: 'llama-3.1-70b-versatile',
        maxTokens: 8192,
        temperature: 0.5,
      },
      {
        providerId: 'openai',
        name: 'OpenAI GPT',
        priority: 3,
        isEnabled: false,
        modelName: 'gpt-4o-mini',
        maxTokens: 4096,
        temperature: 0.3,
      },
      {
        providerId: 'anthropic',
        name: 'Anthropic Claude',
        priority: 4,
        isEnabled: false,
        modelName: 'claude-3-sonnet-20240229',
        maxTokens: 4096,
        temperature: 0.3,
      },
    ];

    for (const config of defaultConfigs) {
      const existing = await (
        this.prisma as any
      ).providerConfiguration.findUnique({
        where: { providerId: config.providerId },
      });

      if (!existing) {
        await this.createProviderConfig(config);
        console.log(`✅ Created default config for ${config.name}`);
      }
    }
  }
}
