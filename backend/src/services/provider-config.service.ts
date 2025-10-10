import { PrismaClient } from '@prisma/client';

export interface ProviderConfig {
  id?: string;
  providerId: string;
  name: string;
  apiKey?: string;
  apiUrl?: string;
  modelName?: string;
  isEnabled: boolean;
  priority: number;
  maxTokens?: number;
  temperature?: number;
  config?: any;
  metadata?: any;
}

export class ProviderConfigService {
  private prisma: PrismaClient;
  private encryptionKey: string;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    // SZYBKO - używam prostego klucza szyfrowania
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-not-secure';
  }

  /**
   * Szyfruje API key - SZYBKA IMPLEMENTACJA BASE64
   */
  private encryptApiKey(apiKey: string): string {
    if (!apiKey) return '';
    return Buffer.from(apiKey).toString('base64');
  }

  /**
   * Deszyfruje API key - SZYBKA IMPLEMENTACJA BASE64
   */
  private decryptApiKey(encryptedApiKey: string): string {
    if (!encryptedApiKey) return '';

    try {
      return Buffer.from(encryptedApiKey, 'base64').toString('utf8');
    } catch {
      return '';
    }
  }

  /**
   * Inicjalizuje defaultowe konfiguracje providerów
   */
  async initializeDefaultConfigs(): Promise<void> {
    const defaultConfigs: ProviderConfig[] = [
      {
        providerId: 'github-copilot',
        name: 'GitHub Copilot',
        apiKey: '', // Token będzie ustawiony przez użytkownika w interfejsie
        apiUrl: 'https://api.github.com/copilot',
        modelName: 'copilot-chat',
        isEnabled: false, // Wyłączony domyślnie - użytkownik musi dodać token
        priority: 1,
        maxTokens: 4000,
        temperature: 0.1,
        config: { stream: true },
        metadata: {
          description: 'GitHub Copilot AI Assistant - wymaga API token',
        },
      },
      {
        providerId: 'groq',
        name: 'Groq',
        apiKey: '',
        apiUrl: 'https://api.groq.com/v1/chat/completions',
        modelName: 'llama-3.1-8b-instant',
        isEnabled: true,
        priority: 2,
        maxTokens: 8000,
        temperature: 0.1,
        config: { stream: false },
        metadata: { description: 'Groq Llama Models - Free Tier' },
      },
      {
        providerId: 'openai',
        name: 'OpenAI GPT',
        apiKey: '',
        apiUrl: 'https://api.openai.com/v1/chat/completions',
        modelName: 'gpt-4o-mini',
        isEnabled: false,
        priority: 3,
        maxTokens: 4000,
        temperature: 0.1,
        config: { stream: true },
        metadata: { description: 'OpenAI GPT Models' },
      },
      {
        providerId: 'anthropic',
        name: 'Anthropic Claude',
        apiKey: '',
        apiUrl: 'https://api.anthropic.com/v1/messages',
        modelName: 'claude-3-haiku-20240307',
        isEnabled: false,
        priority: 4,
        maxTokens: 4000,
        temperature: 0.1,
        config: { stream: true },
        metadata: { description: 'Anthropic Claude Models' },
      },
    ];

    for (const config of defaultConfigs) {
      const existing = await this.prisma.providerConfiguration.findUnique({
        where: { providerId: config.providerId },
      });

      if (!existing) {
        await this.prisma.providerConfiguration.create({
          data: {
            providerId: config.providerId,
            name: config.name,
            apiKey: config.apiKey ? this.encryptApiKey(config.apiKey) : null,
            apiUrl: config.apiUrl,
            modelName: config.modelName,
            isEnabled: config.isEnabled,
            priority: config.priority,
            maxTokens: config.maxTokens,
            temperature: config.temperature,
            config: config.config,
            metadata: config.metadata,
          },
        });
        console.log(`✅ Initialized default config for ${config.providerId}`);
      }
    }
  }

  /**
   * Pobiera wszystkie konfiguracje providerów
   */
  async getAllConfigs(): Promise<ProviderConfig[]> {
    const configs = await this.prisma.providerConfiguration.findMany({
      orderBy: { priority: 'asc' },
    });

    return configs.map(config => ({
      id: config.id,
      providerId: config.providerId,
      name: config.name,
      apiKey: config.apiKey ? this.decryptApiKey(config.apiKey) : undefined,
      apiUrl: config.apiUrl || undefined,
      modelName: config.modelName || undefined,
      isEnabled: config.isEnabled,
      priority: config.priority,
      maxTokens: config.maxTokens || undefined,
      temperature: config.temperature || undefined,
      config: config.config as any,
      metadata: config.metadata as any,
    }));
  }

  /**
   * Pobiera konfigurację providera
   */
  async getConfig(providerId: string): Promise<ProviderConfig | null> {
    const config = await this.prisma.providerConfiguration.findUnique({
      where: { providerId },
    });

    if (!config) return null;

    return {
      id: config.id,
      providerId: config.providerId,
      name: config.name,
      apiKey: config.apiKey ? this.decryptApiKey(config.apiKey) : undefined,
      apiUrl: config.apiUrl || undefined,
      modelName: config.modelName || undefined,
      isEnabled: config.isEnabled,
      priority: config.priority,
      maxTokens: config.maxTokens || undefined,
      temperature: config.temperature || undefined,
      config: config.config as any,
      metadata: config.metadata as any,
    };
  }

  /**
   * Aktualizuje konfigurację providera
   */
  async updateConfig(
    providerId: string,
    updates: Partial<ProviderConfig>
  ): Promise<ProviderConfig> {
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.apiKey !== undefined) {
      updateData.apiKey = updates.apiKey
        ? this.encryptApiKey(updates.apiKey)
        : null;
    }
    if (updates.apiUrl !== undefined) updateData.apiUrl = updates.apiUrl;
    if (updates.modelName !== undefined)
      updateData.modelName = updates.modelName;
    if (updates.isEnabled !== undefined)
      updateData.isEnabled = updates.isEnabled;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.maxTokens !== undefined)
      updateData.maxTokens = updates.maxTokens;
    if (updates.temperature !== undefined)
      updateData.temperature = updates.temperature;
    if (updates.config !== undefined) updateData.config = updates.config;
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

    const updated = await this.prisma.providerConfiguration.upsert({
      where: { providerId },
      update: updateData,
      create: {
        providerId,
        name: updates.name || providerId,
        apiKey: updates.apiKey ? this.encryptApiKey(updates.apiKey) : null,
        apiUrl: updates.apiUrl,
        modelName: updates.modelName,
        isEnabled: updates.isEnabled ?? true,
        priority: updates.priority ?? 1,
        maxTokens: updates.maxTokens,
        temperature: updates.temperature,
        config: updates.config,
        metadata: updates.metadata,
      },
    });

    return {
      id: updated.id,
      providerId: updated.providerId,
      name: updated.name,
      apiKey: updated.apiKey ? this.decryptApiKey(updated.apiKey) : undefined,
      apiUrl: updated.apiUrl || undefined,
      modelName: updated.modelName || undefined,
      isEnabled: updated.isEnabled,
      priority: updated.priority,
      maxTokens: updated.maxTokens || undefined,
      temperature: updated.temperature || undefined,
      config: updated.config as any,
      metadata: updated.metadata as any,
    };
  }

  /**
   * Usuwa konfigurację providera
   */
  async deleteConfig(providerId: string): Promise<boolean> {
    try {
      await this.prisma.providerConfiguration.delete({
        where: { providerId },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Pobiera aktywne providery (włączone) posortowane według priorytetu
   */
  async getActiveConfigs(): Promise<ProviderConfig[]> {
    const configs = await this.prisma.providerConfiguration.findMany({
      where: { isEnabled: true },
      orderBy: { priority: 'asc' },
    });

    return configs.map(config => ({
      id: config.id,
      providerId: config.providerId,
      name: config.name,
      apiKey: config.apiKey ? this.decryptApiKey(config.apiKey) : undefined,
      apiUrl: config.apiUrl || undefined,
      modelName: config.modelName || undefined,
      isEnabled: config.isEnabled,
      priority: config.priority,
      maxTokens: config.maxTokens || undefined,
      temperature: config.temperature || undefined,
      config: config.config as any,
      metadata: config.metadata as any,
    }));
  }
}
