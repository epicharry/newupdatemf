import { ValorantTokens, RankInfo, MatchData, PlayerInfo } from '../types/valorant';
import { CLIENT_PLATFORM, CLIENT_VERSION, DEFAULT_REGION, DEFAULT_SHARD, AGENTS, RANKS } from '../constants/valorant';
import { ConfigService } from './configService';
import { RegionService } from './regionService';

export class ValorantAPI {
  private tokens: ValorantTokens | null = null;
  private lastTokenFetch: number = 0;
  private readonly TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private configService: ConfigService;
  private currentRegion: string = DEFAULT_REGION;
  private currentShard: string = DEFAULT_SHARD;
  private currentMatchId: string = '';
  private startingSide: string = '';

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
    const shouldRefresh = !this.tokens || (now - this.lastTokenFetch) > this.TOKEN_REFRESH_INTERVAL;
    
    if (shouldRefresh) {
      try {
        await this.fetchTokens();
      } catch (error) {
        console.warn('Token refresh failed, continuing with existing tokens:', error);
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
    let headers = await this.getHeaders();
    
    try {
      const response = await window.electronAPI.makeRequest({
        url,
        headers,
        ...options
      });
      
      return response;
    } catch (error) {
      // If request fails, try refreshing tokens once
      console.warn('Request failed, attempting token refresh:', error);
      await this.fetchTokens();
      headers = await this.getHeaders();
      
      return await window.electronAPI.makeRequest({
        url,
        headers,
        ...options
      });
    }
  }

  async getPlayerRank(puuid: string): Promise<RankInfo> {
    try {
      // Try competitive updates first
      const competitiveResponse = await this.makeRequestWithRetry(
        `https://pd.${this.currentRegion}.a.pvp.net/mmr/v1/players/${puuid}/competitiveupdates`
      );

      if (competitiveResponse.status === 200 && competitiveResponse.data?.Matches) {
        for (const match of competitiveResponse.data.Matches) {
          if (match.TierAfterUpdate > 0) {
            return {
              tier: match.TierAfterUpdate,
              rr: match.RankedRatingAfterUpdate,
              rank: RANKS[match.TierAfterUpdate] || "Unranked"
            };
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
          return {
            tier: currentTier,
            rr: currentRR,
            rank: RANKS[currentTier] || "Unranked"
          };
        }

        // Final fallback to seasonal info
        const seasonalInfo = competitive.SeasonalInfoBySeasonID || {};
        if (Object.keys(seasonalInfo).length > 0) {
          const latestSeason = Object.values(seasonalInfo)[Object.values(seasonalInfo).length - 1] as any;
          if (latestSeason.CompetitiveTier > 0) {
            return {
              tier: latestSeason.CompetitiveTier,
              rr: latestSeason.RankedRating,
              rank: RANKS[latestSeason.CompetitiveTier] || "Unranked"
            };
          }
        }
      }
    } catch (error) {
      console.error(`Rank fetch error: ${error}`);
    }

    return { tier: 0, rr: 0, rank: "Unranked" };
  }

  async getPlayerNames(puuids: string[]): Promise<Record<string, string>> {
    try {
      const response = await this.makeRequestWithRetry(
        `https://pd.${this.currentRegion}.a.pvp.net/name-service/v2/players`,
        {
        method: 'PUT',
        body: puuids
        }
      );

      if (response.status === 200) {
        return response.data.reduce((acc: Record<string, string>, player: any) => {
          acc[player.Subject] = `${player.GameName}#${player.TagLine}`;
          return acc;
        }, {});
      }
    } catch (error) {
      console.error('Failed to fetch player names:', error);
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