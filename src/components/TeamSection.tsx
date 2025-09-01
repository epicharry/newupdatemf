import React from 'react';
import { Shield, Sword } from 'lucide-react';
import { PlayerCard } from './PlayerCard';
import { PlayerInfo } from '../types/valorant';

interface TeamSectionProps {
  title: string;
  players: PlayerInfo[];
  isMyTeam: boolean;
  icon: React.ReactNode;
  isDarkMode: boolean;
  onPlayerClick?: (player: PlayerInfo) => void;
}

export const TeamSection: React.FC<TeamSectionProps> = ({ 
  title, 
  players, 
  isMyTeam,
  icon,
  isDarkMode,
  onPlayerClick
}) => {
  // Sort players to put current user first if it's their team
  const sortedPlayers = isMyTeam 
    ? [...players].sort((a, b) => {
        // Put current user first
        if (a.isCurrentUser) return -1;
        if (b.isCurrentUser) return 1;
        return 0;
      })
    : players;

  return (
    <div className="flex-1">
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
            {icon}
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
          {sortedPlayers.length > 0 ? (
            sortedPlayers.map((player) => (
              <PlayerCard
                key={player.puuid}
                player={player}
                isMyTeam={isMyTeam}
                isDarkMode={isDarkMode}
                onPlayerClick={onPlayerClick}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">👥</div>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                No players found
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const MyTeamSection: React.FC<Omit<TeamSectionProps, 'icon'>> = (props) => (
  <TeamSection {...props} icon={<Shield className="w-6 h-6" />} />
);

export const EnemyTeamSection: React.FC<Omit<TeamSectionProps, 'icon'>> = (props) => (
  <TeamSection {...props} icon={<Sword className="w-6 h-6" />} />
);