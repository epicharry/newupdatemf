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

interface MatchTimelineProps {
  timelineData: any[];
  allPlayers: MatchPlayer[];
  myTeamId: string;
  isDarkMode: boolean;
}

const MatchTimeline: React.FC<MatchTimelineProps> = ({
  timelineData,
  allPlayers,
  myTeamId,
  isDarkMode
}) => {
  const getPlayerName = (puuid: string) => {
    const player = allPlayers.find(p => p.subject === puuid);
    return player ? `${player.gameName}#${player.tagLine}` : 'Unknown';
  };

  const getPlayerAgent = (puuid: string) => {
    const player = allPlayers.find(p => p.subject === puuid);
    return player ? AGENTS[player.characterId] || 'Unknown' : 'Unknown';
  };

  const formatRoundTime = (timeMs: number) => {
    const seconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getKillIcon = (damageType: string) => {
    switch (damageType.toLowerCase()) {
      case 'weapon':
        return <Target className="w-3 h-3" />;
      case 'ability':
        return <Zap className="w-3 h-3" />;
      case 'bomb':
        return <Bomb className="w-3 h-3" />;
      case 'melee':
        return <Skull className="w-3 h-3" />;
      default:
        return <Target className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-4">
      {timelineData.map((round) => (
        <div
          key={round.roundNum}
          className={`
            rounded-2xl p-6 backdrop-blur-xl border transition-all duration-300
            ${isDarkMode 
              ? 'bg-slate-900/40 border-slate-700/50' 
              : 'bg-white/20 border-white/30'
            }
          `}
        >
          {/* Round Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`
                px-3 py-1 rounded-full text-sm font-bold
                ${round.winningTeam === myTeamId
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }
              `}>
                Round {round.roundNum + 1}
              </div>
              <div className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {round.winningTeam === myTeamId ? 'WON' : 'LOST'} • {round.result}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {round.bombPlanted && (
                <div className="flex items-center space-x-1 text-orange-400">
                  <Bomb className="w-4 h-4" />
                  <span className="text-sm">
                    {round.plantSite ? `${round.plantSite} Site` : 'Planted'}
                  </span>
                </div>
              )}
              {round.bombDefused && (
                <div className="flex items-center space-x-1 text-blue-400">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">Defused</span>
                </div>
              )}
              <div className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {formatRoundTime(round.duration)}
              </div>
            </div>
          </div>

          {/* Kills Timeline */}
          {round.kills.length > 0 && (
            <div className="space-y-2">
              <h4 className={`text-sm font-medium mb-3 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Eliminations ({round.kills.length})
              </h4>
              <div className="space-y-2">
                {round.kills.map((kill, killIndex) => {
                  const killerPlayer = allPlayers.find(p => p.subject === kill.killer);
                  const victimPlayer = allPlayers.find(p => p.subject === kill.victim);
                  const isTeamKill = killerPlayer?.teamId === myTeamId;
                  
                  return (
                    <div
                      key={killIndex}
                      className={`
                        flex items-center justify-between p-3 rounded-lg backdrop-blur-sm border
                        ${isDarkMode 
                          ? 'bg-slate-800/40 border-slate-700/50' 
                          : 'bg-white/20 border-white/30'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`
                          p-1 rounded-full
                          ${isTeamKill 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                          }
                        `}>
                          {getKillIcon(kill.finishingDamage.damageType)}
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`font-medium ${
                              isDarkMode ? 'text-white' : 'text-gray-800'
                            }`}>
                              {getPlayerName(kill.killer)}
                            </span>
                            <span className={`text-xs ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              ({getPlayerAgent(kill.killer)})
                            </span>
                            <span className={`text-sm ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              eliminated
                            </span>
                            <span className={`font-medium ${
                              isDarkMode ? 'text-white' : 'text-gray-800'
                            }`}>
                              {getPlayerName(kill.victim)}
                            </span>
                            <span className={`text-xs ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              ({getPlayerAgent(kill.victim)})
                            </span>
                          </div>
                          
                          {kill.assistants.length > 0 && (
                            <div className={`text-xs mt-1 ${
                              isDarkMode ? 'text-gray-500' : 'text-gray-500'
                            }`}>
                              Assisted by: {kill.assistants.map(getPlayerName).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {formatRoundTime(kill.roundTime)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

interface EconomyAnalysisProps {
  roundResults: any[];
  allPlayers: MatchPlayer[];
  myTeamId: string;
  isDarkMode: boolean;
}

const EconomyAnalysis: React.FC<EconomyAnalysisProps> = ({
  roundResults,
  allPlayers,
  myTeamId,
  isDarkMode
}) => {
  const getPlayerName = (puuid: string) => {
    const player = allPlayers.find(p => p.subject === puuid);
    return player ? `${player.gameName}#${player.tagLine}` : 'Unknown';
  };

  const getWeaponName = (weaponId: string) => {
    const weaponNames: Record<string, string> = {
      '29A0CFAB-485B-F5D5-779A-B59F85E204A8': 'Classic',
      '1BAA85B4-4C70-1284-64BB-6481DFC3BB4E': 'Shorty',
      '44D4E95C-4157-0037-81B2-17841BF2E8E3': 'Frenzy',
      '29A0CFAB-485B-F5D5-779A-B59F85E204A8': 'Ghost',
      'E336C6B8-418D-9340-D77F-7A9E4CFE0702': 'Sheriff',
      'F7E1B454-4AD4-1063-EC0A-159E56B58941': 'Stinger',
      '462080D1-4035-2937-7C09-27AA2A5C27A7': 'Spectre',
      'C4883E50-4494-202C-3EC3-6B8A9284F00B': 'Bucky',
      '910BE174-449B-C412-AB22-D0873436B21B': 'Judge',
      'EC845BF4-4F79-DDDA-A3DA-0DB3774B2794': 'Bulldog',
      'AE3DE142-4D85-2547-DD26-4E90BED35CF7': 'Guardian',
      '4ADE7FAA-4CF1-8376-95EF-39884480959B': 'Phantom',
      '9C82E19D-4575-0200-1A81-3EACF00CF872': 'Vandal',
      'C4883E50-4494-202C-3EC3-6B8A9284F00B': 'Marshal',
      'A03B24D3-4319-996D-0F8C-94BBFBA1DFC7': 'Operator',
      '55D8A0F4-4274-CA67-FE2C-06AB45EFDF58': 'Ares',
      '63E6C2B6-4A8E-869C-3D4C-E38355226584': 'Odin',
      'EE8E8D15-496B-07AC-E5F6-8FAE5D4C7B1A': 'Outlaw',
      '5F0AAF7A-4289-3998-D5FF-EB9A5CF7EF5C': 'Tour de Force'
    };
    return weaponNames[weaponId] || 'Unknown';
  };

  const getArmorName = (armorId: string) => {
    const armorNames: Record<string, string> = {
      '4DEC83D5-4902-9AB3-BED6-A7A390761157': 'Light Armor',
      'B1B9086D-41BD-A516-5D29-E3B34A6F1644': 'Heavy Armor',
      '822BCAB2-40A2-324E-C137-E09195AD7692': 'Heavy Armor'
    };
    return armorNames[armorId] || '';
  };

  return (
    <div className="space-y-6">
      <div className={`
        rounded-3xl p-6 backdrop-blur-xl border transition-all duration-300
        ${isDarkMode 
          ? 'bg-slate-900/40 border-slate-700/50' 
          : 'bg-white/20 border-white/30'
        }
      `}>
        <h3 className={`text-xl font-bold mb-4 ${
          isDarkMode ? 'text-white' : 'text-gray-800'
        }`}>
          Economy Analysis
        </h3>
        
        <div className="grid gap-4">
          {roundResults.slice(0, 5).map((round) => (
            <div
              key={round.roundNum}
              className={`
                p-4 rounded-xl backdrop-blur-sm border
                ${isDarkMode 
                  ? 'bg-slate-800/40 border-slate-700/50' 
                  : 'bg-white/20 border-white/30'
                }
              `}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className={`font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  Round {round.roundNum + 1}
                </h4>
                <div className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {round.winningTeam === myTeamId ? 'Won' : 'Lost'}
                </div>
              </div>
              
              {round.playerEconomies && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className={`text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-blue-300' : 'text-blue-700'
                    }`}>
                      Your Team
                    </h5>
                    <div className="space-y-1">
                      {round.playerEconomies
                        .filter((eco: any) => {
                          const player = allPlayers.find(p => p.subject === eco.subject);
                          return player?.teamId === myTeamId;
                        })
                        .map((eco: any) => (
                          <div
                            key={eco.subject}
                            className={`text-xs ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}
                          >
                            <span className="font-medium">
                              {getPlayerName(eco.subject).split('#')[0]}
                            </span>
                            : {getWeaponName(eco.weapon)} 
                            {eco.armor && ` + ${getArmorName(eco.armor)}`}
                            <span className="ml-2 text-green-400">
                              ${eco.remaining}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className={`text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-red-300' : 'text-red-700'
                    }`}>
                      Enemy Team
                    </h5>
                    <div className="space-y-1">
                      {round.playerEconomies
                        .filter((eco: any) => {
                          const player = allPlayers.find(p => p.subject === eco.subject);
                          return player?.teamId !== myTeamId;
                        })
                        .map((eco: any) => (
                          <div
                            key={eco.subject}
                            className={`text-xs ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}
                          >
                            <span className="font-medium">
                              {getPlayerName(eco.subject).split('#')[0]}
                            </span>
                            : {getWeaponName(eco.weapon)}
                            {eco.armor && ` + ${getArmorName(eco.armor)}`}
                            <span className="ml-2 text-green-400">
                              ${eco.remaining}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};