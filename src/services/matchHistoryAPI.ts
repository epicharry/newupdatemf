import { ValorantTokens, PlayerInfo } from '../types/valorant';
import { MatchHistoryEntry, MatchDetails, ProcessedMatch, CompetitiveUpdate } from '../types/matchHistory';
import { CLIENT_PLATFORM, CLIENT_VERSION, DEFAULT_REGION, DEFAULT_SHARD, AGENTS, RANKS } from '../constants/valorant';
import { MAPS, QUEUE_TYPES } from '../constants/maps';

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxRequestsPerSecond: 2, // Conservative rate limit
  requestQueue: [] as Array<() => Promise<any>>,
  isProcessing: false,
  lastRequestTime: 0
};

// Cache configuration
const CACHE_CONFIG = {
  matchDetails: new Map<string, { data: MatchDetails; timestamp: number }>(),
  competitiveUpdates: new Map<string, { data: CompetitiveUpdate[]; timestamp: number }>(),
  processedMatches: new Map<string, { data: ProcessedMatch[]; timestamp: number }>(),
  cacheDuration: 5 * 60 * 1000 // 5 minutes
};

// Rate limiting helper
async function rateLimitedRequest<T>(requestFn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    RATE_LIMIT_CONFIG.requestQueue.push(async () => {
      try {
        const result = await requestFn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
    
    processRequestQueue();
  });
}

async function processRequestQueue() {
  if (RATE_LIMIT_CONFIG.isProcessing || RATE_LIMIT_CONFIG.requestQueue.length === 0) {
    return;
  }
  
  RATE_LIMIT_CONFIG.isProcessing = true;
  
  while (RATE_LIMIT_CONFIG.requestQueue.length > 0) {
    const now = Date.now();
    const timeSinceLastRequest = now - RATE_LIMIT_CONFIG.lastRequestTime;
    const minInterval = 1000 / RATE_LIMIT_CONFIG.maxRequestsPerSecond;
    
    if (timeSinceLastRequest < minInterval) {
      await new Promise(resolve => setTimeout(resolve, minInterval - timeSinceLastRequest));
    }
    
    const request = RATE_LIMIT_CONFIG.requestQueue.shift();
    if (request) {
      RATE_LIMIT_CONFIG.lastRequestTime = Date.now();
      await request();
    }
  }
  
  RATE_LIMIT_CONFIG.isProcessing = false;
}

// Cache helper functions
function getCachedData<T>(cache: Map<string, { data: T; timestamp: number }>, key: string): T | null {
  const cached = cache.get(key);
  if (cached && (Date.now() - cached.timestamp) < CACHE_CONFIG.cacheDuration) {
    return cached.data;
  }
  return null;
}

function setCachedData<T>(cache: Map<string, { data: T; timestamp: number }>, key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export class MatchHistoryAPI {
  private tokens: ValorantTokens | null = null;
  private lastTokenRefresh: number = 0;
  private readonly TOKEN_REFRESH_INTERVAL = 2 * 60 * 1000; // 2 minutes
  private region: string = DEFAULT_REGION;
  private shard: string = DEFAULT_SHARD;

  constructor(tokens: ValorantTokens, region?: string, shard?: string) {
    this.tokens = tokens;
    this.lastTokenRefresh = Date.now();
    if (region) this.region = region;
    if (shard) this.shard = shard;
  }

  private getHeaders(): Record<string, string> {
    // Check if tokens need refresh
    const now = Date.now();
    if (!this.tokens || (now - this.lastTokenRefresh) > this.TOKEN_REFRESH_INTERVAL) {
      throw new Error('Tokens expired - need refresh');
    }
    
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
    return rateLimitedRequest(async () => {
      try {
        const headers = this.getHeaders();
        const response = await window.electronAPI.makeRequest({
          url,
          headers,
          ...options
        });
        
        return response;
      } catch (error) {
        const errorStr = error.toString();
        
        // Check if it's a rate limit error
        if (errorStr.includes('429')) {
          console.warn('Rate limited, backing off...');
          // Wait longer for rate limit errors
          await new Promise(resolve => setTimeout(resolve, 5000));
          throw new Error('Rate limited - please wait before making more requests');
        }
        
        // Check if it's an auth error or token expiration
        if (errorStr.includes('401') || errorStr.includes('403') || 
            errorStr.includes('Unauthorized') || errorStr.includes('Tokens expired')) {
          console.warn('Auth error detected, need fresh tokens:', error);
          
          // Re-fetch tokens from the main process
          try {
            this.tokens = await window.electronAPI.fetchTokens();
            this.lastTokenRefresh = Date.now();
            console.log('Tokens refreshed for match history API');
            
            const headers = this.getHeaders();
            return await window.electronAPI.makeRequest({
              url,
              headers,
              ...options
            });
          } catch (retryError) {
            console.error('Token refresh and retry failed:', retryError);
            throw new Error('Authentication failed - please restart Valorant');
          }
        }
        
        // For other errors, don't retry
        throw error;
      }
    });
  }

  async getMatchHistory(puuid: string, startIndex: number = 0, endIndex: number = 20): Promise<MatchHistoryEntry[]> {
    try {
      const response = await this.makeRequestWithRetry(
        `https://pd.${this.region}.a.pvp.net/match-history/v1/history/${puuid}?startIndex=${startIndex}&endIndex=${endIndex}`
      );

      if (response.status === 200 && response.data?.History) {
        return response.data.History;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to fetch match history:', error);
      return [];
    }
  }

  async getMatchDetails(matchId: string): Promise<MatchDetails | null> {
    // Check cache first
    const cached = getCachedData(CACHE_CONFIG.matchDetails, matchId);
    if (cached) {
      return cached;
    }
    
    try {
      const response = await this.makeRequestWithRetry(
        `https://pd.${this.region}.a.pvp.net/match-details/v1/matches/${matchId}`
      );

      if (response.status === 200) {
        // Cache the result
        setCachedData(CACHE_CONFIG.matchDetails, matchId, response.data);
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to fetch match details for ${matchId}:`, error);
      return null;
    }
  }

  async getCompetitiveUpdates(puuid: string): Promise<CompetitiveUpdate[]> {
    // Check cache first
    const cached = getCachedData(CACHE_CONFIG.competitiveUpdates, puuid);
    if (cached) {
      return cached;
    }
    
    try {
      const response = await this.makeRequestWithRetry(
        `https://pd.${this.region}.a.pvp.net/mmr/v1/players/${puuid}/competitiveupdates`
      );

      if (response.status === 200 && response.data?.Matches) {
        // Cache the result
        setCachedData(CACHE_CONFIG.competitiveUpdates, puuid, response.data.Matches);
        return response.data.Matches;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to fetch competitive updates:', error);
      return [];
    }
  }

  async getProcessedMatchHistory(puuid: string, limit: number = 10): Promise<ProcessedMatch[]> {
    // Check cache first
    const cacheKey = `${puuid}-${limit}`;
    const cached = getCachedData(CACHE_CONFIG.processedMatches, cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      const history = await this.getMatchHistory(puuid, 0, limit);
      const processedMatches: ProcessedMatch[] = [];

      // Get competitive updates once for the user (not per match)
      let competitiveUpdates: CompetitiveUpdate[] = [];
      try {
        competitiveUpdates = await this.getCompetitiveUpdates(puuid);
      } catch (error) {
        console.warn('Failed to fetch competitive updates, continuing without RR data:', error);
      }

      for (const historyEntry of history) {
        // Get full match details for each match
        const matchDetails = await this.getMatchDetails(historyEntry.MatchID);
        if (matchDetails) {
          const competitiveUpdate = competitiveUpdates.find(update => update.MatchID === historyEntry.MatchID);
          
          const processedMatch = this.processMatchData(matchDetails, puuid, competitiveUpdate);
          if (processedMatch) {
            processedMatches.push(processedMatch);
          }
        }
        
        // Add a small delay between match detail requests to avoid overwhelming the API
        if (processedMatches.length < history.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const sortedMatches = processedMatches.sort((a, b) => b.gameStartTime - a.gameStartTime);
      
      // Cache the result
      setCachedData(CACHE_CONFIG.processedMatches, cacheKey, sortedMatches);
      
      return sortedMatches;
    } catch (error) {
      console.error('Failed to get processed match history:', error);
      return [];
    }
  }

  async getFullMatchData(matchId: string, puuid: string): Promise<ProcessedMatch | null> {
    try {
      const matchDetails = await this.getMatchDetails(matchId);
      if (!matchDetails) return null;

      let competitiveUpdate: CompetitiveUpdate | undefined;
      try {
        const competitiveUpdates = await this.getCompetitiveUpdates(puuid);
        competitiveUpdate = competitiveUpdates.find(update => update.MatchID === matchId);
      } catch (error) {
        console.warn('Failed to fetch competitive updates for match:', error);
      }
      
      return this.processMatchData(matchDetails, puuid, competitiveUpdate);
    } catch (error) {
      console.error('Failed to get full match data:', error);
      return null;
    }
  }

  async getMatchDetailsForDisplay(matchId: string, targetPuuid: string): Promise<{
    matchDetails: MatchDetails;
    myTeam: MatchPlayer[];
    enemyTeam: MatchPlayer[];
    myTeamId: string;
    enemyTeamId: string;
    matchResult: 'victory' | 'defeat' | 'draw';
    myTeamScore: number;
    enemyTeamScore: number;
  } | null> {
    try {
      const matchDetails = await this.getMatchDetails(matchId);
      if (!matchDetails) return null;

      // Check if this is deathmatch mode
      const isDeathmatch = matchDetails.matchInfo.queueID === 'deathmatch';
      
      if (isDeathmatch) {
        // In deathmatch, all players are in one list, no teams
        const allPlayers = matchDetails.players.map(player => ({
          ...player,
          competitiveTier: player.competitiveTier || 0
        }));
        
        // Find target player to determine their result
        const targetPlayer = allPlayers.find(p => p.subject === targetPuuid);
        if (!targetPlayer) return null;
        
        // In deathmatch, result is based on individual performance
        // Find the winner (player with most kills or highest score)
        const winner = allPlayers.reduce((prev, current) => 
          (current.stats.kills > prev.stats.kills) ? current : prev
        );
        
        const matchResult: 'victory' | 'defeat' | 'draw' = 
          targetPlayer.subject === winner.subject ? 'victory' : 'defeat';
        
        return {
          matchDetails,
          myTeam: allPlayers, // All players in one team for deathmatch
          enemyTeam: [], // No enemy team in deathmatch
          myTeamId: 'deathmatch',
          enemyTeamId: '',
          matchResult,
          myTeamScore: targetPlayer.stats.kills,
          enemyTeamScore: winner.stats.kills
        };
      } else {
        // Regular team-based modes
        const targetPlayer = matchDetails.players.find(p => p.subject === targetPuuid);
        if (!targetPlayer) return null;

        const myTeamId = targetPlayer.teamId;
        const enemyTeamId = myTeamId === 'Blue' ? 'Red' : 'Blue';

        // Separate teams and ensure all players have competitive tier
        const myTeam = matchDetails.players.filter(p => p.teamId === myTeamId).map(player => ({
          ...player,
          competitiveTier: player.competitiveTier || 0
        }));
        const enemyTeam = matchDetails.players.filter(p => p.teamId === enemyTeamId).map(player => ({
          ...player,
          competitiveTier: player.competitiveTier || 0
        }));

        // Get team scores
        const myTeamData = matchDetails.teams.find(t => t.teamId === myTeamId);
        const enemyTeamData = matchDetails.teams.find(t => t.teamId === enemyTeamId);

        const myTeamScore = myTeamData?.roundsWon || 0;
        const enemyTeamScore = enemyTeamData?.roundsWon || 0;

        // Determine match result
        let matchResult: 'victory' | 'defeat' | 'draw' = 'defeat';
        if (myTeamData?.won) {
          matchResult = 'victory';
        } else if (myTeamScore === enemyTeamScore) {
          matchResult = 'draw';
        }

        return {
          matchDetails,
          myTeam,
          enemyTeam,
          myTeamId,
          enemyTeamId,
          matchResult,
          myTeamScore,
          enemyTeamScore
        };
      }
    } catch (error) {
      console.error('Failed to get match details for display:', error);
      return null;
    }
  }
  async getProcessedCompetitiveHistory(puuid: string, limit: number = 10): Promise<ProcessedMatch[]> {
    // Always fetch fresh data for competitive history
    const allMatches = await this.getProcessedMatchHistory(puuid, limit);
    return allMatches.filter(match => match.isRanked);
  }

  private processMatchData(matchDetails: MatchDetails, targetPuuid: string, competitiveUpdate?: CompetitiveUpdate): ProcessedMatch | null {
    try {
      const player = matchDetails.players.find(p => p.subject === targetPuuid);
      if (!player) return null;

      const playerTeam = matchDetails.teams.find(t => t.teamId === player.teamId);
      const enemyTeam = matchDetails.teams.find(t => t.teamId !== player.teamId);
      
      if (!playerTeam || !enemyTeam) return null;

      // Determine match result
      let matchResult: 'victory' | 'defeat' | 'draw' = 'defeat';
      if (playerTeam.won) {
        matchResult = 'victory';
      } else if (playerTeam.roundsWon === enemyTeam.roundsWon) {
        matchResult = 'draw';
      }

      // Check if player is team MVP (highest score on team)
      const teamPlayers = matchDetails.players.filter(p => p.teamId === player.teamId);
      const isTeamMVP = teamPlayers.every(p => p.stats.score <= player.stats.score);

      // Get map info
      const mapInfo = MAPS[matchDetails.matchInfo.mapId] || { 
        name: 'Unknown Map', 
        image: 'https://via.placeholder.com/300x200?text=Unknown+Map' 
      };

      // Get agent info
      const agentName = AGENTS[player.characterId] || 'Unknown';

      // Determine queue type - handle custom games
      let queueType = QUEUE_TYPES[matchDetails.matchInfo.queueID] || 'Unknown';
      
      // Check if it's a custom game based on provisioning flow
      if (matchDetails.matchInfo.provisioningFlow === 'CustomGame' || 
          matchDetails.matchInfo.queueID === 'custom') {
        queueType = 'Custom Game';
      }

      // Format KDA
      const kda = `${player.stats.kills}/${player.stats.deaths}/${player.stats.assists}`;

      return {
        matchId: matchDetails.matchInfo.matchId,
        gameStartTime: matchDetails.matchInfo.gameStartMillis,
        mapName: mapInfo.name,
        mapImage: mapInfo.image,
        queueType,
        isRanked: matchDetails.matchInfo.isRanked,
        playerStats: {
          kills: player.stats.kills,
          deaths: player.stats.deaths,
          assists: player.stats.assists,
          score: player.stats.score,
          agent: agentName,
          agentImage: `https://media.valorant-api.com/agents/${player.characterId}/displayicon.png`,
          kda
        },
        matchResult,
        teamScore: playerTeam.roundsWon,
        enemyScore: enemyTeam.roundsWon,
        scoreDisplay: `${playerTeam.roundsWon} – ${enemyTeam.roundsWon}`,
        isTeamMVP,
        competitiveTier: player.competitiveTier,
        gameLength: matchDetails.matchInfo.gameLengthMillis || matchDetails.matchInfo.gameLength,
        rrChange: competitiveUpdate?.RankedRatingEarned
      };
    } catch (error) {
      console.error('Error processing match data:', error);
      return null;
    }
  }
}

// Global function to be used by the hook
let matchHistoryAPI: MatchHistoryAPI | null = null;

export const initializeMatchHistoryAPI = (tokens: ValorantTokens, region?: string, shard?: string) => {
  console.log('Initializing match history API with fresh tokens');
  matchHistoryAPI = new MatchHistoryAPI(tokens, region, shard);
};

export const getMatchDetails = async (matchId: string): Promise<MatchDetails | null> => {
  if (!matchHistoryAPI) return null;
  return matchHistoryAPI.getMatchDetails(matchId);
};

export const getMatchDetailsForDisplay = async (matchId: string, targetPuuid: string) => {
  if (!matchHistoryAPI) return null;
  return matchHistoryAPI.getMatchDetailsForDisplay(matchId, targetPuuid);
};
export const getProcessedMatchHistory = async (puuid: string, limit: number = 10): Promise<ProcessedMatch[]> => {
  if (!matchHistoryAPI) return [];
  return matchHistoryAPI.getProcessedMatchHistory(puuid, limit);
};

export const getProcessedCompetitiveHistory = async (puuid: string, limit: number = 10): Promise<ProcessedMatch[]> => {
  if (!matchHistoryAPI) return [];
  return matchHistoryAPI.getProcessedCompetitiveHistory(puuid, limit);
};

export const getFullMatchData = async (matchId: string, puuid: string): Promise<ProcessedMatch | null> => {
  if (!matchHistoryAPI) return null;
  return matchHistoryAPI.getFullMatchData(matchId, puuid);
}