/**
 * Provider Manager
 * Zarządzanie providerami ML dla Enhanced Workflow Controller
 */

import { ProviderHealth } from '../types/workflow-controller.types';

export class ProviderManager {
  private providers: Map<string, any> = new Map();
  private providerHealthCache: Map<
    string,
    { status: string; timestamp: Date }
  > = new Map();

  constructor() {}

  /**
   * Rejestruje nowego providera
   */
  registerProvider(name: string, provider: any): void {
    this.providers.set(name, provider);
    console.log(`🔗 Registered ML provider: ${name}`);

    // Resetuj cache health dla tego providera
    this.providerHealthCache.delete(name);
  }

  /**
   * Pobiera providera po nazwie
   */
  getProvider(name: string): any | null {
    return this.providers.get(name) || null;
  }

  /**
   * Pobiera wszystkich providerów
   */
  getAllProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Pobiera status wszystkich providerów
   */
  getProviders(): ProviderHealth[] {
    const providers: ProviderHealth[] = [];

    for (const [name, provider] of this.providers) {
      const cachedHealth = this.providerHealthCache.get(name);

      // Jeśli cache jest świeży (< 5 min), użyj go
      if (
        cachedHealth &&
        Date.now() - cachedHealth.timestamp.getTime() < 5 * 60 * 1000
      ) {
        const status = ['healthy', 'degraded', 'unhealthy'].includes(
          cachedHealth.status
        )
          ? (cachedHealth.status as 'healthy' | 'degraded' | 'unhealthy')
          : 'unknown';
        providers.push({
          name,
          status,
          lastChecked: cachedHealth.timestamp,
        });
      } else {
        // Sprawdź health asynchronicznie
        provider
          .healthCheck?.()
          .then((health: any) => {
            const status = health.success ? health.data.status : 'unhealthy';
            this.providerHealthCache.set(name, {
              status,
              timestamp: new Date(),
            });
          })
          .catch(() => {
            this.providerHealthCache.set(name, {
              status: 'unhealthy',
              timestamp: new Date(),
            });
          });

        providers.push({
          name,
          status: 'unknown',
          lastChecked: cachedHealth?.timestamp,
        });
      }
    }

    return providers;
  }

  /**
   * Sprawdza dostępność providera
   */
  async checkProviderHealth(name: string): Promise<ProviderHealth> {
    const provider = this.providers.get(name);

    if (!provider) {
      return {
        name,
        status: 'unknown',
        lastChecked: new Date(),
      };
    }

    try {
      const health = await provider.healthCheck?.();
      const status = health?.success
        ? health.data?.status || 'healthy'
        : 'unhealthy';

      // Cache wynik
      this.providerHealthCache.set(name, {
        status,
        timestamp: new Date(),
      });

      return {
        name,
        status: status as 'healthy' | 'degraded' | 'unhealthy',
        lastChecked: new Date(),
      };
    } catch {
      this.providerHealthCache.set(name, {
        status: 'unhealthy',
        timestamp: new Date(),
      });

      return {
        name,
        status: 'unhealthy',
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Pobiera statystyki providerów
   */
  getProviderStats(): {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    unknown: number;
  } {
    const providers = this.getProviders();

    return {
      total: providers.length,
      healthy: providers.filter(p => p.status === 'healthy').length,
      degraded: providers.filter(p => p.status === 'degraded').length,
      unhealthy: providers.filter(p => p.status === 'unhealthy').length,
      unknown: providers.filter(p => p.status === 'unknown').length,
    };
  }

  /**
   * Usuwa providera
   */
  unregisterProvider(name: string): boolean {
    const exists = this.providers.has(name);
    if (exists) {
      this.providers.delete(name);
      this.providerHealthCache.delete(name);
      console.log(`🗑️ Unregistered ML provider: ${name}`);
    }
    return exists;
  }

  /**
   * Czyści cache health wszystkich providerów
   */
  clearHealthCache(): void {
    this.providerHealthCache.clear();
    console.log('🧹 Cleared provider health cache');
  }
}
