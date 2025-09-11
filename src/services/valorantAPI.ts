import { ValorantTokens, RankInfo, MatchData, PlayerInfo } from '../types/valorant';
import { CLIENT_PLATFORM, CLIENT_VERSION, DEFAULT_REGION, DEFAULT_SHARD, AGENTS, RANKS } from '../constants/valorant';
import { ConfigService } from './configService';
import { RegionService } from './regionService';

export class ValorantAPI {
  private tokens: ValorantTokens | null = null;
  private lastTokenFetch: number = 0;
  private readonly TOKEN_REFRESH_INTERVAL = 2 * 60 * 1000; // 2 minutes - more frequent refresh
  private configService: ConfigService;
  private currentRegion: string = DEFAULT_REGION;
  private currentShard: string = DEFAULT_SHARD;
  private currentMatchId: string = '';
  private startingSide: string = '';
  private rankCache: Map<string, { rank: RankInfo; timestamp: number }> = new Map();
  private nameCache: Map<string, { names: Record<string, string>; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // Increased to 10 minutes to reduce API calls

  constructor() {
    this.configService = new ConfigService();
  }

  async fetchTokens(): Promise<ValorantTokens> {
    try {
      this.tokens = await window.electronAPI.fetchTokens();
      this.lastTokenFetch = Date.now();
      
      // Auto-detect and set region for this user
      await this.setupUserRegion();
      
      return this.tokens;
    } catch (error) {
      throw new Error(`Failed to fetch tokens: ${error}`);
    }
  }

  private async setupUserRegion(): Promise<void> {
    if (!this.tokens) return;

    try {
      // Check if we have cached region info for this user
      const existingConfig = this.configService.getUserConfig(this.tokens.puuid);
      
      if (existingConfig && !this.configService.isConfigStale(this.tokens.puuid)) {
        // Use cached region
        this.currentRegion = existingConfig.region;
        this.currentShard = existingConfig.shard;
        this.configService.setCurrentUser(this.tokens.puuid);
        console.log(`Using cached region: ${this.currentRegion} (${this.currentShard}) for user ${this.tokens.puuid}`);
        return;
      }

      // Detect region from user info
      console.log('Detecting user region...');
      const regionInfo = await RegionService.detectUserRegion(this.tokens.authToken);
      
      // Update region settings
      this.currentRegion = regionInfo.region;
      this.currentShard = regionInfo.shard;
      
      // Save to config
      this.configService.setUserConfig(this.tokens.puuid, regionInfo.region, regionInfo.shard);
      
      console.log(`Region detection complete: ${this.currentRegion} (${this.currentShard})`);
    } catch (error) {
      console.error('Failed to setup user region:', error);
      // Use default region on error
      this.currentRegion = DEFAULT_REGION;
      this.currentShard = DEFAULT_SHARD;
    }
  }

  getCurrentRegion(): string {
    return this.currentRegion;
  }

  getCurrentShard(): string {
    return this.currentShard;
  }

  private async ensureValidTokens(): Promise<void> {
    const now = Date.now();
    // Always refresh tokens if they're older than 2 minutes OR if we get auth errors
    const shouldRefresh = !this.tokens || 
                         (now - this.lastTokenFetch) > this.TOKEN_REFRESH_INTERVAL ||
                         this.lastTokenFetch === 0;
    
    if (shouldRefresh) {
      try {
        console.log('Refreshing Riot tokens...');
        await this.fetchTokens();
        console.log('Tokens refreshed successfully');
      } catch (error) {
        console.error('Token refresh failed:', error);
        // Clear tokens on refresh failure to force re-fetch
        this.tokens = null;
        this.lastTokenFetch = 0;
        throw error;
      }
    }
  }

  getTokens(): ValorantTokens | null {
    return this.tokens;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    await this.ensureValidTokens();
    
    if (!this.tokens) {
      throw new Error('Tokens not available');
    }
    
    return {
      "Authorization": `Bearer ${this.tokens.authToken}`,
      "X-Riot-Entitlements-JWT": this.tokens.entToken,
      "X-Riot-ClientPlatform": CLIENT_PLATFORM,
      "X-Riot-ClientVersion": CLIENT_VERSION,
      "Content-Type": "application/json"
    };
  }

  private async makeRequestWithRetry(url: string, options: any = {}): Promise<any> {
    // Always ensure we have fresh tokens before making requests
    await this.ensureValidTokens();
    let headers = await this.getHeaders();
    
    try {
      const response = await window.electronAPI.makeRequest({
        url,
        headers,
        ...options
      });
      
      return response;
    } catch (error) {
      // If request fails with auth error, force token refresh and retry once
      const errorStr = error.toString();
      if (errorStr.includes('401') || errorStr.includes('403') || errorStr.includes('Unauthorized')) {
        console.warn('Auth error detected, forcing token refresh:', error);
        
        // Force fresh token fetch
        this.tokens = null;
        this.lastTokenFetch = 0;
        await this.ensureValidTokens();
        headers = await this.getHeaders();
        
        return await window.electronAPI.makeRequest({
          url,
          headers,
          ...options
        });
      }
      
      // For other errors, don't retry
      throw error;
    }
  }

  async getPlayerRank(puuid: string): Promise<RankInfo> {
    // Check cache first
    const cached = this.rankCache.get(puuid);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return cached.rank;
    }

    try {
      // Try competitive updates first
      const competitiveResponse = await this.makeRequestWithRetry(
        `https://pd.${this.currentRegion}.a.pvp.net/mmr/v1/players/${puuid}/competitiveupdates`
      );

      if (competitiveResponse.status === 200 && competitiveResponse.data?.Matches) {
        for (const match of competitiveResponse.data.Matches) {
          if (match.TierAfterUpdate > 0) {
            const rank = {
              tier: match.TierAfterUpdate,
              rr: match.RankedRatingAfterUpdate,
              rank: RANKS[match.TierAfterUpdate] || "Unranked"
            };
            
            // Cache the result
            this.rankCache.set(puuid, { rank, timestamp: now });
            return rank;
          }
        }
      }

      // Fallback to current competitive tier
      const mmrResponse = await this.makeRequestWithRetry(
        `https://pd.${this.currentRegion}.a.pvp.net/mmr/v1/players/${puuid}`
      );

      if (mmrResponse.status === 200 && mmrResponse.data?.QueueSkills?.competitive) {
        const competitive = mmrResponse.data.QueueSkills.competitive;
        const currentTier = competitive.CurrentSeasonTier || 0;
        const currentRR = competitive.CurrentSeasonEndRankedRating || 0;

        if (currentTier > 0) {
          const rank = {
            tier: currentTier,
            rr: currentRR,
            rank: RANKS[currentTier] || "Unranked"
          };
          
          // Cache the result
          this.rankCache.set(puuid, { rank, timestamp: now });
          return rank;
        }

        // Final fallback to seasonal info
        const seasonalInfo = competitive.SeasonalInfoBySeasonID || {};
        if (Object.keys(seasonalInfo).length > 0) {
          const latestSeason = Object.values(seasonalInfo)[Object.values(seasonalInfo).length - 1] as any;
          if (latestSeason.CompetitiveTier > 0) {
            const rank = {
              tier: latestSeason.CompetitiveTier,
              rr: latestSeason.RankedRating,
              rank: RANKS[latestSeason.CompetitiveTier] || "Unranked"
            };
            
            // Cache the result
            this.rankCache.set(puuid, { rank, timestamp: now });
            return rank;
          }
        }
      }
    } catch (error) {
      console.error(`Rank fetch error for ${puuid}: ${error}`);
      
      // If we have cached data, return it even if stale during errors
      if (cached) {
        console.warn(`Using stale cached rank data for ${puuid}`);
        return cached.rank;
      }
    }

    const defaultRank = { tier: 0, rr: 0, rank: "Unranked" };
    // Cache the default rank to avoid repeated failed requests
    this.rankCache.set(puuid, { rank: defaultRank, timestamp: now });
    return defaultRank;
  }

  async getPlayerNames(puuids: string[]): Promise<Record<string, string>> {
    // Check cache first
    const cacheKey = puuids.sort().join(',');
    const cached = this.nameCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return cached.names;
    }

    try {
      const response = await this.makeRequestWithRetry(
        `https://pd.${this.currentRegion}.a.pvp.net/name-service/v2/players`,
        {
        method: 'PUT',
        body: puuids
        }
      );

      if (response.status === 200) {
        const names = response.data.reduce((acc: Record<string, string>, player: any) => {
          acc[player.Subject] = `${player.GameName}#${player.TagLine}`;
          return acc;
        }, {});
        
        // Cache the result
        this.nameCache.set(cacheKey, { names, timestamp: now });
        return names;
      }
    } catch (error) {
      console.error('Failed to fetch player names:', error);
      
      // If we have cached data, return it even if stale during errors
      if (cached) {
        console.warn(`Using stale cached name data for ${cacheKey}`);
        return cached.names;
      }
    }

    return {};
  }

  async checkPregame(): Promise<MatchData | null> {
    try {
      if (!this.tokens) return null;
      
      const pregameResponse = await this.makeRequestWithRetry(
        `https://glz-${this.currentRegion}-1.${this.currentShard}.a.pvp.net/pregame/v1/players/${this.tokens.puuid}`
      );

      if (pregameResponse.status === 200 && pregameResponse.data?.MatchID) {
        // Reset match tracking if it's a new match
        if (this.currentMatchId !== pregameResponse.data.MatchID) {
          this.currentMatchId = pregameResponse.data.MatchID;
          this.startingSide = ''; // Reset starting side for new match
        }

        const matchResponse = await this.makeRequestWithRetry(
          `https://glz-${this.currentRegion}-1.${this.currentShard}.a.pvp.net/pregame/v1/matches/${pregameResponse.data.MatchID}`
        );

        if (matchResponse.status === 200) {
          return this.handlePregameData(matchResponse.data);
        }
      }
    } catch (error) {
      console.error('Pregame check failed:', error);
    }

    return null;
  }

  async checkLiveMatch(): Promise<MatchData | null> {
    try {
      if (!this.tokens) return null;
      
      const liveResponse = await this.makeRequestWithRetry(
        `https://glz-${this.currentRegion}-1.${this.currentShard}.a.pvp.net/core-game/v1/players/${this.tokens.puuid}`
      );

      if (liveResponse.status === 200 && liveResponse.data?.MatchID) {
        // Reset match tracking if it's a new match
        if (this.currentMatchId !== liveResponse.data.MatchID) {
          this.currentMatchId = liveResponse.data.MatchID;
          this.startingSide = ''; // Reset starting side for new match
        }

        const matchResponse = await this.makeRequestWithRetry(
          `https://glz-${this.currentRegion}-1.${this.currentShard}.a.pvp.net/core-game/v1/matches/${liveResponse.data.MatchID}`
        );

        if (matchResponse.status === 200) {
          return this.handleLiveMatchData(matchResponse.data);
        }
      }
    } catch (error) {
      console.error('Live match check failed:', error);
    }

    return null;
  }

  private async handlePregameData(matchData: any): Promise<MatchData> {
    // Get team assignment from AllyTeam
    const myTeamId = matchData.AllyTeam?.TeamID || 'Blue';
    
    // During agent select, only show ally team players since enemy team is not visible
    const allPlayers = matchData.AllyTeam?.Players || [];

    // Get player names
    const puuids = allPlayers.map(p => p.Subject);
    const names = await this.getPlayerNames(puuids);

    // Get player info with ranks
    const players: PlayerInfo[] = await Promise.all(
      allPlayers.map(async (player) => {
        const rank = await this.getPlayerRank(player.Subject);
        return {
          puuid: player.Subject,
          name: names[player.Subject] || 'Unknown',
          agent: AGENTS[player.CharacterID] || (player.CharacterID ? 'Unknown' : 'Selecting...'),
          agentImageUrl: player.CharacterID ? `https://media.valorant-api.com/agents/${player.CharacterID}/displayicon.png` : undefined,
          rank,
          teamId: myTeamId, // Assign all players to your team during agent select
          isCurrentUser: player.Subject === this.tokens?.puuid // Mark current user
        };
      })
    );

    // Correct side detection: Red = Attacking, Blue = Defending
    const side = myTeamId === 'Red' ? 'Attacking' : 'Defending';
    
    // Store the starting side for this match
    if (!this.startingSide) {
      this.startingSide = side;
    }

    return {
      type: 'pregame',
      players,
      myTeamId,
      side: `Started As: ${this.startingSide}`
    };
  }

  private async handleLiveMatchData(matchData: any): Promise<MatchData> {
    const allPlayers = matchData.Players || [];

    // Get player names
    const puuids = allPlayers.map(p => p.Subject);
    const names = await this.getPlayerNames(puuids);

    // Find my team ID
    const myPlayer = allPlayers.find(p => p.Subject === this.tokens?.puuid);
    const myTeamId = myPlayer?.TeamID || '';

    // Get player info with ranks
    const players: PlayerInfo[] = await Promise.all(
      allPlayers.map(async (player) => {
        const rank = await this.getPlayerRank(player.Subject);
        return {
          puuid: player.Subject,
          name: names[player.Subject] || 'Unknown',
          agent: AGENTS[player.CharacterID] || 'Unknown',
          agentImageUrl: player.CharacterID ? `https://media.valorant-api.com/agents/${player.CharacterID}/displayicon.png` : undefined,
          rank,
          teamId: player.TeamID,
          isCurrentUser: player.Subject === this.tokens?.puuid // Mark current user
        };
      })
    );

    // Correct side detection: Red = Attacking, Blue = Defending
    const currentSide = myTeamId === 'Red' ? 'Attacking' : 'Defending';
    
    // Store the starting side if not already set
    if (!this.startingSide) {
      this.startingSide = currentSide;
    }

    return {
      type: 'live',
      players,
      myTeamId,
      side: `Started As: ${this.startingSide}`
    };
  }

  async getMatchData(): Promise<MatchData> {
    // Try pregame first
    const pregame = await this.checkPregame();
    if (pregame) return pregame;

    // Try live match
    const live = await this.checkLiveMatch();
    if (live) return live;

    // No match found - reset tracking
    this.currentMatchId = '';
    this.startingSide = '';

    return {
      type: 'none',
      players: [],
      myTeamId: '',
      side: ''
    };
  }
}