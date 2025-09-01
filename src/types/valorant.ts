export interface ValorantTokens {
  authToken: string;
  entToken: string;
  puuid: string;
}

export interface Player {
  Subject: string;
  TeamID: string;
  CharacterID?: string;
}

export interface RankInfo {
  tier: number;
  rr: number;
  rank: string;
}

export interface PlayerInfo {
  puuid: string;
  name: string;
  agent: string;
  agentImageUrl?: string;
  rank: RankInfo;
  teamId: string;
  isCurrentUser?: boolean;
}

export interface MatchData {
  type: 'pregame' | 'live' | 'none';
  players: PlayerInfo[];
  myTeamId: string;
  side: string;
}

declare global {
  interface Window {
    electronAPI: {
      fetchTokens: () => Promise<ValorantTokens>;
      makeRequest: (options: {
        url: string;
        headers: Record<string, string>;
        method?: string;
        body?: any;
      }) => Promise<{ status: number; data: any }>;
    };
  }
}