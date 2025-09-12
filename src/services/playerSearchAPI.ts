import { ValorantTokens, PlayerInfo, RankInfo } from '../types/valorant';
import { RANKS, CLIENT_PLATFORM, CLIENT_VERSION } from '../constants/valorant';

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
  private static readonly FALLBACK_API_BASE = 'https://c4ldas.com.br/api/valorant';
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

    // Only use c4ldas API (removed dak.gg due to invalid PUUID issues)
    console.log(`🔍 [DEBUG] Using c4ldas API for ${username}#${tag}`);
    return this.searchWithC4ldasAPI(username, tag);
  }

  private static async searchWithC4ldasAPI(username: string, tag: string): Promise<PlayerSearchResult | null> {
    const encodedUsername = encodeURIComponent(username);
    const encodedTag = encodeURIComponent(tag);
    const url = `${this.FALLBACK_API_BASE}/puuid?player=${encodedUsername}&tag=${encodedTag}`;

    let lastError: Error | null = null;

    // Retry logic with exponential backoff
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`🔍 [DEBUG] === C4LDAS API ATTEMPT ${attempt}/${this.MAX_RETRIES} ===`);
        console.log(`🔍 [DEBUG] URL: ${url}`);
        console.log(`🔍 [DEBUG] Username: ${username}, Tag: ${tag}`);

        const response = await this.fetchWithTimeout(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ValRadiant-App/1.0.0'
          }
        }, this.REQUEST_TIMEOUT);

        if (!response.ok) {
          console.log(`🔍 [DEBUG] Response not OK. Status: ${response.status}`);
          const responseText = await response.text();
          console.log(`🔍 [DEBUG] Response body:`, responseText);
          
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
        console.log(`🔍 [DEBUG] === C4LDAS API RESPONSE ===`);
        console.log(`🔍 [DEBUG] Full response:`, data);
        console.log(`🔍 [DEBUG] Player data:`, data.data);
        
        if (data.status !== 200 || !data.data) {
          throw new Error('Player not found. Please check the username and try again.');
        }

        // Cache the result on success
        const cacheKey = `${username}#${tag}`.toLowerCase();
        this.cache.set(cacheKey, { data: data.data, timestamp: Date.now() });
        
        console.log(`✅ [DEBUG] C4ldas API search successful for ${username}#${tag} on attempt ${attempt}`);
        return data.data;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error occurred');
        
        // Don't retry for certain errors
        if (lastError.message.includes('Player not found') || 
            lastError.message.includes('Too many requests') ||
            lastError.message.includes('Request timed out')) {
          console.error('🔍 [DEBUG] C4ldas API search failed (non-retryable):', lastError.message);
          throw lastError;
        }

        // If this is the last attempt, throw the error
        if (attempt === this.MAX_RETRIES) {
          console.error(`Fallback API search failed after ${this.MAX_RETRIES} attempts:`, lastError.message);
          throw new Error(`Search failed after ${this.MAX_RETRIES} attempts. The search service may be temporarily unavailable. Please try again later.`);
        }

        // Wait before retrying (exponential backoff)
        const delayMs = this.RETRY_DELAY * Math.pow(2, attempt - 1);
        console.warn(`🔍 [DEBUG] C4ldas API attempt ${attempt} failed: ${lastError.message}. Retrying in ${delayMs}ms...`);
        await this.delay(delayMs);
      }
    }

    throw lastError || new Error('C4ldas API search failed');
  }

  static async convertToPlayerInfo(
    searchResult: PlayerSearchResult, 
    valorantAPI: any,
    usePlayerRegion: boolean = true
  ): Promise<PlayerInfo> {
    try {
      console.log(`🔍 [DEBUG] === CONVERT TO PLAYER INFO ===`);
      console.log(`🔍 [DEBUG] Search result:`, searchResult);
      console.log(`🔍 [DEBUG] Original PUUID from search:`, searchResult.puuid);
      console.log(`🔍 [DEBUG] PUUID length:`, searchResult.puuid.length);
      console.log(`🔍 [DEBUG] Player region:`, searchResult.region);
      console.log(`🔍 [DEBUG] Use player region:`, usePlayerRegion);
      
      console.log(`Converting search result for ${searchResult.name}#${searchResult.tag} from region: ${searchResult.region}`);
      
      // Create a new API instance with the player's region if needed
      let apiToUse = valorantAPI;
      
      if (usePlayerRegion && searchResult.region) {
        const playerRegion = searchResult.region.toLowerCase();
        const currentRegion = valorantAPI.getCurrentRegion();
        
        console.log(`🔍 [DEBUG] Player region: ${playerRegion}, Current region: ${currentRegion}`);
        
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
        // Use extended rank search for player search
        rank = await this.getExtendedPlayerRank(searchResult.puuid, apiToUse);
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

  static async getExtendedPlayerRank(puuid: string, valorantAPI: any): Promise<RankInfo> {
    const region = valorantAPI.getCurrentRegion();
    const tokens = valorantAPI.getTokens();
    
    console.log(`🔍 [DEBUG] Starting extended rank search for PUUID: ${puuid}`);
    console.log(`🔍 [DEBUG] Using region: ${region}`);
    console.log(`🔍 [DEBUG] Tokens available:`, !!tokens);
    
    if (!tokens) {
      console.error(`❌ [DEBUG] No tokens available for rank search`);
      throw new Error('No tokens available');
    }

    const headers = {
      "Authorization": `Bearer ${tokens.authToken}`,
      "X-Riot-Entitlements-JWT": tokens.entToken,
      "X-Riot-ClientPlatform": CLIENT_PLATFORM,
      "X-Riot-ClientVersion": CLIENT_VERSION,
      "Content-Type": "application/json"
    };

    try {
      console.log(`Extended rank search for ${puuid} in region ${region}`);
      console.log(`🔍 [DEBUG] Making competitive updates request...`);
      
      // Try competitive updates with extended range (up to 50 matches)
      const competitiveResponse = await window.electronAPI.makeRequest({
        url: `https://pd.${region}.a.pvp.net/mmr/v1/players/${puuid}/competitiveupdates?startIndex=0&endIndex=50`,
        headers,
        method: 'GET'
      });

      if (competitiveResponse.status === 200 && competitiveResponse.data?.Matches) {
        console.log(`✅ [DEBUG] Found ${competitiveResponse.data.Matches.length} competitive matches for ${puuid}`);
        console.log(`🔍 [DEBUG] First few matches:`, competitiveResponse.data.Matches.slice(0, 3));
        
        // Look through all matches to find the most recent rank
        for (const match of competitiveResponse.data.Matches) {
          console.log(`🔍 [DEBUG] Checking match: TierAfterUpdate=${match.TierAfterUpdate}, RR=${match.RankedRatingAfterUpdate}`);
          if (match.TierAfterUpdate > 0) {
            const rank = {
              tier: match.TierAfterUpdate,
              rr: match.RankedRatingAfterUpdate,
              rank: RANKS[match.TierAfterUpdate] || "Unranked"
            };
            
            console.log(`✅ [DEBUG] Found rank from competitive updates: ${rank.rank} (${rank.rr} RR)`);
            return rank;
          }
        }
        
        console.log(`⚠️ [DEBUG] No ranked matches found in ${competitiveResponse.data.Matches.length} competitive updates`);
      } else {
        console.log(`❌ [DEBUG] Competitive updates request failed. Status: ${competitiveResponse.status}`);
        console.log(`🔍 [DEBUG] Response data:`, competitiveResponse.data);
      }

      console.log(`🔍 [DEBUG] Trying MMR endpoint as fallback...`);
      // Fallback to current MMR endpoint
      const mmrResponse = await window.electronAPI.makeRequest({
        url: `https://pd.${region}.a.pvp.net/mmr/v1/players/${puuid}`,
        headers,
        method: 'GET'
      });

      if (mmrResponse.status === 200 && mmrResponse.data?.QueueSkills?.competitive) {
        const competitive = mmrResponse.data.QueueSkills.competitive;
        console.log(`✅ [DEBUG] MMR endpoint successful`);
        console.log(`🔍 [DEBUG] MMR data:`, competitive);
        
        // Try current season tier
        const currentTier = competitive.CurrentSeasonTier || 0;
        const currentRR = competitive.CurrentSeasonEndRankedRating || 0;

        console.log(`🔍 [DEBUG] Current season data: Tier=${currentTier}, RR=${currentRR}`);
        
        if (currentTier > 0) {
          const rank = {
            tier: currentTier,
            rr: currentRR,
            rank: RANKS[currentTier] || "Unranked"
          };
          
          console.log(`✅ [DEBUG] Found rank from current season: ${rank.rank} (${rank.rr} RR)`);
          return rank;
        }

        console.log(`🔍 [DEBUG] Checking seasonal info...`);
        // Try seasonal info as final fallback
        const seasonalInfo = competitive.SeasonalInfoBySeasonID || {};
        console.log(`🔍 [DEBUG] Seasonal info keys:`, Object.keys(seasonalInfo));
        
        if (Object.keys(seasonalInfo).length > 0) {
          const seasons = Object.values(seasonalInfo) as any[];
          console.log(`🔍 [DEBUG] Found ${seasons.length} seasons of data`);
          // Sort by season to get the most recent
          const latestSeason = seasons[seasons.length - 1];
          console.log(`🔍 [DEBUG] Latest season data:`, latestSeason);
          
          if (latestSeason && latestSeason.CompetitiveTier > 0) {
            const rank = {
              tier: latestSeason.CompetitiveTier,
              rr: latestSeason.RankedRating || 0,
              rank: RANKS[latestSeason.CompetitiveTier] || "Unranked"
            };
            
            console.log(`✅ [DEBUG] Found rank from seasonal info: ${rank.rank} (${rank.rr} RR)`);
            return rank;
          }
        }
      } else {
        console.log(`❌ [DEBUG] MMR endpoint failed. Status: ${mmrResponse.status}`);
        console.log(`🔍 [DEBUG] MMR Response data:`, mmrResponse.data);
      }

      console.log(`❌ [DEBUG] No rank data found for ${puuid} after checking all endpoints`);
      return { tier: 0, rr: 0, rank: "Unranked" };
      
    } catch (error) {
      console.error(`❌ [DEBUG] Extended rank search failed for ${puuid}:`, error);
      
      // If it's a rate limit error, throw it up
      if (error.toString().includes('429')) {
        console.log(`⚠️ [DEBUG] Rate limited during rank search`);
        throw new Error('Rate limited - please wait before searching again');
      }
      
      console.log(`🔍 [DEBUG] Returning unranked due to error`);
      return { tier: 0, rr: 0, rank: "Unranked" };
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