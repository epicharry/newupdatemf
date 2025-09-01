import { ValorantTokens } from '../types/valorant';
import { MatchHistoryAPI } from './matchHistoryAPI';
import { ProcessedMatch } from '../types/matchHistory';

export interface PartyAnalysis {
  playerPuuid: string;
  playerName: string;
  isInParty: boolean;
  partyMembers: string[];
  confidence: number; // 0-100
  matchesAnalyzed: number;
  commonMatches: number;
}

export interface WinTraderAnalysis {
  suspiciousPlayer: string;
  suspiciousPlayerName: string;
  targetOpponent: string;
  targetOpponentName: string;
  totalEncounters: number;
  winRate: number;
  isHighlySuspicious: boolean;
  matchesAnalyzed: number;
}

export class AnalysisService {
  private matchHistoryAPI: MatchHistoryAPI;

  constructor(matchHistoryAPI: MatchHistoryAPI) {
    this.matchHistoryAPI = matchHistoryAPI;
  }

  async analyzeTeammateParties(
    currentTeammates: string[], 
    targetPlayerPuuid: string,
    matchLimit: number = 20
  ): Promise<PartyAnalysis[]> {
    try {
      const analyses: PartyAnalysis[] = [];
      
      // Get target player's match history
      const matches = await this.matchHistoryAPI.getProcessedMatchHistory(targetPlayerPuuid, matchLimit);
      
      for (const teammate of currentTeammates) {
        if (teammate === targetPlayerPuuid) continue; // Skip self
        
        let commonMatches = 0;
        let totalMatches = 0;
        
        // Check each match to see if this teammate was present
        for (const match of matches) {
          totalMatches++;
          
          // Get full match details to check all players
          const matchDetails = await this.matchHistoryAPI.getMatchDetails(match.matchId);
          if (matchDetails) {
            // Check if teammate was in the same team
            const targetPlayer = matchDetails.players.find(p => p.subject === targetPlayerPuuid);
            const teammatePlayer = matchDetails.players.find(p => p.subject === teammate);
            
            if (targetPlayer && teammatePlayer && targetPlayer.teamId === teammatePlayer.teamId) {
              commonMatches++;
            }
          }
        }
        
        const confidence = totalMatches > 0 ? Math.round((commonMatches / totalMatches) * 100) : 0;
        const isInParty = commonMatches >= 3 && confidence >= 30; // At least 3 matches together with 30% rate
        
        analyses.push({
          playerPuuid: teammate,
          playerName: 'Teammate', // Will be filled by caller
          isInParty,
          partyMembers: isInParty ? [targetPlayerPuuid, teammate] : [],
          confidence,
          matchesAnalyzed: totalMatches,
          commonMatches
        });
      }
      
      return analyses;
    } catch (error) {
      console.error('Failed to analyze teammate parties:', error);
      return [];
    }
  }

  async analyzeWinTrading(
    currentTeammates: string[],
    currentEnemies: string[],
    matchLimit: number = 30
  ): Promise<WinTraderAnalysis[]> {
    try {
      const analyses: WinTraderAnalysis[] = [];
      
      // For each teammate, check their history against current enemies
      for (const teammate of currentTeammates) {
        const matches = await this.matchHistoryAPI.getProcessedMatchHistory(teammate, matchLimit);
        
        // Track encounters with each current enemy
        const enemyEncounters: Record<string, { wins: number; total: number; name: string }> = {};
        
        for (const enemy of currentEnemies) {
          enemyEncounters[enemy] = { wins: 0, total: 0, name: 'Enemy' };
        }
        
        // Analyze matches
        for (const match of matches) {
          const matchDetails = await this.matchHistoryAPI.getMatchDetails(match.matchId);
          if (!matchDetails) continue;
          
          const teammatePlayer = matchDetails.players.find(p => p.subject === teammate);
          if (!teammatePlayer) continue;
          
          // Check if any current enemies were opponents in this match
          for (const enemy of currentEnemies) {
            const enemyPlayer = matchDetails.players.find(p => p.subject === enemy);
            if (enemyPlayer && enemyPlayer.teamId !== teammatePlayer.teamId) {
              // They were opponents
              enemyEncounters[enemy].total++;
              enemyEncounters[enemy].name = `${enemyPlayer.gameName}#${enemyPlayer.tagLine}`;
              
              // Check if teammate's team won
              const teammateTeam = matchDetails.teams.find(t => t.teamId === teammatePlayer.teamId);
              if (teammateTeam?.won) {
                enemyEncounters[enemy].wins++;
              }
            }
          }
        }
        
        // Generate analyses for suspicious patterns
        for (const [enemyPuuid, encounter] of Object.entries(enemyEncounters)) {
          if (encounter.total >= 3) { // At least 3 encounters
            const winRate = (encounter.wins / encounter.total) * 100;
            const isHighlySuspicious = encounter.total >= 5 && (winRate >= 80 || winRate <= 20);
            
            analyses.push({
              suspiciousPlayer: teammate,
              suspiciousPlayerName: 'Teammate', // Will be filled by caller
              targetOpponent: enemyPuuid,
              targetOpponentName: encounter.name,
              totalEncounters: encounter.total,
              winRate: Math.round(winRate),
              isHighlySuspicious,
              matchesAnalyzed: matches.length
            });
          }
        }
      }
      
      // Sort by most suspicious first
      return analyses.sort((a, b) => {
        if (a.isHighlySuspicious && !b.isHighlySuspicious) return -1;
        if (!a.isHighlySuspicious && b.isHighlySuspicious) return 1;
        return b.totalEncounters - a.totalEncounters;
      });
    } catch (error) {
      console.error('Failed to analyze win trading:', error);
      return [];
    }
  }
}