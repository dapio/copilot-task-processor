/**
 * Configuration Manager - Singleton pattern
 */
export class ConfigManager {
  private static instance: ConfigManager;

  private constructor() {}

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public get(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Configuration key ${key} is not set`);
    }
    return value;
  }

  public getOptional(key: string, defaultValue: string = ''): string {
    return process.env[key] || defaultValue;
  }

  public isValid(): boolean {
    const required = [
      'JIRA_HOST',
      'JIRA_EMAIL', 
      'JIRA_API_TOKEN',
      'GITHUB_TOKEN',
      'GITHUB_OWNER',
      'GITHUB_REPO'
    ];

    for (const key of required) {
      if (!process.env[key]) {
        console.error(`Missing required environment variable: ${key}`);
        return false;
      }
    }

    return true;
  }

  public async validate(): Promise<void> {
    if (!this.isValid()) {
      throw new Error('Invalid configuration. Check your .env file.');
    }
  }
}