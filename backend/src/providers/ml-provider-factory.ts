/**
 * ML Provider Factory
 * Creates appropriate ML provider instances based on configuration
 */

import { IMLProvider, MLProviderConfig } from './ml-provider.interface';
import { OpenAIProvider } from './openai.provider';

export class MLProviderFactory {
  /**
   * Creates ML provider instance - TYLKO PRAWDZIWE IMPLEMENTACJE
   */
  static async createProvider(
    type: 'openai' | 'anthropic' | 'azure',
    config: MLProviderConfig
  ): Promise<IMLProvider> {
    switch (type) {
      case 'openai':
        return new OpenAIProvider(config);
      default:
        throw new Error(
          `Unsupported provider type: ${type}. Only real implementations allowed.`
        );
    }
  }
}

export default MLProviderFactory;
