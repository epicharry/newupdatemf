import React, { useState, useEffect } from 'react';
import { ArrowLeft, Crown, Clock, Target, Filter, ExternalLink, Moon, Sun } from 'lucide-react';
import { PlayerInfo } from '../types/valorant';
import { ProcessedMatch } from '../types/matchHistory';
import { getProcessedMatchHistory, getProcessedCompetitiveHistory } from '../services/matchHistoryAPI';
import { MatchDetailsPage } from './MatchDetailsPage';

interface MatchHistoryPageProps {
  player: PlayerInfo;
  onBack: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const MatchHistoryPage: React.FC<MatchHistoryPageProps> = ({
  player,
  onBack,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [matches, setMatches] = useState<ProcessedMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCompetitiveOnly, setShowCompetitiveOnly] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    loadMatchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.puuid, showCompetitiveOnly]);

  const loadMatchHistory = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Use cached data when available to reduce API calls
      const matchHistory = showCompetitiveOnly
        ? await getProcessedCompetitiveHistory(player.puuid, 10) // Reduced from 15 to 10
        : await getProcessedMatchHistory(player.puuid, 10); // Reduced from 15 to 10
      
      setMatches(matchHistory);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load match history';
      
      // Handle rate limiting specifically
      if (errorMessage.includes('429') || errorMessage.includes('Rate limited')) {
        setError('Rate limited by Riot API. Please wait a moment before refreshing.');
      } else {
        setError(errorMessage);
      }
      
      console.error('Match history error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const openTrackerProfile = () => {
    const encodedName = encodeURIComponent(player.name);
    const trackerUrl = `https://tracker.gg/valorant/profile/riot/${encodedName}/overview`;
    (window as any).electronAPI?.openExternal?.(trackerUrl) || window.open(trackerUrl, '_blank');
  };

  const getRankColor = (tier: number) => {
    if (tier === 0) return isDarkMode ? 'text-gray-400' : 'text-gray-500';
    if (tier <= 5) return 'text-amber-600'; // Iron
    if (tier <= 8) return 'text-amber-500'; // Bronze
    if (tier <= 11) return isDarkMode ? 'text-gray-300' : 'text-gray-600'; // Silver
    if (tier <= 14) return 'text-yellow-500'; // Gold
    if (tier <= 17) return 'text-cyan-500'; // Platinum
    if (tier <= 20) return 'text-blue-500'; // Diamond
    if (tier <= 23) return 'text-green-500'; // Ascendant
    if (tier <= 26) return 'text-purple-500'; // Immortal
    return 'text-yellow-400'; // Radiant
  };

  const formatGameTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const formatGameLength = (lengthMs: number) => {
    const minutes = Math.floor(lengthMs / (1000 * 60));
    const seconds = Math.floor((lengthMs % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMatchClick = async (match: ProcessedMatch) => {
    try {
      // Dynamically import the function to avoid loading it until needed
      const { getMatchDetailsForDisplay } = await import('../services/matchHistoryAPI');
      const matchDetails = await getMatchDetailsForDisplay(match.matchId, player.puuid);
      if (matchDetails) {
        setSelectedMatch(matchDetails);
      }
    } catch (error) {
      console.error('Failed to load match details:', error);
    }
  };

  const handleBackFromMatch = () => {
    setSelectedMatch(null);
  };

  // Show match details if a match is selected
  if (selectedMatch) {
    return (
      <MatchDetailsPage
        matchDetails={selectedMatch.matchDetails}
        myTeam={selectedMatch.myTeam}
        enemyTeam={selectedMatch.enemyTeam}
        myTeamId={selectedMatch.myTeamId}
        enemyTeamId={selectedMatch.enemyTeamId}
        matchResult={selectedMatch.matchResult}
        myTeamScore={selectedMatch.myTeamScore}
        enemyTeamScore={selectedMatch.enemyTeamScore}
        onBack={handleBackFromMatch}
        isDarkMode={isDarkMode}
        onToggleDarkMode={onToggleDarkMode}
      />
    );
  }

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        isDarkMode
          ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
          : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
      }`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: isDarkMode
              ? `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
                 radial-gradient(circle at 75% 75%, rgba(239, 68, 68, 0.3) 0%, transparent 50%)`
              : `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.2) 0%, transparent 50%),
                 radial-gradient(circle at 75% 75%, rgba(239, 68, 68, 0.2) 0%, transparent 50%)`
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className={`
              p-3 rounded-full backdrop-blur-sm border transition-all duration-300
              hover:scale-110 active:scale-95 mr-4
              ${
                isDarkMode
                  ? 'bg-slate-800/40 border-slate-700/50 text-gray-300 hover:bg-slate-800/60'
                  : 'bg-white/20 border-white/30 text-gray-700 hover:bg-white/30'
              }
            `}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1
            className={`text-2xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}
          >
            Match History
          </h1>
          
          {/* Dark Mode Toggle */}
          <div className="ml-auto">
            <button
              onClick={onToggleDarkMode}
              className={`
                p-3 rounded-full backdrop-blur-sm border transition-all duration-300
                hover:scale-110 active:scale-95
                ${isDarkMode 
                  ? 'bg-slate-800/40 border-slate-700/50 text-yellow-400 hover:bg-slate-800/60' 
                  : 'bg-white/20 border-white/30 text-gray-700 hover:bg-white/30'
                }
              `}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setShowCompetitiveOnly(!showCompetitiveOnly)}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300
              backdrop-blur-sm border hover:scale-105 active:scale-95
              ${
                showCompetitiveOnly
                  ? isDarkMode
                    ? 'bg-blue-600/30 border-blue-500/50 text-blue-300'
                    : 'bg-blue-500/30 border-blue-400/50 text-blue-700'
                  : isDarkMode
                    ? 'bg-slate-800/40 border-slate-700/50 text-gray-300 hover:bg-slate-800/60'
                    : 'bg-white/20 border-white/30 text-gray-700 hover:bg-white/30'
              }
            `}
          >
            <Filter className="w-4 h-4" />
            <span>{showCompetitiveOnly ? 'Competitive Only' : 'All Matches'}</span>
          </button>

          <button
            onClick={openTrackerProfile}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300
              backdrop-blur-sm border hover:scale-105 active:scale-95
              ${
                isDarkMode
                  ? 'bg-green-600/20 border-green-500/30 text-green-400 hover:bg-green-600/30'
                  : 'bg-green-500/20 border-green-400/30 text-green-700 hover:bg-green-500/30'
              }
            `}
          >
            <ExternalLink className="w-4 h-4" />
            <span>View on Tracker.gg</span>
          </button>
        </div>

        {/* Player Profile Section */}
        <div
          className={`
            rounded-3xl p-8 backdrop-blur-xl border mb-8 transition-all duration-300
            ${isDarkMode ? 'bg-slate-900/40 border-slate-700/50' : 'bg-white/20 border-white/30'}
          `}
        >
          <div className="flex items-center justify-center mb-6">
            {/* Agent Avatar */}
            <div className="relative mr-6">
              {player.agentImageUrl ? (
                <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-white/20">
                  <img
                    src={player.agentImageUrl}
                    alt={player.agent}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl ring-4 ring-white/20">
                  {player.name[0]}
                </div>
              )}
            </div>

            {/* Player Info */}
            <div className="text-center">
              <h2
                className={`text-3xl font-bold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}
              >
                {player.name}
              </h2>
              <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {player.agent}
              </div>
            </div>
          </div>

          {/* Compact Horizontal Rank Card */}
          {player.rank && player.rank.tier > 0 ? (
            <div className="flex items-center justify-center">
              <div
                className={`
                  px-6 py-4 rounded-2xl backdrop-blur-sm border max-w-sm w-full
                  ${isDarkMode ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/40 border-white/50'}
                `}
              >
                <div className="flex items-center space-x-4">
                  {/* Rank Icon - Left Side */}
                  <div className="flex-shrink-0">
                    <img 
                      src={`./rank-icons/${player.rank.rank.toLowerCase().replace(' ', '')}.png`}
                      alt={player.rank.rank}
                      className="w-12 h-12"
                      draggable={false}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                  
                  {/* Rank Info - Right Side */}
                  <div className="flex-1 min-w-0">
                    {/* Rank Name */}
                    <div className={`text-xl font-bold mb-1 ${getRankColor(player.rank.tier)}`}>
                      {player.rank.rank}
                    </div>
                    
                    {/* Current RR */}
                    <div className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {player.rank.rr} / 100 RR
                    </div>
                    
                    {/* Compact Progress Bar */}
                    <div
                      className={`
                        w-full h-2 rounded-full overflow-hidden shadow-inner
                        ${isDarkMode ? 'bg-slate-700/80' : 'bg-gray-300/80'}
                      `}
                    >
                      <div
                        className={`
                          h-full transition-all duration-1000 rounded-full ${
                        player.rank.tier > 0 
                          ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500' 
                          : 'bg-gray-400'
                      }`}
                        style={{ width: `${player.rank.rr}%` }}
                        draggable={false}
                      />
                    </div>
                    
                    {/* Progress Text */}
                    <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {100 - player.rank.rr} RR to next rank
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`
                px-6 py-4 rounded-2xl backdrop-blur-sm border max-w-sm w-full mx-auto text-center
                ${isDarkMode ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/40 border-white/50'}
              `}
            >
              <div className={`text-xl font-bold ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Unranked
              </div>
              <div className={`text-sm ${
                isDarkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>
                Play competitive matches to get ranked
              </div>
            </div>
          )}
        </div>

        {/* Match History */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {/* Animated Header */}
              <div className={`
                rounded-3xl p-8 backdrop-blur-xl border text-center transition-all duration-300
                ${isDarkMode 
                  ? 'bg-slate-900/40 border-slate-700/50' 
                  : 'bg-white/20 border-white/30'
                }
              `}>
                {/* Animated Loading Icon */}
                <div className="relative mb-6">
                  <div className={`
                    w-16 h-16 mx-auto rounded-full border-4 border-transparent
                    ${isDarkMode 
                      ? 'border-t-blue-400 border-r-purple-400' 
                      : 'border-t-blue-600 border-r-purple-600'
                    }
                    animate-spin
                  `} />
                  <div className={`
                    absolute inset-0 w-16 h-16 mx-auto rounded-full border-4 border-transparent
                    ${isDarkMode 
                      ? 'border-b-pink-400 border-l-cyan-400' 
                      : 'border-b-pink-600 border-l-cyan-600'
                    }
                    animate-spin
                  `} style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                  
                  {/* Center Icon */}
                  <div className={`
                    absolute inset-0 flex items-center justify-center
                    ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}
                  `}>
                    <Target className="w-6 h-6 animate-pulse" />
                  </div>
                </div>

                {/* Animated Title */}
                <h3 className={`text-2xl font-bold mb-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  Loading Match History
                </h3>
                
                {/* Animated Subtitle */}
                <p className={`text-lg mb-4 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Fetching recent matches...
                </p>
                
                {/* Progress Dots */}
                <div className="flex items-center justify-center space-x-2">
                  {[0, 1, 2].map((index) => (
                    <div
                      key={index}
                      className={`
                        w-3 h-3 rounded-full
                        ${isDarkMode ? 'bg-blue-400' : 'bg-blue-600'}
                        animate-bounce
                      `}
                      style={{
                        animationDelay: `${index * 0.2}s`,
                        animationDuration: '1s'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Skeleton Loading Cards */}
              {[1, 2, 3, 4, 5].map((index) => (
                <div
                  key={index}
                  className={`
                    rounded-2xl p-6 backdrop-blur-xl border transition-all duration-300
                    ${isDarkMode 
                      ? 'bg-slate-900/20 border-slate-700/30' 
                      : 'bg-white/10 border-white/20'
                    }
                    animate-pulse
                  `}
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    animationDuration: '2s'
                  }}
                >
                  <div className="flex items-center justify-between">
                    {/* Left: Agent + Info Skeleton */}
                    <div className="flex items-center space-x-4">
                      {/* Agent Icon Skeleton */}
                      <div className={`
                        w-16 h-16 rounded-full
                        ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-300/50'}
                        animate-pulse
                      `} />

                      {/* Match Info Skeleton */}
                      <div className="space-y-2">
                        {/* Result + Queue Type */}
                        <div className="flex items-center space-x-3">
                          <div className={`
                            h-6 w-20 rounded-full
                            ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-300/50'}
                          `} />
                          <div className={`
                            h-4 w-16 rounded-full
                            ${isDarkMode ? 'bg-slate-700/30' : 'bg-gray-300/30'}
                          `} />
                        </div>
                        
                        {/* KDA */}
                        <div className={`
                          h-8 w-24 rounded-lg
                          ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-300/50'}
                        `} />
                        
                        {/* Additional Info */}
                        <div className="flex items-center space-x-4">
                          <div className={`
                            h-3 w-12 rounded-full
                            ${isDarkMode ? 'bg-slate-700/30' : 'bg-gray-300/30'}
                          `} />
                          <div className={`
                            h-3 w-16 rounded-full
                            ${isDarkMode ? 'bg-slate-700/30' : 'bg-gray-300/30'}
                          `} />
                        </div>
                      </div>
                    </div>

                    {/* Center: Score Skeleton */}
                    <div className="flex flex-col items-center justify-center min-w-[120px]">
                      <div className={`
                        h-8 w-16 rounded-lg mb-2
                        ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-300/50'}
                      `} />
                      <div className={`
                        h-4 w-12 rounded-full
                        ${isDarkMode ? 'bg-slate-700/30' : 'bg-gray-300/30'}
                      `} />
                    </div>

                    {/* Right: Map Skeleton */}
                    <div className="text-right min-w-[120px]">
                      <div className={`
                        w-36 h-24 rounded-lg mb-2
                        ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-300/50'}
                        animate-pulse
                      `} />
                      <div className={`
                        h-4 w-20 rounded-full mx-auto
                        ${isDarkMode ? 'bg-slate-700/30' : 'bg-gray-300/30'}
                      `} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">❌</div>
              <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                Error Loading Matches
              </h3>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{error}</p>
              <button
                onClick={loadMatchHistory}
                className={`mt-4 px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                  isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Retry
              </button>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🎮</div>
              <h3
                className={`text-xl font-semibold mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                No Matches Found
              </h3>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                This player hasn't played any recent matches.
              </p>
            </div>
          ) : (
            matches.map((match) => (
              <div
                key={match.matchId}
                className={`
                  rounded-2xl p-6 backdrop-blur-xl border transition-all duration-300
                  hover:scale-[1.02] hover:shadow-xl cursor-pointer
                  ${getResultBackgroundColor(match.matchResult, isDarkMode)}
                `}
                onClick={() => handleMatchClick(match)}
              >
                <div className="flex items-center justify-between">
                  {/* Left: Agent + KDA */}
                  <div className="flex items-center space-x-4">
                    {/* Agent Icon */}
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-white/20">
                        <img
                          src={match.playerStats.agentImage}
                          alt={match.playerStats.agent}
                          className="w-full h-full object-cover"
                          draggable={false}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://via.placeholder.com/64x64?text=${match.playerStats.agent[0]}`;
                          }}
                        />
                      </div>
                    </div>

                    {/* Match Info */}
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`font-bold text-lg ${getResultTextColor(match.matchResult)}`}>
                          {getResultText(match.matchResult)}
                        </span>
                        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                          {match.queueType}
                        </span>
                        {match.isTeamMVP && (
                          <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30">
                            <Crown className="w-3 h-3 text-yellow-400" />
                            <span className="text-xs text-yellow-400 font-medium">Match MVP</span>
                          </div>
                        )}
                      </div>

                      {/* KDA */}
                      <div className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        {match.playerStats.kda}
                      </div>

                      {/* Additional Info */}
                      <div className={`text-sm mt-2 flex items-center space-x-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatGameTime(match.gameStartTime)}</span>
                        </div>
                        {match.rrChange !== undefined && match.isRanked && (
                          <div
                            className={`flex items-center space-x-1 font-semibold ${
                              match.rrChange > 0 ? 'text-green-400' : match.rrChange < 0 ? 'text-red-400' : 'text-gray-400'
                            }`}
                          >
                            <span>{match.rrChange > 0 ? '+' : ''}{match.rrChange} RR</span>
                          </div>
                        )}
                        <span>{formatGameLength(match.gameLength)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Score - Fixed positioning */}
                  <div className="flex flex-col items-center justify-center min-w-[120px]">
                    <div className={`text-2xl font-bold mb-1 ${getResultTextColor(match.matchResult)}`}>
                      {match.scoreDisplay}
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {formatGameLength(match.gameLength)}
                    </div>
                  </div>

                  {/* Right: Map */}
                  <div className="text-right min-w-[120px]">
                    <div className="w-36 h-24 rounded-lg overflow-hidden mb-2 ring-2 ring-white/20">
                      <img
                        src={match.mapImage}
                        alt={match.mapName}
                        className="w-full h-full object-cover"
                        draggable={false}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/144x96?text=Map';
                        }}
                      />
                    </div>
                    <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-sm font-medium`}>
                      {match.mapName}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Helper functions
const getResultBackgroundColor = (matchResult: string, isDarkMode: boolean) => {
  if (matchResult === 'victory') {
    return isDarkMode 
      ? 'bg-green-600/20 border-green-500/30 shadow-green-500/20' 
      : 'bg-green-500/15 border-green-400/30 shadow-green-400/20';
  } else if (matchResult === 'defeat') {
    return isDarkMode 
      ? 'bg-red-600/20 border-red-500/30 shadow-red-500/20' 
      : 'bg-red-500/15 border-red-400/30 shadow-red-400/20';
  }
  return isDarkMode 
    ? 'bg-yellow-500/20 border-yellow-500/30 shadow-yellow-500/20' 
    : 'bg-yellow-400/15 border-yellow-400/30 shadow-yellow-400/20';
};

const getResultText = (matchResult: string) => {
  if (matchResult === 'victory') return 'VICTORY';
  if (matchResult === 'defeat') return 'DEFEAT';
  return 'DRAW';
};

const getResultTextColor = (matchResult: string) => {
  if (matchResult === 'victory') return 'text-green-400';
  if (matchResult === 'defeat') return 'text-red-400';
  return 'text-yellow-400';
};