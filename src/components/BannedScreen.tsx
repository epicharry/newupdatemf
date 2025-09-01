import React from 'react';
import { Shield, ExternalLink } from 'lucide-react';

interface BannedScreenProps {
  reason?: string;
  isDarkMode: boolean;
}

export const BannedScreen: React.FC<BannedScreenProps> = ({
  reason,
  isDarkMode
}) => {
  const openSupport = () => {
    const supportUrl = 'https://e-z.bio/harry';
    (window as any).electronAPI?.openExternal?.(supportUrl) || window.open(supportUrl, '_blank');
  };

  return (
    <div className={`min-h-screen flex items-center justify-center transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-red-50 via-white to-red-50'
    }`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div 
          className="w-full h-full" 
          style={{
            backgroundImage: isDarkMode 
              ? `radial-gradient(circle at 25% 25%, rgba(239, 68, 68, 0.3) 0%, transparent 50%),
                 radial-gradient(circle at 75% 75%, rgba(239, 68, 68, 0.3) 0%, transparent 50%)`
              : `radial-gradient(circle at 25% 25%, rgba(239, 68, 68, 0.2) 0%, transparent 50%),
                 radial-gradient(circle at 75% 75%, rgba(239, 68, 68, 0.2) 0%, transparent 50%)`
          }}
        />
      </div>

      <div className="relative z-10 text-center max-w-md mx-auto px-6">
        <div className={`
          rounded-3xl p-8 backdrop-blur-xl border transition-all duration-300
          ${isDarkMode 
            ? 'bg-slate-900/40 border-red-700/50' 
            : 'bg-white/20 border-red-300/30'
          }
        `}>
          {/* Ban Icon */}
          <div className="flex justify-center mb-6">
            <div className={`
              p-4 rounded-full backdrop-blur-sm border
              ${isDarkMode 
                ? 'bg-red-500/20 border-red-500/30 text-red-400' 
                : 'bg-red-400/20 border-red-400/30 text-red-600'
              }
            `}>
              <Shield className="w-12 h-12" />
            </div>
          </div>

          {/* Title */}
          <h1 className={`text-2xl font-bold mb-4 ${
            isDarkMode ? 'text-red-400' : 'text-red-600'
          }`}>
            Account Suspended
          </h1>

          {/* Message */}
          <p className={`text-lg mb-6 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Your account has been suspended from using this application.
          </p>

          {/* Reason */}
          {reason && (
            <div className={`
              p-4 rounded-xl mb-6 backdrop-blur-sm border
              ${isDarkMode 
                ? 'bg-red-900/20 border-red-700/30' 
                : 'bg-red-100/50 border-red-300/30'
              }
            `}>
              <p className={`text-sm font-medium mb-1 ${
                isDarkMode ? 'text-red-300' : 'text-red-700'
              }`}>
                Reason:
              </p>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {reason}
              </p>
            </div>
          )}

          {/* Support Button */}
          <button
            onClick={openSupport}
            className={`
              px-8 py-3 rounded-xl font-medium transition-all duration-300
              backdrop-blur-sm border hover:scale-105 active:scale-95
              ${isDarkMode 
                ? 'bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30' 
                : 'bg-blue-500/20 border-blue-400/30 text-blue-700 hover:bg-blue-500/30'
              }
            `}
          >
            <div className="flex items-center space-x-2">
              <ExternalLink className="w-4 h-4" />
              <span>Contact Owner</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};