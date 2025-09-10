import React from 'react';
import { Target, RefreshCw, Wifi, WifiOff, Users, Moon, Sun, Globe, History, Download, HelpCircle, MessageSquare, Clock, Sparkles, User } from 'lucide-react';

interface HeaderProps {
  status: string;
  side: string;
  isLoading: boolean;
  isConnected: boolean;
  playerCount: number;
  matchDetected: boolean;
  onRefresh: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  currentRegion?: string;
  onViewMatchHistory?: () => void;
  showMatchHistoryButton?: boolean;
  onCheckUpdates?: () => void;
  onViewFAQ?: () => void;
  onViewSuggestions?: () => void;
  onViewAnalysis?: () => void;
  showAnalysisButton?: boolean;
  refreshCooldown?: number;
  currentUser?: { name: string } | null;
}

export const Header: React.FC<HeaderProps> = ({ 
  status, 
  side, 
  isLoading, 
  isConnected,
  playerCount,
  matchDetected,
  onRefresh,
  isDarkMode,
  onToggleDarkMode,
  currentRegion,
  onViewMatchHistory,
  showMatchHistoryButton = false,
  onCheckUpdates,
  onViewFAQ,
  onViewSuggestions,
  onViewAnalysis,
  showAnalysisButton = false,
  refreshCooldown = 0,
  currentUser = null
}) => {
  const getStatusIcon = () => {
    if (status.includes('Agent Select')) {
      return <Users className="w-6 h-6 text-blue-500" />;
    } else if (status.includes('In Progress')) {
      return <Target className="w-6 h-6 text-green-500" />;
    }
    return <Target className={`w-6 h-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />;
  };

  const getStatusColor = () => {
    if (status.includes('Agent Select')) return 'text-blue-500';
    if (status.includes('In Progress')) return 'text-green-500';
    if (status.includes('Error')) return 'text-red-500';
    return isDarkMode ? 'text-gray-400' : 'text-gray-700';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getUserDisplayName = () => {
    if (!currentUser) return 'Player';
    
    // Extract just the name part before the # if it exists
    const nameParts = currentUser.name.split('#');
    return nameParts[0] || 'Player';
  };
  return (
    <div className="mb-8">
      {/* Top Section - Welcome and Controls */}
      <div className="flex items-start justify-between mb-8">
        {/* Left - Welcome Section */}
        <div className={`
          rounded-3xl p-6 backdrop-blur-xl border transition-all duration-500
          ${isDarkMode 
            ? 'bg-slate-900/40 border-slate-700/50' 
            : 'bg-white/20 border-white/30'
          }
        `}>
          <div className="flex items-center space-x-4">
            {/* Welcome Icon with Animation */}
            <div className={`
              relative p-3 rounded-full backdrop-blur-sm border transition-all duration-300
              ${isDarkMode 
                ? 'bg-blue-500/20 border-blue-500/30' 
                : 'bg-blue-400/20 border-blue-400/30'
              }
            `}>
              {currentUser?.rank ? (
                <img 
                  src={`./rank-icons/${currentUser.rank.rank.toLowerCase().replace(' ', '')}.png`}
                  alt={currentUser.rank.rank}
                  className="w-8 h-8"
                  draggable={false}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <User className={`w-8 h-8 text-blue-500 ${currentUser?.rank ? 'hidden' : ''}`} />
              {/* Sparkle animation */}
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
              </div>
            </div>
            
            {/* Welcome Text */}
            <div>
              <h2 className={`text-2xl font-bold mb-1 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                {getGreeting()}!
              </h2>
              <p className={`text-lg ${
                isDarkMode ? 'text-blue-300' : 'text-blue-700'
              }`}>
                Welcome {getUserDisplayName()}
        rounded-3xl p-6 backdrop-blur-xl border transition-all duration-500 hover:scale-[1.02]
        hover:shadow-2xl group relative overflow-hidden
            </div>
          </div>
        </div>

        {/* Right - Button Groups */}
        {/* Subtle hover glow effect */}
        <div className={`
          absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500
          bg-gradient-to-r ${isDarkMode 
            ? 'from-blue-500/20 via-purple-500/20 to-pink-500/20' 
            : 'from-blue-400/20 via-purple-400/20 to-pink-400/20'
          }
        `} />
        
        <div className="flex flex-col space-y-3 items-end">
          {/* App Controls Group */}
          <div className={`
            rounded-2xl p-3 backdrop-blur-xl border transition-all duration-300 hover:scale-105
            hover:shadow-xl group
            ${isDarkMode 
              ? 'bg-slate-900/30 border-slate-700/50' 
              : 'bg-white/15 border-gray-300/40'
            }
          `}>
            <div className={`text-xs font-medium mb-2 text-center ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              APP CONTROLS
            </div>
            <div className="flex items-center justify-center space-x-2">
              {/* FAQ Button */}
              {onViewFAQ && (
                <button
                  onClick={onViewFAQ}
                  className={`
                    flex items-center space-x-1 px-2 py-1.5 rounded-lg backdrop-blur-sm border transition-all duration-300
                    hover:scale-105 active:scale-95 text-sm font-medium
                    ${isDarkMode 
                      ? 'bg-slate-800/40 border-slate-700/50 text-green-400 hover:bg-slate-800/60' 
                      : 'bg-white/20 border-white/30 text-green-700 hover:bg-white/30'
                    }
                  `}
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>FAQ</span>
                </button>
              )}
              
              {/* Suggestions Button */}
              {onViewSuggestions && (
                <button
                  onClick={onViewSuggestions}
                  className={`
                    flex items-center space-x-1 px-2 py-1.5 rounded-lg backdrop-blur-sm border transition-all duration-300
                    hover:scale-105 active:scale-95 text-sm font-medium
                    ${isDarkMode 
                      ? 'bg-slate-800/40 border-slate-700/50 text-orange-400 hover:bg-slate-800/60' 
                      : 'bg-white/20 border-white/30 text-orange-700 hover:bg-white/30'
                    }
                  `}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Suggestions</span>
                </button>
              )}
              
              {/* Check Updates Button */}
              {onCheckUpdates && (
                <button
                  onClick={onCheckUpdates}
                  className={`
                    flex items-center space-x-1 px-2 py-1.5 rounded-lg backdrop-blur-sm border transition-all duration-300
                    hover:scale-105 active:scale-95 text-sm font-medium
                    ${isDarkMode 
                      ? 'bg-slate-800/40 border-slate-700/50 text-purple-400 hover:bg-slate-800/60' 
                      : 'bg-white/20 border-white/30 text-purple-700 hover:bg-white/30'
                    }
                  `}
                >
                  <Download className="w-4 h-4" />
                  <span>Updates</span>
                </button>
              )}
              
              {/* Dark Mode Toggle */}
                className="w-8 h-8 transition-transform duration-300 group-hover:rotate-12"
                onClick={onToggleDarkMode}
                className={`
                  p-1.5 rounded-lg backdrop-blur-sm border transition-all duration-300
                  hover:scale-110 active:scale-95
                  ${isDarkMode 
                    ? 'bg-slate-800/40 border-slate-700/50 text-yellow-400 hover:bg-slate-800/60' 
                    : 'bg-white/20 border-white/30 text-gray-700 hover:bg-white/30'
                  }
            <User className={`w-8 h-8 text-blue-500 transition-transform duration-300 group-hover:rotate-12 ${currentUser?.rank ? 'hidden' : ''}`} />
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse group-hover:animate-spin" />
            </div>
          </div>

          {/* Match Features Group */}
          {(showMatchHistoryButton || showAnalysisButton) && (
            <div className={`
              rounded-2xl p-3 backdrop-blur-xl border transition-all duration-300 hover:scale-105
              hover:shadow-xl group
              ${isDarkMode 
                ? 'bg-slate-900/30 border-slate-700/50' 
                : 'bg-white/15 border-gray-300/40'
              }
            `}>
              <div className={`text-xs font-medium mb-2 text-center ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                MATCH FEATURES
              </div>
              <div className="flex items-center justify-center space-x-2">
                {/* Match History Button */}
                {showMatchHistoryButton && onViewMatchHistory && (
                  <button
                    onClick={onViewMatchHistory}
                    className={`
                      flex items-center space-x-1 px-2 py-1.5 rounded-lg backdrop-blur-sm border transition-all duration-300
                      hover:scale-105 active:scale-95 text-sm font-medium
                      ${isDarkMode 
                        ? 'bg-slate-800/40 border-slate-700/50 text-blue-400 hover:bg-slate-800/60' 
                        : 'bg-white/20 border-white/30 text-blue-700 hover:bg-white/30'
                      }
                    `}
                  >
                    <History className="w-4 h-4" />
                    <span>Match History</span>
                  </button>
                )}
                
                {/* Analysis Button */}
                {showAnalysisButton && onViewAnalysis && (
                  <button
                    onClick={onViewAnalysis}
                    className={`
                      flex items-center space-x-1 px-2 py-1.5 rounded-lg backdrop-blur-sm border transition-all duration-300
                      hover:scale-105 active:scale-95 text-sm font-medium
                      ${isDarkMode 
          <div className="relative z-10">
                        : 'bg-white/20 border-white/30 text-cyan-700 hover:bg-white/30'
                      }
                    `}
                  >
                    <Target className="w-4 h-4" />
                    <span>Analysis</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Status Section */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-3 mb-4">
          {getStatusIcon()}
          <h1 className={`text-3xl font-bold ${getStatusColor()}`}>
            {status}
          </h1>
          {isLoading && (
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
          )}
        </div>

        {/* Side Info */}
        {side && (
          <div className={`text-lg font-medium mb-4 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {side}
          </div>
        )}

        {/* Connection Status */}
        <div className="flex items-center justify-center space-x-6 text-sm mb-6">
          <div className={`flex items-center space-x-2 ${
            isConnected ? 'text-green-500' : 'text-red-500'
          }`}>
            {isConnected ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            <span>
              {isConnected ? 'Ready' : 'Disconnected'}
            </span>
          </div>
          
          {currentRegion && isConnected && (
            <div className={`flex items-center space-x-2 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`}>
              <Globe className="w-4 h-4" />
              <span>Region: {currentRegion.toUpperCase()}</span>
            </div>
          )}
          
          {playerCount > 0 && (
            <div className={`flex items-center space-x-2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <Users className="w-4 h-4" />
              <span>{playerCount} players</span>
            </div>
          )}
        </div>

        {/* Manual Refresh Button */}
        {matchDetected && (
          <button
            onClick={onRefresh}
            disabled={isLoading || refreshCooldown > 0}
            className={`
              px-6 py-3 rounded-xl font-medium transition-all duration-300
              backdrop-blur-sm border hover:scale-105 active:scale-95
              disabled:scale-100 disabled:cursor-not-allowed
              ${isDarkMode 
                ? 'bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30 disabled:bg-blue-800/20 disabled:text-blue-600' 
                : 'bg-blue-500/20 border-blue-400/30 text-blue-700 hover:bg-blue-500/30 disabled:bg-blue-400/20 disabled:text-blue-600'
              }
            `}
          >
            {refreshCooldown > 0 ? (
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Wait {refreshCooldown}s</span>
              </div>
            ) : isLoading ? (
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Refreshing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Match</span>
              </div>
            )}
          </button>
        )}
      </div>
    </div>
  );
};