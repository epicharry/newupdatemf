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

  static async searchPlayerByUsername(username: string, tag: string): Promise<PlayerSearchResult | null> {
    const cacheKey = `${username}#${tag}`.toLowerCase();
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const encodedUsername = encodeURIComponent(username);
      const encodedTag = encodeURIComponent(tag);
      const url = `${this.SEARCH_API_BASE}/puuid?player=${encodedUsername}&tag=${encodedTag}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ValRadiant-App/1.0.0'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Player not found. Please check the username and tag.');
        } else if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        } else {
          throw new Error(`Search failed with status ${response.status}`);
        }
      }

      const data: PlayerSearchResponse = await response.json();
      
      if (data.status !== 200 || !data.data) {
        throw new Error('Player not found or invalid response from search API.');
      }

      // Cache the result
      this.cache.set(cacheKey, { data: data.data, timestamp: Date.now() });
      
      return data.data;
    } catch (error) {
      console.error('Player search failed:', error);
      throw error;
    }
  }

  static async convertToPlayerInfo(
    searchResult: PlayerSearchResult, 
    valorantAPI: any
  ): Promise<PlayerInfo> {
    try {
      // Get player's rank using the existing Valorant API
      let rank: RankInfo = { tier: 0, rr: 0, rank: "Unranked" };
      
      try {
        rank = await valorantAPI.getPlayerRank(searchResult.puuid);
      } catch (error) {
        console.warn('Failed to get player rank:', error);
        // Use default unranked if rank fetch fails
      }

      return {
        puuid: searchResult.puuid,
        name: `${searchResult.name}#${searchResult.tag}`,
        agent: '', // Will be filled when viewing match history
        rank,
        teamId: '',
        agentImageUrl: searchResult.card.large // Use player card as avatar
      };
    } catch (error) {
      console.error('Failed to convert search result to player info:', error);
      throw new Error('Failed to process player data');
    }
  }

  static clearCache(): void {
    this.cache.clear();
  }
}