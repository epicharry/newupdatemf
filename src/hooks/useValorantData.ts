import { useState, useEffect, useRef } from 'react';
import { ValorantAPI } from '../services/valorantAPI';
import { initializeMatchHistoryAPI } from '../services/matchHistoryAPI';
import { MatchData } from '../types/valorant';
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
        await apiRef.current.fetchTokens();
        // Initialize match history API when tokens are available (always fresh)
        const tokens = await apiRef.current.getTokens();
        if (tokens) {
          const region = apiRef.current.getCurrentRegion();
          const shard = apiRef.current.getCurrentShard();
          initializeMatchHistoryAPI(tokens, region, shard);
        }
        setIsConnected(true);
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
      } else if (errorMessage.includes('fetchTokens') || errorMessage.includes('Cannot read properties of undefined')) {
        setError('Please launch Valorant to use this app');
      } else if (errorMessage.includes('Failed to fetch tokens')) {
        setError('Please launch Valorant to use this app');
      } else {
        setError(errorMessage);
      }
      
      setIsConnected(false);
      setMatchDetected(false);
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
    
    // Only auto-refresh if no match is detected
    const interval = setInterval(() => {
      if (!matchDetected) {
        updateData();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [matchDetected]);

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
    refresh: updateData,
    currentRegion: apiRef.current.getCurrentRegion()
  };
};