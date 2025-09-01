import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface MaintenanceScreenProps {
  message: string;
  onRetry: () => void;
  isRetrying: boolean;
  isDarkMode: boolean;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({
  message,
  onRetry,
  isRetrying,
  isDarkMode
}) => {
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

      <div className="relative z-10 text-center max-w-md mx-auto px-6">
        <div className={`
          rounded-3xl p-8 backdrop-blur-xl border transition-all duration-300
          ${isDarkMode 
            ? 'bg-slate-900/40 border-slate-700/50' 
            : 'bg-white/20 border-white/30'
          }
        `}>
          {/* Warning Icon */}
          <div className="flex justify-center mb-6">
            <div className={`
              p-4 rounded-full backdrop-blur-sm border
              ${isDarkMode 
                ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' 
                : 'bg-yellow-400/20 border-yellow-400/30 text-yellow-600'
              }
            `}>
              <AlertTriangle className="w-12 h-12" />
            </div>
          </div>

          {/* Title */}
          <h1 className={`text-2xl font-bold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Maintenance Mode
          </h1>

          {/* Message */}
          <p className={`text-lg mb-8 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {message}
          </p>

          {/* Retry Button */}
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className={`
              px-8 py-3 rounded-xl font-medium transition-all duration-300
              backdrop-blur-sm border hover:scale-105 active:scale-95
              disabled:scale-100 disabled:cursor-not-allowed
              ${isDarkMode 
                ? 'bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30 disabled:bg-blue-800/20' 
                : 'bg-blue-500/20 border-blue-400/30 text-blue-700 hover:bg-blue-500/30 disabled:bg-blue-400/20'
              }
            `}
          >
            {isRetrying ? (
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Checking...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};