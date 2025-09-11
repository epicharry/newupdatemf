import React, { useState } from 'react';
import { ArrowLeft, Search, User, Loader2, AlertCircle, Moon, Sun } from 'lucide-react';
import { PlayerSearchAPI, PlayerSearchResult } from '../services/playerSearchAPI';
import { ValorantAPI } from '../services/valorantAPI';
import { PlayerInfo } from '../types/valorant';
import { MatchHistoryPage } from './MatchHistoryPage';

interface PlayerSearchPageProps {
  onBack: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const PlayerSearchPage: React.FC<PlayerSearchPageProps> = ({
  onBack,
  isDarkMode,
  onToggleDarkMode
}) => {
  const [username, setUsername] = useState('');
  const [tag, setTag] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchResult, setSearchResult] = useState<PlayerSearchResult | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerInfo | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !tag.trim()) {
      setError('Please enter both username and tag');
      return;
    }

    try {
      setIsSearching(true);
      setError('');
      setSearchResult(null);

      const result = await PlayerSearchAPI.searchPlayerByUsername(username.trim(), tag.trim());
      
      if (result) {
        setSearchResult(result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setError(errorMessage);
    } finally {
      setIsSearching(false);
    }
  };

  const handleViewProfile = async () => {
    if (!searchResult) return;

    try {
      setIsSearching(true);
      setError('');

      // Get the existing Valorant API instance
      const valorantAPI = new ValorantAPI();
      await valorantAPI.fetchTokens();

      // Convert search result to PlayerInfo using the player's region
      const playerInfo = await PlayerSearchAPI.convertToPlayerInfo(searchResult, valorantAPI, true);
      setSelectedPlayer(playerInfo);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load player profile';
      setError(errorMessage);
    } finally {
      setIsSearching(false);
    }
  };

  const handleBackFromProfile = () => {
    setSelectedPlayer(null);
  };

  const parseUsernameInput = (input: string) => {
    const trimmed = input.trim();
    if (trimmed.includes('#')) {
      const parts = trimmed.split('#');
      if (parts.length === 2) {
        setUsername(parts[0]);
        setTag(parts[1]);
      }
    } else {
      setUsername(trimmed);
    }
  };

  // Show player profile if selected
  if (selectedPlayer) {
    return (
      <MatchHistoryPage
        player={selectedPlayer}
        onBack={handleBackFromProfile}
        isDarkMode={isDarkMode}
        onToggleDarkMode={onToggleDarkMode}
      />
    );
  }

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

      <div className="relative z-10 container mx-auto px-6 py-8 max-w-4xl">
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
          <h1 className={`text-3xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Player Search
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

        {/* Search Form */}
        <div className={`
          rounded-3xl p-8 backdrop-blur-xl border mb-8 transition-all duration-300
          ${isDarkMode 
            ? 'bg-slate-900/40 border-slate-700/50' 
            : 'bg-white/20 border-white/30'
          }
        `}>
          <div className="flex items-center space-x-3 mb-6">
            <div className={`
              p-3 rounded-full backdrop-blur-sm border
              ${isDarkMode 
                ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' 
                : 'bg-blue-400/20 border-blue-400/30 text-blue-600'
              }
            `}>
              <Search className="w-6 h-6" />
            </div>
            <h2 className={`text-2xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              Search for a Player
            </h2>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            {/* Quick Input */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Player Name (Username#Tag) - Search may take up to 30 seconds
              </label>
              <input
                type="text"
                placeholder="e.g., MARVEL HARRY#harry"
                onChange={(e) => parseUsernameInput(e.target.value)}
                className={`
                  w-full p-4 rounded-xl backdrop-blur-sm border transition-all duration-300
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50
                  ${isDarkMode 
                    ? 'bg-slate-800/60 border-slate-700/50 text-white placeholder-gray-400' 
                    : 'bg-white/40 border-white/50 text-gray-800 placeholder-gray-500'
                  }
                `}
              />
            </div>

            {/* Separate Username and Tag */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="MARVEL HARRY"
                  className={`
                    w-full p-4 rounded-xl backdrop-blur-sm border transition-all duration-300
                    focus:outline-none focus:ring-2 focus:ring-blue-500/50
                    ${isDarkMode 
                      ? 'bg-slate-800/60 border-slate-700/50 text-white placeholder-gray-400' 
                      : 'bg-white/40 border-white/50 text-gray-800 placeholder-gray-500'
                    }
                  `}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Tag
                </label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="harry"
                  className={`
                    w-full p-4 rounded-xl backdrop-blur-sm border transition-all duration-300
                    focus:outline-none focus:ring-2 focus:ring-blue-500/50
                    ${isDarkMode 
                      ? 'bg-slate-800/60 border-slate-700/50 text-white placeholder-gray-400' 
                      : 'bg-white/40 border-white/50 text-gray-800 placeholder-gray-500'
                    }
                  `}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSearching || !username.trim() || !tag.trim()}
              className={`
                w-full px-6 py-4 rounded-xl font-medium transition-all duration-300
                backdrop-blur-sm border hover:scale-105 active:scale-95
                disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50
                ${isDarkMode 
                  ? 'bg-blue-600/30 border-blue-500/50 text-blue-300 hover:bg-blue-600/40' 
                  : 'bg-blue-500/30 border-blue-400/50 text-blue-700 hover:bg-blue-500/40'
                }
              `}
            >
              {isSearching ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Searching...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Search className="w-5 h-5" />
                  <span>Search Player</span>
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`
            mb-6 p-4 rounded-xl backdrop-blur-sm border
            ${isDarkMode 
              ? 'bg-red-600/20 border-red-500/30' 
              : 'bg-red-500/15 border-red-400/30'
            }
          `}>
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className={`font-medium ${
                isDarkMode ? 'text-red-300' : 'text-red-700'
              }`}>
                {error}
              </span>
            </div>
          </div>
        )}

        {/* Search Result */}
        {searchResult && (
          <div className={`
            rounded-3xl p-8 backdrop-blur-xl border transition-all duration-300
            ${isDarkMode 
              ? 'bg-slate-900/40 border-slate-700/50' 
              : 'bg-white/20 border-white/30'
            }
          `}>
            <h3 className={`text-xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              Player Found
            </h3>

            <div className="flex items-center justify-between">
              {/* Player Info */}
              <div className="flex items-center space-x-6">
                {/* Player Card */}
                <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-white/20">
                  <img 
                    src={searchResult.card.small}
                    alt="Player Card"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://via.placeholder.com/80x80?text=${searchResult.name[0]}`;
                    }}
                  />
                </div>

                {/* Player Details */}
                <div>
                  <h4 className={`text-2xl font-bold mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    {searchResult.name}#{searchResult.tag}
                  </h4>
                  <div className={`text-sm space-y-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <div>Level: {searchResult.account_level}</div>
                    <div>Region: {searchResult.region.toUpperCase()}</div>
                    <div>Last Updated: {searchResult.last_update}</div>
                  </div>
                </div>
              </div>

              {/* View Profile Button */}
              <button
                onClick={handleViewProfile}
                disabled={isSearching}
                className={`
                  px-8 py-4 rounded-xl font-medium transition-all duration-300
                  backdrop-blur-sm border hover:scale-105 active:scale-95
                  disabled:scale-100 disabled:cursor-not-allowed
                  ${isDarkMode 
                    ? 'bg-green-600/30 border-green-500/50 text-green-300 hover:bg-green-600/40' 
                    : 'bg-green-500/30 border-green-400/50 text-green-700 hover:bg-green-500/40'
                  }
                `}
              >
                {isSearching ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>View Profile</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!searchResult && !error && !isSearching && (
          <div className={`
            rounded-3xl p-8 backdrop-blur-xl border text-center transition-all duration-300
            ${isDarkMode 
              ? 'bg-slate-900/40 border-slate-700/50' 
              : 'bg-white/20 border-white/30'
            }
          `}>
            <Search className={`w-12 h-12 mx-auto mb-4 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <h3 className={`text-xl font-semibold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              Search for Any Valorant Player
            </h3>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-md mx-auto`}>
              Enter a player's username and tag to view their profile, match history, and statistics.
              You can enter the full name with # or use separate fields.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};