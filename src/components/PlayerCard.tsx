import React from 'react';
import { User } from 'lucide-react';
import { PlayerInfo } from '../types/valorant';

interface PlayerCardProps {
  player: PlayerInfo;
  isMyTeam: boolean;
  isDarkMode: boolean;
  onPlayerClick?: (player: PlayerInfo) => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ 
  player, 
  isMyTeam, 
  isDarkMode, 
  onPlayerClick 
}) => {
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

  const getAgentColor = () => {
    const colors = [
      'bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400',
      'bg-purple-400', 'bg-pink-400', 'bg-indigo-400', 'bg-teal-400'
    ];
    const hash = player.agent.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className={`
      backdrop-blur-xl rounded-2xl p-4 border transition-all duration-300
      hover:scale-[1.02] hover:shadow-xl group cursor-pointer
      ${isDarkMode 
        ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60' 
        : 'bg-white/20 border-white/30 hover:bg-white/30'
      }
      ${isMyTeam 
        ? (isDarkMode ? 'shadow-blue-500/20' : 'shadow-blue-400/30') 
        : (isDarkMode ? 'shadow-red-500/20' : 'shadow-red-400/30')
      }
    `}
    onClick={() => onPlayerClick?.(player)}
    >
      <div className="flex items-center space-x-4">
        {/* Agent Avatar */}
        <div className="relative">
          {player.agentImageUrl ? (
            <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-white/20 group-hover:ring-white/40 transition-all duration-300">
              <img 
                src={player.agentImageUrl} 
                alt={player.agent}
                className="w-full h-full object-cover"
                draggable={false}
                onError={(e) => {
                  // Fallback to letter avatar if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className={`
                ${getAgentColor()} rounded-full w-14 h-14 flex items-center justify-center
                text-white font-bold text-lg shadow-lg hidden
              `}>
                {player.agent[0] || <User className="w-6 h-6" />}
              </div>
            </div>
          ) : (
            <div className={`
              ${getAgentColor()} rounded-full w-14 h-14 flex items-center justify-center
              text-white font-bold text-lg shadow-lg ring-2 ring-white/20 
              group-hover:ring-white/40 transition-all duration-300
            `}>
              {player.agent[0] || <User className="w-6 h-6" />}
            </div>
          )}
        </div>
        
        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className={`font-semibold text-base truncate ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              {player.name}
            </h3>
          </div>
          
          <div className={`text-sm mt-1 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {player.agent}
          </div>
          
          <div className="flex items-center space-x-2 mt-1">
            <img 
              src={`./rank-icons/${player.rank.rank.toLowerCase().replace(' ', '')}.png`}
              alt={player.rank.rank}
              className="w-5 h-5"
              draggable={false}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <div className={`text-sm font-medium ${getRankColor(player.rank.tier)}`}>
              {player.rank.rank}
              {player.rank.tier > 0 && (
                <span className={`ml-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  ({player.rank.rr} RR)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};