import React, { useState, useEffect } from 'react';
import { User, Sparkles, ArrowRight } from 'lucide-react';
import { PlayerInfo } from '../types/valorant';

interface WelcomeScreenProps {
  currentUser: PlayerInfo | null;
  isDarkMode: boolean;
  onContinue: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  currentUser,
  isDarkMode,
  onContinue
}) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Animate content in after a brief delay
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

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
    <div className={`min-h-screen flex items-center justify-center transition-all duration-500 ${
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

      <div className={`
        relative z-10 text-center max-w-md mx-auto px-6 transition-all duration-1000 transform
        ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
      `}>
        <div className={`
          rounded-3xl p-8 backdrop-blur-xl border transition-all duration-300
          ${isDarkMode 
            ? 'bg-slate-900/40 border-slate-700/50' 
            : 'bg-white/20 border-white/30'
          }
        `}>
          {/* Welcome Icon */}
          <div className="flex justify-center mb-6">
            <div className={`
              relative p-4 rounded-full backdrop-blur-sm border
              ${isDarkMode 
                ? 'bg-blue-500/20 border-blue-500/30' 
                : 'bg-blue-400/20 border-blue-400/30'
              }
            `}>
              {currentUser?.agentImageUrl ? (
                <div className="w-16 h-16 rounded-full overflow-hidden">
                  <img 
                    src={currentUser.agentImageUrl} 
                    alt="Agent"
                    className="w-full h-full object-cover"
                    draggable={false}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="w-16 h-16 flex items-center justify-center text-blue-500 hidden">
                    <User className="w-8 h-8" />
                  </div>
                </div>
              ) : (
                <User className="w-16 h-16 text-blue-500" />
              )}
              
              {/* Sparkle animation */}
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Greeting */}
          <h1 className={`text-3xl font-bold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            {getGreeting()}!
          </h1>

          {/* User Name */}
          <h2 className={`text-2xl font-semibold mb-6 ${
            isDarkMode ? 'text-blue-300' : 'text-blue-700'
          }`}>
            Welcome back, {getUserDisplayName()}
          </h2>

          {/* User Rank */}
          {currentUser?.rank && currentUser.rank.tier > 0 && (
            <div className={`
              flex items-center justify-center space-x-3 mb-6 p-4 rounded-xl backdrop-blur-sm border
              ${isDarkMode 
                ? 'bg-slate-800/40 border-slate-700/50' 
                : 'bg-white/20 border-white/30'
              }
            `}>
              <img 
                src={`./rank-icons/${currentUser.rank.rank.toLowerCase().replace(' ', '')}.png`}
                alt={currentUser.rank.rank}
                className="w-8 h-8"
                draggable={false}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <div>
                <div className={`font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  {currentUser.rank.rank}
                </div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {currentUser.rank.rr} RR
                </div>
              </div>
            </div>
          )}

          {/* Continue Button */}
          <button
            onClick={onContinue}
            className={`
              w-full px-8 py-4 rounded-xl font-medium transition-all duration-300
              backdrop-blur-sm border hover:scale-105 active:scale-95
              ${isDarkMode 
                ? 'bg-blue-600/30 border-blue-500/50 text-blue-300 hover:bg-blue-600/40' 
                : 'bg-blue-500/30 border-blue-400/50 text-blue-700 hover:bg-blue-500/40'
              }
            `}
          >
            <div className="flex items-center justify-center space-x-2">
              <span>Continue to App</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>

          {/* Subtitle */}
          <p className={`mt-4 text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Ready to dominate your matches?
          </p>
        </div>
      </div>
    </div>
  );
};