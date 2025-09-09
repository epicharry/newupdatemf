import React, { useState } from 'react';
import { ArrowLeft, Crown, Target, Clock, Users, Moon, Sun, Activity, Bomb, Shield, Zap, Skull } from 'lucide-react';
import { MatchDetails, MatchPlayer } from '../types/matchHistory';
import { AGENTS, RANKS } from '../constants/valorant';
import { MAPS } from '../constants/maps';

interface MatchDetailsPageProps {
  matchDetails: MatchDetails;
  myTeam: MatchPlayer[];
  enemyTeam: MatchPlayer[];
  myTeamId: string;
  enemyTeamId: string;
  matchResult: 'victory' | 'defeat' | 'draw';
  myTeamScore: number;
  enemyTeamScore: number;
  onBack: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const MatchDetailsPage: React.FC<MatchDetailsPageProps> = ({
  matchDetails,
  myTeam,
  enemyTeam,
  myTeamId,
  enemyTeamId,
  matchResult,
  myTeamScore,
  enemyTeamScore,
  onBack,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'economy'>('overview');
  
  const mapInfo = MAPS[matchDetails.matchInfo.mapId] || { 
    name: 'Unknown Map', 
    image: 'https://via.placeholder.com/300x200?text=Unknown+Map' 
  };

  const formatGameTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatGameLength = (lengthMs: number) => {
    const minutes = Math.floor(lengthMs / (1000 * 60));
    const seconds = Math.floor((lengthMs % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getResultColor = () => {
    if (matchResult === 'victory') {
      return isDarkMode ? 'text-green-400' : 'text-green-600';
    } else if (matchResult === 'defeat') {
      return isDarkMode ? 'text-red-400' : 'text-red-600';
    }
    return isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
  };

  const getResultText = () => {
    if (matchResult === 'victory') return 'VICTORY';
    if (matchResult === 'defeat') return 'DEFEAT';
    return 'DRAW';
  };

  const getRankColor = (tier: number) => {
    if (tier === 0) return 'text-[#6D6D6D]'; // Unranked
    if (tier <= 5) return 'text-[#6D6D6D]'; // Iron
    if (tier <= 8) return 'text-[#AD8A56]'; // Bronze
    if (tier <= 11) return 'text-[#A9A9A9]'; // Silver
    if (tier <= 14) return 'text-[#E2C76E]'; // Gold
    if (tier <= 17) return 'text-[#4FBDBF]'; // Platinum
    if (tier <= 20) return 'text-[#8A59C2]'; // Diamond
    if (tier <= 23) return 'text-[#3BB273]'; // Ascendant
    if (tier <= 26) return 'text-[#C03B3B]'; // Immortal
    return 'text-[#FADC45]'; // Radiant
  };

  const processTimelineData = () => {
    if (!matchDetails.roundResults || !matchDetails.kills) return [];
    
    return matchDetails.roundResults.map((round, index) => {
      const roundKills = matchDetails.kills?.filter(kill => kill.round === round.roundNum) || [];
      
      return {
        roundNum: round.roundNum,
        result: round.roundResult,
        winningTeam: round.winningTeam,
        winningTeamRole: round.winningTeamRole,
        bombPlanted: !!round.bombPlanter,
        bombDefused: !!round.bombDefuser,
        plantSite: round.plantSite,
        kills: roundKills,
        duration: roundKills.length > 0 ? Math.max(...roundKills.map(k => k.roundTime)) : 0
      };
    });
  };

  const timelineData = processTimelineData();

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
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

      <div className="relative z-10 container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className={`
              p-3 rounded-full backdrop-blur-sm border transition-all duration-300
              hover:scale-110 active:scale-95 mr-4
              ${isDarkMode 
                ? 'bg-slate-800/40 border-slate-700/50 text-gray-300 hover:bg-slate-800/60' 
                : 'bg-white/20 border-white/30 text-gray-700 hover:bg-white/30'
              }
            `}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className={`text-2xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Match Details
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

        {/* Match Summary */}
        <div className={`
          rounded-3xl p-8 backdrop-blur-xl border mb-8 transition-all duration-300
          ${isDarkMode 
            ? 'bg-slate-900/40 border-slate-700/50' 
            : 'bg-white/20 border-white/30'
          }
        `}>
          <div className="flex items-center justify-between mb-6">
            {/* Map Image */}
            <div className="w-48 h-32 rounded-lg overflow-hidden ring-2 ring-white/20">
              <img 
                src={mapInfo.image} 
                alt={mapInfo.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/192x128?text=Map';
                }}
              />
            </div>

            {/* Match Result */}
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getResultColor()}`}>
                {getResultText()}
              </div>
              <div className={`text-2xl font-bold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                {myTeamScore} – {enemyTeamScore}
              </div>
              <div className={`text-lg ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {mapInfo.name}
              </div>
            </div>

            {/* Match Info */}
            <div className="text-right">
              <div className={`text-sm mb-2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <div className="flex items-center space-x-1 mb-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatGameTime(matchDetails.matchInfo.gameStartMillis)}</span>
                </div>
                <div>Duration: {formatGameLength(matchDetails.matchInfo.gameLengthMillis || matchDetails.matchInfo.gameLength)}</div>
                <div className="capitalize">{matchDetails.matchInfo.queueID}</div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-2 mb-6">
            {[
              { id: 'overview', label: 'Overview', icon: Users },
              { id: 'timeline', label: 'Timeline', icon: Activity },
              { id: 'economy', label: 'Economy', icon: Target }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300
                  backdrop-blur-sm border hover:scale-105 active:scale-95
                  ${activeTab === id
                    ? isDarkMode
                      ? 'bg-blue-600/30 border-blue-500/50 text-blue-300'
                      : 'bg-blue-500/30 border-blue-400/50 text-blue-700'
                    : isDarkMode
                      ? 'bg-slate-800/40 border-slate-700/50 text-gray-300 hover:bg-slate-800/60'
                      : 'bg-white/20 border-white/30 text-gray-700 hover:bg-white/30'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-8">
            <TeamDetailsSection
              title={`Your Team (${myTeamId})`}
              players={myTeam}
              isMyTeam={true}
              isDarkMode={isDarkMode}
              getRankColor={getRankColor}
            />
            <TeamDetailsSection
              title={`Enemy Team (${enemyTeamId})`}
              players={enemyTeam}
              isMyTeam={false}
              isDarkMode={isDarkMode}
              getRankColor={getRankColor}
            />
          </div>
        )}

        {activeTab === 'timeline' && (
          <MatchTimeline
            timelineData={timelineData}
            allPlayers={[...myTeam, ...enemyTeam]}
            myTeamId={myTeamId}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'economy' && (
          <EconomyAnalysis
            roundResults={matchDetails.roundResults || []}
            allPlayers={[...myTeam, ...enemyTeam]}
            myTeamId={myTeamId}
            isDarkMode={isDarkMode}
          />
        )}
      </div>
    </div>
  );
};

interface TeamDetailsSectionProps {
  title: string;
  players: MatchPlayer[];
  isMyTeam: boolean;
  isDarkMode: boolean;
  getRankColor: (tier: number) => string;
}

const TeamDetailsSection: React.FC<TeamDetailsSectionProps> = ({
  title,
  players,
  isMyTeam,
  isDarkMode,
  getRankColor
}) => {
  // Sort players by score (highest first)
  const sortedPlayers = [...players].sort((a, b) => b.stats.score - a.stats.score);
  const teamMVP = sortedPlayers[0];

  return (
    <div className={`
      rounded-3xl p-6 backdrop-blur-xl border transition-all duration-300
      ${isDarkMode 
        ? 'bg-slate-900/30 border-slate-700/50' 
        : 'bg-white/10 border-white/20'
      }
      ${isMyTeam 
        ? (isDarkMode ? 'shadow-blue-500/10' : 'shadow-blue-400/20') 
        : (isDarkMode ? 'shadow-red-500/10' : 'shadow-red-400/20')
      }
    `}>
      {/* Team Header */}
      <div className="flex items-center justify-center space-x-3 mb-6">
        <div className={`
          p-3 rounded-full backdrop-blur-sm transition-all duration-300
          ${isMyTeam 
            ? (isDarkMode 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                : 'bg-blue-400/20 text-blue-600 border border-blue-400/30'
              ) 
            : (isDarkMode 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                : 'bg-red-400/20 text-red-600 border border-red-400/30'
              )
          }
        `}>
          <Users className="w-6 h-6" />
        </div>
        <h2 className={`
          text-xl font-bold
          ${isMyTeam 
            ? (isDarkMode ? 'text-blue-300' : 'text-blue-700') 
            : (isDarkMode ? 'text-red-300' : 'text-red-700')
          }
        `}>
          {title}
        </h2>
      </div>

      {/* Players */}
      <div className="space-y-3">
        {sortedPlayers.map((player) => (
          <PlayerDetailsCard
            key={player.subject}
            player={player}
            isTeamMVP={player.subject === teamMVP.subject}
            isDarkMode={isDarkMode}
            getRankColor={getRankColor}
          />
        ))}
      </div>
    </div>
  );
};

interface PlayerDetailsCardProps {
  player: MatchPlayer;
  isTeamMVP: boolean;
  isDarkMode: boolean;
  getRankColor: (tier: number) => string;
}

const PlayerDetailsCard: React.FC<PlayerDetailsCardProps> = ({
  player,
  isTeamMVP,
  isDarkMode,
  getRankColor
}) => {
  const agentName = AGENTS[player.characterId] || 'Unknown';
  const agentImageUrl = `https://media.valorant-api.com/agents/${player.characterId}/displayicon.png`;

  return (
    <div className={`
      backdrop-blur-xl rounded-2xl p-4 border transition-all duration-300
      hover:scale-[1.02] hover:shadow-xl
      ${isDarkMode 
        ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60' 
        : 'bg-white/20 border-white/30 hover:bg-white/30'
      }
    `}>
      <div className="flex items-center justify-between">
        {/* Left: Agent + Player Info */}
        <div className="flex items-center space-x-4">
          {/* Agent Icon */}
          <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white/20">
            <img 
              src={agentImageUrl} 
              alt={agentName}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://via.placeholder.com/48x48?text=${agentName[0]}`;
              }}
            />
          </div>

          {/* Player Info */}
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className={`font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                {player.gameName}#{player.tagLine}
              </span>
              {isTeamMVP && (
                <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30">
                  <Crown className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs text-yellow-400 font-medium">MVP</span>
                </div>
              )}
            </div>
            <div className={`text-sm ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {agentName}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <img 
                src={`./rank-icons/${(RANKS[player.competitiveTier] || 'unranked').toLowerCase().replace(' ', '')}.png`}
                alt={RANKS[player.competitiveTier] || 'Unranked'}
                className="w-5 h-5"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <div className={`text-sm font-medium ${getRankColor(player.competitiveTier)}`}>
                {RANKS[player.competitiveTier] || 'Unranked'}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Stats */}
        <div className="text-right">
          <div className={`text-lg font-bold mb-1 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            {player.stats.kills}/{player.stats.deaths}/{player.stats.assists}
          </div>
        </div>
      </div>
    </div>
  );
};