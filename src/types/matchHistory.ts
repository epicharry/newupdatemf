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
  rounds?: RoundEconomy[];
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
  winningTeamRole?: string;
  bombPlanter?: string;
  bombDefuser?: string;
  plantRoundTime?: number;
  defuseRoundTime?: number;
  plantSite?: string;
  roundResultCode?: string;
}

export interface Kill {
  gameTime: number;
  roundTime: number;
  round: number;
  killer: string;
  victim: string;
  victimLocation: { x: number; y: number };
  assistants: string[];
  finishingDamage: {
    damageType: string;
    damageItem: string;
    isSecondaryFireMode: boolean;
  };
  damage?: number;
}

export interface RoundEconomy {
  round: number;
  playerEconomies: {
    subject: string;
    loadoutValue: number;
    weapon: string;
    armor: string;
    remaining: number;
    spent: number;
  }[];
}


export interface RoundStats {
  roundNum: number;
  result: string;
  winningTeam: string;
  winningTeamRole?: string;
  bombPlanted: boolean;
  bombDefused: boolean;
  plantSite?: string;
  kills: Kill[];
  duration: number;
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