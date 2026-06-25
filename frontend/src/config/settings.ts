/**
 * Settings Store for managing user preferences and API keys in localStorage
 */

export interface Settings {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  defaultProvider: 'openai' | 'anthropic';
  theme: 'dark';
  language: 'en' | 'pt' | 'es';
}

export class SettingsStore {
  private static readonly STORAGE_KEY = 'skelica_settings';

  /**
   * Load settings from localStorage
   * Returns default settings if none exist or if there's an error
   */
  static load(): Settings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return this.getDefaults();
      }

      const parsed = JSON.parse(stored);
      
      // Validate and merge with defaults to ensure all fields exist
      return {
        ...this.getDefaults(),
        ...parsed,
      };
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to load settings from localStorage:', error);
      return this.getDefaults();
    }
  }

  /**
   * Save settings to localStorage
   * Merges with existing settings
   */
  static save(settings: Partial<Settings>): void {
    try {
      const current = this.load();
      const updated = { ...current, ...settings };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to save settings to localStorage:', error);
      throw new Error('Failed to save settings. Please check your browser storage permissions.');
    }
  }

  /**
   * Clear all settings from localStorage
   */
  static clear(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to clear settings from localStorage:', error);
    }
  }

  /**
   * Get default settings
   */
  static getDefaults(): Settings {
    return {
      defaultProvider: 'openai',
      theme: 'dark',
      language: 'en',
    };
  }

  /**
   * Mask API key for display purposes
   * Shows first 7 characters and last 4 characters
   */
  static maskApiKey(key: string | undefined): string {
    if (!key || key.length < 8) {
      return '••••••••';
    }
    
    return `${key.slice(0, 7)}...${key.slice(-4)}`;
  }

  /**
   * Check if an API key is configured
   */
  static hasApiKey(provider: 'openai' | 'anthropic'): boolean {
    const settings = this.load();
    const key = provider === 'openai' ? settings.openaiApiKey : settings.anthropicApiKey;
    return !!key && key.trim() !== '';
  }

  /**
   * Get API key for a specific provider
   */
  static getApiKey(provider: 'openai' | 'anthropic'): string | undefined {
    const settings = this.load();
    return provider === 'openai' ? settings.openaiApiKey : settings.anthropicApiKey;
  }

  /**
   * Set API key for a specific provider
   */
  static setApiKey(provider: 'openai' | 'anthropic', apiKey: string): void {
    const update = provider === 'openai' 
      ? { openaiApiKey: apiKey }
      : { anthropicApiKey: apiKey };
    
    this.save(update);
  }

  /**
   * Clear API key for a specific provider
   */
  static clearApiKey(provider: 'openai' | 'anthropic'): void {
    const update = provider === 'openai'
      ? { openaiApiKey: undefined }
      : { anthropicApiKey: undefined };
    
    this.save(update);
  }

  /**
   * Export settings as JSON (for backup/sharing)
   * Excludes sensitive API keys
   */
  static exportSettings(): string {
    const settings = this.load();
    const safeSettings = {
      defaultProvider: settings.defaultProvider,
      theme: settings.theme,
      language: settings.language,
      // Don't export API keys
    };
    
    return JSON.stringify(safeSettings, null, 2);
  }

  /**
   * Import settings from JSON
   * Does not import API keys for security
   */
  static importSettings(json: string): void {
    try {
      const imported = JSON.parse(json);
      
      // Only import non-sensitive settings
      const safeSettings: Partial<Settings> = {
        defaultProvider: imported.defaultProvider,
        theme: imported.theme,
        language: imported.language,
      };
      
      this.save(safeSettings);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to import settings:', error);
      throw new Error('Invalid settings format');
    }
  }
}
