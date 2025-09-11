import { ValorantTokens, PlayerInfo, RankInfo } from '../types/valorant';
import { RANKS } from '../constants/valorant';

export interface PlayerSearchResult {
  puuid: string;
  region: string;
  account_level: number;
  name: string;
  tag: string;
  card: {
    small: string;
    large: string;
    wide: string;
    id: string;
  };
  last_update: string;
  last_update_raw: number;
}

export interface PlayerSearchResponse {
  status: number;
  data: PlayerSearchResult;
}

export class PlayerSearchAPI {
  private static readonly SEARCH_API_BASE = 'https://c4ldas.com.br/api/valorant';
  private static cache = new Map<string, { data: PlayerSearchResult; timestamp: number }>();
  private static readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  private static readonly REQUEST_TIMEOUT = 15000; // 15 seconds
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 3000; // 3 seconds between retries

  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static async fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out after 15 seconds');
      }
      throw error;
    }
  }

  static async searchPlayerByUsername(username: string, tag: string): Promise<PlayerSearchResult | null> {
    const cacheKey = `${username}#${tag}`.toLowerCase();
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }

    const encodedUsername = encodeURIComponent(username);
    const encodedTag = encodeURIComponent(tag);
    const url = `${this.SEARCH_API_BASE}/puuid?player=${encodedUsername}&tag=${encodedTag}`;

    let lastError: Error | null = null;

    // Retry logic with exponential backoff
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`Player search attempt ${attempt}/${this.MAX_RETRIES} for ${username}#${tag}`);

        const response = await this.fetchWithTimeout(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ValRadiant-App/1.0.0'
          }
        }, this.REQUEST_TIMEOUT);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Player not found. Please check the username and tag.');
          } else if (response.status === 429) {
            throw new Error('Too many requests. Please wait a moment and try again.');
          } else if (response.status === 504 || response.status === 502 || response.status === 503 || response.status === 500) {
            // Server errors - retry these
            throw new Error(`Server error (${response.status}). Retrying...`);
          } else {
            throw new Error(`Search failed with status ${response.status}`);
          }
        }

        const data: PlayerSearchResponse = await response.json();
        
        if (data.status !== 200 || !data.data) {
          throw new Error('Player not found or invalid response from search API.');
        }

        // Cache the result on success
        this.cache.set(cacheKey, { data: data.data, timestamp: Date.now() });
        
        console.log(`Player search successful for ${username}#${tag} on attempt ${attempt}`);
        return data.data;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error occurred');
        
        // Don't retry for certain errors
        if (lastError.message.includes('Player not found') || 
            lastError.message.includes('Too many requests') ||
            lastError.message.includes('Request timed out')) {
          console.error('Player search failed (non-retryable):', lastError.message);
          throw lastError;
        }

        // If this is the last attempt, throw the error
        if (attempt === this.MAX_RETRIES) {
          console.error(`Player search failed after ${this.MAX_RETRIES} attempts:`, lastError.message);
          throw new Error(`Search failed after ${this.MAX_RETRIES} attempts. The search service may be temporarily unavailable. Please try again later.`);
        }

        // Wait before retrying (exponential backoff)
        const delayMs = this.RETRY_DELAY * Math.pow(2, attempt - 1);
        console.warn(`Player search attempt ${attempt} failed: ${lastError.message}. Retrying in ${delayMs}ms...`);
        await this.delay(delayMs);
      }
    }

    // This should never be reached, but just in case
    throw lastError || new Error('Search failed for unknown reasons');
  }

  static async convertToPlayerInfo(
    searchResult: PlayerSearchResult, 
    valorantAPI: any,
    usePlayerRegion: boolean = true
  ): Promise<PlayerInfo> {
    try {
      console.log(`Converting search result for ${searchResult.name}#${searchResult.tag} from region: ${searchResult.region}`);
      
      // Create a new API instance with the player's region if needed
      let apiToUse = valorantAPI;
      
      if (usePlayerRegion && searchResult.region) {
        const playerRegion = searchResult.region.toLowerCase();
        const currentRegion = valorantAPI.getCurrentRegion();
        
        if (playerRegion !== currentRegion) {
          console.log(`Player is from different region (${playerRegion} vs ${currentRegion}), creating region-specific API`);
          
          // Import ValorantAPI dynamically to avoid circular imports
          const { ValorantAPI } = await import('./valorantAPI');
          apiToUse = new ValorantAPI();
          
          // Get tokens from the existing API
          const tokens = await valorantAPI.fetchTokens();
          
          // Set the region for this specific API instance
          const playerShard = this.getShardFromRegion(playerRegion);
          apiToUse.setRegionOverride(playerRegion, playerShard);
          
          // Initialize with tokens
          await apiToUse.initializeWithTokens(tokens);
          
          console.log(`Created region-specific API for ${playerRegion} (${playerShard})`);
        }
      }
      
      let rank: RankInfo = { tier: 0, rr: 0, rank: "Unranked" };
      
      try {
        rank = await apiToUse.getPlayerRank(searchResult.puuid);
        console.log(`Fetched rank for ${searchResult.name}#${searchResult.tag}:`, rank);
      } catch (error) {
        console.warn(`Failed to get player rank for ${searchResult.name}#${searchResult.tag}:`, error);
        // Use default unranked if rank fetch fails
      }

      return {
        puuid: searchResult.puuid,
        name: `${searchResult.name}#${searchResult.tag}`,
        agent: '', // Will be filled when viewing match history
        rank,
        teamId: '',
        agentImageUrl: searchResult.card.large, // Use player card as avatar
        playerRegion: searchResult.region // Store the player's region for match history
      };
    } catch (error) {
      console.error('Failed to convert search result to player info:', error);
      throw new Error('Failed to process player data');
    }
  }

  static clearCache(): void {
    this.cache.clear();
  }

  private static getShardFromRegion(region: string): string {
    const regionToShard: Record<string, string> = {
      'na': 'na',
      'eu': 'eu', 
      'ap': 'ap',
      'kr': 'kr',
      'br': 'br',
      'latam': 'latam'
    };
    
    return regionToShard[region.toLowerCase()] || region.toLowerCase();
  }
}