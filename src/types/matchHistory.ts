export interface MatchHistoryEntry {
  matchID: string;
  gameStartMillis: number;
  queueID: string;
}

export interface MatchDetails {
  matchInfo: {
    matchId: string;
    mapId: string;
    gameStartMillis: number;
    gameLength: number;
    isCompleted: boolean;
    queueID: string;
    isRanked: boolean;
  };
  players: MatchPlayer[];
  teams: MatchTeam[];
  roundResults: RoundResult[];
}

export interface MatchPlayer {
  subject: string;
  gameName: string;
  tagLine: string;
  teamId: string;
  partyId: string;
  characterId: string;
  stats: {
    kills: number;
    deaths: number;
    assists: number;
    score: number;
    bodyshots: number;
    headshots: number;
    legshots: number;
  };
  competitiveTier: number;
  playerCard: string;
  playerTitle: string;
}

export interface MatchTeam {
  teamId: string;
  won: boolean;
  roundsPlayed: number;
  roundsWon: number;
  numPoints: number;
}

export interface RoundResult {
  roundNum: number;
  roundResult: string;
  roundCeremony: string;
  winningTeam: string;
}

export interface ProcessedMatch {
  matchId: string;
  gameStartTime: number;
  mapName: string;
  mapImage: string;
  queueType: string;
  isRanked: boolean;
  playerStats: {
    kills: number;
    deaths: number;
    assists: number;
    score: number;
    agent: string;
    agentImage: string;
    kda: string;
  };
  matchResult: 'victory' | 'defeat' | 'draw';
  teamScore: number;
  enemyScore: number;
  scoreDisplay: string;
  isTeamMVP: boolean;
  competitiveTier: number;
  gameLength: number;
  gameLengthMillis: number;
  rrChange?: number;
}

export interface CompetitiveUpdate {
  MatchID: string;
  TierBeforeUpdate: number;
  TierAfterUpdate: number;
  RankedRatingEarned: number;
  RankedRatingPost: number;
  CompetitiveMovement: string;
  AFKPenalty: number;
}