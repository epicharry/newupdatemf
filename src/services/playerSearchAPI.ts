import { ValorantAPI } from './valorantAPI';
import { PlayerInfo, RankInfo } from '../types/valorant';
import { RANKS } from '../constants/valorant';

export interface PlayerSearchResult {
  puuid: string;
  name: string;
  tag: string;
  account_level: number;
  card: {
    small: string;
    large: string;
    wide: string;
    id: string;
  };
  last_update: string;
  last_update_raw: number;
  region: string;
}

export class PlayerSearchAPI {
  private static readonly DAK_GG_API_BASE = 'https://api.dak.gg/v2/val';
  private static readonly HENRIKDEV_API_BASE = 'https://api.henrikdev.xyz/valorant/v1';
  
  static async searchPlayerByUsername(username: string, tag: string): Promise<PlayerSearchResult | null> {
    console.log(`Searching for player: ${username}#${tag}`);
    
    // Try dak.gg API first (more reliable)
    const dakResult = await this.tryDakGGAPI(username, tag);
    if (dakResult) {
      console.log(`Player search successful via dak.gg for ${username}#${tag}`);
      return dakResult;
    }
    
    // Fallback to Henrik API
    const henrikResult = await this.tryHenrikAPI(username, tag);
    if (henrikResult) {
      console.log(`Player search successful via Henrik API for ${username}#${tag}`);
      return henrikResult;
    }
    
    throw new Error(`Player ${username}#${tag} not found`);
  }

  private static async tryDakGGAPI(username: string, tag: string): Promise<PlayerSearchResult | null> {
    console.log(`Trying dak.gg API for ${username}#${tag}`);
    
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`dak.gg API attempt ${attempt}/${maxRetries} for ${username}#${tag}`);
        
        const response = await fetch(
          `${this.DAK_GG_API_BASE}/profile/${encodeURIComponent(username)}/${encodeURIComponent(tag)}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'ValRadiant/1.0.0'
            },
            signal: AbortSignal.timeout(10000) // 10 second timeout
          }
        );

        if (response.ok) {
          const data = await response.json();
          
          if (data && data.puuid) {
            return {
              puuid: data.puuid,
              name: data.name || username,
              tag: data.tag || tag,
              account_level: data.account_level || 0,
              card: data.card || {
                small: `https://via.placeholder.com/80x80?text=${username[0]}`,
                large: `https://via.placeholder.com/200x200?text=${username[0]}`,
                wide: `https://via.placeholder.com/300x150?text=${username[0]}`,
                id: 'default'
              },
              last_update: data.last_update || new Date().toISOString(),
              last_update_raw: data.last_update_raw || Date.now(),
              region: data.region || 'na'
            };
          }
        } else if (response.status === 404) {
          console.log(`Player ${username}#${tag} not found on dak.gg`);
          return null;
        } else if (response.status === 429) {
          console.warn(`Rate limited by dak.gg API (attempt ${attempt}/${maxRetries})`);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            continue;
          }
          lastError = new Error('Rate limited by dak.gg API');
        } else {
          lastError = new Error(`dak.gg API error: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error(`dak.gg API attempt ${attempt} failed:`, error);
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    console.warn(`dak.gg API failed after ${maxRetries} attempts:`, lastError);
    return null;
  }

  private static async tryHenrikAPI(username: string, tag: string): Promise<PlayerSearchResult | null> {
    console.log(`Trying Henrik API for ${username}#${tag}`);
    
    const maxRetries = 2;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Henrik API attempt ${attempt}/${maxRetries} for ${username}#${tag}`);
        
        const response = await fetch(
          `${this.HENRIKDEV_API_BASE}/account/${encodeURIComponent(username)}/${encodeURIComponent(tag)}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'ValRadiant/1.0.0'
            },
            signal: AbortSignal.timeout(8000) // 8 second timeout
          }
        );

        if (response.ok) {
          const result = await response.json();
          
          if (result.status === 200 && result.data) {
            const data = result.data;
            return {
              puuid: data.puuid,
              name: data.name || username,
              tag: data.tag || tag,
              account_level: data.account_level || 0,
              card: data.card || {
                small: `https://via.placeholder.com/80x80?text=${username[0]}`,
                large: `https://via.placeholder.com/200x200?text=${username[0]}`,
                wide: `https://via.placeholder.com/300x150?text=${username[0]}`,
                id: 'default'
              },
              last_update: data.last_update || new Date().toISOString(),
              last_update_raw: data.last_update_raw || Date.now(),
              region: data.region || 'na'
            };
          }
        } else if (response.status === 404) {
          console.log(`Player ${username}#${tag} not found on Henrik API`);
          return null;
        } else if (response.status === 429) {
          console.warn(`Rate limited by Henrik API (attempt ${attempt}/${maxRetries})`);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 3000 * attempt));
            continue;
          }
          lastError = new Error('Rate limited by Henrik API');
        } else {
          lastError = new Error(`Henrik API error: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error(`Henrik API attempt ${attempt} failed:`, error);
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
      }
    }
    
    console.warn(`Henrik API failed after ${maxRetries} attempts:`, lastError);
    return null;
  }

  static async convertToPlayerInfo(
    searchResult: PlayerSearchResult, 
    valorantAPI: ValorantAPI,
    usePlayerRegion: boolean = false
  ): Promise<PlayerInfo> {
    console.log(`Converting search result for ${searchResult.name}#${searchResult.tag} from region: ${searchResult.region}`);
    
    let rank: RankInfo = { tier: 0, rr: 0, rank: 'Unranked' };
    
    try {
      // If the player is from a different region, create a region-specific API
      if (usePlayerRegion && searchResult.region && searchResult.region !== valorantAPI.getCurrentRegion()) {
        console.log(`Player is from different region (${searchResult.region} vs ${valorantAPI.getCurrentRegion()}), creating region-specific API`);
        
        // Get current tokens but don't re-fetch them
        const currentTokens = valorantAPI.getTokens();
        if (!currentTokens) {
          throw new Error('No tokens available for cross-region rank fetch');
        }
        
        // Create a new API instance with the player's region
        const regionSpecificAPI = new ValorantAPI();
        const playerShard = this.getShardFromRegion(searchResult.region);
        
        // Set region override and initialize with existing tokens
        regionSpecificAPI.setRegionOverride(searchResult.region, playerShard);
        await regionSpecificAPI.initializeWithTokens(currentTokens);
        
        console.log(`Created region-specific API for ${searchResult.region} (${playerShard})`);
        
        // Use the region-specific API to get rank
        rank = await regionSpecificAPI.getPlayerRank(searchResult.puuid);
        console.log(`Fetched rank for ${searchResult.name}#${searchResult.tag}:`, rank);
      } else {
        // Use the existing API for same-region players
        rank = await valorantAPI.getPlayerRank(searchResult.puuid);
        console.log(`Fetched rank for ${searchResult.name}#${searchResult.tag}:`, rank);
      }
    } catch (error) {
      console.error(`Failed to fetch rank for ${searchResult.name}#${searchResult.tag}:`, error);
      // Keep default unranked on error
    }

    return {
      puuid: searchResult.puuid,
      name: `${searchResult.name}#${searchResult.tag}`,
      agent: 'Unknown',
      agentImageUrl: searchResult.card.small,
      rank,
      teamId: '',
      playerRegion: searchResult.region
    };
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