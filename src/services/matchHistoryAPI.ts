import { ValorantTokens, PlayerInfo } from '../types/valorant';
import { MatchHistoryEntry, MatchDetails, ProcessedMatch, CompetitiveUpdate } from '../types/matchHistory';
import { CLIENT_PLATFORM, CLIENT_VERSION, DEFAULT_REGION, DEFAULT_SHARD, AGENTS, RANKS } from '../constants/valorant';
import { MAPS, QUEUE_TYPES } from '../constants/maps';

export class MatchHistoryAPI {
  private tokens: ValorantTokens | null = null;
  private region: string = DEFAULT_REGION;
  private shard: string = DEFAULT_SHARD;

  constructor(tokens: ValorantTokens, region?: string, shard?: string) {
    this.tokens = tokens;
    if (region) this.region = region;
    if (shard) this.shard = shard;
  }

  private getHeaders(): Record<string, string> {
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
    try {
      const headers = this.getHeaders();
      const response = await window.electronAPI.makeRequest({
        url,
        headers,
        ...options
      });
      
      return response;
    } catch (error) {
      // If request fails, try refreshing tokens once
      console.warn('Match history request failed, attempting token refresh:', error);
      
      // Re-fetch tokens
      try {
        this.tokens = await window.electronAPI.fetchTokens();
        const headers = this.getHeaders();
        
        return await window.electronAPI.makeRequest({
          url,
          headers,
          ...options
        });
      } catch (retryError) {
        console.error('Token refresh and retry failed:', retryError);
        throw error; // Throw original error
      }
    }
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
    try {
      const response = await this.makeRequestWithRetry(
        `https://pd.${this.region}.a.pvp.net/match-details/v1/matches/${matchId}`
      );

      if (response.status === 200) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to fetch match details for ${matchId}:`, error);
      return null;
    }
  }

  async getCompetitiveUpdates(puuid: string): Promise<CompetitiveUpdate[]> {
    try {
      const response = await this.makeRequestWithRetry(
        `https://pd.${this.region}.a.pvp.net/mmr/v1/players/${puuid}/competitiveupdates`
      );

      if (response.status === 200 && response.data?.Matches) {
        return response.data.Matches;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to fetch competitive updates:', error);
      return [];
    }
  }

  async getProcessedMatchHistory(puuid: string, limit: number = 10): Promise<ProcessedMatch[]> {
    try {
      const history = await this.getMatchHistory(puuid, 0, limit);
      const processedMatches: ProcessedMatch[] = [];

      for (const historyEntry of history) {
        // Create basic match info with minimal data for fast loading
        const basicMatch: ProcessedMatch = {
          matchId: historyEntry.MatchID,
          gameStartTime: historyEntry.gameStartMillis,
          mapName: 'Loading...',
          mapImage: 'https://via.placeholder.com/300x200?text=Loading',
          queueType: historyEntry.queueID || 'Unknown',
          isRanked: historyEntry.queueID === 'competitive',
          playerStats: {
            kills: 0,
            deaths: 0,
            assists: 0,
            score: 0,
            agent: 'Loading...',
            agentImage: 'https://via.placeholder.com/64x64?text=?',
            kda: '? / ? / ?'
          },
          matchResult: 'defeat',
          teamScore: 0,
          enemyScore: 0,
          scoreDisplay: '? – ?',
          isTeamMVP: false,
          competitiveTier: 0,
          gameLength: 0,
          rrChange: undefined
        };
        processedMatches.push(basicMatch);
      }

      return processedMatches.sort((a, b) => b.gameStartTime - a.gameStartTime);
    } catch (error) {
      console.error('Failed to get processed match history:', error);
      return [];
    }
  }

  async getFullMatchData(matchId: string, puuid: string): Promise<ProcessedMatch | null> {
    try {
      const matchDetails = await this.getMatchDetails(matchId);
      if (!matchDetails) return null;

      const competitiveUpdates = await this.getCompetitiveUpdates(puuid);
      const competitiveUpdate = competitiveUpdates.find(update => update.MatchID === matchId);
      
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

      // Find player's team
      const targetPlayer = matchDetails.players.find(p => p.subject === targetPuuid);
      if (!targetPlayer) return null;

      const myTeamId = targetPlayer.teamId;
      const enemyTeamId = myTeamId === 'Blue' ? 'Red' : 'Blue';

      // Separate teams and ensure all players have competitive tier
      const myTeam = matchDetails.players.filter(p => p.teamId === myTeamId).map(player => ({
        ...player,
        competitiveTier: player.competitiveTier || 0 // Ensure tier is set for non-competitive matches
      }));
      const enemyTeam = matchDetails.players.filter(p => p.teamId === enemyTeamId).map(player => ({
        ...player,
        competitiveTier: player.competitiveTier || 0 // Ensure tier is set for non-competitive matches
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

      // Format KDA
      const kda = `${player.stats.kills}/${player.stats.deaths}/${player.stats.assists}`;

      return {
        matchId: matchDetails.matchInfo.matchId,
        gameStartTime: matchDetails.matchInfo.gameStartMillis,
        mapName: mapInfo.name,
        mapImage: mapInfo.image,
        queueType: QUEUE_TYPES[matchDetails.matchInfo.queueID] || 'Unknown',
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