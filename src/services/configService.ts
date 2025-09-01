import { ValorantTokens } from '../types/valorant';

export interface UserConfig {
  puuid: string;
  region: string;
  shard: string;
  lastUpdated: number;
}

export interface AppConfig {
  users: Record<string, UserConfig>;
  currentUser?: string;
}

export class ConfigService {
  private static readonly CONFIG_KEY = 'valorant-companion-config';
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): AppConfig {
    try {
      const stored = localStorage.getItem(ConfigService.CONFIG_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
    
    return { users: {} };
  }

  private saveConfig(): void {
    try {
      localStorage.setItem(ConfigService.CONFIG_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  getUserConfig(puuid: string): UserConfig | null {
    return this.config.users[puuid] || null;
  }

  setUserConfig(puuid: string, region: string, shard: string): void {
    this.config.users[puuid] = {
      puuid,
      region,
      shard,
      lastUpdated: Date.now()
    };
    this.config.currentUser = puuid;
    this.saveConfig();
  }

  getCurrentUserConfig(): UserConfig | null {
    if (this.config.currentUser) {
      return this.getUserConfig(this.config.currentUser);
    }
    return null;
  }

  setCurrentUser(puuid: string): void {
    this.config.currentUser = puuid;
    this.saveConfig();
  }

  // Check if user config is stale (older than 7 days)
  isConfigStale(puuid: string): boolean {
    const userConfig = this.getUserConfig(puuid);
    if (!userConfig) return true;
    
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    return (Date.now() - userConfig.lastUpdated) > sevenDaysMs;
  }

  clearUserConfig(puuid: string): void {
    delete this.config.users[puuid];
    if (this.config.currentUser === puuid) {
      this.config.currentUser = undefined;
    }
    this.saveConfig();
  }

  clearAllConfig(): void {
    this.config = { users: {} };
    this.saveConfig();
  }
}