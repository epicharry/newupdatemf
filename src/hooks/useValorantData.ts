import { useState, useEffect, useRef } from 'react';
import { ValorantAPI } from '../services/valorantAPI';
import { initializeMatchHistoryAPI } from '../services/matchHistoryAPI';
import { MatchData, RankInfo } from '../types/valorant';
import { supabase } from '../services/supabaseClient';

export const useValorantData = () => {
  const [matchData, setMatchData] = useState<MatchData>({
    type: 'none',
    players: [],
    myTeamId: '',
    side: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [matchDetected, setMatchDetected] = useState(false);
  const [databaseConnected, setDatabaseConnected] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  
  const [currentUserRank, setCurrentUserRank] = useState<RankInfo | null>(null);
  
  const apiRef = useRef<ValorantAPI>(new ValorantAPI());

  const updateData = async () => {
    try {
      // Always check database connection first
      try {
        const { error: dbError } = await supabase.from('users').select('puuid').limit(1);
        if (dbError) {
          throw new Error('Database connection failed');
        }
        setDatabaseConnected(true);
      } catch (dbError) {
        console.error('Database connection failed:', dbError);
        setDatabaseConnected(false);
        setError('Database connection failed. App cannot function without database access.');
        setIsConnected(false);
        setMatchDetected(false);
        return;
      }

      setIsLoading(true);
      setError('');
      
      // Try to fetch tokens if not connected
      if (!isConnected) {
        try {
          console.log('Fetching fresh tokens...');
          await apiRef.current.fetchTokens();
          console.log('Tokens fetched successfully');
        } catch (error) {
          // Don't retry immediately on rate limit errors
          if (error.toString().includes('429')) {
            console.warn('Rate limited during token fetch - backing off');
            setError('Rate limited - please wait before refreshing');
            return;
          }
          throw error;
        }
        
        // Initialize match history API when tokens are available (always fresh)
        const tokens = await apiRef.current.getTokens();
        if (tokens) {
          const region = apiRef.current.getCurrentRegion();
          const shard = apiRef.current.getCurrentShard();
          console.log('Reinitializing match history API with fresh tokens');
          initializeMatchHistoryAPI(tokens, region, shard);
        }
        setIsConnected(true);
      } else {
        // Even if connected, ensure match history API has fresh tokens
        try {
          const tokens = await apiRef.current.getTokens();
          if (tokens) {
            const region = apiRef.current.getCurrentRegion();
            const shard = apiRef.current.getCurrentShard();
            initializeMatchHistoryAPI(tokens, region, shard);
          }
        } catch (error) {
          console.warn('Failed to refresh match history API tokens:', error);
        }
      }
      
      const data = await apiRef.current.getMatchData();
      setMatchData(data);
      
      // Update match detection status
      const hasMatch = data.type !== 'none';
      setMatchDetected(hasMatch);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      // Convert technical errors to user-friendly messages
      if (errorMessage.includes('Database connection failed')) {
        setError('Database connection failed. App cannot function without database access.');
        setDatabaseConnected(false);
      } else if (errorMessage.includes('429') || errorMessage.includes('Rate limited')) {
        setError('Rate limited by Riot API. Please wait a moment before refreshing.');
      } else if (errorMessage.includes('fetchTokens') || errorMessage.includes('Cannot read properties of undefined')) {
        setError('Please launch Valorant to use this app');
      } else if (errorMessage.includes('Failed to fetch tokens')) {
        setError('Please launch Valorant to use this app');
      } else {
        setError(errorMessage);
      }
      
      setIsConnected(false);
      setMatchDetected(false);
      setCurrentUserRank(null);
      setMatchData({
        type: 'none',
        players: [],
        myTeamId: '',
        side: ''
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    updateData();
    
    // Only auto-refresh if no match is detected and not in cooldown
    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTime;
      
      // Increased interval to reduce API pressure
      if (!matchDetected && timeSinceLastRefresh >= 10000) {
        updateData();
      }
    }, 10000); // Increased from 5 seconds to 10 seconds

    return () => clearInterval(interval);
  }, [matchDetected, lastRefreshTime]);

  const manualRefresh = () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;
    
    // Enforce 15-second cooldown for manual refresh when match is detected
    if (matchDetected && timeSinceLastRefresh < 15000) {
      return;
    }
    
    setLastRefreshTime(now);
    updateData();
  };

  const getStatus = () => {
    if (error) return `Error: ${error}`;
    if (matchData.type === 'pregame') return 'Match Found - Agent Select';
    if (matchData.type === 'live') return 'Match Found - In Progress';
    return 'Not in a match';
  };

  const myTeamPlayers = matchData.players.filter(p => p.teamId === matchData.myTeamId);
  const enemyTeamPlayers = matchData.players.filter(p => p.teamId !== matchData.myTeamId);

  return {
    status: getStatus(),
    side: matchData.side,
    myTeamPlayers,
    enemyTeamPlayers,
    isLoading,
    isConnected,
    matchDetected,
    totalPlayers: matchData.players.length,
    refresh: manualRefresh,
    currentRegion: apiRef.current.getCurrentRegion(),
    matchType: matchData.type,
    currentUserRank
  };
};